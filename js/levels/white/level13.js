window.LEVELS.push({
    maxClones: 1,
    theme: 'white',
    start: { x: 450, y: 350 }, // Middle Start
    goal: { x: 740, y: 90, triggerId: null }, // Top Right on Ledge
    platforms: [
        // Ground Floor
        { x: 0, y: 400, w: 900, h: 50 },

        // Top Platform (Running from Elevator area to Right Wall)
        // Elevator (x=70, w=100) ends x=170. Platform starts x=170.
        { x: 170, y: 150, w: 610, h: 20 },

        // WALL: Blocks access to elevator from start
        // Placed at x=200, extending from Ground to Top Platform
        { x: 200, y: 170, w: 20, h: 230 },

        // Walls and Ceiling
        { x: 0, y: 20, w: 20, h: 380 },
        { x: 780, y: 20, w: 20, h: 380 },
        { x: 0, y: 0, w: 800, h: 20 }
    ],
    buttons: [],
    doors: [],
    levers: [],
    movingPlatforms: [
        // Elevator (Left Side, Isolated)
        // x=70, w=100.
        { x: 70, y: 400, w: 100, h: 20, endX: 70, endY: 150, triggerId: null, weightSensitive: true, requiredWeight: 2 }
    ],
    portals: [
        // Portal A (Entrance - Far Right)
        { x: 700, y: 340, w: 40, h: 60, targetId: 2, id: 1 },

        // Portal B (Exit - Left Wall)
        // x=25 (Next to left wall x=20. Elevator starts at x=70)
        { x: 25, y: 90, w: 40, h: 60, targetId: 1, id: 2 }
    ],
    texts: [
        { x: 650, y: 300, text: 'ENTER', size: 16, color: '#000' },
        { x: 300, y: 300, text: 'NO ACCESS', size: 14, color: '#000' },
        { x: 80, y: 300, text: '2 PEOPLE', size: 14, color: '#000' }
    ]
});
