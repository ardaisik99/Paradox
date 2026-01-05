window.LEVELS.push({
    maxClones: 1,
    theme: 'white',
    start: { x: 700, y: 50 },
    goal: { x: 740, y: 370, triggerId: null },
    platforms: [
        // Top Floor
        { x: 140, y: 100, w: 640, h: 20 },

        // Middle Floor
        { x: 140, y: 280, w: 640, h: 20 },

        // Bottom Floor (Visible White Floor)
        // Raised to y=430 to be visible on 450h canvas.
        { x: 20, y: 430, w: 120, h: 20 },
        { x: 140, y: 430, w: 640, h: 20 },

        // Walls
        { x: 0, y: 0, w: 20, h: 500 },
        { x: 780, y: 0, w: 20, h: 500 }
    ],
    movingPlatforms: [
        // Elevator (Left Side)
        // Adjust EndY to 410 to sit on new floor (430-20 height = 410 top)
        { x: 20, y: 100, w: 120, h: 20, endX: 20, endY: 410, weightSensitive: true, requiredWeight: 1 }
    ],
    lasers: [
        // Source Right. Shoots Left.
        { x: 20, y: 250, w: 760, h: 20, direction: 'left' }
    ],
    texts: []
});
