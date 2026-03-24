const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  // VIBE: your "is API alive?" endpoint
  res.json({ ok: true, service: "arc-staking-vibe-backend" });
});

app.get("/leaderboard", (_req, res) => {
  // VIBE: replace with real DB/cache data later
  res.json({
    leaderboard: [
      { wallet: "0x111...abc", staked: "1200.00" },
      { wallet: "0x222...def", staked: "845.00" },
    ],
  });
});

app.listen(port, () => {
  console.log(`// VIBE: backend running on http://localhost:${port}`);
});
