import express from "express";

const app = express();

/* ==============================
   CONFIG
============================== */
const PORT = process.env.PORT || 8080;

/* ==============================
   LIVE STATE (in-memory)
   NOTE: survives while container runs
============================== */
let LIVE_STATE = {
  isLive: false,
  updatedAt: null,
  source: "manual"
};

/* ==============================
   MIDDLEWARE
============================== */
app.use(express.json());

/* ==============================
   DISCORD WEBHOOK ENDPOINT
============================== */
app.post("/discord-live", (req, res) => {
  const content =
    req.body?.

