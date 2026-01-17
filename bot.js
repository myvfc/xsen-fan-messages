import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

/* ==============================
   CONFIG
============================== */
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Channel name where commands are allowed
const LIVE_CONTROL_CHANNEL = "live-control";

// Public server endpoints (safe – not visible to users)
const API_BASE =
  "https://xsen-fan-messages-production.up.railway.app";

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
    await setLiveState("on", message);
    return;
  }

  if (content === "/live off") {
    await setLiveState("off", message);
    return;
  }
});

/* ==============================
   LIVE STATE UPDATE
============================== */
async function setLiveState(mode, message) {
  try {
    const url = `${API_BASE}/live/${mode}`;
    await fetch(url);

    console.log(`LIVE STATE SET: ${mode.toUpperCase()}`);

    // React only if allowed (prevents crashes)
    try {
      await message.react(mode === "on" ? "🔴" : "⚪");
    } catch (e) {
      console.warn("Reaction failed (missing perms)");
    }

  } catch (err) {
    console.error("Failed to set live state:", err);

    try {
      await message.react("❌");
    } catch {}
  }
}

/* ==============================
   LOGIN
============================== */
client.login(DISCORD_TOKEN);
