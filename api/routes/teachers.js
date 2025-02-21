const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Teacher = require("../models/teachers.js");
const Exam = require("../models/exams");
const Question = require("../models/questions");
const Student = require("../models/students");
const ExamAnswers = require("../models/examanswers");
const { checkExist } = require("../middleware/helpers");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createPdfFromText } = require("../middleware/pdf_helpers");
const axios = require("axios");

/**
 * Placeholder function for grading logic (to be implemented)
 * @param {Object} question - Question object from database
 * @param {string} answer - Correct answer from question
 * @param {string} studentAnswer - Student's submitted answer
 * @param {number} full_mark - Maximum marks for the question
 * @returns {Object} Grading result object
 */
function GetGrade(question, answer, studentAnswer, full_mark) {
  return { text_answer: "ASDASD", grade: 8, explanation: "ASDASD" };
}
// Set up multer to store files in memory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { id } = req.params;
    const uploadDir = path.join(__dirname, `../../uploads/${id}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); // Save files in the specified folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
  },
});

const imageFolderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { teacherId, examId, studentId } = req.params;
    const uploadDir = path.join(
      __dirname,
      `../../uploads/${teacherId}/${examId}/${studentId}`
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); // Save files in the specified folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
  },
});

const imageUpload = multer({ storage: imageFolderStorage });

const upload = multer({ storage: storage });

/**
 * GET /:id - Get all exams for a teacher
 * @param {string} id - Teacher ID
 * @returns {Object} Teacher's exams or error message
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let status = 200;
    let message = "";
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      status = 404;
      message = "Teacher not found";
      return res.status(status).json({ message });
    }
    const exams = await Exam.find({ teacher: id });
    if (exams.length === 0) {
      status = 200;
      message = "No exams found";
    }
    res.status(status).json({ name: teacher.name, exams, message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /:id/uploads - Upload PDFs for a teacher
 * @param {string} id - Teacher ID
 * @returns {Object} Upload confirmation or error
 */
router.post("/:id/uploads", upload.array("pdf", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    const pdfPaths = req.files.map((file) => file.path);
    for (let i = 0; i < pdfPaths.length; i++) {
      const pdf = { name: req.files[i].originalname, pdf_url: pdfPaths[i] };
      teacher.pdfs.push(pdf);
    }
    await teacher.save();

    console.log("File saved at:", pdfPaths);
    res.status(200).json({ message: "Uploaded" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /:id/exams/generate - Get all PDFs for question generation
 * @param {string} id - Teacher ID
 * @returns {Object} List of PDFs or error
 */
router.get("/:id/exams/generate", async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    const pdfs = teacher.pdfs;
    if (pdfs.length === 0) {
      return res
        .status(204)
        .json({ message: "No data found please upload pdfs" });
    }
    res.status(200).json({ teacher: teacher.name, pdfs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /:id/exams/generate/save - Save generated exam
 * @param {string} id - Teacher ID
 * @param {Object} req.body - Exam data {exam_name, full_mark, num_of_questions, questions, students}
 * @returns {Object} Created exam object or error
 */
router.post("/:id/exams/generate/save", async (req, res) => {
  try {
    const { id } = req.params;
    let { exam_name, full_mark, num_of_questions, questions, students } =
      req.body;
    let Qobjects = [];
    console.log(
      req.body,
      exam_name,
      full_mark,
      num_of_questions,
      questions,
      students
    );
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    const exam = new Exam({
      name: exam_name,
      teacher: id,
      full_mark,
      num_of_questions: questions.length,
      students: [],
    });
    for (let i = 0; i < questions.length; i++) {
      let { question, answer, grade } = questions[i];
      let newQuestion = new Question({
        question,
        answer,
        exam_id: exam._id,
        grade,
      });
      Qobjects.push(newQuestion);
      await newQuestion.save();
    }
    exam.questions = Qobjects;
    await exam.save();

    teacher.exams.push(exam._id);
    await teacher.save();
    res.status(200).json({ exam });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /:id/exams/create - create an exam and an empty exam pdf
 * @param {string} id - Teacher ID
 * @returns {Object} Created exam ID and path or error
 */
router.post("/:id/exams/create", async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const exam = new Exam({
      name: "temp",
      teacher: id,
      full_mark: 0,
      num_of_questions: 0,
      questions: [],
      path: "",
    });

    // Generate initial empty PDF
    const pdfPath = path.join(__dirname, `../../exams/${id}/${exam._id}.pdf`);
    const fontPath = path.join(
      __dirname,
      "../../OpenSans-Italic-VariableFont_wdth,wght.ttf"
    );

    const dir = path.dirname(pdfPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await createPdfFromText(" ", pdfPath, fontPath, false);

    exam.path = pdfPath;
    await exam.save();
    teacher.exams.push(exam._id);
    await teacher.save();

    res.status(201).json({ examId: exam._id, pdfPath: exam.path });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /:teacherId/exams/:examId - Get specific exam details
 * @param {string} teacherId - Teacher ID
 * @param {string} examId - Exam ID
 * @returns {Object} Exam details or error
 */
router.get("/:teacherId/exams/:examId", async (req, res) => {
  try {
    const { teacherId, examId } = req.params;
    const teacher = await Teacher.findById(teacherId);
    const exam = await Exam.findById(examId);
    const { isValid, message } = checkExist([
      (teacher, "Teacher not found"),
      (exam, "Exam not found"),
    ]);
    if (!isValid) {
      return res.status(404).json({ message });
    }

    res.status(200).json({ exam });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * DELETE /:teacherId/exams/:examId - Delete an exam
 * @param {string} teacherId - Teacher ID
 * @param {string} examId - Exam ID
 * @returns {Object} Confirmation message or error
 */
router.delete("/:teacherId/exams/:examId", async (req, res) => {
  try {
    const { teacherId, examId } = req.params;
    const teacher = await Teacher.findById(teacherId);
    const exam = await Exam.findByIdAndDelete(examId);
    const { isValid, message } = checkExist([
      (teacher, "Teacher not found"),
      (exam, "Exam not found"),
    ]);
    if (!isValid) {
      return res.status(404).json({ message });
    }
    teacher.exams = teacher.exams.filter((id) => id !== examId);
    await teacher.save();

    for (let i = 0; i < exam.questions.length; i++) {
      await question.findByIdAndDelete(exam.questions[i]);
    }

    res.status(200).json({ message: "Exam deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /:teacherId/exams/:examId/genqa - Get QA from PDF
 * @param {string} teacherId - Teacher ID
 * @param {string} pdfName - PDF filename
 * @returns {Object} PDF data or error
 */
router.post("/:teacherId/exams/genqa", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { pdfName, paragraph } = req.body;
    const teacher = await Teacher.findById(teacherId);
    const pdf = teacher.pdfs.find((pdf) => pdf.name.endsWith(pdfName));
    const { isValid, message } = checkExist([
      (teacher | false, "Teacher not found"),
      (pdf | false, "Pdf not found"),
      (paragraph | false, "Paragraph not found"),
    ]);
    if (!isValid) {
      return res.status(404).json({ message });
    }
    const pdfPath = pdf.pdf_url;
    const pdfData = fs.readFileSync(pdfPath);
    const base64Pdf = pdfData.toString("base64");
    const AI_ENDPOINT =
      "https://grad-proj-1043518827762.us-central1.run.app/process";
    const response = await axios.post(AI_ENDPOINT, {
      paragrpath: paragraph,
      pdf: base64Pdf,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /:teacherId/exams/:examId/genqa/save - Save generated question
 * @param {string} teacherId - Teacher ID
 * @param {string} examId - Exam ID
 * @param {Object} req.body - Question data {question, answer, grade}
 * @returns {Object} Created question and updated exam
 */
router.post("/:teacherId/exams/:examId/genqa/save", async (req, res) => {
  try {
    const { teacherId, examId } = req.params;
    const { question, answer, grade } = req.body;

    const [teacher, exam] = await Promise.all([
      Teacher.findById(teacherId),
      Exam.findById(examId),
    ]);
    const { isValid, message } = checkExist([
      (teacher, "Teacher not found"),
      (exam, "Exam not found"),
    ]);
    if (!isValid) {
      return res.status(404).json({ message });
    }

    const newQuestion = new Question({
      question,
      answer,
      exam_id: examId,
      grade,
    });

    exam.questions.push(newQuestion._id);
    exam.num_of_questions += 1;
    exam.full_mark += grade;

    // Regenerate PDF with all questions
    const fontPath = path.join(
      __dirname,
      "../../OpenSans-Italic-VariableFont_wdth,wght.ttf"
    );
    const questions = await Question.find({ _id: { $in: exam.questions } });
    questions.push(newQuestion);
    const inputText = questions.map((q) => q.question).join("\n\n");
    const questionIds = questions.map((q) => q._id.toString()).join("\n\n");
    await createPdfFromText(inputText, exam.path, fontPath, questionIds, true);
    await newQuestion.save();
    await exam.save();
    // create bar cooooode and add it to the EXAM PDF
    // not implemented yet **************

    res.status(201).json({
      exam,
      question: newQuestion,
      message: "Question created and added to exam.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /:teacherId/exams/:examId/edit - Get exam editing interface
 * @param {string} teacherId - Teacher ID
 * @param {string} examId - Exam ID
 * @returns {Object} Exam data and PDFs for editing
 */
router.get("/:teacherId/exams/:examId/edit", async (req, res) => {
  try {
    const { teacherId, examId } = req.params;

    const teacher = await Teacher.findById(teacherId);
    const exam = await Exam.findOne({ _id: examId });
    const pdfs = teacher.pdfs;
    const { isValid, message } = checkExist([
      (teacher, "Teacher not found"),
      (exam, "Exam not found"),
    ]);
    if (!isValid) {
      return res.status(404).json({ message });
    }
    if (pdfs.length === 0) {
      return res
        .status(204)
        .json({ message: "No data found please upload pdfs" });
    }
    res.status(200).json({ teacher: teacher.name, exam, pdfs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// get all students grades for an exam
/**
 * GET /:teacherId/exams/:examId/grade - Get all student grades for exam
 * @param {string} teacherId - Teacher ID
 * @param {string} examId - Exam ID
 * @returns {Object} List of student grades
 */

router.get("/:teacherId/exams/:examId/grade", async (req, res) => {
  try {
    const { teacherId, examId } = req.params;

    const teacher = await Teacher.findById(teacherId);
    const exam = await Exam.findOne({ _id: examId });
    const { isValid, message } = checkExist([
      (teacher, "Teacher not found"),
      (exam, "Exam not found"),
    ]);
    if (!isValid) {
      return res.status(404).json({ message });
    }
    const studentIds = exam.students;
    const students = await Student.find({ _id: { $in: studentIds } });
    const studentGrades = students.map((student) => {
      const examGrade = student.exam_grades.find((ex) =>
        ex.exam_id.equals(new mongoose.Types.ObjectId(examId))
      );
      return {
        student_id: student._id,
        student_name: student.name,
        total_grade: examGrade.total_grade,
      };
    });
    res.status(200).json({ exam, students, studentGrades });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// get a student grade for an exam
/**
 * GET /:teacherId/exams/:examId/grade/:studentId - Get detailed student grade
 * @param {string} teacherId - Teacher ID
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @returns {Object} Detailed grade breakdown
 */
router.get("/:teacherId/exams/:examId/grade/:studentId", async (req, res) => {
  try {
    const { teacherId, examId, studentId } = req.params;
    const teacher = await Teacher.findById(teacherId);
    const exam = await Exam.findById(examId);
    const student = await Student.findById(studentId);
    const { isValid, message } = checkExist([
      (teacher, "Teacher not found"),
      (exam, "Exam not found"),
      (student, "Student not found"),
    ]);
    if (!isValid) {
      return res.status(404).json({ message });
    }
    studentExam = student.exam_grades.find((ex) => ex.exam_id.equals(examId));
    if (!studentExam) {
      return res.status(404).json({ message: "Student didn't take the exam" });
    }
    // for each question in the exam, get the grade
    const questionGrades = exam.questions.map(async (question) => {
      const QA = await ExamAnswers.find({
        exam_id: examId,
        question_id: question,
        student_id: studentId,
      });
      if (!QA) {
        return {
          question: "Question not found",
          grade: 0,
          student_answer_image: "No image",
          student_answer: "No answer",
          explanation: "No explanation",
        };
      }
      const Q = await Question.findById(question._);
      return {
        question: Q.question,
        grade: QA.grade,
        student_answer_image: QA.student_answer_image,
        student_answer: QA.student_answer,
        explanation: QA.explanation,
      };
    });
    res.status(200).json({ student, exam, questionGrades });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// grade an exam for a student
/**
 * POST /:teacherId/exams/:examId/grade/:studentId - Grade student exam
 * @param {string} teacherId - Teacher ID
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @param {File[]} images - Answer images (multipart form)
 * @returns {Object} Grading results
 */
router.post(
  "/:teacherId/exams/:examId/grade/:studentId",
  imageUpload.array("images", 15),
  async (req, res) => {
    try {
      const { teacherId, examId, studentId } = req.params;
      const teacher = await Teacher.findById(teacherId);
      const exam = await Exam.findById(examId);
      const student = await Student.findById(studentId);

      const { isValid, message } = checkExist([
        (teacher, "Teacher not found"),
        (exam, "Exam not found"),
        (student, "Student not found"),
        (exam.num_of_questions === req.files.length,
        `Number of questions in exam is ${exam.num_of_questions} but ${req.files.length} images were uploaded`),
      ]);

      if (!isValid) {
        return res.status(404).json({ message });
      }
      exam.students.push(studentId);
      await exam.save();
      const questions = exam.questions;
      let totalGrade = 0;
      // grade_pipeline(questions, teacherId, studentId, examId);
      // question["img"], question["questionId"], question["questionAnswer"];
      let questionArray = [];
      for (let i = 0; i < questions.length; i++) {
        const question = await Question.findById(questions[i]);
        const studentAnswer = req.files[i].path;
        const base64Image = fs.readFileSync(studentAnswer, {
          encoding: "base64",
        });
        questionArray.push({
          img: base64Image,
          questionId: question._id,
          questionAnswer: question.answer,
        });
      }
      const AI_ENDPOINT =
        "https://grad-proj-1043518827762.us-central1.run.app/grade";
      const response = await axios.post(AI_ENDPOINT, {
        questions: questionArray,
        teacherId,
        studentId,
        examId,
      });

      const grades = response.data;
      let final_grades = [];
      for (let i = 0; i < grades.length; i++) {
        const [QID, grade, explanation] = grades[i];
        console.log(QID, grade, explanation);
        totalGrade += grade;
        const examAnswer = new ExamAnswers({
          exam_id: examId,
          question_id: QID,
          student_id: studentId,
          student_answer_image: questionArray[i].img,
          student_answer: "text_answer",
          grade,
          explanation,
        });
        final_grades.push({
          question_id: QID,
          grade,
        });
        await examAnswer.save();
      }
      student.exam_grades.push({
        exam_id: examId,
        total_grade: totalGrade,
        question_grades: final_grades,
      });

      await student.save();
      res.status(200).json({ message: "Graded", student });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// add a student to an exam
/**
 * POST /:teacherId/exams/:examId/addstudent/:studentId - Add student to exam
 * @param {string} teacherId - Teacher ID
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @returns {Object} Updated exam and student
 */

router.post(
  "/:teacherId/exams/:examId/addstudent/:studentId",
  async (req, res) => {
    try {
      const { teacherId, examId, studentId } = req.params;
      const teacher = await Teacher.findById(teacherId);
      const exam = await Exam.findById(examId);
      const student = await Student.findById(studentId);

      const { isValid, message } = checkExist([
        (teacher, "Teacher not found"),
        (exam, "Exam not found"),
        (student, "Student not found"),
      ]);
      if (!isValid) {
        return res.status(404).json({ message });
      }
      exam.students.push(studentId);
      await exam.save();
      await student.save();
      res.status(200).json({ message: "Student added to exam", exam, student });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// create a student group
/**
 * POST /:teacherId/studentgroup - Create student group
 * @param {string} teacherId - Teacher ID
 * @param {Object} req.body - Group data {name, students}
 * @returns {Object} Created group
 */
router.post("/:teacherId/studentgroup", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, students } = req.body;
    const teacher = await Teacher.findById(teacherId);
    const { isValid, message } = checkExist([(teacher, "Teacher not found")]);
    if (!isValid) {
      return res.status(404).json({ message });
    }
    const studentGroup = {
      name,
      students,
    };
    teacher.student_groups.push(studentGroup);
    await teacher.save();
    res
      .status(201)
      .json({ message: "Student group created", teacher, studentGroup });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// add a student to a student group
router.post(
  "/:teacherId/studentgroup/:groupId/addstudent/:studentId",
  async (req, res) => {
    try {
      const { teacherId, groupId, studentId } = req.params;
      const teacher = await Teacher.findById(teacherId);
      const { isValid, message } = checkExist([(teacher, "Teacher not found")]);
      if (!isValid) {
        return res.status(404).json({ message });
      }
      const studentGroup = teacher.student_groups.find(
        (group) => group._id === groupId
      );
      if (!studentGroup) {
        return res.status(404).json({ message: "Student group not found" });
      }
      studentGroup.students.push(studentId);
      await teacher.save();
      res.status(200).json({ message: "Student added to group", teacher });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// remove a student from a student group
router.delete(
  "/:teacherId/studentgroup/:groupId/removestudent/:studentId",
  async (req, res) => {
    try {
      const { teacherId, groupId, studentId } = req.params;
      const teacher = await Teacher.findById(teacherId);
      const { isValid, message } = checkExist([(teacher, "Teacher not found")]);
      if (!isValid) {
        return res.status(404).json({ message });
      }
      const studentGroup = teacher.student_groups.find(
        (group) => group._id === groupId
      );
      if (!studentGroup) {
        return res.status(404).json({ message: "Student group not found" });
      }
      studentGroup.students = studentGroup.students.filter(
        (id) => id !== studentId
      );
      await teacher.save();
      res.status(200).json({ message: "Student removed from group", teacher });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// get all student groups
router.get("/:teacherId/studentgroup", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await Teacher.findById(teacherId);
    const { isValid, message } = checkExist([(teacher, "Teacher not found")]);
    if (!isValid) {
      return res.status(404).json({ message });
    }
    res.status(200).json({ student_groups: teacher.student_groups });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
