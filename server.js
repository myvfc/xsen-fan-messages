import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ==============================
   FAN MESSAGE ENDPOINT
============================== */
app.post("/fan-message", async (req, res) => {
  const { name, message, source } = req.body;

  if (!message || message.length < 2) {
    return res.status(400).json({ error: "Message required" });
  }

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/Denver"
  });

  const content = {
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
      body: JSON.stringify(content)
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Discord webhook error:", err);
    res.status(500).json({ error: "Failed to send message" });
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
