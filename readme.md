# ⚡ FC SCOUT PRO | The Meta Database



> **"Don't play the game, break the game."**
> 17.500+ oyuncu arasından sıradan kartları değil, mevkisinin en canavarlarını (Meta) bulman için tasarlandı.

---

## 💎 Projenin Kalbi: META SCORE Algoritması

Klasik reytingleri unut. Bu projede oyuncular sadece kulübün onlara verdiği `OVR` (Genel Reyting) ile listelenmez. Arka planda çalışan özel JS algoritması, oyuncunun mevkisine göre en kritik özelliklerini tartar:

* 🏹 **Forvetler (ST/LW/RW):** Hız (%35) + Şut (%35) + Dripling (%20)
* 🧠 **Orta Sahalar (CAM/CM):** Pas (%30) + Dripling (%30) + Hız (%20)
* 🛡️ **Defanslar (CB/RB/LB):** Defans (%35) + Fizik (%25) + Hız (%30)

Bu sayede sadece "Hızlı" olanı değil, mevkisinde en çok iş yapacak **Gizli Canavarları** tek tıkla listelersin.

---

## 🛠️ Teknik Altyapı (Under The Hood)

Bu proje hızı ve karanlık temayı ilke edinir.

* **Frontend:** Neon yeşili ağırlıklı Tailwind CSS + Saf JavaScript (Vanilla JS)
* **Backend:** Node.js & Express.js mimarisi
* **Database:** MongoDB Atlas (Bulut Veritabanı)
* **Hız:** 1.8 saniyelik ham veri okuma hantallığı, MongoDB `Compound Index` (`rating_1_pos_1`) optimizasyonu ile **milisaniyeler** seviyesine düşürüldü. 🔥

---

## 🕹️ Nasıl Çalıştırırım?

Bilgisayarında test etmek istiyorsan terminali aç ve sırayla şu büyüleri yap:

1. **Depoyu Klonla:**
   ```bash
   git clone [https://github.com/kullanici_adin/fc-scout.git](https://github.com/kullanici_adin/fc-scout.git)

   // Modül yükleme
   npm install

   // ana dizinde .env dosyası aç ve mongodb atlas bağlantı linkini yapıştır
   MONGO_URI=your_mongodb_connection_string
PORT=3000
// sistemi başlatın
node server.js

Geliştirici Notu: Bu proje EA Sports FC 26 oyuncu datasetleri baz alınarak, tamamen bağımsız bir scout simülasyonu olarak geliştirilmiştir.


---

### 🚀 GitHub'a Göndermek İçin:
Yine `kullanici_adin` kısmını kendi profil isminle değiştirdikten sonra terminale şu 3 satırı yazıp enter'laman yeterli:

```bash
git add README.md
git commit -m "docs: Agresif ve fütüristik README tasarımı"
git push
