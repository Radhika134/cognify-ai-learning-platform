const express = require('express');
const router = express.Router();
const { generateStudyPlan } = require('../controllers/aiController');
const protect = require('../middleware/auth');

router.post('/generate-plan', protect, generateStudyPlan);

module.exports = router;
