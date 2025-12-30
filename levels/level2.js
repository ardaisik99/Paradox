window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    start: {x: 80, y: 350}, 
    goal: {x: 720, y: 130}, 
    platforms: [
        // Çerçeve (Kalın)
        {x:0, y:400, w:800, h:60}, 
        {x:0, y:0, w:800, h:50}, 
        {x:0, y:0, w:50, h:450}, 
        {x:750, y:0, w:50, h:450}, 

        // Platformlar
        {x:160, y:290, w:80, h:20}, 
        {x:20, y:200, w:140, h:20}, 
        {x:300, y:250, w:20, h:150}, 
        {x:450, y:320, w:100, h:20}, 
        // Sağ üst platform (Kapıların olduğu yer)
        {x:580, y:200, w:170, h:20} 
    ],
    doors: [
        // Kapı 1: x=600 (Artık platformun üzerinde)
        // y=20, h=180 -> Alt ucu 200'e değer (Platform hizası)
        {x:600, y:20, h:180, id:1}, 
        
        // Kapı 2: x=680 (Biraz daha sağda)
        {x:680, y:20, h:180, id:2}
    ],
    buttons: [{x:70, y:200, target:1}, {x:500, y:320, target:2}]
});