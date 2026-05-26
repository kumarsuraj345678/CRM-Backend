import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.trim() });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    let isMatch = false;

    if (user.role === "employee" && password === email) {
      isMatch = true;
    } else if (user.role === "admin") {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const generateToken = (id) => {
      return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    };

    res.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        language: user.language,
        status: user.status,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const { firstName, lastName, password, confirmPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let updateCount = 0;

    if (firstName && firstName !== user.firstName) updateCount++;
    if (lastName && lastName !== user.lastName) updateCount++;
    if (password || confirmPassword) updateCount++;

    if (updateCount !== 1) {
      return res.status(400).json({
        message: "Update only one field at a time",
      });
    }

    if (firstName) user.firstName = firstName;

    if (lastName) user.lastName = lastName;

    if (password || confirmPassword) {
      if (!password || !confirmPassword) {
        return res.status(400).json({
          message: "Both password fields required",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      message: "Updated successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        language: user.language,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
