import bcrypt from "bcryptjs";

const plainPassword = process.argv[2] || "";

if (!plainPassword) {
  console.error("Usage: node scripts/hash_password_tmp.js <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(plainPassword, 10);
console.log(hash);
