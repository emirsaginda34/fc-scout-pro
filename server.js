// 1. Gerekli Modülleri Yükle
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 2. Kendi Modüllerini Yükle (Refactor ettiğin dosyalar)
const connectDB = require('./config/db');
const Player = require('./models/player');
const cors = require('./middlewares/corsConfig'); // Dosya yolu düzeltildi

const app = express();
const PORT = process.env.PORT || 3000; // PORT burada tanımlandı!

// 3. Veritabanı Bağlantısı
connectDB();

// 4. Middleware Ayarları
app.use(cors); // Ayrı dosyadan gelen CORS ayarını kullan
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IP Ban Sistemi
const securityLog = new Map();
const checkBanStatus = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const record = securityLog.get(clientIp);
    if (record?.isBanned) {
        return res.status(403).json({ success: false, error: "Giriş işlemi başarısız oldu." });
    }
    next();
};
app.use(checkBanStatus);

const usersFilePath = path.join(__dirname, 'data', 'users.json');

const getUsers = () => {
    if (!fs.existsSync(usersFilePath)) return [];
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    try {
        return JSON.parse(data || '[]');
    } catch { return []; }
};

// --- ROTALAR (ROUTES) ---

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        res.json({ 
            success: true, 
            user: { name: user.username, role: user.role || "user" },
            redirect: '/dashboard-sayfasi' 
        });
    } else {
        res.status(401).json({ success: false, error: "Kullanıcı adı veya şifre hatalı!" });
    }
});

const playerRoutes = require('./routes/playerRoutes');
app.use('/api', playerRoutes);

app.get('/api/user-status', (req, res) => {
    const users = getUsers();
    const requestUsername = req.query.username;
    if (!requestUsername) return res.status(400).json({ success: false });

    const user = users.find(u => u.username.toLowerCase() === requestUsername.toLowerCase());
    if (user) {
        res.json({ success: true, limits: user.updateLimits || { username: 0, password: 0 } });
    } else {
        res.status(404).json({ success: false });
    }
});

app.post('/api/security-alert', (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    let record = securityLog.get(clientIp) || { attempts: 0, lastViolation: Date.now(), isBanned: false };
    record.attempts += 1;
    if (record.attempts >= 3) record.isBanned = true;
    securityLog.set(clientIp, record);
    res.json({ success: true, banned: record.isBanned });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    if (!password || password.length < 6) return res.status(400).json({ success: false, error: "Şifre kısa!" });

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ success: false, error: "Kullanıcı var!" });
    }

    const salt = bcrypt.genSaltSync(10);
    users.push({ 
        username, 
        password: bcrypt.hashSync(password, salt), 
        role: 'user', 
        updateLimits: { username: 0, password: 0 } 
    });
    
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.json({ success: true }); 
});

app.use(express.static('views')); 

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/dashboard-sayfasi', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'views', 'settings.html')));
app.get('/register-page', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));

// Sunucuyu Başlatma
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} portunda çalışıyor!`));

module.exports = app;