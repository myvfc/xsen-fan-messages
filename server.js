import express from "express";
import fetch from "node-fetch";

const app = express();

/* ==============================
   CONFIG
============================== */
const PORT = process.env.PORT || 8080;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

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

  if (!DISCORD_WEBHOOK_URL) {
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
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Discord webhook error:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
}

/* ==============================
   ROUTES
============================== */
app.post("/fan-message", handleFanMessage);

// Railway fallback (important)
app.post("/", handleFanMessage);

/* ==============================
   HEALTH CHECK
============================== */
app.get("/", (req, res) => {
  res.json({
    service: "xsen-fan-messages",
    status: "running"
  });
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () => {
  console.log(`XSEN Fan Messages running on port ${PORT}`);
});

