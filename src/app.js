const http = require("http");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes");
const models = require("./models");
const path = require('path');

require("./config/db_connection");

const app = express();

/* =======================
   CORS (SINGLE SOURCE)
   ======================= */
const ALLOWED_ORIGINS =
  "*";

const allowedOrigins = [
  "http://localhost:8080","http://localhost:8081","https://payyanur-cl-fe-204746249106.europe-west1.run.app"
];

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

app.use(express.static('public'))

/* =======================
   MIDDLEWARE
   ======================= */
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(routes);
app.disable("x-powered-by");

/* =======================
   HEALTH CHECK
   ======================= */
app.get("/", (req, res) => {
  res.send("Server is up");
});

/* =======================
   HTTP SERVER (IMPORTANT)
   ======================= */
const server = http.createServer(app);

/* =======================
   SOCKET.IO
   ======================= */
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
});

global.io = io;

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", async (roomId) => {
    socket.join(roomId);

    // const selectedPlayer = await models.players.findOne({
    //   where: { profile_link: "1" },
    //   order: [["updatedAt", "DESC"]],
    // });

    // io.to(roomId).emit("current_player", JSON.stringify(selectedPlayer));
  });
});




/* =======================
   START SERVER
   ======================= */
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "my_verify_token";

app.get("/webhook/whatsapp", (req, res) => {
  console.log("req== ", req.query);
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("WhatsApp webhook verification request");
  console.log("VERIFY_TOKEN== ", VERIFY_TOKEN)
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");

    return res.status(200).send(challenge);
  }

  console.log("WhatsApp webhook verification failed");

  return res.sendStatus(403);
});


app.post("/webhook/whatsapp", (req, res) => {
  try {
    console.log(
      "WhatsApp webhook received:",
      JSON.stringify(req.body, null, 2)
    );

    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const entries = body.entry || [];

    entries.forEach((entry) => {
      const changes = entry.changes || [];

      changes.forEach((change) => {
        const value = change.value;

        // Message status updates
        const statuses = value?.statuses || [];

        statuses.forEach((status) => {
          console.log("=================================");
          console.log("WhatsApp Message Status");
          console.log("Message ID:", status.id);
          console.log("Status:", status.status);
          console.log("Recipient:", status.recipient_id);
          console.log("Timestamp:", status.timestamp);

          if (status.errors) {
            console.log(
              "Errors:",
              JSON.stringify(status.errors, null, 2)
            );
          }

          console.log("=================================");

          switch (status.status) {
            case "sent":
              console.log("Message sent to WhatsApp");
              break;

            case "delivered":
              console.log("Message delivered to recipient");
              break;

            case "read":
              console.log("Message read by recipient");
              break;

            case "failed":
              console.log("Message delivery failed");

              if (status.errors) {
                status.errors.forEach((error) => {
                  console.log("Error code:", error.code);
                  console.log("Error title:", error.title);
                  console.log("Error message:", error.message);
                });
              }

              break;

            default:
              console.log("Unknown status:", status.status);
          }
        });

        // Incoming WhatsApp messages
        const messages = value?.messages || [];

        messages.forEach((message) => {
          console.log("Incoming WhatsApp message");

          console.log("Message ID:", message.id);
          console.log("From:", message.from);
          console.log("Type:", message.type);

          if (message.text) {
            console.log("Text:", message.text.body);
          }
        });
      });
    });

    // IMPORTANT:
    // Respond quickly to WhatsApp
    return res.sendStatus(200);

  } catch (error) {
    console.error("WhatsApp webhook error:", error);

    return res.sendStatus(500);
  }
});





module.exports = { app, server, io };
