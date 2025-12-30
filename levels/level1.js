window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    start: {x: 80, y: 350}, 
    goal: {x: 700, y: 340},
    platforms: [
        // ZEMİN (Kalın)
        {x:0, y:400, w:800, h:60}, 
        // SOL DUVAR (Kalın)
        {x:0, y:0, w:50, h:450}, 
        // SAĞ DUVAR (Kalın)
        {x:750, y:0, w:50, h:450}, 
        
        // İç Platformlar
        {x:200, y:320, w:100, h:25}, 
        {x:500, y:250, w:250, h:25}
    ],
    doors: [{x:600, y:250, h:150, id:1}],
    buttons: [{x:240, y:320, target:1}]
});