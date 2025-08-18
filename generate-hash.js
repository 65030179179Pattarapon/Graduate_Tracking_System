// generate-hash.js
const bcrypt = require('bcryptjs');
const password = '123456'; // รหัสผ่านของ admin ที่เราจะใช้ทดสอบ

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('Password:', password);
  console.log('Hashed Password:', hash);
});