const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Unique username
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  password: { type: String, required: true } // Will be hashed with bcrypt
}, {
  timestamps: true // Adds createdAt/updatedAt
});

module.exports = mongoose.model("User", userSchema);
