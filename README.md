# VibeChat 💬

VibeChat is a real-time web chat application with topic-based public rooms and direct messages (DMs), built using Node.js, Express, Socket.IO, and MongoDB.

---

## ✨ Features

- Topic-based chat rooms:
  - Fashion
  - Aliens
  - MentalHealth
  - Entrepreneurship
  - Travel
  - Technology
  - Paranormal
- Real-time room messaging
- Recent message history loads when joining a room
- Active members list per room
- Typing indicators (room chat + DMs)
- Direct messages (stored in MongoDB)
- DM history loading

---

## 🚀 Tech Stack

**Backend**
- Node.js
- Express
- Socket.IO

**Database**
- MongoDB
- Mongoose

**Frontend**
- HTML
- CSS
- Bootstrap 5
- Socket.IO Client

---

## 📁 Project Structure

- `server.js` — Express + Socket.IO server, MongoDB connection
- `public/`
  - `rooms.html`
  - `chat.html`
  - `app.css`
- `view/`
  - `signup.html`
  - `login.html`
- `models/`
  - `GroupMessage.js`
  - `PrivateMessage.js`
  - `User.js`
- `routes/`
  - `auth.js`

---

## 📌 Requirements

- Node.js (v18+ recommended)
- MongoDB (Local or MongoDB Atlas)
- npm

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

---

## ▶️ Install & Run (Development)

```bash
npm install
npm run dev
```

Then open:

- http://localhost:3000/login.html  

---

## 🧑‍💻 How to Use

1. Sign up or log in.
2. Choose a room in `rooms.html`.
3. Start chatting — messages broadcast live.
4. Switch to the **Direct Message** tab to message an online user.
5. DMs are stored in MongoDB and can be reloaded.

---

## 🔌 Socket Events (Overview)

### 🏠 Room Chat

**Client → Server**
- `registerUser`
- `joinRoom`
- `leaveRoom`
- `groupMessage`
- `typing`
- `stopTyping`

**Server → Client**
- `onlineUsers`
- `roomHistory`
- `groupMessage`
- `system`
- `roomMembers`

---

### 💌 Direct Messages

**Client → Server**
- `privateMessage`
- `dmTyping`
- `dmStopTyping`
- `getDMHistory`

**Server → Client**
- `privateMessage`
- `dmTyping`
- `dmStopTyping`
- `dmHistory`

---

## 🛠 Notes / Troubleshooting

If DMs do not appear:

- Ensure both users are online (for live delivery).
- Make sure the client requests DM history (`getDMHistory`) after selecting a user.
- Restart the server after updating `server.js`.
