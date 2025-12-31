window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    start: {x: 50, y: 350}, // Sol taraf başlangıç
    // HEDEF DÜZELTİLDİ: x: 700 (Duvardan uzak)
    goal: {x: 700, y: 340}, 
    platforms: [
        // Çerçeve
        {x:0, y:0, w:800, h:50},   
        {x:0, y:0, w:50, h:450},   
        {x:750, y:0, w:50, h:450}, 
        
        // Zeminler (Arası açık)
        {x:0, y:400, w:150, h:50}, // Sol zemin (Küçültüldü)
        {x:650, y:400, w:150, h:50}, // Sağ zemin
        
        // BUTON PLATFORMU (Çok solda ve yukarıda)
        {x:0, y:250, w:100, h:20}
    ],
    // Hareketli Platform
    // Varsayılan (Start): x:500 (Sağda, ULAŞILAMAZ)
    // Hedef (End): x:150 (Sola gelir)
    // Oyuncu butona basınca sola gelir. Bırakınca sağa kaçar.
    movingPlatforms: [
        {x:500, y:400, w:150, h:20, endX:150, endY:400, triggerId:1}
    ],
    doors: [],
    buttons: [
        // Platformu çağıran buton (Çok uzakta)
        // Buradan platforma koşmak imkansız olmalı
        {x:20, y:250, target:1}
    ]
});