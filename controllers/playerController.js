const Player = require('../models/player');

exports.getPlayers = async (req, res) => {
    try {
        let query = {};
        const { tier, pos, search, names, page, limit, sort, order } = req.query;

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
        
        const sortField = sort || 'rating';
        const sortOrder = order === 'asc' ? 1 : -1;

        const players = await Player.find(query)
            .sort({ [sortField]: sortOrder })
            .limit(limit)
            .skip((page - 1) * limit);

        const totalPlayers = await Player.countDocuments(query);
        res.json({ success: true, players: players || [], totalPlayers });
    } catch (error) {
        res.status(500).json({ success: false, error: "Sunucu hatası" });
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
        res.json({ success: true, players: enrichedMetaPlayers.slice(0, 50) });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Sunucu hatasi' });
    }
};

exports.createPlayer = async (req, res) => {
    try {
        const payload = req.body;
        const created = await Player.create(payload);
        res.status(201).json({ success: true, player: created });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Oyuncu eklenemedi.' });
    }
};

exports.updatePlayer = async (req, res) => {
    try {
        const playerName = decodeURIComponent(req.params.playerName);
        const player = await Player.findOneAndUpdate({ name: playerName }, req.body, { new: true });
        if (!player) return res.status(404).json({ success: false, error: 'Oyuncu bulunamadi.' });
        res.json({ success: true, player });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Oyuncu guncellenemedi.' });
    }
};

exports.deletePlayer = async (req, res) => {
    try {
        const playerName = decodeURIComponent(req.params.playerName);
        const result = await Player.findOneAndDelete({ name: playerName });
        if (!result) return res.status(404).json({ success: false, error: 'Oyuncu bulunamadi.' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Oyuncu silinemedi.' });
    }
};