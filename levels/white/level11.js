window.LEVELS.push({
    theme: 'white',
    start: { x: 100, y: 350 }, // Start near elevator
    goal: { x: 700, y: 40, triggerId: 99, sequence: [1, 2] },  // Top Right (Exit) - Trigger: 99, Seq: 1->2
    platforms: [
        // Floor 0 (Bottom)
        { x: 0, y: 400, w: 800, h: 50 },

        // Floating Jump Platform (Floor 0 Middle)
        { x: 350, y: 320, w: 100, h: 20 },

        // Floor 1 (Middle) - Right side platform
        { x: 500, y: 250, w: 300, h: 20 },

        // Floor 2 (Top) - Long platform across
        { x: 100, y: 100, w: 700, h: 50 }
    ],
    buttons: [
        // Button 1 (Middle Floor) - Label "1"
        { x: 700, y: 240, target: 99, isCeiling: false, id: 1 },

        // Button 2 (Bottom Floor) - Label "2"
        { x: 700, y: 390, target: 99, isCeiling: false, id: 2 }
    ],
    // Exit Door removed -> Goal itself is the "door" that appears.
    doors: [],
    levers: [
        { x: 550, y: 390, triggerId: 100 } // Floor 0 Lever (Right side)
    ],
    movingPlatforms: [
        // Elevator (Far Left)
        { x: 20, y: 390, w: 60, h: 10, endX: 20, endY: 90, triggerId: 100 }
    ],
    texts: [
        { x: 695, y: 200, text: '1', size: 30, color: '#000' },
        { x: 695, y: 350, text: '2', size: 30, color: '#000' }
    ]
});
