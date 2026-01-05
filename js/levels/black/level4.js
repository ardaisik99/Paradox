window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    start: {x: 100, y: 350}, 
    goal: {x: 700, y: 340}, // Hedef duvarın arkasında
    platforms: [
        // ZEMİN VE ÇERÇEVE
        {x:0, y:400, w:800, h:60},   // Zemin
        {x:0, y:0, w:50, h:450},     // Sol Duvar
        {x:750, y:0, w:50, h:450},   // Sağ Duvar
        {x:0, y:0, w:800, h:50},     // Tavan

        // --- AŞILMASI GEREKEN YÜKSEK DUVAR ---
        // Zemin Y: 400
        // Duvar Üst Y: 210
        // Yükseklik Farkı: 190px
        // (Karakter zıplama gücü yaklaşık 120-130px'tir. Klon olmadan geçilemez.)
        {x:380, y:210, w:60, h:190} 
    ],
    doors: [],   // Kapı yok
    buttons: []  // Buton yok
});