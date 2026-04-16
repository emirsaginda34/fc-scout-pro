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

module.exports = mongoose.model('Player', playerSchema, 'players');