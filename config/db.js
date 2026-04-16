const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        console.warn("⚠️ UYARI: MONGO_URI bulunamadı!");
        return;
    }

    try {
        await mongoose.connect(mongoURI);
        console.log("🚀 Veritabanına güvenli şekilde bağlandık!");
    } catch (err) {
        console.error("❌ MongoDB Bağlantı hatası:", err);
        process.exit(1); // Kritik hata: Uygulamayı durdur
    }
};

module.exports = connectDB;