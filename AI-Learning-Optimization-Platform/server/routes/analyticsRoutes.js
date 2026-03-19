const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
    logSession,
    getAllSessions,
    getSessionsByPlan,
    getSummary,
    getWeeklyChart,
    deleteSession
} = require('../controllers/analyticsController');

// All routes are protected
router.use(protect);

// @route   POST   /api/analytics  — Log a new study session
// @route   GET    /api/analytics  — Get all sessions for user
router.route('/').post(logSession).get(getAllSessions);

// @route   GET    /api/analytics/summary  — Get aggregated stats
router.get('/summary', getSummary);

// @route   GET    /api/analytics/weekly  — Get last 7 days chart data
router.get('/weekly', getWeeklyChart);

// @route   GET    /api/analytics/plan/:planId  — Sessions by study plan
router.get('/plan/:planId', getSessionsByPlan);

// @route   DELETE /api/analytics/:id  — Delete a session
router.delete('/:id', deleteSession);

module.exports = router;
