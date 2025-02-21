const mongoose = require("mongoose");

const studentsSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  teachers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teachers",
      required: true,
      default: [],
    },
  ],
  exam_grades: [
    {
      exam_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exams",
        required: true,
      },
      total_grade: {
        type: Number,
        required: true,
      },
      question_grades: [
        {
          question_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Questions",
            required: true,
          },
          grade: {
            type: Number,
            required: true,
          },
        },
      ],
    },
  ],
  default: [],
});

module.exports = mongoose.model("Students", studentsSchema);
