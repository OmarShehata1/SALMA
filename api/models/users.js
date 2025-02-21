const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  profile_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teachers" || "Students",
    required: true,
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
