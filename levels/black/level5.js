window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    start: {x: 50, y: 250}, // Sol üstte başla
    goal: {x: 720, y: 220}, // Hedef sağda (Platformla birlikte biraz aşağı indi)
    platforms: [
        // Çerçeve (Tavan ve Yanlar)
        {x:0, y:0, w:800, h:50},   // Tavan
        {x:0, y:0, w:50, h:450},   // Sol Duvar
        {x:750, y:0, w:50, h:450}, // Sağ Duvar
        
        // ZEMİN (SOL VE SAĞ)
        // Sol Platform
        {x:0, y:300, w:250, h:150}, 
        
        // Sağ Platform (DÜZELTİLDİ: Alçaltıldı)
        // Yükseklik 200'den 270'e çekildi. Artık zıplayarak yetişilebilir.
        {x:550, y:270, w:250, h:180},

        // ÇUKURUN DİBİ
        {x:250, y:400, w:300, h:50} 
    ],
    doors: [],
    buttons: []
});