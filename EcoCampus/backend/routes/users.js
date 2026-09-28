const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Could not load users" });
  }
});

router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), hash, role === "admin" ? "admin" : "user"]
    );

    res.status(201).json({ id: result.insertId, message: "User created" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Could not create user" });
  }
});

module.exports = router;
