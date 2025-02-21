const mongoose = require("mongoose");

const teachersSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  exams: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exams",
      required: true,
      default: [],
    },
  ],
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      required: true,
      default: [],
    },
  ],
  pdfs: [{ name: String, pdf_url: String }],
  student_groups: [
    {
      name: String,
      students: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Students",
          required: true,
          default: [],
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Teachers", teachersSchema);
