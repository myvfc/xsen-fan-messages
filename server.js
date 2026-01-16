import express from "express";
import fetch from "node-fetch";

const app = express();

/* ==============================
   CONFIG
============================== */
const PORT = process.env.PORT || 8080;

// Fan → Broadcaster messages
const FAN_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Broadcaster → System LIVE control
const LIVE_WEBHOOK_URL = process.env.DISCORD_LIVE_WEBHOOK_URL;

/* ==============================
   LIVE STATE (in-memory)
============================== */
let LIVE_STATE = {
  isLive: false,
  updatedAt: null,
  source: "manual"
};

/* ==============================
   GLOBAL CORS + BODY PARSERS
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
   FAN MESSAGE HANDLER
============================== */
async function handleFanMessage(req, res) {
  const { name, message, source } = req.body || {};

  if (!message || message.trim().length < 2) {
    return res.status(400).json({ error: "Message required" });
  }

  if (!FAN_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL not set");
    return res.status(500).json({ error: "Fan webhook not configured" });
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
    console.error("Fan webhook error:", err);
    return res.status(500).json({ error: "Failed to send fan message" });
  }
}

/* ==============================
   LIVE CONTROL (DISCORD → SYSTEM)
============================== */
app.post("/discord-live", async (req, res) => {
  const content = req.body?.content?.toLowerCase?.();

  if (!content) {
    return res.sendStatus(200);
  }

  if (content === "/live on") {
    LIVE_STATE.isLive = true;
    LIVE_STATE.updatedAt = new Date().toISOString();
    LIVE_STATE.source = "discord";

    console.log("LIVE STATE: ON");
  }

  if (content === "/live off") {
    LIVE_STATE.isLive = false;
    LIVE_STATE.updatedAt = new Date().toISOString();
    LIVE_STATE.source = "discord";

    console.log("LIVE STATE: OFF");
  }

  // Acknowledge Discord silently
  return res.sendStatus(200);
});

/* ==============================
   LIVE STATUS (APP READ-ONLY)
============================== */
app.get("/live-status", (req, res) => {
  res.json(LIVE_STATE);
});

/* ==============================
   ROUTES
============================== */
app.post("/fan-message", handleFanMessage);

// Railway fallback
app.post("/", handleFanMessage);

/* ==============================
   HEALTH CHECK
============================== */
app.get("/", (req, res) => {
  res.json({
    service: "xsen-fan-messages",
    version: "2026-01-15-C",
    status: "running",
    live: LIVE_STATE.isLive
  });
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () => {
  console.log(`XSEN Fan + Live Control running on port ${PORT}`);
});

