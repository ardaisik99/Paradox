window.LEVELS = window.LEVELS || [];
window.LEVELS.push({
    start: { x: 50, y: 350 },     // Start Left
    goal: { x: 700, y: 350 },     // Goal (Reachable, after door, x=700 ensures collision before wall at 750)

    platforms: [
        // --- ROOM ---
        { x: 0, y: 0, w: 800, h: 50 },     // Ceiling
        { x: 0, y: 400, w: 800, h: 50 },   // Ground
        { x: 0, y: 0, w: 50, h: 450 },     // Left Wall
        { x: 750, y: 0, w: 50, h: 450 },   // Right Wall

        // --- DECOR ---
        // A wall panel for the text
        { x: 250, y: 150, w: 300, h: 100 },

        // Anti-cheat wall above door
        { x: 650, y: 0, w: 20, h: 300 }
    ],

    texts: [
        { x: 320, y: 210, text: "CODE:", size: 20, color: "#aaa" },
        { x: 300, y: 240, text: "2 - 3 - 1 - 4", size: 30, color: "#fff" }
    ],

    buttons: [
        // 4 Buttons side by side (IDs 1, 2, 3, 4)
        // Target: 1 (The Door)

        // Button 1 (Leftmost)
        { x: 200, y: 400, target: 1, id: 1 },

        // Button 2
        { x: 300, y: 400, target: 1, id: 2 },

        // Button 3
        { x: 400, y: 400, target: 1, id: 3 },

        // Button 4 (Rightmost)
        { x: 500, y: 400, target: 1, id: 4 }
    ],

    doors: [
        // EXIT DOOR
        // Sequence: [2, 3, 1, 4]
        { x: 650, y: 300, h: 100, id: 1, sequence: [2, 3, 1, 4] }
    ],

    movingPlatforms: [],
    portals: [],
    levers: []
});
