// backend/jwt.js

const crypto = require("crypto");
const secret = crypto.randomBytes(32).toString("hex");
console.log(secret);

// cd backend; node jwt
