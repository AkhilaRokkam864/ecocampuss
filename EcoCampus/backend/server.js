const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const pool = require("./db");

dotenv.config();

const authRoutes = require("./routes/auth");
const binRoutes = require("./routes/bins");
const userRoutes = require("./routes/users");
const reportRoutes = require("./routes/reports");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "EcoCampus API",
    status: "running",
    version: "1.0.0"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

async function initialize() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bin_code VARCHAR(30) NOT NULL UNIQUE,
        location VARCHAR(150) NOT NULL,
        waste_type ENUM('General','Recyclable','Organic','E-Waste') DEFAULT 'General',
        fill_level INT NOT NULL DEFAULT 0,
        latitude DECIMAL(10,7) NULL,
        longitude DECIMAL(10,7) NULL,
        status ENUM('LOW','MEDIUM','FULL') NOT NULL DEFAULT 'LOW',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bin_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('completed') DEFAULT 'completed',
        collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bin_id INT NULL,
        user_id INT NOT NULL,
        issue_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('open','in_progress','resolved') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    const [admins] = await pool.execute("SELECT id FROM users WHERE email = ?", ["admin@ecocampus.com"]);
    if (!admins.length) {
      const hash = await bcrypt.hash("admin123", 10);
      await pool.execute(
        "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'admin')",
        ["Campus Administrator", "admin@ecocampus.com", hash]
      );
    }

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", ["user@ecocampus.com"]);
    if (!users.length) {
      const hash = await bcrypt.hash("user123", 10);
      await pool.execute(
        "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'user')",
        ["Waste Collection Staff", "user@ecocampus.com", hash]
      );
    }

    const [bins] = await pool.execute("SELECT COUNT(*) AS count FROM bins");
    if (Number(bins[0].count) === 0) {
      const seed = [
        ["B001","Canteen","Organic",92,"FULL"],
        ["B002","Block A","General",55,"MEDIUM"],
        ["B003","Library","Recyclable",25,"LOW"],
        ["B004","Parking","General",87,"FULL"],
        ["B005","Main Gate","Recyclable",71,"MEDIUM"],
        ["B006","Block B","Organic",43,"LOW"],
        ["B007","Hostel A","General",82,"FULL"],
        ["B008","Sports Ground","Recyclable",61,"MEDIUM"]
      ];

      for (const row of seed) {
        await pool.execute(
          "INSERT INTO bins (bin_code,location,waste_type,fill_level,status) VALUES (?,?,?,?,?)",
          row
        );
      }
    }

    app.listen(PORT, () => {
      console.log(`EcoCampus API running at http://localhost:${PORT}`);
      console.log("Admin: admin@ecocampus.com / admin123");
      console.log("User:  user@ecocampus.com / user123");
    });
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    console.error("Check MySQL, database name, username and password in backend/.env");
    process.exit(1);
  }
}

initialize();
