window.LEVELS.push({
    theme: 'white',
    start: { x: 100, y: 380 }, // Spawn on Bottom Floor
    goal: { x: 50, y: 30, triggerId: null }, // Goal Top Left
    platforms: [
        // 1. Top Line 
        { x: 0, y: 80, w: 700, h: 20 },

        // 2. Middle Left Line
        // Lowered to 300 to be jumpable from floor (420)
        { x: 50, y: 300, w: 200, h: 10 },

        // 3. Right Structure (Covering Button)
        { x: 300, y: 220, w: 380, h: 10 }, // Ceiling
        { x: 680, y: 220, w: 20, h: 200 }, // Wall down

        // 4. Bottom Floor (Ground)
        // Positioned at 420 to ensure it fits in the black rectangle
        { x: 0, y: 420, w: 800, h: 100 },

        // Walls
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 }
    ],
    buttons: [
        { x: 450, y: 410, target: 'elevator', isCeiling: false, id: 'btn_elev' }
    ],
    movingPlatforms: [
        // THE ELEVATOR (Reverse C)
        // Top: 80, Bottom: 420

        // Floor
        { x: 700, y: 80, w: 90, h: 20, endX: 700, endY: 420, triggerId: 'elevator', weightSensitive: false },

        // Ceiling
        { x: 700, y: 0, w: 90, h: 20, endX: 700, endY: 340, triggerId: 'elevator', weightSensitive: false },

        // Back Wall (Right)
        { x: 780, y: 0, w: 10, h: 100, endX: 780, endY: 340, triggerId: 'elevator', weightSensitive: false }
    ],
    lasers: [],
    texts: [
        { x: 430, y: 390, text: 'CALL', size: 10, color: '#aaa' }
    ]
});
