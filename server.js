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

app.get('/api/players', async (req, res) => {
    try {
        let query = {};
        const { tier, pos, search, names } = req.query;

        if (names) {
            query.name = { $in: names.split(',') };
        } else {
            if (search) query.name = { $regex: search, $options: 'i' };
            if (pos && pos !== 'all') query.pos = pos;
        }

        if (tier && tier !== 'all') {
            if (tier === 'gold') query.rating = { $gte: 80 };
            else if (tier === 'silver') query.rating = { $gte: 70, $lt: 80 };
            else if (tier === 'bronze') query.rating = { $gte: 60, $lt: 70 };
            else if (tier === 'iron') query.rating = { $lt: 60 };
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const sortField = req.query.sort || 'rating';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        const players = await Player.find(query)
            .sort({ [sortField]: sortOrder })
            .limit(limit)
            .skip((page - 1) * limit);

        const totalPlayers = await Player.countDocuments(query);

        res.json({ players: players || [], totalPlayers });
    } catch (error) {
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

app.get('/api/wonderkids', async (req, res) => {
    try {
        const players = await Player.find({});
        const enrichedMetaPlayers = players.map(p => {
            const playerObj = p.toObject();
            const { pace=0, shoot=0, pass=0, drib=0, def=0, phy=0, pos='' } = playerObj;
            let metaScore = 0;
            const pPos = pos.toUpperCase();

            if (['ST', 'LW', 'RW', 'CF'].includes(pPos)) {
                metaScore = (pace * 0.35) + (shoot * 0.35) + (drib * 0.20) + (pass * 0.10);
            } else if (['CAM', 'CM', 'LM', 'RM'].includes(pPos)) {
                metaScore = (pass * 0.30) + (drib * 0.30) + (pace * 0.20) + (shoot * 0.20);
            } else if (['CB', 'RB', 'LB', 'CDM', 'RWB', 'LWB'].includes(pPos)) {
                metaScore = (def * 0.35) + (phy * 0.25) + (pace * 0.30) + (pass * 0.10);
            } else {
                metaScore = (pace + shoot + pass + drib + def + phy) / 6;
            }
            return { ...playerObj, potential: metaScore };
        });

        enrichedMetaPlayers.sort((a, b) => b.potential - a.potential);
        res.json(enrichedMetaPlayers.slice(0, 50));
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

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

app.use(express.static('public')); 

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/dashboard-sayfasi', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'views', 'settings.html')));
app.get('/register-page', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));

// Sunucuyu Başlatma
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} portunda çalışıyor!`));

module.exports = app;