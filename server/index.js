require("dotenv").config();

const crypto = require("node:crypto");
const { promisify } = require("node:util");
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const scrypt = promisify(crypto.scrypt);
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ─────────────────────────────────────────────────────────────

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173"],
    credentials: true,
  })
);

// ─── Helpers de banco ─────────────────────────────────────────────────────────

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cliente',
      supplier_id TEXT,
      avatar TEXT,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureOrdersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      paid_at TIMESTAMPTZ,
      subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
      shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
      total NUMERIC(12, 2) NOT NULL DEFAULT 0,
      items JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `);
}

// ─── Helpers de senha ─────────────────────────────────────────────────────────

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, encodedHash) {
  const [, n, r, p, salt, storedKey] = String(encodedHash || "").split("$");
  if (!n || !r || !p || !salt || !storedKey) return false;
  const derivedKey = await scrypt(password, salt, storedKey.length / 2, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  const expected = Buffer.from(storedKey, "hex");
  return (
    expected.length === derivedKey.length &&
    crypto.timingSafeEqual(expected, derivedKey)
  );
}

// ─── Helpers de sessão ────────────────────────────────────────────────────────

const SESSION_COOKIE = "kenara_user_session";
const ADMIN_COOKIE = "kenara_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function authSecret() {
  return process.env.AUTH_SECRET || "development-only-change-me";
}

function encodePayload(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", authSecret())
    .update(payload)
    .digest("base64url");
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .filter(Boolean)
      .map((c) => {
        const sep = c.indexOf("=");
        return [c.slice(0, sep).trim(), c.slice(sep + 1).trim()];
      })
  );
}

function readSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE] || cookies[ADMIN_COOKIE];
  const [payload, signature] = (token || "").split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    return claims.exp > Math.floor(Date.now() / 1000) ? claims : null;
  } catch {
    return null;
  }
}

function setSessionCookies(res, user) {
  const payload = encodePayload({
    id: user.id,
    email: user.email,
    role: user.role,
    supplierId: user.supplierId || null,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });
  const token = `${payload}.${signPayload(payload)}`;
  const cookies = [
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax`,
  ];
  if (user.role === "administradora") {
    const csrfToken = crypto.randomBytes(32).toString("base64url");
    cookies.push(
      `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax`,
      `kenara_csrf=${csrfToken}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax`
    );
  }
  res.setHeader("Set-Cookie", cookies);
}

function clearSessionCookies(res) {
  res.setHeader("Set-Cookie", [
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    `${ADMIN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    "kenara_csrf=; Path=/; Max-Age=0; SameSite=Lax",
  ]);
}

function requireAdmin(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const [payload, signature] = (cookies[ADMIN_COOKIE] || "").split(".");
  const expected =
    payload && authSecret()
      ? crypto
          .createHmac("sha256", authSecret())
          .update(payload)
          .digest("base64url")
      : "";
  let claims;
  try {
    claims = payload
      ? JSON.parse(Buffer.from(payload, "base64url").toString())
      : null;
  } catch {
    claims = null;
  }
  const ok =
    payload &&
    signature &&
    expected &&
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) &&
    claims?.role === "administradora" &&
    claims.exp > Math.floor(Date.now() / 1000);
  if (!ok) {
    res.status(401).json({ erro: "Acesso administrativo não autorizado." });
    return false;
  }
  return true;
}

function requireCsrf(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const headerToken = req.headers["x-csrf-token"];
  const cookieToken = cookies.kenara_csrf;
  const valid =
    typeof headerToken === "string" &&
    typeof cookieToken === "string" &&
    headerToken.length === cookieToken.length &&
    crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken));
  if (!valid) {
    res.status(403).json({ erro: "Token CSRF inválido ou ausente." });
    return false;
  }
  return true;
}

// ─── Helpers de formatação ────────────────────────────────────────────────────

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    supplierId: row.supplier_id || undefined,
    avatar: row.avatar || undefined,
    phone: row.phone || undefined,
    address: row.address || undefined,
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString().split("T")[0]
      : undefined,
  };
}

function publicOrder(row) {
  const items = Array.isArray(row.items) ? row.items : [];
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    date:
      row.date instanceof Date
        ? row.date.toISOString().split("T")[0]
        : String(row.date),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    items,
  };
}

function parseDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
    ? value
    : new Date().toISOString().split("T")[0];
}

// ─── Seed de usuários demo ────────────────────────────────────────────────────

const DEMO_USERS = [
  {
    id: "user-demo-client",
    name: "Ana Carolina",
    email: "demo@brecho.com",
    role: "cliente",
    avatar: "https://picsum.photos/seed/user-ana/200/200",
    phone: "(11) 99999-8888",
    address: "Rua das Flores, 123 - São Paulo, SP",
    createdAt: "2023-06-15",
  },
  {
    id: "user-demo-supplier",
    name: "Ana Carol Fornecedora",
    email: "fornecedora@brecho.com",
    role: "fornecedora",
    supplierId: "supplier-ana-carol",
    avatar: "https://picsum.photos/seed/user-supplier/200/200",
    phone: "(11) 99888-2222",
    address: "Rua da Moda, 40 - São Paulo, SP",
    createdAt: "2023-06-16",
  },
  {
    id: "user-demo-admin",
    name: "Administradora Kenara",
    email: "admin@brecho.com",
    role: "administradora",
    avatar: "https://picsum.photos/seed/user-admin/200/200",
    phone: "(11) 97777-1111",
    address: "Av. da Gestão, 90 - São Paulo, SP",
    createdAt: "2023-06-17",
  },
];

let demoSeedPromise = null;

async function seedDemoUsers() {
  if (!demoSeedPromise) {
    demoSeedPromise = (async () => {
  for (const user of DEMO_USERS) {
    const pw = user.id === 'user-demo-admin' ? 'kenara25@' : '123456';
    const passwordHash = await hashPassword(pw);
        await pool.query(
          `INSERT INTO users
             (id, name, email, password_hash, role, supplier_id, avatar, phone, address, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (email) DO NOTHING`,
          [
            user.id,
            user.name,
            user.email,
            passwordHash,
            user.role,
            user.supplierId || null,
            user.avatar,
            user.phone,
            user.address,
            user.createdAt,
          ]
        );
      }
    })().catch((err) => {
      demoSeedPromise = null;
      throw err;
    });
  }
  await demoSeedPromise;
}

// ─── Rota principal ───────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ mensagem: "API do Brechó Chic Kenara funcionando! 🚀" });
});

// ─── Produtos ─────────────────────────────────────────────────────────────────

app.get("/api/products", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Não foi possível buscar os produtos." });
  }
});

app.post("/api/products", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!requireCsrf(req, res)) return;
  try {
    const {
      name, category, categoryName, size, condition, conditionLabel,
      price, originalPrice, brand, description, photo,
      supplierId, supplierName, createdBy, status,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ erro: "Nome e preço são obrigatórios." });
    }

    const result = await pool.query(
      `INSERT INTO products
         (name, category, category_name, size, condition, condition_label,
          price, original_price, brand, description, photo,
          supplier_id, supplier_name, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        name, category || null, categoryName || null, size || null,
        condition || null, conditionLabel || null, price,
        originalPrice ?? null, brand || null, description || null,
        photo || null, supplierId || null, supplierName || null,
        createdBy || null, status || "disponivel",
      ]
    );
    res.status(201).json({ mensagem: "Produto cadastrado com sucesso!", produto: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Não foi possível cadastrar o produto." });
  }
});

app.delete("/api/products", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!requireCsrf(req, res)) return;
  try {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ erro: "ID de produto inválido." });
    }
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Não foi possível excluir o produto." });
  }
});

// ─── Usuários ─────────────────────────────────────────────────────────────────

app.delete("/api/users", (req, res) => {
  clearSessionCookies(res);
  res.status(204).end();
});

app.patch("/api/users", async (req, res) => {
  try {
    await ensureUsersTable();
    const session = readSession(req);
    if (!session) return res.status(401).json({ erro: "Autenticação necessária." });

    const { phone, address, name } = req.body || {};
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(String(name).trim()); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone || null); }
    if (address !== undefined) { fields.push(`address = $${idx++}`); values.push(address || null); }

    if (fields.length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar." });
    }

    values.push(session.id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, email, role, supplier_id, avatar, phone, address, created_at`,
      values
    );
    if (!result.rows[0]) return res.status(404).json({ erro: "Usuário não encontrado." });
    res.status(200).json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(503).json({ erro: "Não foi possível atualizar o perfil." });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    await ensureUsersTable();
    const session = readSession(req);
    const requestedId = req.query.id || session?.id;
    if (!session || (session.role !== "administradora" && requestedId !== session.id)) {
      return res.status(401).json({ erro: "Autenticação necessária." });
    }
    const result = await pool.query(
      "SELECT id, name, email, role, supplier_id, avatar, phone, address, created_at FROM users WHERE id = $1",
      [requestedId]
    );
    if (!result.rows[0]) return res.status(404).json({ erro: "Usuário não encontrado." });
    res.status(200).json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(503).json({ erro: "Persistência de usuários indisponível." });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    await ensureUsersTable();
    await seedDemoUsers();

    const body = req.body || {};
    const action = body.action || (body.name ? "register" : "login");
    const email = String(body.email || "").trim().toLowerCase();

    if (action === "register") {
      if (!String(body.name || "").trim()) {
        return res.status(400).json({ erro: "Nome é obrigatório." });
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ erro: "E-mail inválido." });
      }
      if (String(body.password || "").length < 6) {
        return res.status(400).json({ erro: "A senha deve ter ao menos 6 caracteres." });
      }
      const passwordHash = await hashPassword(String(body.password));
      const id = `user-${crypto.randomUUID()}`;
      try {
        const result = await pool.query(
          `INSERT INTO users (id, name, email, password_hash, role, avatar, created_at)
           VALUES ($1, $2, $3, $4, 'cliente', $5, NOW())
           RETURNING id, name, email, role, supplier_id, avatar, phone, address, created_at`,
          [id, String(body.name).trim(), email, passwordHash, `https://picsum.photos/seed/${id}/200/200`]
        );
        const user = publicUser(result.rows[0]);
        setSessionCookies(res, user);
        return res.status(201).json({ user });
      } catch (err) {
        if (err.code === "23505") {
          return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
        }
        throw err;
      }
    }

    if (action !== "login") {
      return res.status(400).json({ erro: "Ação inválida." });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const row = result.rows[0];
    if (!row || !(await verifyPassword(String(body.password || ""), row.password_hash))) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }
    const user = publicUser(row);
    setSessionCookies(res, user);
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(503).json({ erro: "Persistência de usuários indisponível." });
  }
});

// ─── Auth (fallback admin legado) ─────────────────────────────────────────────

app.delete("/api/auth", (_req, res) => {
  res.setHeader("Set-Cookie", [
    "kenara_admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
    "kenara_csrf=; Path=/; Max-Age=0; SameSite=Lax",
  ]);
  res.status(204).end();
});

app.post("/api/auth", (req, res) => {
  const { email, password } = req.body || {};
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!authSecret() || !configuredEmail || !configuredPassword) {
    return res.status(500).json({ erro: "Autenticação não configurada." });
  }
  if (email !== configuredEmail || password !== configuredPassword) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  const payload = encodePayload({
    role: "administradora",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  });
  const token = `${payload}.${signPayload(payload)}`;
  const csrfToken = crypto.randomBytes(32).toString("base64url");
  res.setHeader("Set-Cookie", [
    `kenara_admin_session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax`,
    `kenara_csrf=${csrfToken}; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax`,
  ]);
  res.status(200).json({ autenticado: true });
});

// ─── Pedidos ──────────────────────────────────────────────────────────────────

app.get("/api/orders", async (req, res) => {
  try {
    await ensureOrdersTable();
    const session = readSession(req);
    if (!session) return res.status(401).json({ erro: "Autenticação necessária." });

    const id = req.query.id;
    if (id) {
      const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
      const order = result.rows[0];
      if (!order) return res.status(404).json({ erro: "Pedido não encontrado." });
      const canAccess =
        session.role === "administradora" ||
        order.customer_id === session.id ||
        (session.role === "fornecedora" &&
          Array.isArray(order.items) &&
          order.items.some((item) => item.supplierId === session.supplierId));
      if (!canAccess) return res.status(404).json({ erro: "Pedido não encontrado." });
      return res.status(200).json({ order: publicOrder(order) });
    }

    let result;
    if (session.role === "administradora") {
      result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    } else if (session.role === "fornecedora") {
      result = await pool.query(
        `SELECT * FROM orders
         WHERE items @> $1::jsonb OR customer_id = $2
         ORDER BY created_at DESC`,
        [JSON.stringify([{ supplierId: session.supplierId }]), session.id]
      );
    } else {
      result = await pool.query(
        "SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC",
        [session.id]
      );
    }
    res.status(200).json({ orders: result.rows.map(publicOrder) });
  } catch (err) {
    console.error(err);
    res.status(503).json({ erro: "Persistência de pedidos indisponível." });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    await ensureOrdersTable();
    const session = readSession(req);
    if (!session) return res.status(401).json({ erro: "Autenticação necessária." });

    const body = req.body?.order || req.body || {};
    if (!body.id || !body.customerId || body.customerId !== session.id) {
      return res.status(403).json({ erro: "Pedido não pertence à sessão atual." });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ erro: "O pedido deve conter itens." });
    }

    const result = await pool.query(
      `INSERT INTO orders
         (id, customer_id, customer_name, customer_email, date, created_at, status,
          payment_status, payment_method, paid_at, subtotal, shipping, total, items)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6::timestamptz,NOW()),$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         payment_status = EXCLUDED.payment_status,
         payment_method = EXCLUDED.payment_method,
         paid_at = EXCLUDED.paid_at,
         subtotal = EXCLUDED.subtotal,
         shipping = EXCLUDED.shipping,
         total = EXCLUDED.total,
         items = EXCLUDED.items
       RETURNING *`,
      [
        body.id, session.id, String(body.customerName || ""),
        String(body.customerEmail || session.email),
        parseDate(body.date), body.createdAt || null,
        body.status || "aguardando_pagamento",
        body.paymentStatus || "pending",
        body.paymentMethod || null, body.paidAt || null,
        Number(body.subtotal || 0), Number(body.shipping || 0),
        Number(body.total || 0), JSON.stringify(body.items),
      ]
    );
    res.status(201).json({ order: publicOrder(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(503).json({ erro: "Persistência de pedidos indisponível." });
  }
});

app.patch("/api/orders", async (req, res) => {
  try {
    await ensureOrdersTable();
    const session = readSession(req);
    if (!session) return res.status(401).json({ erro: "Autenticação necessária." });

    const id = req.query.id || req.body?.id;
    const found = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    const order = found.rows[0];
    if (!order) return res.status(404).json({ erro: "Pedido não encontrado." });

    const canAccess =
      session.role === "administradora" ||
      order.customer_id === session.id ||
      (session.role === "fornecedora" &&
        Array.isArray(order.items) &&
        order.items.some((item) => item.supplierId === session.supplierId));
    if (!canAccess) return res.status(404).json({ erro: "Pedido não encontrado." });

    const body = req.body || {};
    const updated = await pool.query(
      `UPDATE orders
       SET status = COALESCE($1, status),
           payment_status = COALESCE($2, payment_status),
           payment_method = COALESCE($3, payment_method),
           paid_at = COALESCE($4, paid_at)
       WHERE id = $5
       RETURNING *`,
      [
        body.status || null, body.paymentStatus || null,
        body.paymentMethod || null, body.paidAt || null, id,
      ]
    );
    res.status(200).json({ order: publicOrder(updated.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(503).json({ erro: "Persistência de pedidos indisponível." });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
