const mongoose = require('mongoose');

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

playerSchema.index({ name: 1 });
playerSchema.index({ pos: 1 });
playerSchema.index({ rating: -1 });
playerSchema.index({ age: 1 });

module.exports = mongoose.model('Player', playerSchema, 'players');