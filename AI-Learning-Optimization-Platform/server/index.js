const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const app = express();

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: "Server running" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
