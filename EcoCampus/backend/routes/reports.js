const express = require("express");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/collections", authenticate, async (req, res) => {
  try {
    const query = req.user.role === "admin"
      ? `SELECT c.id, b.bin_code, b.location, u.name AS collector, c.collected_at
         FROM collections c
         JOIN bins b ON b.id = c.bin_id
         JOIN users u ON u.id = c.user_id
         ORDER BY c.collected_at DESC`
      : `SELECT c.id, b.bin_code, b.location, c.collected_at
         FROM collections c
         JOIN bins b ON b.id = c.bin_id
         WHERE c.user_id = ?
         ORDER BY c.collected_at DESC`;

    const [rows] = req.user.role === "admin"
      ? await pool.execute(query)
      : await pool.execute(query, [req.user.id]);

    res.json(rows);
  } catch {
    res.status(500).json({ message: "Could not load collection history" });
  }
});

router.get("/issues", authenticate, async (req, res) => {
  try {
    const [rows] = req.user.role === "admin"
      ? await pool.execute(
          `SELECT i.id, b.bin_code, b.location, u.name AS reported_by,
                  i.issue_type, i.description, i.status, i.created_at
           FROM issues i
           LEFT JOIN bins b ON b.id = i.bin_id
           JOIN users u ON u.id = i.user_id
           ORDER BY i.created_at DESC`
        )
      : await pool.execute(
          `SELECT i.id, b.bin_code, b.location, i.issue_type,
                  i.description, i.status, i.created_at
           FROM issues i
           LEFT JOIN bins b ON b.id = i.bin_id
           WHERE i.user_id = ?
           ORDER BY i.created_at DESC`,
          [req.user.id]
        );

    res.json(rows);
  } catch {
    res.status(500).json({ message: "Could not load issues" });
  }
});

router.post("/issues", authenticate, async (req, res) => {
  try {
    const { bin_id, issue_type, description } = req.body;
    if (!issue_type || !description) {
      return res.status(400).json({ message: "Issue type and description are required" });
    }

    const [result] = await pool.execute(
      "INSERT INTO issues (bin_id, user_id, issue_type, description) VALUES (?, ?, ?, ?)",
      [bin_id || null, req.user.id, issue_type, description]
    );

    res.status(201).json({ id: result.insertId, message: "Issue reported successfully" });
  } catch {
    res.status(500).json({ message: "Could not report issue" });
  }
});

router.get("/stats", authenticate, async (req, res) => {
  try {
    const [[binStats]] = await pool.execute(`
      SELECT
        COUNT(*) AS totalBins,
        SUM(fill_level >= 80) AS fullBins,
        SUM(fill_level >= 50) AS pendingBins,
        ROUND(AVG(CASE WHEN waste_type = 'Recyclable' THEN 100 ELSE 0 END), 0) AS recyclingIndicator
      FROM bins
    `);

    const [[collectionStats]] = await pool.execute(
      req.user.role === "admin"
        ? "SELECT COUNT(*) AS completed FROM collections"
        : "SELECT COUNT(*) AS completed FROM collections WHERE user_id = ?",
      req.user.role === "admin" ? [] : [req.user.id]
    );

    const [[issueStats]] = await pool.execute(
      req.user.role === "admin"
        ? "SELECT COUNT(*) AS issues FROM issues WHERE status <> 'resolved'"
        : "SELECT COUNT(*) AS issues FROM issues WHERE user_id = ?",
      req.user.role === "admin" ? [] : [req.user.id]
    );

    res.json({
      totalBins: Number(binStats.totalBins || 0),
      fullBins: Number(binStats.fullBins || 0),
      pendingBins: Number(binStats.pendingBins || 0),
      completed: Number(collectionStats.completed || 0),
      issues: Number(issueStats.issues || 0)
    });
  } catch {
    res.status(500).json({ message: "Could not load statistics" });
  }
});

module.exports = router;
