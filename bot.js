import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

/* ==============================
   CONFIG
============================== */
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

// MUST match the channel name exactly
const LIVE_CONTROL_CHANNEL = "live-control";

// Internal endpoint (never shown to broadcasters)
const LIVE_CONTROL_ENDPOINT =
  "https://xsen-fan-messages-production.up.railway.app/internal/live";

/* ==============================
   SAFETY CHECK
============================== */
if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN not set");
  process.exit(1);
}

/* ==============================
   CREATE CLIENT
============================== */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ==============================
   READY
============================== */
client.once("ready", () => {
  console.log(`🤖 XSEN Live Bot logged in as ${client.user.tag}`);
});

/* ==============================
   MESSAGE HANDLER
============================== */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.name !== LIVE_CONTROL_CHANNEL) return;

  const content = message.content.trim().toLowerCase();

  if (content === "/live on") {
    await setLiveState(true, message);
  }

  if (content === "/live off") {
    await setLiveState(false, message);
  }
});

/* ==============================
   LIVE STATE UPDATE
============================== */
async function setLiveState(isLive, message) {
  try {
    await fetch(LIVE_CONTROL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isLive,
        source: "discord-bot"
      })
    });

    await message.react("✅");
    console.log(`LIVE STATE SET: ${isLive ? "ON" : "OFF"}`);
  } catch (err) {
    console.error("Failed to set live state:", err);
    await message.react("❌");
  }
}

/* ==============================
   LOGIN
============================== */
client.login(DISCORD_TOKEN);
