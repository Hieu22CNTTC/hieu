// Generate hashed passwords for seed.sql
import bcrypt from 'bcrypt';

const users = [
  { email: 'admin@flight.com', password: 'admin' },
  { email: 'manager@flight.com', password: '123' },
  { email: 'sales@flight.com', password: '123' },
  { email: 'customer@gmail.com', password: '123' },
];

console.log('Generating hashed passwords...\n');

async function generateHashes() {
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`${user.email}: ${hash}`);
  }
  
  console.log('\n✅ Copy these hashes to database/seed.sql in the users INSERT statement');
}

generateHashes();
