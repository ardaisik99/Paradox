window.LEVELS.push({
    maxClones: 3,
    theme: 'white',
    start: { x: 50, y: 350 },
    goal: { x: 740, y: 340, triggerId: null },
    platforms: [
        // Left Side
        { x: 0, y: 400, w: 200, h: 50 },

        // Right Side
        { x: 600, y: 400, w: 200, h: 50 },

        // The Pit Floor
        // Invisible/Solid floor for corpses to land on.
        // Needs to be slightly below the spikes so the corpse looks like it's ON the spikes.
        // Spikes are at y=430 with height 20.
        // Top of spikes = 430. Bottom = 450.
        // Actually spikes are drawn from bottom up in my logic?
        // Logic: moveTo(bx, by); by = this.y + this.height.
        // So Spikes cover [y, y+h].
        // If spikes are at y=430, h=20. They cover 430-450.
        // Tips are at 430.
        // Corpse needs to land just below the tips so it looks impaled/resting.
        // Corpse height = 35.
        // If corpse stands on y=440, its top is 405.
        // That seems fine.
        // Needs to be thick enough to prevent tunneling at terminal velocity (12px/frame).
        { x: 200, y: 440, w: 400, h: 50 },

        // Central Pillar to help bridging (optional, but requested "pit full of spikes")
        // Let's remove the pillar to make it a pure "Human Bridge" challenge.
        // Gap is 400px.
        // Player Jump is limited. 400px is too far.
        // You generally need a step every ~150px.
        // So you need ~2 corpses mid-air/mid-pit.
        // But corpses fall to the floor.
        // So you just pile them up on the floor until you can jump across?
        // Or you jump on the corpses that are on the floor.
        // If floor is y=440. Spikes are y=430.
        // Tips of spikes are at 430.
        // If you stand on a corpse at y=440, the corpse top is 440 - 35 = 405.
        // 405 is safely above the spikes (430).
        // So jumping on corpses on the floor works!
        // You just need to space them out.
    ],
    movingPlatforms: [],
    lasers: [
        // The Bed of Spikes
        // y=420 (Tip). Height 20. Base=440.
        // Floor is at 440. Spikes sit perfectly on top.
        { x: 200, y: 420, w: 400, h: 20, direction: 'right', type: 'spike' }
    ],
    texts: [
        { x: 320, y: 150, text: 'SPIKE FIELD', size: 14, color: '#aaa' }
    ]
});
