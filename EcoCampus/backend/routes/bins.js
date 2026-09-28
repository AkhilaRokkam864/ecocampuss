const express = require("express");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

function statusFor(fill) {
  if (fill >= 80) return "FULL";
  if (fill >= 50) return "MEDIUM";
  return "LOW";
}

router.get("/", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, bin_code, location, waste_type, fill_level, latitude, longitude, status, updated_at FROM bins ORDER BY fill_level DESC"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Could not load bins" });
  }
});

router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { bin_code, location, waste_type = "General", fill_level = 0 } = req.body;
    if (!bin_code || !location) {
      return res.status(400).json({ message: "Bin code and location are required" });
    }

    const fill = Math.max(0, Math.min(100, Number(fill_level)));
    const [result] = await pool.execute(
      `INSERT INTO bins (bin_code, location, waste_type, fill_level, status)
       VALUES (?, ?, ?, ?, ?)`,
      [bin_code, location, waste_type, fill, statusFor(fill)]
    );

    const [rows] = await pool.execute("SELECT * FROM bins WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Bin code already exists" });
    }
    res.status(500).json({ message: "Could not create bin" });
  }
});

router.patch("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const fill = Math.max(0, Math.min(100, Number(req.body.fill_level)));
    await pool.execute(
      "UPDATE bins SET fill_level = ?, status = ? WHERE id = ?",
      [fill, statusFor(fill), req.params.id]
    );
    const [rows] = await pool.execute("SELECT * FROM bins WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Bin not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: "Could not update bin" });
  }
});

router.post("/:id/collect", authenticate, async (req, res) => {
  try {
    const [bins] = await pool.execute("SELECT * FROM bins WHERE id = ?", [req.params.id]);
    if (!bins.length) return res.status(404).json({ message: "Bin not found" });

    await pool.execute(
      "UPDATE bins SET fill_level = 0, status = 'LOW' WHERE id = ?",
      [req.params.id]
    );

    await pool.execute(
      "INSERT INTO collections (bin_id, user_id) VALUES (?, ?)",
      [req.params.id, req.user.id]
    );

    res.json({ message: "Collection completed and bin reset" });
  } catch {
    res.status(500).json({ message: "Could not complete collection" });
  }
});

module.exports = router;
