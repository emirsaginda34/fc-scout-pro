require('dotenv').config();
const express = require('express');
const path = require('path');

const connectDB = require('./config/db');
const cors = require('./middlewares/corsConfig');
const { apiLimiter } = require('./middlewares/rateLimiters');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const bootstrapUsersFromJson = require('./services/bootstrapUsers');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();
bootstrapUsersFromJson().catch(() => {});

app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const userRoutes = require('./routes/userRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

app.use('/', authRoutes);
app.use('/api', playerRoutes);
app.use('/api', userRoutes);
app.use('/api', favoriteRoutes);

app.use(express.static('views'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/dashboard-sayfasi', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'views', 'settings.html')));
app.get('/register-page', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, () => console.log(`Sunucu http://localhost:${PORT} portunda calisiyor.`));
}

module.exports = app;