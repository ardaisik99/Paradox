window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    start: {x: 300, y: 350}, // Ortada başla
    goal: {x: 30, y: 90},    // Sol üstte, yeni balkonun üzerinde
    
    platforms: [
        // --- DIŞ ÇERÇEVE ---
        {x:0, y:0, w:800, h:50},   // Tavan
        {x:0, y:0, w:40, h:450},   // Sol Duvar
        {x:760, y:0, w:40, h:450}, // Sağ Duvar
        {x:0, y:400, w:800, h:50}, // Zemin

        // --- YENİ: HEDEF BALKONU (Sol Üst) ---
        // Bitiş kapısı artık havada değil, bu platformun üstünde.
        {x:0, y:150, w:100, h:20},

        // --- BUTON PLATFORMU (Sağ Üst) ---
        {x:550, y:220, w:210, h:20}, 

        // --- MERDİVENLER ---
        {x:350, y:320, w:80, h:20},  
        {x:450, y:270, w:80, h:20},  

        // --- KONTROL ODASI (Sağ Alt) ---
        // TAVAN (Balkonun altı)
        {x:550, y:240, w:210, h:20},
        // DİKKAT: Buradaki duvarı kaldırdım! 
        // Artık girişi sadece KAPI koruyor. Duvar yok.
    ],
    
    // ASANSÖR
    // x: 110'a çekildi (Balkonun yanına gelir, altına girmez).
    // Zeminden (400) -> Hedef Balkon Hizasına (150) çıkar.
    movingPlatforms: [
        {x:110, y:400, w:80, h:20, endX:110, endY:150, triggerId:99}
    ],
    
    // KAPI
    // Sağ alt odanın girişini kapatır.
    // Arkasında artık duvar yok, açılınca geçebilirsin.
    doors: [
        {x:550, y:260, h:140, id:1}
    ],
    
    // BUTON
    // Sağ üst balkonda. Kapıyı açar.
    buttons: [
        {x:700, y:220, target:1}
    ],
    
    // ŞALTER (Lever)
    // Sağ alt odanın içinde. Asansörü çağırır.
    levers: [
        {x:650, y:390, triggerId:99}
    ]
});