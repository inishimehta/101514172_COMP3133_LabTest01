require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const GroupMessage = require("./models/GroupMessage");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // Serve frontend files

async function start() {
  await mongoose.connect(process.env.MONGO_URI); // Connect MongoDB
  console.log("MongoDB connected");

  io.on("connection", (socket) => {
    console.log("user connected:", socket.id);

    // Join a room and send chat history
    socket.on("joinRoom", async ({ room, username }) => {
      socket.join(room); // Join room [web:7]

      const msgs = await GroupMessage.find({ room })
        .sort({ date_sent: 1 })
        .limit(20);

      socket.emit("roomHistory", msgs);
      io.to(room).emit("system", `${username} joined ${room}`); // Notify room [web:7]
    });

    // Leave the current room
    socket.on("leaveRoom", ({ room, username }) => {
      socket.leave(room); // Leave room [web:7]
      io.to(room).emit("system", `${username} left ${room}`); // Notify room [web:7]
    });

    // Save and broadcast room message
    socket.on("groupMessage", async ({ room, from, message }) => {
      const doc = await GroupMessage.create({
        from_user: from,
        room,
        message
      });

      io.to(room).emit("groupMessage", {
        room: doc.room,
        from: doc.from_user,
        message: doc.message,
        date_sent: doc.date_sent
      }); // Broadcast to room [web:7]
    });

    socket.on("disconnect", () => {
      console.log("user disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log("Listening on " + PORT));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
