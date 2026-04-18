const fs = require('fs');
const path = require('path');
const User = require('../models/User');

async function bootstrapUsersFromJson() {
    const count = await User.countDocuments();
    if (count > 0) return;

    const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');
    if (!fs.existsSync(usersFilePath)) return;

    const data = fs.readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data || '[]');
    if (!users.length) return;

    const docs = users
        .filter((u) => u.username && u.password)
        .map((u) => ({
            username: String(u.username).toLowerCase().trim(),
            password: u.password,
            role: u.role === 'admin' ? 'admin' : 'user',
            updateLimits: u.updateLimits || { username: 0, password: 0 }
        }));

    if (docs.length) {
        await User.insertMany(docs, { ordered: false });
    }
}

module.exports = bootstrapUsersFromJson;
