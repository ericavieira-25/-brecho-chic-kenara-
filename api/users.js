import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { ensureUsersTable, getPool } from './_db.js';
import { clearSessionCookies, readSession, setSessionCookies } from './_session.js';

const scrypt = promisify(crypto.scrypt);
const DEMO_USERS = [
  {
    id: 'user-demo-client',
    name: 'Ana Carolina',
    email: 'demo@brecho.com',
    role: 'cliente',
    avatar: 'https://picsum.photos/seed/user-ana/200/200',
    phone: '(11) 99999-8888',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    createdAt: '2023-06-15',
  },
  {
    id: 'user-demo-supplier',
    name: 'Ana Carol Fornecedora',
    email: 'fornecedora@brecho.com',
    role: 'fornecedora',
    supplierId: 'supplier-ana-carol',
    avatar: 'https://picsum.photos/seed/user-supplier/200/200',
    phone: '(11) 99888-2222',
    address: 'Rua da Moda, 40 - São Paulo, SP',
    createdAt: '2023-06-16',
  },
  {
    id: 'user-demo-admin',
    name: 'Administradora Kenara',
    email: 'admin@brecho.com',
    role: 'administradora',
    avatar: 'https://picsum.photos/seed/user-admin/200/200',
    phone: '(11) 97777-1111',
    address: 'Av. da Gestão, 90 - São Paulo, SP',
    createdAt: '2023-06-17',
  },
];

let demoSeedPromise;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, encodedHash) {
  const [, n, r, p, salt, storedKey] = String(encodedHash || '').split('$');
  if (!n || !r || !p || !salt || !storedKey) return false;

  const derivedKey = await scrypt(password, salt, storedKey.length / 2, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  const expected = Buffer.from(storedKey, 'hex');
  return expected.length === derivedKey.length &&
    crypto.timingSafeEqual(expected, derivedKey);
}

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
      ? new Date(row.created_at).toISOString().split('T')[0]
      : undefined,
  };
}

async function seedDemoUsers() {
  if (!demoSeedPromise) {
    demoSeedPromise = (async () => {
      const db = getPool();
      for (const user of DEMO_USERS) {
        const passwordHash = await hashPassword('123456');
        await db.query(
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
    })().catch((error) => {
      demoSeedPromise = null;
      throw error;
    });
  }
  await demoSeedPromise;
}

function validateRegistration(body) {
  if (!String(body?.name || '').trim()) return 'Nome é obrigatório.';
  if (!/\S+@\S+\.\S+/.test(String(body?.email || ''))) return 'E-mail inválido.';
  if (String(body?.password || '').length < 6) return 'A senha deve ter ao menos 6 caracteres.';
  return null;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'DELETE') {
      clearSessionCookies(res);
      return res.status(204).end();
    }

    await ensureUsersTable();
    await seedDemoUsers();
    const db = getPool();

    if (req.method === 'GET') {
      const session = readSession(req);
      const requestedId = req.query?.id || session?.id;
      if (!session || (session.role !== 'administradora' && requestedId !== session.id)) {
        return res.status(401).json({ erro: 'Autenticação necessária.' });
      }
      const result = await db.query(
        'SELECT id, name, email, role, supplier_id, avatar, phone, address, created_at FROM users WHERE id = $1',
        [requestedId]
      );
      if (!result.rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
      return res.status(200).json({ user: publicUser(result.rows[0]) });
    }

    if (req.method === 'PATCH') {
      const session = readSession(req);
      if (!session) return res.status(401).json({ erro: 'Autenticação necessária.' });

      const { name, phone, address } = req.body || {};
      const fields = [];
      const values = [];
      let idx = 1;

      if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(String(name).trim()); }
      if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone || null); }
      if (address !== undefined) { fields.push(`address = $${idx++}`); values.push(address || null); }

      if (fields.length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
      }

      values.push(session.id);
      const result = await db.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
         RETURNING id, name, email, role, supplier_id, avatar, phone, address, created_at`,
        values
      );
      if (!result.rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
      return res.status(200).json({ user: publicUser(result.rows[0]) });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ erro: 'Método não permitido.' });
    }

    const body = req.body || {};
    const action = body.action || (body.name ? 'register' : 'login');
    const email = String(body.email || '').trim().toLowerCase();

    if (action === 'register') {
      const validationError = validateRegistration(body);
      if (validationError) return res.status(400).json({ erro: validationError });

      const passwordHash = await hashPassword(String(body.password));
      const id = `user-${crypto.randomUUID()}`;
      try {
        const result = await db.query(
          `INSERT INTO users (id, name, email, password_hash, role, avatar, created_at)
           VALUES ($1, $2, $3, $4, 'cliente', $5, NOW())
           RETURNING id, name, email, role, supplier_id, avatar, phone, address, created_at`,
          [
            id,
            String(body.name).trim(),
            email,
            passwordHash,
            `https://picsum.photos/seed/${id}/200/200`,
          ]
        );
        const user = publicUser(result.rows[0]);
        setSessionCookies(res, user);
        return res.status(201).json({ user });
      } catch (error) {
        if (error.code === '23505') {
          return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
        }
        throw error;
      }
    }

    if (action !== 'login') {
      return res.status(400).json({ erro: 'Ação inválida.' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const row = result.rows[0];
    if (!row || !(await verifyPassword(String(body.password || ''), row.password_hash))) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const user = publicUser(row);
    setSessionCookies(res, user);
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Erro na API de usuários:', error);
    return res.status(503).json({ erro: 'Persistência de usuários indisponível.' });
  }
}
