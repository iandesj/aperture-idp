import db from '../db';
import { createUser } from '../users';

describe('Database Setup', () => {
  it('should create users table on initialization', () => {
    const tableInfo = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).get() as { name: string } | undefined;

    expect(tableInfo).toBeDefined();
    expect(tableInfo?.name).toBe('users');
  });

  it('should have correct users table schema', () => {
    const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>;

    const columnNames = columns.map((col) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('username');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('created_at');

    const idColumn = columns.find((col) => col.name === 'id');
    expect(idColumn?.pk).toBe(1);
  });

  it('should enforce username uniqueness', async () => {
    await createUser('testuser', 'test1@example.com', 'password123');
    await expect(
      createUser('testuser', 'test2@example.com', 'password123')
    ).rejects.toThrow();
  });

  it('should enforce email uniqueness', async () => {
    await createUser('user1', 'test@example.com', 'password123');
    await expect(
      createUser('user2', 'test@example.com', 'password123')
    ).rejects.toThrow();
  });
});

