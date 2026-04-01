const fs = require('fs');

// Dosyayı oku
try {
    const rawData = fs.readFileSync('players.json');
    const players = JSON.parse(rawData);

    console.log(`📊 Toplam ${players.length} oyuncu analiz ediliyor...\n`);

    // Hıza (pace) göre büyükten küçüğe sırala ve ilk 10'u al
    const fastestTen = players
        .sort((a, b) => b.pace - a.pace)
        .slice(0, 10);

    console.log("⚡ EN HIZLI 10 OYUNCU (TOP SPEED) ⚡");
    console.table(fastestTen.map((p, index) => ({
        Sıra: index + 1,
        İsim: p.name,
        Hız: p.pace,
        Takım: p.team,
        Pozisyon: p.pos,
        Rating: p.rating
    })));

} catch (error) {
    console.error("Hata:", error.message);
}