const mongoose = require('mongoose');
const fs = require('fs');

// 1. Veritabanı Bağlantısı
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("🚀 Veritabanına güvenli şekilde bağlandık!"))
    .catch(err => console.error("❌ Bağlantı hatası:", err));

mongoose.connect(mongoURI)
    .then(() => console.log("🚀 Veri aktarımı için MongoDB'ye bağlandık!"))
    .catch(err => console.error("❌ Bağlantı hatası:", err));

// 2. MongoDB Şeması (Schema) Tanımlama
// Oyuncu verilerinin hangi yapıda kaydedileceğini belirtiyoruz.
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
    stats: Object // Radar grafiği için kullandığın o detaylı objeler
}, { strict: false }); // 'strict: false' diyerek JSON'da ne varsa esnekçe kabul etmesini sağlıyoruz.

const Player = mongoose.model('Player', playerSchema, 'players');

// 3. JSON Dosyasını Okuma ve Veritabanına Yazma Fonksiyonu
const importData = async () => {
    try {
        // Buradaki dosya yolunu kendi players.json dosyanın yerine göre düzenle!
        const players = JSON.parse(fs.readFileSync('./data/players.json', 'utf-8'));
        
        // Önce temiz bir sayfa açmak için içeriyi boşaltıyoruz
        await Player.deleteMany();
        console.log("🧹 Eski veriler temizlendi.");

        // Ve tüm oyuncuları tek seferde uçuruyoruz!
        await Player.insertMany(players);
        console.log("🔥 17.500+ Oyuncu başarıyla MongoDB Atlas'a yüklendi!");
        
        process.exit();
    } catch (error) {
        console.error("❌ Veri aktarımında hata oluştu:", error);
        process.exit(1);
    }
};

// Bağlantı kurulduktan hemen sonra aktarımı başlat
mongoose.connection.once('open', () => {
    importData();
});