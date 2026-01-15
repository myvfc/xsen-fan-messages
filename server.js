import express from "express";
import fetch from "node-fetch";

const app = express();

/* ==============================
   GLOBAL CORS + PRE-FLIGHT
============================== */
app.use((req, res, next) => {
  // Allow any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Allowed HTTP methods
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  // Allowed request headers
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // If this is a preflight request, end here
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// JSON parser
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
    return res.json({ success: true });
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
app.listen(PORT, () =>
  console.log(`XSEN Fan Messages running on port ${PORT}`)
);
