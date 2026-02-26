// server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

// Serve frontend from same server
app.use(express.static(path.join(__dirname, ".")));

// Admin config
const ADMIN_EMAIL = "stormywilliams279@gmail.com";
const ADMIN_KEY = "SuperSecret123";

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".apk")) return cb(new Error("Only APK files allowed"));
    cb(null, true);
  }
});

// In-memory database
const games = [];

// Upload game (user or admin)
app.post("/upload-game", upload.single("gameFile"), (req, res) => {
  const { title, description, price, developerEmail, isAdmin } = req.body;
  if (!title || !developerEmail || !req.file) return res.status(400).json({ error: "Missing fields or file" });

  const status = isAdmin === "true" ? "approved" : "pending";
  const newGame = {
    id: Date.now().toString(),
    title,
    description,
    price: Number(price || 0),
    developerEmail,
    status,
    filePath: req.file.filename
  };
  games.push(newGame);

  res.json({ success: true, message: status === "approved" ? "Game live!" : "Pending admin verification." });
});

// Verify game (admin)
app.post("/verify-game/:id", (req, res) => {
  const { email, key } = req.body;
  if (email !== ADMIN_EMAIL || key !== ADMIN_KEY) return res.status(403).json({ error: "Not authorized" });

  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });

  game.status = "approved";
  res.json({ success: true });
});

// Approved store
app.get("/store", (req, res) => res.json(games.filter(g => g.status === "approved")));

// Pending games for admin
app.get("/pending", (req, res) => res.json(games.filter(g => g.status === "pending")));

// Serve uploaded APKs
app.use("/uploads", express.static(UPLOAD_DIR));

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ GameStorePro running at http://localhost:${PORT}/index.html`));
