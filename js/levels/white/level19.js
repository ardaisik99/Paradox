window.LEVELS.push({
    maxClones: 1,
    theme: 'white',
    darkness: true, // Enable Darkness Mode
    start: { x: 40, y: 80 },
    goal: { x: 740, y: 370 },
    platforms: [
        // Start Ledge (Top Left)
        { x: 0, y: 120, w: 120, h: 20 },
        // Wall blocking jump
        { x: 230, y: 0, w: 20, h: 300 },

        // Middle Floating Platform
        { x: 450, y: 340, w: 120, h: 20 },

        // Right Structure Top
        { x: 600, y: 280, w: 200, h: 20 },

        // Main Floor
        { x: 0, y: 430, w: 125, h: 20 },
        { x: 225, y: 430, w: 575, h: 20 }
    ],
    movingPlatforms: [
        // Elevator
        {
            x: 125, y: 120, w: 100, h: 20,
            endX: 125, endY: 430,
            triggerId: null,
            weightSensitive: true,
            requiredWeight: 1,
            speed: 5.0
        }
    ],
    buttons: [
        // Button on the High Platform
        { x: 700, y: 280, target: 'gate1', isCeiling: false }
    ],
    doors: [
        // Gate on Bottom Right
        { x: 650, y: 300, h: 130, id: 'gate1', req: 1 }
    ],
    texts: [
        { x: 50, y: 40, text: 'FOLLOW THE LIGHT', size: 14, color: '#aaa' },
        { x: 450, y: 150, text: 'TRUST YOURSELF', size: 14, color: '#aaa' }
    ]
});
