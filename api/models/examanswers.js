const mongoose = require("mongoose");
const examAnswersSchema = mongoose.Schema({
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exams",
    required: true,
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Questions",
    required: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Students",
    required: true,
  },
  student_answer_image: { type: String, required: true },
  student_answer: { type: String, required: true },
  grade: { type: Number, required: true },
  explanation: { type: String, required: true },
});

module.exports = mongoose.model("ExamAnswers", examAnswersSchema);
