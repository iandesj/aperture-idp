const { createUser } = require('../src/lib/auth/users');

const username = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];

if (!username || !email || !password) {
  console.error('Usage: node scripts/create-user.js <username> <email> <password>');
  process.exit(1);
}

createUser(username, email, password)
  .then((user) => {
    console.log(`✅ User "${user.username}" created successfully!`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  });

