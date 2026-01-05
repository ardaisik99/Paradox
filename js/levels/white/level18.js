window.LEVELS.push({
    theme: 'white',
    start: { x: 100, y: 390 },
    goal: { x: 730, y: 90, triggerId: null }, // Goal HIGH up on the ledge
    platforms: [
        // Floor
        { x: 0, y: 430, w: 800, h: 20 },
        // Top Left Static Platform (Portal Landing) - Reverted to original width
        { x: 20, y: 150, w: 100, h: 20 },
        // Goal Ledge (Right) - Target of the bridge
        { x: 700, y: 150, w: 100, h: 20 }
    ],
    movingPlatforms: [
        // Oscillating around 150 (Bridge Height)
        { x: 150, y: 40, w: 120, h: 20, endX: 150, endY: 260, movementType: 'patrol', sequenceVal: 0, speed: 6.0 },
        { x: 290, y: 40, w: 120, h: 20, endX: 290, endY: 260, movementType: 'patrol', sequenceVal: 1, speed: 6.0 },
        { x: 430, y: 40, w: 120, h: 20, endX: 430, endY: 260, movementType: 'patrol', sequenceVal: 2, speed: 6.0 },
        { x: 570, y: 40, w: 120, h: 20, endX: 570, endY: 260, movementType: 'patrol', sequenceVal: 3, speed: 6.0 }
    ],
    buttons: [
        // Sequencer Button
        { x: 380, y: 430, isSequencer: true }
    ],
    portals: [
        // Entrance (Bottom Right)
        { x: 700, y: 370, w: 40, h: 60, targetId: 'top', id: 'bottom' },
        // Exit (Top Left)
        { x: 50, y: 10, w: 40, h: 60, id: 'top', targetId: 'bottom' }
    ],
    texts: [
        { x: 340, y: 300, text: 'PREPARE THE PATH', size: 14, color: '#aaa' }
    ]
});
