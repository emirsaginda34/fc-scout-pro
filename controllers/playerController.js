const Player = require('../models/player');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');

const getUsers = () => {
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(data || '[]');
};

exports.resetPassword = async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        let users = getUsers();

        const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

        if (userIndex === -1) {
            return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı!" });
        }

        // Yeni şifreyi hashle
        const salt = bcrypt.genSaltSync(10);
        users[userIndex].password = bcrypt.hashSync(newPassword, salt);

        // Dosyaya geri yaz
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

        res.json({ success: true, message: "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz." });
    } catch (error) {
        console.error("Sıfırlama hatası:", error);
        res.status(500).json({ error: "Sunucu hatası" });
    }
};

exports.getPlayers = async (req, res) => {
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
};

// Wonderkids mantığı
exports.getWonderkids = async (req, res) => {
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
};