require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        console.error('MONGO_URI bulunamadi.');
        process.exit(1);
    }

    await mongoose.connect(mongoURI);

    const usersFile = path.join(__dirname, '..', 'data', 'users.json');
    if (!fs.existsSync(usersFile)) {
        console.log('users.json bulunamadi, migration atlandi.');
        process.exit(0);
    }

    const raw = fs.readFileSync(usersFile, 'utf-8');
    const users = JSON.parse(raw || '[]');

    for (const user of users) {
        const username = String(user.username || '').toLowerCase().trim();
        if (!username || !user.password) continue;
        await User.updateOne(
            { username },
            {
                $setOnInsert: {
                    username,
                    password: user.password,
                    role: user.role === 'admin' ? 'admin' : 'user',
                    updateLimits: user.updateLimits || { username: 0, password: 0 }
                }
            },
            { upsert: true }
        );
    }

    console.log('Kullanici migration tamamlandi.');
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
