window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    maxClones: 2,
    start: { x: 50, y: 350 }, // Sol taraf başlangıç
    // HEDEF DÜZELTİLDİ: x: 700 (Duvardan uzak)
    goal: { x: 700, y: 340 },
    platforms: [
        // Çerçeve
        { x: 0, y: 0, w: 800, h: 50 },
        { x: 0, y: 50, w: 50, h: 350 },
        { x: 750, y: 50, w: 50, h: 350 },

        // Zeminler (Arası açık)
        { x: 50, y: 400, w: 150, h: 50 }, // Sol zemin (Uzatıldı, zıplama için alan)
        { x: 650, y: 400, w: 100, h: 50 }, // Sağ zemin

        // BUTON PLATFORMU (Çok solda ve yukarıda)
        // Alçaltıldı (250 -> 270) ki zıplayarak erişilebilsin.
        { x: 50, y: 270, w: 100, h: 20 }
    ],
    // Hareketli Platform
    // Varsayılan (Start): x:500 (Sağda, ULAŞILAMAZ)
    // Hedef (End): x:200 (Sola gelir, zeminle birleşir)
    // Oyuncu butona basınca sola gelir. Bırakınca sağa kaçar.
    movingPlatforms: [
        { x: 500, y: 400, w: 150, h: 15, endX: 200, endY: 400, triggerId: 1 }
    ],
    doors: [],
    buttons: [
        // Platformu çağıran buton (Çok uzakta)
        // Buradan platforma koşmak imkansız olmalı
        { x: 70, y: 270, target: 1 }
    ]
});