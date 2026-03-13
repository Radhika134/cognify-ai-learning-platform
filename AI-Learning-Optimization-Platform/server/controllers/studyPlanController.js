const StudyPlan = require('../models/StudyPlan');

// @desc    Create a new study plan
// @route   POST /api/studyplans
// @access  Private
const createStudyPlan = async (req, res) => {
    try {
        const { title, subject, description, goals, dailyHours, startDate, endDate } = req.body;

        const studyPlan = new StudyPlan({
            user: req.userId,
            title,
            subject,
            description,
            goals,
            dailyHours,
            startDate,
            endDate
        });

        const savedPlan = await studyPlan.save();
        res.status(201).json(savedPlan);
    } catch (error) {
        console.error('Error in createStudyPlan:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all study plans for logged-in user
// @route   GET /api/studyplans
// @access  Private
const getStudyPlans = async (req, res) => {
    try {
        const plans = await StudyPlan.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        console.error('Error in getStudyPlans:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get a single study plan by ID
// @route   GET /api/studyplans/:id
// @access  Private
const getStudyPlanById = async (req, res) => {
    try {
        const plan = await StudyPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Study plan not found' });
        }

        // Ensure the plan belongs to the logged-in user
        if (plan.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to access this plan' });
        }

        res.json(plan);
    } catch (error) {
        console.error('Error in getStudyPlanById:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a study plan
// @route   PUT /api/studyplans/:id
// @access  Private
const updateStudyPlan = async (req, res) => {
    try {
        const plan = await StudyPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Study plan not found' });
        }

        if (plan.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to update this plan' });
        }

        const updatedPlan = await StudyPlan.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json(updatedPlan);
    } catch (error) {
        console.error('Error in updateStudyPlan:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a study plan
// @route   DELETE /api/studyplans/:id
// @access  Private
const deleteStudyPlan = async (req, res) => {
    try {
        const plan = await StudyPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Study plan not found' });
        }

        if (plan.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this plan' });
        }

        await plan.deleteOne();
        res.json({ message: 'Study plan deleted successfully' });
    } catch (error) {
        console.error('Error in deleteStudyPlan:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createStudyPlan,
    getStudyPlans,
    getStudyPlanById,
    updateStudyPlan,
    deleteStudyPlan
};
