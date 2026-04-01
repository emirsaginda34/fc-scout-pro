// Doğrudan .env dosyasını oku (Localhost için en rahat yöntem)
require('dotenv').config();

const cors = require('cors');
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// 1. Veritabanı Bağlantısı ve Port Ayarı
const mongoURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

if (!mongoURI) {
    console.warn("⚠️ UYARI: MONGO_URI bulunamadı! Lütfen proje klasöründe .env dosyası oluşturup içine MONGO_URI=linkiniz şeklinde ekleyin.");
}

const playerSchema = new mongoose.Schema({
    id: Number,
    name: String,
    position: String,
    rating: Number,
    pace: Number,
    age: Number,
    tier: String,
    team: String,
    league: String,
    stats: Object
}, { strict: false });

const Player = mongoose.model('Player', playerSchema, 'players');

// Sadece mongoURI varsa bağlanmayı dene (Sunucunun çökmesini engeller)
if (mongoURI) {
    mongoose.connect(mongoURI)
        .then(() => console.log("🚀 MongoDB Atlas bağlantısı başarılı!"))
        .catch(err => {
            console.error("❌ MongoDB Bağlantı hatası:", err);
        });
}

const allowedOrigins = [
    'https://fc-scout-pro.onrender.com', 
    'http://localhost:3000',             
    'http://127.0.0.1:5500',
    'http://localhost:5500', 
    'http://127.0.0.1:3000'  
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS Politikası: Bu adresten erişim izniniz yok!'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

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

const playersPath = path.join(__dirname, 'data', 'players.json');
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
        const players = await Player.find({});
        res.json(players);
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        res.status(500).json({ message: "Sunucu hatası oluştu." });
    }
});

app.get('/api/user-status', (req, res) => {
    const users = getUsers();
    
    // Tarayıcıdan gelen kullanıcı adını URL'den alıyoruz (Örn: ?username=EMRUZOR)
    const requestUsername = req.query.username;

    if (!requestUsername) {
        return res.status(400).json({ success: false, error: "Kullanıcı adı belirtilmedi." });
    }

    // Gelen isme göre users.json içinde tam eşleşme arıyoruz
    const user = users.find(u => u.username.toLowerCase() === requestUsername.toLowerCase());
    
    if (user) {
        const limits = user.updateLimits || { username: 0, password: 0 };
        res.json({ success: true, limits: limits });
    } else {
        res.status(404).json({ success: false, error: "Kullanıcı bulunamadı." });
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

app.post('/api/update-settings', (req, res) => {
    try {
        const { newUsername, newPassword } = req.body;
        let users = getUsers();
        
        // 1. ADIM: İsteği atan kullanıcının ESKİ adını frontend'den alacağız.
        // Bunun için req.body'den mevcut kullanıcı adını da çekelim.
        const { currentUsername } = req.body; 

        // 2. ADIM: Dosyada o anki kullanıcıyı tam adıyla arıyoruz.
        let userIndex = users.findIndex(u => u.username.toLowerCase() === currentUsername.toLowerCase());
        
        if (userIndex === -1) return res.status(404).json({ success: false, error: "Kullanıcı yok." });

        let user = users[userIndex];
        if (!user.updateLimits) user.updateLimits = { username: 0, password: 0 };

        let updated = false;
        if (newUsername && newUsername !== user.username && user.updateLimits.username < 2) {
            user.username = newUsername;
            user.updateLimits.username += 1;
            updated = true;
        }
        
        if (newPassword && newPassword.trim() !== "" && user.updateLimits.password < 2) {
            const salt = bcrypt.genSaltSync(10);
            user.password = bcrypt.hashSync(newPassword, salt); 
            user.updateLimits.password += 1;
            updated = true;
        }

        if (updated) {
            users[userIndex] = user;
            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
            res.json({ success: true, message: "Güncellendi", limits: user.updateLimits });
        } else {
            res.status(400).json({ success: false, error: "Limit doldu veya değişiklik yok." });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: "Şifre en az 6 karakter olmalıdır!" });
    }

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ success: false, error: "Bu kullanıcı adı zaten alınmış!" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    users.push({ 
        username, 
        password: hashedPassword, 
        role: 'user', 
        updateLimits: { username: 0, password: 0 } 
    });
    
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.json({ success: true, message: "Kayıt başarılı!" }); 
});

app.use(express.static('public')); 

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/dashboard-sayfasi', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'views', 'settings.html')));
app.get('/register-page', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));

app.get('/api/wonderkids', (req, res) => {
    fs.readFile(playersPath, 'utf-8', (err, data) => {
        if (err) return res.status(500).json([]);
        try {
            const allPlayers = JSON.parse(data);
            const wonderkids = allPlayers.filter(p => {
                const age = Number(p.age);
                const rating = Number(p.rating);
                return age <= 21 && rating >= 60; 
            });

            const enrichedWonderkids = wonderkids.map(p => ({
                ...p,
                potential: p.potential || (Number(p.rating) + (25 - Number(p.age)) * 2)
            }));

            enrichedWonderkids.sort((a, b) => b.potential - a.potential);
            res.json(enrichedWonderkids.slice(0, 50));
        } catch (e) {
            res.status(500).json([]);
        }
    });
});

// Sunucuyu Başlatma (Hem Localhost hem de Vercel/Render için tam uyumlu ihracat)
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} portunda canavar gibi çalışıyor!`));

module.exports = app;