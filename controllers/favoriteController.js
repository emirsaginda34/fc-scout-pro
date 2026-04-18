const Favorite = require('../models/Favorite');
const Player = require('../models/player');

async function getFavorites(req, res, next) {
    try {
        const favorites = await Favorite.find({ userId: req.user.userId }).lean();
        const names = favorites.map((fav) => fav.playerName);
        if (!names.length) return res.json({ success: true, players: [] });

        const players = await Player.find({ name: { $in: names } }).lean();
        return res.json({ success: true, players });
    } catch (err) {
        return next(err);
    }
}

async function addFavorite(req, res, next) {
    try {
        const { playerName } = req.body;
        await Favorite.updateOne(
            { userId: req.user.userId, playerName },
            { $setOnInsert: { userId: req.user.userId, playerName } },
            { upsert: true }
        );
        res.status(201).json({ success: true });
    } catch (err) {
        next(err);
    }
}

async function removeFavorite(req, res, next) {
    try {
        const { playerName } = req.params;
        await Favorite.deleteOne({ userId: req.user.userId, playerName: decodeURIComponent(playerName) });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

module.exports = { getFavorites, addFavorite, removeFavorite };
