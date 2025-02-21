const express = require("express");
const router = express.Router();
const User = require("../models/users");
const Teacher = require("../models/teachers");
const Student = require("../models/students");
const { saveUser } = require("../middleware/helpers");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    let newUser;
    if (role === "teacher") {
      const newTeacher = new Teacher({
        name,
        exams: [],
        students: [],
        pdfs: [],
      });
      await newTeacher.save();
      newUser = await saveUser(
        newTeacher,
        name,
        email,
        password,
        role,
        newTeacher._id
      );
      console.log(newUser);
    } else if (role === "student") {
      const newStudent = new Student({ name, teachers: [], exam_grades: [] });
      await newStudent.save();
      newUser = await saveUser(
        newStudent,
        name,
        email,
        password,
        role,
        newStudent._id
      );
      console.log(newUser);
    }

    const token = jwt.sign({ id: newUser._id }, "secret");
    res.status(201).json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    const profile = await Teacher.findByIdAndDelete(user.profile_id);
    if (!user || !profile) {
      return res.status(400).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ id: user._id }, "secret");
    res.status(200).json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
