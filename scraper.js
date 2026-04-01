const fs = require('fs');
const path = require('path');

async function fetchAllPlayers() {
    let allPlayers = [];
    const limit = 100; // EA API limiti genellikle 100'dür
    let offset = 0;
    
    // --- KRİTİK GÜNCELLEME: Hedef Sayı ---
    const maxPlayers = 17500; // Tüm veri setini kapsamak için (FC 25'te yaklaşık bu civardadır)
    const delay = (ms) => new Promise(res => setTimeout(res,ms));
    await delay(500);

    console.log("🚀 Veri çekme işlemi başlatıldı...");

    try {
        while (offset < maxPlayers) {
            // EA API URL (Locale ve limit parametreleri ile)
            const url = `https://drop-api.ea.com/rating/ea-sports-fc?locale=en&limit=${limit}&offset=${offset}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Hata! Statu: ${response.status}`);
            
            const data = await response.json();

            // Eğer gelen veri boşsa veya items yoksa döngüyü kır
            if (!data.items || data.items.length === 0) {
                console.log("ℹ️ Daha fazla oyuncu bulunamadı, işlem sonlandırılıyor.");
                break;
            }

            const cleanedData = data.items.map(player => ({
                name: player.commonName || `${player.firstName} ${player.lastName}`,
                rating: player.overallRating,
                pos: player.position ? player.position.shortLabel : "N/A",
                team: player.team ? player.team.label : "Free Agent",
                league: player.leagueName || "Unknown",
                nation: player.nationality ? player.nationality.label : "Unknown",
                // İstatistikler (Bazı oyuncularda eksik olabilir, o yüzden varsayılan 0 ekledik)
                pace: (player.stats && player.stats.pac) ? player.stats.pac.value : 0,
                shoot: (player.stats && player.stats.sho) ? player.stats.sho.value : 0,
                pass: (player.stats && player.stats.pas) ? player.stats.pas.value : 0,
                drib: (player.stats && player.stats.dri) ? player.stats.dri.value : 0,
                def: (player.stats && player.stats.def) ? player.stats.def.value : 0,
                phy: (player.stats && player.stats.phy) ? player.stats.phy.value : 0,
                image: player.avatarUrl
            }));

            allPlayers = [...allPlayers, ...cleanedData];
            
            // Mevcut durumu konsola yazdır
            console.log(`✅ Toplam çekilen: ${allPlayers.length} / Yaklaşık hedef: ${maxPlayers}`);
            
            offset += limit;

            // EA sunucularını yormamak ve IP ban yememek için 300ms bekleme
            await new Promise(res => setTimeout(res, 300));
        }

        // --- DOSYA KAYIT İŞLEMİ (Fonksiyon İçinde Olmalı) ---
        const targetPath = path.join(__dirname, 'players.json'); 
        fs.writeFileSync(targetPath, JSON.stringify(allPlayers, null, 2));
        
        console.log(`\n🎉 İŞLEM TAMAMLANDI!`);
        console.log(`📂 Dosya Yolu: ${targetPath}`);
        console.log(`📊 Toplam Oyuncu Sayısı: ${allPlayers.length}`);

    } catch (error) {
        console.error("❌ Hata oluştu:", error.message);
    }
}

// Fonksiyonu çalıştır
fetchAllPlayers();
