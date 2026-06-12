const express = require('express');
const dotenv = require('dotenv');
const { router } = require('./routes/profileRoutes');

dotenv.config();

const app = express();

app.use(express.json());

// Health check route
app.get('/', (req, res) => {
    res.json({
        message: 'GitHub Analyzer API is running.',
        version: '1.0.0',
        endpoints: [
            { method: 'POST', path: '/api/analyze/:username', description: 'Analyze a GitHub profile and store insights' },
            { method: 'GET', path: '/api/profiles', description: 'Get all analyzed profiles (supports ?page=1&limit=10)' },
            { method: 'GET', path: '/api/profiles/:username', description: 'Get a single analyzed profile by username' },
        ]
    });
});

app.use('/api', router);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;