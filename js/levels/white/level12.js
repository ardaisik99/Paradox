window.LEVELS.push({
    maxClones: 2,
    theme: 'white',
    start: { x: 50, y: 350 }, // Bottom Left
    goal: { x: 750, y: 60, triggerId: 99 }, // Top Right
    platforms: [
        // Ground Floor Start
        { x: 0, y: 400, w: 100, h: 50 },
        // Elevator Gap (100-200)

        // Ground Floor Right
        { x: 200, y: 400, w: 600, h: 50 },

        // Middle Floor (Lever Area) - Raised to 250 (Harder to jump directly)
        { x: 200, y: 240, w: 600, h: 20 },

        // Steps to Middle Floor (Intermediate platform to allow jump)
        { x: 600, y: 320, w: 80, h: 20 },

        // Top Floor (Goal Area)
        { x: 200, y: 110, w: 600, h: 20 }
    ],
    buttons: [
        // Button on Middle Floor (Controls Goal)
        { x: 500, y: 240, target: 99 }
    ],
    doors: [],
    levers: [],
    movingPlatforms: [
        // Elevator (Left Side, moved to x=100)
        // Starts Ground (y=400), Goes Top (y=90)
        { x: 100, y: 400, w: 100, h: 20, endX: 100, endY: 110, triggerId: null, weightSensitive: true, requiredWeight: 2 }
    ],
    texts: [
        { x: 20, y: 300, text: '2 PEOPLE', size: 20, color: '#000' }
    ]
});
