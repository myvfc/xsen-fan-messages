import express from "express";
import fetch from "node-fetch";

const app = express();

/* ==============================
   BODY PARSERS
============================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ==============================
   FAN MESSAGE HANDLER
   (shared logic)
============================== */
async function handleFanMessage(req, res) {
  const { name, message, source } = req.body;

  if (!message || message.trim().length < 2) {
    return res.status(400).send("Message required");
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

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Discord webhook error:", err);
    return res.status(500).send("failed");
  }
}

/* ==============================
   ROUTES (IMPORTANT)
============================== */
app.post("/fan-message", handleFanMessage);
app.post("/", handleFanMessage); // ← fallback for Railway mount quirks

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

