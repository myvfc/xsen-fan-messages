import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

/* ==============================
   CONFIG
============================== */
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const LIVE_CONTROL_CHANNEL = "live-control"; // channel name
const LIVE_CONTROL_ENDPOINT =
  "https://xsen-fan-messages-production.up.railway.app/internal/live";

/* ==============================
   SAFETY CHECKS
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
  // Ignore bots
  if (message.author.bot) return;

  // Only listen in live-control
  if (message.channel.name !== LIVE_CONTROL_CHANNEL) return;

  const content = message.content.trim().toLowerCase();

  if (content === "/live on") {
    await setLiveState(true, message);
  }

  if (content === "/live off")
