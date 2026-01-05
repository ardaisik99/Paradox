window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    maxClones: 3,
    start: { x: 50, y: 250 }, // Orta kattan başla

    // DÜZELTME: Hedefin Y koordinatı 110'dan 90'a çekildi.
    // Platform Y (150) - Hedef Boyu (60) = 90. Artık tam üstünde duracak.
    goal: { x: 700, y: 90 },

    platforms: [
        // --- ÇERÇEVE ---
        { x: 0, y: 0, w: 800, h: 50 },   // Tavan
        { x: 0, y: 50, w: 50, h: 350 },   // Sol Duvar
        { x: 750, y: 50, w: 50, h: 350 }, // Sağ Duvar
        { x: 0, y: 400, w: 800, h: 50 }, // Zemin

        // --- ORTA KAT (Başlangıç & Buton 1 Alanı) ---
        { x: 50, y: 300, w: 250, h: 20 },
        { x: 350, y: 300, w: 100, h: 20 }, // Buton 1 platformu

        // --- ALT KAT (Sağ Alt Oda - Buton 2 Alanı) ---
        { x: 500, y: 280, w: 250, h: 20 }, // Tavanı

        // --- SOL ÜST KAT (Buton 3 Alanı) ---
        { x: 50, y: 150, w: 200, h: 20 },

        // --- SAĞ ÜST KAT (Hedef Alanı) ---
        { x: 550, y: 150, w: 200, h: 20 },

        // --- MERDİVENLER ---
        { x: 280, y: 220, w: 60, h: 10 },
        { x: 480, y: 220, w: 60, h: 10 }
    ],
    doors: [
        // KAPI 2 (Sağ Alt Oda - Giriş)
        { x: 500, y: 300, h: 100, id: 2 },

        // KAPI 3 (Sol Üst - Giriş)
        { x: 180, y: 50, h: 100, id: 3 },

        // KAPI 1 (Sağ Üst - Hedef Önü)
        { x: 600, y: 50, h: 100, id: 1 }
    ],
    buttons: [
        // BUTON 1 (Orta) -> Açar: Kapı 2
        { x: 400, y: 300, target: 2 },

        // BUTON 2 (Sağ Alt) -> Açar: Kapı 3
        { x: 700, y: 400, target: 3 },

        // BUTON 3 (Sol Üst) -> Açar: Kapı 1 (Hedef)
        { x: 50, y: 150, target: 1 }
    ]
});