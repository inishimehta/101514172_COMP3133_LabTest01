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

app.use(express.static("public"));
app.use(express.static("view"));
app.use(express.json());
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const userSockets = new Map(); // username -> socket.id

function emitRoomMembers(room) {
  const roomSet = io.sockets.adapter.rooms.get(room);
  const members = [];

  if (roomSet) {
    for (const sid of roomSet) {
      const s = io.sockets.sockets.get(sid);
      if (s?.username) members.push(s.username);
    }
  }

  io.to(room).emit("roomMembers", members);
}

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  io.on("connection", (socket) => {
    console.log("user connected:", socket.id);

    socket.on("registerUser", ({ username }) => {
      socket.username = username;
      userSockets.set(username, socket.id);
      io.emit("onlineUsers", Array.from(userSockets.keys()));
    });

    socket.on("joinRoom", async ({ room, username }) => {
      socket.join(room);
      socket.room = room;

      const msgs = await GroupMessage.find({ room }).sort({ date_sent: 1 }).limit(20);
      socket.emit("roomHistory", msgs);

      socket.to(room).emit("system", `${username} joined ${room}`);
      emitRoomMembers(room);
    });

    socket.on("leaveRoom", ({ room, username }) => {
      socket.leave(room);
      socket.to(room).emit("system", `${username} left ${room}`);

      if (socket.room === room) socket.room = null;
      emitRoomMembers(room);
    });

    socket.on("groupMessage", async ({ room, from, message }) => {
      const doc = await GroupMessage.create({ from_user: from, room, message });

      io.to(room).emit("groupMessage", {
        room: doc.room,
        from: doc.from_user,
        message: doc.message,
        date_sent: doc.date_sent
      });
    });

    socket.on("typing", ({ room, username }) => socket.to(room).emit("typing", { username }));
    socket.on("stopTyping", ({ room, username }) => socket.to(room).emit("stopTyping", { username }));

    socket.on("dmTyping", ({ to_user, from_user }) => {
      const toSocketId = userSockets.get(to_user);
      if (toSocketId) socket.to(toSocketId).emit("dmTyping", { from_user });
    });

    socket.on("dmStopTyping", ({ to_user, from_user }) => {
      const toSocketId = userSockets.get(to_user);
      if (toSocketId) socket.to(toSocketId).emit("dmStopTyping", { from_user });
    });

    // DM history
    socket.on("getDMHistory", async ({ userA, userB }) => {
      if (!userA || !userB) return;

      const msgs = await PrivateMessage.find({
        $or: [
          { from_user: userA, to_user: userB },
          { from_user: userB, to_user: userA }
        ]
      }).sort({ date_sent: 1 }).limit(30);

      socket.emit("dmHistory", msgs);
    });

    // DM save always (even if offline)
    socket.on("privateMessage", async ({ to_user, from_user, message }) => {
      if (!to_user || !from_user || !message) return;

      const doc = await PrivateMessage.create({ from_user, to_user, message });

      const toSocketId = userSockets.get(to_user);
      if (toSocketId) {
        socket.to(toSocketId).emit("privateMessage", {
          from_user: doc.from_user,
          to_user: doc.to_user,
          message: doc.message,
          date_sent: doc.date_sent
        });
      }

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

      if (socket.room) emitRoomMembers(socket.room);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log("Listening on " + PORT));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
