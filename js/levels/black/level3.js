window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    maxClones: 2,
    start: { x: 50, y: 350 },
    goal: { x: 700, y: 340 },
    platforms: [
        { x: 0, y: 400, w: 800, h: 60 },
        { x: 0, y: 0, w: 50, h: 450 },
        { x: 750, y: 0, w: 50, h: 450 },

        { x: 250, y: 0, w: 20, h: 250 }, { x: 350, y: 300, w: 150, h: 20 }, { x: 600, y: 0, w: 20, h: 250 }
    ],
    doors: [{ x: 250, y: 250, h: 150, id: 1 }, { x: 600, y: 250, h: 150, id: 2 }],
    buttons: [{ x: 100, y: 400, target: 1 }, { x: 400, y: 300, target: 2 }]
});