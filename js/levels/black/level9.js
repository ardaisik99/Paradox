window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    maxClones: 2,
    start: { x: 300, y: 350 }, // Ortada başla
    goal: { x: 710, y: 340 },  // Sağ taraf (Kapı arkası)
    platforms: [
        // --- DIŞ ÇERÇEVE ---
        { x: 0, y: 0, w: 800, h: 50 },   // Tavan
        { x: 0, y: 50, w: 50, h: 350 },   // Sol Duvar
        { x: 750, y: 50, w: 50, h: 350 }, // Sağ Duvar
        { x: 0, y: 400, w: 800, h: 50 }, // Zemin

        // --- BUTON KOLONU (En Solda) ---
        // Yükseklik: 325. (Zemin 400).
        // Boşluk: 75 birim. Karakterler 70 birim. 
        // 5 birim pay var, üzerine çıkınca "cuk" diye oturur.
        { x: 100, y: 50, w: 40, h: 275 },

        // --- KAPININ ÜSTÜNDEKİ DUVAR (Anti-Hile) ---
        // Kapı x:600'de. Bu duvar tavandan kapıya kadar iner.
        { x: 600, y: 50, w: 20, h: 200 }
    ],
    // BUTONLAR
    buttons: [
        // ALT BUTON (Zeminde)
        { x: 100, y: 400, target: 1 },

        // ÜST BUTON (Tavanda, aşağı bakıyor)
        // Yeri 325 (Kolonun ucu)
        { x: 100, y: 325, target: 1, isCeiling: true }
    ],
    // KAPI
    doors: [
        // req: 2 (İkisi de basılı olmalı)
        // Yükseklik 150 (250'den başlar, 400'e iner)
        { x: 600, y: 250, h: 150, id: 1, req: 2 }
    ],
    portals: [],
    levers: [],
    movingPlatforms: []
});