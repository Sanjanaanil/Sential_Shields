import { generateToken, verifyToken } from "./config/jwt";

const payload = { id: "123", email: "sanju@example.com", role: "user" };

const token = generateToken(payload);
console.log("Generated Token:", token);

const decoded = verifyToken(token);
console.log("Decoded Token:", decoded);