import express from "express";
import fetch from "node-fetch";

const app = express();

/* ==============================
   CONFIG
============================== */
const PORT = process.env.PORT || 8080;

// Fan → Broadcaster messages webhook (required for fan messaging)
const FAN_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Optional: a separate Discord webhook to post LIVE/Offline announcements
// (recommended, but safe to leave unset)
const LIVE_ANNOUNCE_WEBHOOK_URL = process.env.DISCORD_LIVE_WEBHOOK_URL;

// Optional: protect /live/on and /live/off with a shared secret token
// If set, calls must include ?key=YOUR_TOKEN
const LIVE_CONTROL_KEY = process.env.LIVE_CONTROL_KEY || "";

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
   HELPERS
============================== */
function nowIso() {
  return new Date().toISOString();
}

function requireKey(req, res) {
  // If no key configured, do not require one (simple proof-of-concept mode)
  if (!LIVE_CONTROL_KEY) return true;

  const provided = (req.query?.key || "").toString();
  if (provided !== LIVE_CONTROL_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

async function postToDiscord(webhookUrl, content) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
  } catch (err) {
    console.error("Discord post failed:", err);
  }
}

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
    console.error("Fan webhook error:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
}

/* ==============================
   ROUTES — FAN MESSAGES
============================== */
app.post("/fan-message", handleFanMessage);

// Railway fallback (keeps your prior “mount quirks” protection)
app.post("/", handleFanMessage);

/* ==============================
   ROUTES — LIVE CONTROL (Option A)
   Use: /live/on  and /live/off
   Optional protection: ?key=LIVE_CONTROL_KEY
============================== */
app.get("/live/on", async (req, res) => {
  if (!requireKey(req, res)) return;

  LIVE_STATE.isLive = true;
  LIVE_STATE.updatedAt = nowIso();
  LIVE_STATE.source = "control-url";

  console.log("LIVE STATE: ON", LIVE_STATE.updatedAt);

  await postToDiscord(
    LIVE_ANNOUNCE_WEBHOOK_URL,
    "🔴 **Boomer Bot is now ON AIR**"
  );

  return res.json({ ok: true, ...LIVE_STATE });
});

app.get("/live/off", async (req, res) => {
  if (!requireKey(req, res)) return;

  LIVE_STATE.isLive = false;
  LIVE_STATE.updatedAt = nowIso();
  LIVE_STATE.source = "control-url";

  console.log("LIVE STATE: OFF", LIVE_STATE.updatedAt);

  await postToDiscord(
    LIVE_ANNOUNCE_WEBHOOK_URL,
    "⚪ **Boomer Bot is now OFF AIR**"
  );

  return res.json({ ok: true, ...LIVE_STATE });
});

/* ==============================
   ROUTE — LIVE STATUS (read-only)
============================== */
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
    routes: ["/fan-message", "/live/on", "/live/off", "/live-status", "/__whoami"],
    live: LIVE_STATE
  });
});

app.get("/", (req, res) => {
  // keep it simple; your root POST is reserved for fan-message fallback
  res.send("XSEN Fan Message + Live Control Service is running");
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () => {
  console.log(`XSEN Fan + Live Control running on port ${PORT}`);
});

