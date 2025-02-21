const mongoose = require("mongoose");

const questionsSchema = mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exams",
    required: true,
  },
  grade: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Questions", questionsSchema);
