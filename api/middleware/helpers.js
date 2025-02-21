const bcrypt = require("bcrypt");
const User = require("../models/users");

async function saveUser(user, name, email, password, role, profile_id) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role,
    profile_id,
  });
  await newUser.save();
  return newUser;
}

function checkExist(args) {
  console.log("heeeeeeeeeeee \n", args[0][0], args[0][1]);
  for (let i = 0; i < args.length; i++) {
    if (!args[i][0]) {
      console.log(args[i][1]);
      return { isValid: false, message: args[i][1] };
    }
  }
  return { isValid: true, message: "All fields are valid" };
}

module.exports = { saveUser, checkExist };
