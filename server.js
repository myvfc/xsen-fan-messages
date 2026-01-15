import express from "express";
import fetch from "node-fetch";

const app = express();

/* ==============================
   HARD CORS HANDLER (RAILWAY-SAFE)
============================== */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // SHORT-CIRCUIT ALL PREFLIGHT REQUESTS
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

/* ==============================
   FAN MESSAGE ENDPOINT
============================== */
app.post("/fan-message", async (req, res) => {
  const { name, message, source } = req.body;

  if (!message || message.trim().length < 2) {
    return res.status(400).json({ error: "Message required" });
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
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Discord webhook error:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

/* ==============================
   HEALTH CHECK
============================== */
app.get("/", (req, res) => {
  res.send("XSEN Fan Message Service is running");
});

/* ==============================
   START SERVER
============================== */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`XSEN Fan Messages running on port ${PORT}`);
});
