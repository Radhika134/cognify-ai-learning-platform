const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studyPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyPlan',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    hoursStudied: {
        type: Number,
        required: true,
        min: 0,
        max: 24
    },
    topicsCompleted: [
        {
            type: String,
            trim: true
        }
    ],
    quizScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    focusRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    notes: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
