const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    xp: {
        type: Number,
        default: 0
    },
    streak: {
        type: Number,
        default: 0
    },
    lastStudyDate: {
        type: Date,
        default: null
    },
    badges: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model("User", UserSchema);
