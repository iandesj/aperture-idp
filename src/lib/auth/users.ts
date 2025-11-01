import bcrypt from 'bcryptjs';
import db from './db';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: string;
}

export async function createUser(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const existingUser = db
    .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(username, email) as User | undefined;

  if (existingUser) {
    throw new Error('User with this username or email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = db
    .prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(username, email, passwordHash, 'user');

  return getUserById(result.lastInsertRowid as number);
}

export async function verifyUser(username: string, password: string): Promise<User | null> {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  return isValid ? user : null;
}

export function getUserById(id: number): User {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export function getUserByUsername(username: string): User | null {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  return user || null;
}

export function getUserByEmail(email: string): User | null {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  return user || null;
}

