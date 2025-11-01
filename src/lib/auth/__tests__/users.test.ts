import { createUser, verifyUser, getUserById, getUserByUsername } from '../users';
import db from '../db';

beforeEach(() => {
  db.exec('DELETE FROM users');
});

afterAll(() => {
  db.close();
});

describe('User Management', () => {
  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const user = await createUser('testuser', 'test@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.password_hash).not.toBe('password123');
      expect(user.password_hash.length).toBeGreaterThan(20);
    });

    it('should throw error if username already exists', async () => {
      await createUser('testuser', 'test1@example.com', 'password123');

      await expect(
        createUser('testuser', 'test2@example.com', 'password123')
      ).rejects.toThrow('User with this username or email already exists');
    });

    it('should throw error if email already exists', async () => {
      await createUser('user1', 'test@example.com', 'password123');

      await expect(
        createUser('user2', 'test@example.com', 'password123')
      ).rejects.toThrow('User with this username or email already exists');
    });
  });

  describe('verifyUser', () => {
    it('should return user for valid credentials', async () => {
      await createUser('testuser', 'test@example.com', 'password123');
      const user = await verifyUser('testuser', 'password123');

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for invalid username', async () => {
      await createUser('testuser', 'test@example.com', 'password123');
      const user = await verifyUser('wronguser', 'password123');

      expect(user).toBeNull();
    });

    it('should return null for invalid password', async () => {
      await createUser('testuser', 'test@example.com', 'password123');
      const user = await verifyUser('testuser', 'wrongpassword');

      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const created = await createUser('testuser', 'test@example.com', 'password123');
      const user = getUserById(created.id);

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
    });

    it('should throw error if user not found', () => {
      expect(() => getUserById(99999)).toThrow('User not found');
    });
  });

  describe('getUserByUsername', () => {
    it('should return user by username', async () => {
      await createUser('testuser', 'test@example.com', 'password123');
      const user = getUserByUsername('testuser');

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    it('should return null if user not found', () => {
      const user = getUserByUsername('nonexistent');
      expect(user).toBeNull();
    });
  });
});

