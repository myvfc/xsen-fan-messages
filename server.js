import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

/* ==============================
   LIVE STATE (in-memory)
============================== */
let LIVE_STATE = {
  isLive: false,
  updatedAt: null,
  source: "control-url"
};

/* ==============================
   CORS + BODY PARSERS
============================== */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==============================
   FAN MESSAGE ENDPOINT
============================== */
app.post("/fan-message", async (req, res) => {
  const { name, message, source } = req.body || {};

  if (!message || message.trim().length < 2) {
    return res.status(400).json({ error: "Message required" });
  }

  const FAN_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!FAN_WEBHOOK_URL) {
    return res.status(500).json({ error: "Webhook not configured" });
  }

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/Denver"
  });

  const payload = {
    content:
`📣 **FAN MESSAGE — BOOMER BOT**

👤 **Name:** ${name || "Anonymous Fan"}
💬 **Message:**
${message}

⏱️ ${timestamp}
📡 ${source || "Boomer Bot Live"}`
  };

  try {
    await fetch(FAN_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

/* ==============================
   LIVE CONTROL — OPTION A
============================== */
app.get("/live/on", (req, res) => {
  LIVE_STATE.isLive = true;
  LIVE_STATE.updatedAt = new Date().toISOString();
  return res.json({ ok: true, ...LIVE_STATE });
});

app.get("/live/off", (req, res) => {
  LIVE_STATE.isLive = false;
  LIVE_STATE.updatedAt = new Date().toISOString();
  return res.json({ ok: true, ...LIVE_STATE });
});

app.get("/live-status", (req, res) => {
  return res.json(LIVE_STATE);
});

/* ==============================
   HEALTH / INFO
============================== */
app.get("/__whoami", (req, res) => {
  res.json({
    service: "xsen-fan-messages",
    status: "running",
    routes: ["/fan-message", "/live/on", "/live/off", "/live-status"],
    live: LIVE_STATE
  });
});

app.get("/", (req, res) => {
  res.send("XSEN Fan Message + Live Control Service running");
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () => {
  console.log(`XSEN Fan + Live Control running on port ${PORT}`);
});
