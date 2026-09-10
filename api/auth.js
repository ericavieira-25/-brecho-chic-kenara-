import users from './users.js';
// Compatibility route; all logins now use the same identity and session.
export default function handler(req, res) {
  if (req.method === 'POST') req.body = { ...req.body, action: 'login', admin: true };
  return users(req, res);
}
