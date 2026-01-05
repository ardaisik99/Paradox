window.LEVELS.push({
    maxClones: 1,
    theme: 'white',
    inverted: true,
    darkness: true, // Enable Darkness Mode
    start: { x: 50, y: 50 },
    goal: { x: 280, y: 370, triggerId: 'finishGate' },
    platforms: [
        // --- TOP FLOOR ---
        { x: 0, y: 100, w: 700, h: 20 },

        // --- MIDDLE FLOOR ---
        { x: 700, y: 240, w: 100, h: 20 },

        { x: 600, y: 240, w: 40, h: 20 },
        { x: 500, y: 240, w: 40, h: 20 },
        { x: 400, y: 240, w: 40, h: 20 },

        { x: 200, y: 240, w: 140, h: 20 },

        // --- BOTTOM FLOOR ---
        { x: 200, y: 430, w: 600, h: 20 },
    ],
    movingPlatforms: [
        {
            x: 20, y: 240, w: 180, h: 20,
            endX: 20, endY: 430,
            weightSensitive: true,
            requiredWeight: 1,
            speed: 5.0
        }
    ],
    buttons: [
        { x: 400, y: 100, target: 'doorStart', isCeiling: false }
    ],
    doors: [
        { x: 700, y: 0, h: 100, id: 'doorStart', req: 1 },
    ],
    levers: [
        { x: 720, y: 420, triggerId: 'finishGate' }
    ],
    lasers: [
        { x: 650, y: 248, w: 40, h: 5, direction: 'horizontal', type: 'static' },
        { x: 550, y: 248, w: 40, h: 5, direction: 'horizontal', type: 'static' },
        { x: 450, y: 248, w: 40, h: 5, direction: 'horizontal', type: 'static' },
        { x: 350, y: 248, w: 40, h: 5, direction: 'horizontal', type: 'static' },
    ],
    texts: [
        { x: 50, y: 40, text: 'LEFT IS RIGHT', size: 14, color: '#aaa' },
        { x: 50, y: 60, text: 'RIGHT IS LEFT', size: 14, color: '#aaa' },
        { x: 400, y: 200, text: 'WATCH YOUR STEP', size: 14, color: '#aaa' }
    ]
});
