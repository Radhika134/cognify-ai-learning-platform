const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
    createStudyPlan,
    getStudyPlans,
    getStudyPlanById,
    updateStudyPlan,
    deleteStudyPlan
} = require('../controllers/studyPlanController');

// All routes are protected — user must be logged in
router.use(protect);

// @route   POST   /api/studyplans       — Create a new study plan
// @route   GET    /api/studyplans       — Get all study plans for user
router.route('/')
    .post(createStudyPlan)
    .get(getStudyPlans);

// @route   GET    /api/studyplans/:id   — Get single study plan
// @route   PUT    /api/studyplans/:id   — Update study plan
// @route   DELETE /api/studyplans/:id   — Delete study plan
router.route('/:id')
    .get(getStudyPlanById)
    .put(updateStudyPlan)
    .delete(deleteStudyPlan);

module.exports = router;
