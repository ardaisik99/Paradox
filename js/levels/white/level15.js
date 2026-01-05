window.LEVELS.push({
    theme: 'white',
    start: { x: 400, y: 40 },
    goal: { x: 400, y: 400, triggerId: null },
    platforms: [
        // Top Floor (Spawn)
        { x: 300, y: 80, w: 200, h: 20 },

        // Tower Walls
        { x: 230, y: 0, w: 20, h: 450 },
        { x: 550, y: 0, w: 20, h: 450 },

        // Level 1 Platform (Left) - Target for blocking Laser 1
        { x: 250, y: 180, w: 170, h: 20 },

        // Level 2 Platform (Right) - Target for blocking Laser 2
        { x: 380, y: 300, w: 170, h: 20 },

        // Bottom Floor - Target for blocking Laser 3
        { x: 0, y: 430, w: 800, h: 20 }
    ],
    movingPlatforms: [],
    lasers: [
        // Laser 1 (Top Gap)
        // Platform at 180. Character height 35.
        // Laser needs to be at approx 160-165 to clearly hit the standing/fallen body.
        { x: 250, y: 165, w: 300, h: 10, direction: 'right' },

        // Laser 2 (Middle Gap)
        // Platform at 300.
        // Laser at 285.
        { x: 250, y: 285, w: 300, h: 10, direction: 'left' },

        // Laser 3 (Bottom Gap)
        // Floor at 430.
        // Laser at 415.
        { x: 250, y: 415, w: 300, h: 10, direction: 'right' }
    ],
    texts: [
        { x: 360, y: 40, text: 'FREE FALL', size: 14, color: '#aaa' }
    ]
});
