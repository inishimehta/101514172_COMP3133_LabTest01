require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // chat.html, rooms.html
app.use(express.static("view")); // signup.html, login.html
app.use(express.json());
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const userSockets = new Map(); // username -> socket.id

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  io.on("connection", (socket) => {
    console.log("user connected:", socket.id);

    // Register user for private messaging
    socket.on("registerUser", ({ username }) => {
      socket.username = username;
      userSockets.set(username, socket.id);
      io.emit("onlineUsers", Array.from(userSockets.keys()));
    });

    // Join a room and send chat history
    socket.on("joinRoom", async ({ room, username }) => {
      socket.join(room);

      const msgs = await GroupMessage.find({ room })
        .sort({ date_sent: 1 })
        .limit(20);

      socket.emit("roomHistory", msgs);

      socket.to(room).emit("system", `${username} joined ${room}`);
    });

    // Leave the current room
    socket.on("leaveRoom", ({ room, username }) => {
      socket.leave(room);
      socket.to(room).emit("system", `${username} left ${room}`);
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
      });
    });

    // Typing indicator events
    socket.on("typing", ({ room, username }) => {
      socket.to(room).emit("typing", { username });
    });

    socket.on("stopTyping", ({ room, username }) => {
      socket.to(room).emit("stopTyping", { username });
    });

    // Private message + MongoDB save
    socket.on("privateMessage", async ({ to_user, from_user, message }) => {
      const toSocketId = userSockets.get(to_user);
      if (!toSocketId) return;

      const doc = await PrivateMessage.create({
        from_user,
        to_user,
        message
      });

      // Receiver
      socket.to(toSocketId).emit("privateMessage", {
        from_user: doc.from_user,
        to_user: doc.to_user,
        message: doc.message,
        date_sent: doc.date_sent
      });

      // Sender (show in sender UI too)
      socket.emit("privateMessage", {
        from_user: doc.from_user,
        to_user: doc.to_user,
        message: doc.message,
        date_sent: doc.date_sent
      });
    });

    socket.on("disconnect", () => {
      console.log("user disconnected:", socket.id);

      if (socket.username) {
        userSockets.delete(socket.username);
        io.emit("onlineUsers", Array.from(userSockets.keys()));
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log("Listening on " + PORT));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
