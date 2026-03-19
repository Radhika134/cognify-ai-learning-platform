const Analytics = require('../models/Analytics');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');

// @desc    Log a study session for a study plan
// @route   POST /api/analytics
// @access  Private
const logSession = async (req, res) => {
    try {
        const { studyPlan, date, hoursStudied, topicsCompleted, quizScore, focusRating, notes } = req.body;

        // Verify the study plan exists and belongs to this user
        const plan = await StudyPlan.findById(studyPlan);
        if (!plan) {
            return res.status(404).json({ message: 'Study plan not found' });
        }
        if (plan.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to log for this study plan' });
        }

        const session = new Analytics({
            user: req.userId,
            studyPlan,
            date: date || Date.now(),
            hoursStudied,
            topicsCompleted,
            quizScore,
            focusRating,
            notes
        });

        const savedSession = await session.save();

        // --- Gamification Logic ---
        const user = await User.findById(req.userId);
        if (user) {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const lastStr = user.lastStudyDate ? new Date(user.lastStudyDate).toISOString().split('T')[0] : null;

            if (lastStr !== dateStr) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastStr === yesterdayStr) {
                    user.streak += 1;
                } else {
                    user.streak = 1;
                }
                user.lastStudyDate = today;
            }

            // XP = (Hours * 50) + (Focus * 10)
            user.xp += Math.round(hoursStudied * 50) + (focusRating * 10);

            // Badges
            if (user.streak >= 3 && !user.badges.includes("3-Day Streak 🔥")) user.badges.push("3-Day Streak 🔥");
            if (user.streak >= 7 && !user.badges.includes("7-Day Streak 🔥🔥")) user.badges.push("7-Day Streak 🔥🔥");
            if (user.streak >= 30 && !user.badges.includes("30-Day Streak 🏆")) user.badges.push("30-Day Streak 🏆");

            await user.save();
        }

        res.status(201).json(savedSession);
    } catch (error) {
        console.error('Error in logSession:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all sessions for the logged-in user
// @route   GET /api/analytics
// @access  Private
const getAllSessions = async (req, res) => {
    try {
        const sessions = await Analytics.find({ user: req.userId })
            .populate('studyPlan', 'title subject')
            .sort({ date: -1 });
        res.json(sessions);
    } catch (error) {
        console.error('Error in getAllSessions:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all sessions for a specific study plan
// @route   GET /api/analytics/plan/:planId
// @access  Private
const getSessionsByPlan = async (req, res) => {
    try {
        const sessions = await Analytics.find({
            user: req.userId,
            studyPlan: req.params.planId
        }).sort({ date: -1 });

        res.json(sessions);
    } catch (error) {
        console.error('Error in getSessionsByPlan:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get summary stats for the logged-in user
// @route   GET /api/analytics/summary
// @access  Private
const getSummary = async (req, res) => {
    try {
        const sessions = await Analytics.find({ user: req.userId });

        const totalSessions = sessions.length;
        // totalDuration in MINUTES (frontend expects this)
        const totalDuration = sessions.reduce((sum, s) => sum + (s.hoursStudied * 60), 0);
        const totalTopics = sessions.reduce((sum, s) => sum + s.topicsCompleted.length, 0);

        const focusWithValues = sessions.filter(s => s.focusRating !== null && s.focusRating !== undefined);
        const averageFocus = focusWithValues.length
            ? parseFloat((focusWithValues.reduce((sum, s) => sum + s.focusRating, 0) / focusWithValues.length).toFixed(1))
            : 0;

        const user = await User.findById(req.userId).select('xp streak badges level');
        const xp = user?.xp || 0;
        const level = Math.floor(xp / 1000) + 1;

        res.json({
            totalSessions,
            totalDuration,          // minutes — used by Dashboard & Analytics
            totalTopicsCompleted: totalTopics,
            averageFocus,           // number — used by Dashboard
            gamification: {
                xp,
                streak: user?.streak || 0,
                level,
                badges: user?.badges || []
            }
        });
    } catch (error) {
        console.error('Error in getSummary:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get last 7 days study hours for the Analytics chart
// @route   GET /api/analytics/weekly
// @access  Private
const getWeeklyChart = async (req, res) => {
    try {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        // Build last 7 days array
        const last7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        const startDate = new Date(last7[0]);
        startDate.setHours(0, 0, 0, 0);

        const sessions = await Analytics.find({
            user: req.userId,
            date: { $gte: startDate }
        });

        const chart = last7.map(day => {
            const dayStr = day.toISOString().split('T')[0];
            const daySessions = sessions.filter(s => {
                return new Date(s.date).toISOString().split('T')[0] === dayStr;
            });
            const hours = daySessions.reduce((sum, s) => sum + s.hoursStudied, 0);
            return { name: dayNames[day.getDay()], hours: parseFloat(hours.toFixed(1)) };
        });

        res.json({ weeklyChart: chart });
    } catch (error) {
        console.error('Error in getWeeklyChart:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a session log
// @route   DELETE /api/analytics/:id
// @access  Private
const deleteSession = async (req, res) => {
    try {
        const session = await Analytics.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        if (session.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this session' });
        }

        await session.deleteOne();
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error in deleteSession:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    logSession,
    getAllSessions,
    getSessionsByPlan,
    getSummary,
    getWeeklyChart,
    deleteSession
};
