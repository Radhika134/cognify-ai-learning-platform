const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signupUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save new user
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error in signupUser:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Login user & return JWT
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error in loginUser:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get logged-in user profile
// @route   GET /api/auth/me
// @access  Private (requires JWT)
const getMe = async (req, res) => {
    try {
        // req.userId is set by the auth middleware
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error in getMe:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { signupUser, loginUser, getMe };
