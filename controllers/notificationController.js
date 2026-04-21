const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const Player = require('../models/player');

async function checkFavoriteUpdates(req, res, next) {
    try {
        const favorites = await Favorite.find({ userId: req.user.userId });
        if (!favorites.length) return res.json({ success: true, notifications: [] });

        const names = favorites.map((fav) => fav.playerName);
        const players = await Player.find({ name: { $in: names } }).lean();
        const playerByName = new Map(players.map((p) => [p.name, p]));
        const createdNotifications = [];

        for (const favorite of favorites) {
            const player = playerByName.get(favorite.playerName);
            if (!player) continue;

            if (
                favorite.lastKnownRating !== null &&
                Number(favorite.lastKnownRating) !== Number(player.rating)
            ) {
                createdNotifications.push({
                    userId: req.user.userId,
                    playerName: favorite.playerName,
                    type: 'rating_change',
                    oldValue: String(favorite.lastKnownRating),
                    newValue: String(player.rating),
                    message: `${favorite.playerName} rating degisti (${favorite.lastKnownRating} -> ${player.rating}).`
                });
            }

            if (
                favorite.lastKnownPos &&
                String(favorite.lastKnownPos).toUpperCase() !== String(player.pos || '').toUpperCase()
            ) {
                createdNotifications.push({
                    userId: req.user.userId,
                    playerName: favorite.playerName,
                    type: 'position_change',
                    oldValue: String(favorite.lastKnownPos),
                    newValue: String(player.pos || '-'),
                    message: `${favorite.playerName} pozisyonu degisti (${favorite.lastKnownPos} -> ${player.pos || '-'}).`
                });
            }

            favorite.lastKnownRating = player.rating ?? null;
            favorite.lastKnownPos = player.pos ?? null;
            await favorite.save();
        }

        if (createdNotifications.length) {
            await Notification.insertMany(createdNotifications);
        }

        res.json({ success: true, notifications: createdNotifications });
    } catch (err) {
        next(err);
    }
}

async function getNotifications(req, res, next) {
    try {
        const notifications = await Notification.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json({ success: true, notifications });
    } catch (err) {
        next(err);
    }
}

async function markNotificationRead(req, res, next) {
    try {
        await Notification.updateOne(
            { _id: req.params.id, userId: req.user.userId },
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

module.exports = { checkFavoriteUpdates, getNotifications, markNotificationRead };
