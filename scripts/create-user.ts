#!/usr/bin/env ts-node

import { createUser } from '../src/lib/auth/users.js';
import { createUserSchema } from '../src/lib/auth/validators.js';

const username = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const role = process.argv[5] || 'user';

if (!username || !email || !password) {
  console.error('Usage: ts-node scripts/create-user.ts <username> <email> <password> [admin]');
  console.error('\nExample: ts-node scripts/create-user.ts admin admin@example.com "SecurePass123!@" admin');
  process.exit(1);
}

// Validate input
const validation = createUserSchema.safeParse({ username, email, password });
if (!validation.success) {
  console.error('❌ Validation errors:');
  validation.error.issues.forEach(err => {
    console.error(`   - ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

createUser(username, email, password)
  .then(async (user) => {
    // If admin role requested, update it in the database
    if (role === 'admin') {
      const db = (await import('../src/lib/auth/db.js')).default;
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', user.id);
      console.log(`✅ Admin user "${user.username}" created successfully!`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: admin`);
    } else {
      console.log(`✅ User "${user.username}" created successfully!`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  });

