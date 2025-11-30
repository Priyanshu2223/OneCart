import User from "../model/userModel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import { genToken, genToken1 } from "../config/token.js";

const cookieOptions = {
  httpOnly: true,
  secure: false,      // localhost is NOT https
  sameSite: "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

// REGISTER
export const registration = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "User exists" });

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Weak password" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hash });

    const token = genToken(user._id);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json(user);
  } catch (err) {
    return res.status(500).json({ message: "Registration failed" });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    const token = genToken(user._id);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json(user);
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
};

// LOGOUT
export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "Lax"
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ message: "Logout failed" });
  }
};

// GOOGLE LOGIN
export const googleLogin = async (req, res) => {
  try {
    const { name, email } = req.body;

    let user = await User.findOne({ email });
    if (!user) user = await User.create({ name, email });

    const token = genToken(user._id);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: "Google login failed" });
  }
};

// ADMIN LOGIN
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = genToken1(email);

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.status(200).json(token);
    }

    return res.status(400).json({ message: "Invalid admin credentials" });
  } catch (err) {
    return res.status(500).json({ message: "Admin login failed" });
  }
};
