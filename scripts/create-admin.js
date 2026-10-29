require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(resolve => rl.question(q, resolve));

(async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || await ask("Admin email: ")).trim().toLowerCase();
    const name = (process.env.ADMIN_NAME || await ask("Admin name: ")).trim();
    const password = process.env.ADMIN_PASSWORD || await ask("Admin password (12+ characters recommended): ");
    if (!email || password.length < 10) throw new Error("Provide an email and a password of at least 10 characters.");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_canteen");
    const Admin = mongoose.model("Admin", new mongoose.Schema({ name: String, email: { type: String, unique: true }, passwordHash: String, role: String }, { timestamps: true }));
    const passwordHash = await bcrypt.hash(password, 12);
    await Admin.findOneAndUpdate({ email }, { name: name || "Administrator", email, passwordHash, role: "admin" }, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log("Admin account created/updated. Keep these credentials private.");
  } catch (err) {
    console.error("Could not create admin:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    rl.close();
  }
})();
