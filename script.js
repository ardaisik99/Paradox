document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initLevelButtons();
    setTimeout(() => { document.getElementById('loadingScreen').style.display = 'none'; }, 1000);
    if (!window.LEVELS || window.LEVELS.length === 0) console.error("Levels not loaded!");

    // YENİ: Başlarken ve ekran boyutu değişince canvas'ı ayarla
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    gameState = 'MENU';
    initVisuals();
    loop();
});

const THEMES = {
    noir: { solid: '#000000', player: '#ffffff', clone: '#888888', rimLight: '#ffffff', buttonActive: '#aaaaaa', text: '#fff', bg: '#333333', useBorders: true },
    white: { solid: '#ffffff', player: '#000000', clone: '#333333', rimLight: '#333333', buttonActive: '#ff0000', text: '#000', bg: '#888888', useBorders: false }
};

let COLORS = {
    solid: '#000000', // Default Noir
    rimLight: '#ffffff',
    player: '#ffffff',
    clone: '#888888',
    door: '#222222',
    button: '#aaaaaa',
    dust: '#ffffff',
    movingPlat: '#333333',
    leverBase: '#222222',
    leverStick: '#cccccc',
    buttonActive: '#aaaaaa', // Default
    portal: '#00ffff'
};

function setTheme(name) {
    const t = THEMES[name] || THEMES.noir;
    COLORS.solid = t.solid;
    COLORS.player = t.player;
    COLORS.rimLight = t.rimLight;
    COLORS.buttonActive = t.buttonActive;
    COLORS.bg = t.bg;
    COLORS.clone = t.clone || '#888888';
    COLORS.useBorders = t.useBorders;

    // Update dependent visual styles if needed
    if (name === 'white') {
        COLORS.dust = '#000000';
        COLORS.door = '#000000'; // Black door
        COLORS.button = '#666666';
        COLORS.movingPlat = '#bbbbbb'; // Lighter platform
        COLORS.leverBase = '#ffffff';
        COLORS.portal = '#000000';
    } else {
        COLORS.dust = '#ffffff';
        COLORS.door = '#222222';
        COLORS.button = '#aaaaaa';
        COLORS.movingPlat = '#333333';
        COLORS.leverBase = '#222222';
        COLORS.portal = '#ffffff'; // White portal for Noir theme
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- HD & RESPONSIVE EKRAN AYARI ---
function resizeCanvas() {
    // 1. Ekranın içine sığacak en büyük 16:9 oranını hesapla
    const targetRatio = 800 / 450;

    // Pencerenin %95'ini kullansın (Kenarlardan hafif boşluk kalsın)
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.95;

    let finalWidth = maxWidth;
    let finalHeight = maxWidth / targetRatio;

    // Eğer yükseklik ekrana sığmıyorsa, yüksekliğe göre ayarla
    if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = finalHeight * targetRatio;
    }

    // 2. CSS Boyutunu Ayarla (Görünen boyut)
    canvas.style.width = `${finalWidth}px`;
    canvas.style.height = `${finalHeight}px`;

    // Canvas'ı ortala
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';

    // 3. İç Çözünürlüğü Ayarla (HD Kalite için DPI çarpımı)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = finalWidth * dpr;
    canvas.height = finalHeight * dpr;

    // 4. Çizim Ölçeğini Ayarla (Oyun mantığı 800x450 sanmaya devam etsin)
    // Bu sayede oyunun fiziği bozulmadan HD görüntü alırız.
    const scaleFactor = (finalWidth * dpr) / 800;
    ctx.scale(scaleFactor, scaleFactor);

    // Yumuşatma ayarları
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
}

const mainMenu = document.getElementById('mainMenu');
const ingameMenu = document.getElementById('ingameMenu');
const levelsMenu = document.getElementById('levelsMenu');
const settingsMenu = document.getElementById('settingsMenu');
const winScreen = document.getElementById('winScreen');
const winButtons = document.getElementById('winButtons');
const gameUI = document.getElementById('gameUI');
const levelTextUI = document.getElementById('levelText');
const cloneTextUI = document.getElementById('cloneText');
const collisionTextUI = document.getElementById('collisionText');
const levelIndicator = document.getElementById('levelIndicator');

// --- FİZİK (Hassas Kontrol) ---
const GRAVITY = 0.6;
const FRICTION = 0.75;
const SPEED = 2.5;
const ACCEL = 0.5;
const JUMP_FORCE = 12;
const TERMINAL_VELOCITY = 6;

let gameState = 'MENU';
let currentLevelIndex = 0;
let unlockedLevels = 99;
let frameCount = 0;
let gameOver = false;
let keys = {};
let cloneCollisionEnabled = false;
let soundEnabled = true;

let player, clones = [], platforms = [], buttons = [], doors = [], particles = [], goal = null;
let movingPlatforms = [], levers = [], portals = [], texts = [];
let atmosphericDust = []; let lightRays = [];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// --- NAMESPACE & CONCEPTS ---
const CONCEPTS = [
    { id: 'noir', name: 'NOIR', desc: 'The Beginning', start: 0, count: 10, cssClass: 'card-black' },
    { id: 'white', name: 'BLANC', desc: 'Inversion', start: 10, count: 10, cssClass: 'card-white' }
];

function bindEvents() {
    document.getElementById('btnPlayMain').addEventListener('click', startGame);
    document.getElementById('btnLevelsMain').addEventListener('click', openLevels); // Calls new openLevels
    document.getElementById('btnSettingsMain').addEventListener('click', openSettings);
    document.getElementById('btnResume').addEventListener('click', resumeGame);
    document.getElementById('btnRestart').addEventListener('click', restartLevel);
    document.getElementById('btnSettingsPause').addEventListener('click', openSettings);
    document.getElementById('btnExit').addEventListener('click', goToMainMenu);

    // New Back Buttons
    document.getElementById('btnBackToMain').addEventListener('click', closeLevels);
    document.getElementById('btnBackToConcepts').addEventListener('click', showConceptView);

    document.getElementById('btnCloseSettings').addEventListener('click', closeSettings);
    document.getElementById('soundToggle').addEventListener('change', (e) => toggleSound(e.target.checked));
    document.getElementById('btnWinMain').addEventListener('click', goToMainMenu);
}

function initLevelButtons() {
    // Legacy function support (not used directly anymore, but kept for init safety if called)
}

function openLevels() {
    playSound('click');
    levelsMenu.classList.add('active');
    if (gameState === 'MENU') mainMenu.classList.remove('active');
    if (gameState === 'PAUSED') ingameMenu.classList.remove('active');

    // Default to Concept View
    showConceptView();
}

function closeLevels() {
    playSound('click');
    levelsMenu.classList.remove('active');
    if (gameState === 'MENU') mainMenu.classList.add('active');
    else if (gameState === 'PAUSED') ingameMenu.classList.add('active');
}

function showConceptView() {
    document.getElementById('conceptSelectView').style.display = 'flex';
    document.getElementById('levelSelectView').style.display = 'none';
    renderConcepts();
}

function showLevelView(concept) {
    document.getElementById('conceptSelectView').style.display = 'none';
    document.getElementById('levelSelectView').style.display = 'flex';
    document.getElementById('selectedConceptTitle').innerText = concept.name;
    renderLevelsForConcept(concept);
}

function renderConcepts() {
    const list = document.querySelector('.concept-list');
    list.innerHTML = '';

    CONCEPTS.forEach(c => {
        // Create Card
        const card = document.createElement('div');
        card.className = `concept-card ${c.cssClass}`;

        // Info
        const info = document.createElement('div');
        info.className = 'concept-info';

        const title = document.createElement('div');
        title.className = 'concept-title';
        title.innerText = c.name;

        const desc = document.createElement('div');
        desc.className = 'concept-desc';
        desc.innerText = c.desc;

        info.appendChild(title);
        info.appendChild(desc);

        // Progress Logic
        // unlockedLevels = 1 means Level 1 is unlocked, 0 completed.
        // completed = unlockedLevels - 1.
        // For a concept starting at 'start':
        // completedInConcept = completed - start.
        // Clamp between 0 and count.

        let globalCompleted = Math.max(0, unlockedLevels - 1);
        let completedInConcept = Math.max(0, Math.min(c.count, globalCompleted - c.start));

        const progress = document.createElement('div');
        progress.className = 'concept-progress';
        progress.innerText = `${completedInConcept}/${c.count}`;

        card.appendChild(info);
        card.appendChild(progress);

        // Lock check
        // If we haven't completed enough levels to reach this concept's start
        if (globalCompleted < c.start) {
            card.classList.add('locked-concept');
        }

        card.onclick = () => {
            playSound('click');
            showLevelView(c);
        };

        list.appendChild(card);
    });
}

function renderLevelsForConcept(concept) {
    const grid = document.querySelector('.level-grid');
    grid.innerHTML = '';

    if (!window.LEVELS) return;

    for (let i = concept.start; i < concept.start + concept.count; i++) {
        if (i >= window.LEVELS.length) {
            // Placeholder for missing levels
            const btn = document.createElement('button');
            btn.className = 'btn level-btn locked';
            btn.innerText = i + 1;
            grid.appendChild(btn);
            continue;
        }

        const btn = document.createElement('button');
        btn.className = 'btn level-btn';
        btn.innerText = i + 1;
        if (i >= unlockedLevels) btn.classList.add('locked');
        btn.onclick = () => selectLevel(i);
        grid.appendChild(btn);
    }
}

function playSound(type) {
    if (!soundEnabled || audioCtx.state === 'suspended') { if (type === 'click') audioCtx.resume(); else return; }
    try {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
        if (type === 'jump') { osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15); }
        else if (type === 'button') { osc.type = 'square'; osc.frequency.setValueAtTime(80, now); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.1); osc.start(now); osc.stop(now + 0.1); }
        else if (type === 'lever') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.linearRampToValueAtTime(50, now + 0.2); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); }
        else if (type === 'portal') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
        else if (type === 'click') { osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05); }
        else if (type === 'win') { osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(600, now + 1.0); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 1.5); osc.start(now); osc.stop(now + 1.5); }
        else if (type === 'rewind') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.4); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.4); osc.start(now); osc.stop(now + 0.4); }
    } catch (e) { }
}
function toggleIngameMenu() { playSound('click'); if (gameState === 'PLAYING') { gameState = 'PAUSED'; ingameMenu.classList.add('active'); } else if (gameState === 'PAUSED') resumeGame(); }
function resumeGame() { playSound('click'); gameState = 'PLAYING'; ingameMenu.classList.remove('active'); }
function goToMainMenu() { playSound('click'); gameState = 'MENU'; mainMenu.classList.add('active'); ingameMenu.classList.remove('active'); levelsMenu.classList.remove('active'); settingsMenu.classList.remove('active'); winScreen.classList.remove('active'); gameUI.classList.remove('visible'); }
function restartLevel() { playSound('click'); resetLevel(true); resumeGame(); }
function startGame() { playSound('click'); loadLevel(currentLevelIndex); gameState = 'PLAYING'; mainMenu.classList.remove('active'); gameUI.classList.add('visible'); winScreen.classList.remove('active'); }

function openSettings() { playSound('click'); document.getElementById('soundToggle').checked = soundEnabled; settingsMenu.classList.add('active'); if (gameState === 'MENU') mainMenu.classList.remove('active'); if (gameState === 'PAUSED') ingameMenu.classList.remove('active'); }
function closeSettings() { playSound('click'); settingsMenu.classList.remove('active'); if (gameState === 'MENU') mainMenu.classList.add('active'); else if (gameState === 'PAUSED') ingameMenu.classList.add('active'); }
function selectLevel(index) { if (index >= unlockedLevels) return; playSound('click'); currentLevelIndex = index; levelsMenu.classList.remove('active'); startGame(); }
function toggleSound(enabled) { soundEnabled = enabled; playSound('click'); }
function toggleCollision() { playSound('click'); cloneCollisionEnabled = !cloneCollisionEnabled; collisionTextUI.innerText = `COLLISION: ${cloneCollisionEnabled ? 'ON' : 'OFF'} [C]`; collisionTextUI.style.color = cloneCollisionEnabled ? '#fff' : '#888'; }

// --- EFEKTLER ---
function initVisuals() {
    atmosphericDust = []; lightRays = [];
    for (let i = 0; i < 60; i++) atmosphericDust.push(new DustParticle());
    for (let i = 0; i < 6; i++) lightRays.push(new LightRay());
}
class DustParticle {
    constructor() { this.reset(); this.x = Math.random() * 800; }
    reset() { this.x = Math.random() * 800; this.y = Math.random() * 450; this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3; this.size = Math.random() * 2 + 0.5; this.alpha = Math.random() * 0.3 + 0.1; }
    update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 450) this.reset(); }
    draw(ctx) { ctx.fillStyle = COLORS.dust; ctx.globalAlpha = this.alpha; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1; }
}
class LightRay {
    constructor() { this.x = Math.random() * 800; this.width = Math.random() * 60 + 40; this.angle = 0.3; this.speed = Math.random() * 0.1 + 0.05; this.alpha = Math.random() * 0.08 + 0.03; }
    update() { this.x += this.speed; if (this.x > 900) this.x = -100; }
    draw(ctx) {
        ctx.save(); let grad = ctx.createLinearGradient(this.x, 0, this.x + Math.tan(this.angle) * 450, 450);
        grad.addColorStop(0, `rgba(255,255,255,${this.alpha})`); grad.addColorStop(0.5, `rgba(255,255,255,${this.alpha * 0.5})`); grad.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.beginPath(); ctx.moveTo(this.x, -50); ctx.lineTo(this.x + this.width, -50); ctx.lineTo(this.x + this.width + 150, 500); ctx.lineTo(this.x + 150, 500); ctx.closePath();
        ctx.fillStyle = grad; ctx.fill(); ctx.restore();
    }
}
function drawBackgroundEffects() {
    ctx.fillStyle = COLORS.bg || '#111';
    ctx.fillRect(0, 0, 800, 450);
    lightRays.forEach(r => { r.update(); r.draw(ctx); });
    atmosphericDust.forEach(d => { d.update(); d.draw(ctx); });
}

// POST PROCESSING (Vignette + Scanlines)
function drawPostProcess() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; // Hafif Scanlines
    for (let i = 0; i < 450; i += 4) { ctx.fillRect(0, i, 800, 2); }

    let grad = ctx.createRadialGradient(400, 225, 300, 400, 225, 500);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.6)"); // Köşe karartma
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);
    ctx.restore();
}

function loadLevel(index) {
    const allLevels = window.LEVELS || [];
    if (index >= allLevels.length) {
        document.getElementById('winTitle').innerText = "GAME OVER"; document.getElementById('winMessage').innerText = "All Paradoxes Solved!";
        winButtons.style.display = 'block'; winScreen.classList.add('active'); return;
    }
    const ld = allLevels[index];
    setTheme(ld.theme || 'noir'); // Set theme based on level data
    platforms = []; doors = []; buttons = []; clones = []; particles = []; movingPlatforms = []; levers = []; portals = []; texts = [];
    frameCount = 0; gameOver = false;

    ld.platforms.forEach(p => platforms.push(new GameObject(p.x, p.y, p.w, p.h, COLORS.solid)));
    ld.doors.forEach(d => doors.push(new Door(d.x, d.y, d.h, d.id, d.req, d.sequence)));
    ld.buttons.forEach(b => buttons.push(new Button(b.x, b.y, b.target, b.isCeiling, b.id)));
    if (ld.movingPlatforms) ld.movingPlatforms.forEach(mp => movingPlatforms.push(new MovingPlatform(mp.x, mp.y, mp.w, mp.h, mp.endX, mp.endY, mp.triggerId)));
    if (ld.levers) ld.levers.forEach(l => levers.push(new Lever(l.x, l.y, l.triggerId)));
    if (ld.portals) ld.portals.forEach(p => portals.push(new Portal(p.x, p.y, p.w, p.h, p.targetId, p.id)));
    if (ld.texts) ld.texts.forEach(t => texts.push(new TextObject(t.x, t.y, t.text, t.size, t.color)));

    if (ld.texts) ld.texts.forEach(t => texts.push(new TextObject(t.x, t.y, t.text, t.size, t.color)));

    goal = ld.goal ? new Goal(ld.goal.x, ld.goal.y, ld.goal.triggerId, ld.goal.sequence) : null;
    player = new Player(ld.start.x, ld.start.y);

    levelTextUI.innerText = `LEVEL ${index + 1}`; cloneTextUI.innerText = `CLONES: ${clones.length}`;
    levelIndicator.innerText = `LEVEL ${index + 1}`; levelIndicator.style.opacity = 1; setTimeout(() => { levelIndicator.style.opacity = 0; }, 2000);
    for (let i = 0; i < 10; i++) particles.push(new Particle(ld.start.x, ld.start.y, '#fff'));
}

function createCloneAndReset() {
    if (gameOver || gameState !== 'PLAYING') return;
    const ld = window.LEVELS[currentLevelIndex];
    if (player.history.length > 0) {
        playSound('rewind');
        clones.push(new Player(ld.start.x, ld.start.y, true, [...player.history]));
        cloneTextUI.innerText = `CLONES: ${clones.length}`;
    }
    player = new Player(ld.start.x, ld.start.y);
    frameCount = 0; clones.forEach(c => c.isExpired = false);
    for (let i = 0; i < 10; i++) particles.push(new Particle(ld.start.x, ld.start.y, '#aaa'));
}
function resetLevel(full) {
    if (full) { playSound('click'); loadLevel(currentLevelIndex); }
    else { const ld = window.LEVELS[currentLevelIndex]; player = new Player(ld.start.x, ld.start.y); frameCount = 0; clones.forEach(c => c.isExpired = false); }
}
function checkRectCollision(r1, r2) { return (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y); }

function update() {
    if (gameState !== 'PLAYING' || gameOver) return;
    particles.forEach((p, i) => { p.update(); if (p.life <= 0) particles.splice(i, 1); });
    const input = { left: keys['ArrowLeft'] || keys['KeyA'], right: keys['ArrowRight'] || keys['KeyD'], jump: keys['ArrowUp'] || keys['KeyW'] || keys['Space'] };

    const entities = [player, ...clones];
    buttons.forEach(b => b.update(entities));
    doors.forEach(d => d.update(buttons));
    levers.forEach(l => l.update(entities));
    movingPlatforms.forEach(mp => mp.update(buttons, levers));
    portals.forEach(p => p.update());

    clones.forEach(c => c.update(null, platforms, doors, movingPlatforms, portals, frameCount));
    player.update(input, platforms, doors, movingPlatforms, portals, frameCount);
    frameCount++;
}

function draw() {
    drawBackgroundEffects();
    if (gameState === 'MENU') return;

    platforms.forEach(p => p.draw(ctx));
    movingPlatforms.forEach(mp => mp.draw(ctx));
    portals.forEach(p => p.draw(ctx));
    buttons.forEach(b => b.draw(ctx));
    levers.forEach(l => l.draw(ctx));
    doors.forEach(d => d.draw(ctx));
    doors.forEach(d => d.draw(ctx));
    if (goal) goal.update(buttons, levers); // Update goal state
    if (goal) goal.draw(ctx);
    clones.forEach(c => c.draw(ctx));
    if (player) player.draw(ctx);
    clones.forEach(c => c.draw(ctx));
    if (player) player.draw(ctx);
    particles.forEach(p => p.draw(ctx));
    texts.forEach(t => t.draw(ctx));

    drawPostProcess(); // Vignette ve Scanlines
}
function loop() { update(); draw(); requestAnimationFrame(loop); }

window.addEventListener('keydown', (e) => {
    if (gameState === 'PLAYING') {
        keys[e.key] = true; keys[e.code] = true;
        if (e.key.toLowerCase() === 'r') createCloneAndReset();
        if (e.key === 'Escape') toggleIngameMenu();
        if (e.key.toLowerCase() === 'c') toggleCollision();
    }
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; keys[e.code] = false; });

// --- CLASSES ---

class GameObject {
    constructor(x, y, w, h, c) { this.x = x; this.y = y; this.width = w; this.height = h; this.color = c; }
    draw(ctx) {
        ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height);

        if (COLORS.useBorders) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        ctx.fillStyle = COLORS.player === '#000000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(this.x, this.y, this.width, 2);
    }
}

class TextObject {
    constructor(x, y, text, size = 20, color = '#fff') { this.x = x; this.y = y; this.text = text; this.size = size; this.color = color; }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px monospace`;
        ctx.shadowBlur = 4; ctx.shadowColor = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Portal extends GameObject {
    constructor(x, y, w, h, targetId, id) {
        super(x, y, w, h, COLORS.portal);
        this.id = id; this.targetId = targetId; this.pulse = 0;
    }
    update() { this.pulse += 0.1; }
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 25 + Math.sin(this.pulse) * 10; ctx.shadowColor = COLORS.portal;
        ctx.fillStyle = '#000'; ctx.fillRect(this.x, this.y, this.width, this.height);
        if (COLORS.useBorders) {
            ctx.strokeStyle = COLORS.portal; ctx.lineWidth = 3; ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        ctx.beginPath(); ctx.arc(this.x + this.width / 2, this.y + this.height / 2, (this.width / 3) * Math.abs(Math.sin(this.pulse * 0.5)), 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.portal; ctx.lineWidth = 2; // Keep inner circle stroke for effect? Or remove? User said "remove borders". 
        // Let's keep the inner arc as it is an effect, but remove the rect border.
        ctx.stroke(); ctx.restore();
    }
}

class Lever extends GameObject {
    constructor(x, y, triggerId) {
        super(x, y, 40, 10, COLORS.leverBase);
        this.triggerId = triggerId; this.isActive = false; this.stickAngle = -0.5;
    }
    update(entities) {
        entities.forEach(e => {
            if (!e.isExpired && checkRectCollision(this, e)) {
                let center = this.x + this.width / 2; let pCenter = e.x + e.width / 2;
                if (pCenter > center && !this.isActive) { this.isActive = true; playSound('lever'); }
                else if (pCenter < center && this.isActive) { this.isActive = false; playSound('lever'); }
            }
        });
        let targetAngle = this.isActive ? 0.5 : -0.5;
        this.stickAngle += (targetAngle - this.stickAngle) * 0.2;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x + this.width / 2, this.y + 5); ctx.rotate(this.stickAngle);
        ctx.fillStyle = COLORS.leverStick; ctx.fillRect(-3, -35, 6, 40);
        ctx.beginPath(); ctx.arc(0, -35, 6, 0, Math.PI * 2); ctx.fillStyle = this.isActive ? COLORS.rimLight : '#888';
        if (this.isActive) { ctx.shadowBlur = 15; ctx.shadowColor = COLORS.rimLight; }
        ctx.fill(); ctx.restore();
        ctx.fillStyle = COLORS.leverBase; ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = COLORS.player === '#000000' ? '#ddd' : '#000'; ctx.fillRect(this.x + 5, this.y + 2, this.width - 10, 6);
    }
}

class MovingPlatform extends GameObject {
    constructor(x, y, w, h, endX, endY, triggerId) {
        super(x, y, w, h, COLORS.movingPlat);
        this.startX = x; this.startY = y; this.endX = endX; this.endY = endY; this.triggerId = triggerId; this.vx = 0; this.vy = 0;
    }
    update(btns, levers) {
        let active = false;
        btns.forEach(b => { if (b.targetDoorId === this.triggerId && b.isPressed) active = true; });
        if (levers) { levers.forEach(l => { if (l.triggerId === this.triggerId && l.isActive) active = true; }); }
        let tx = active ? this.endX : this.startX; let ty = active ? this.endY : this.startY;
        let dx = tx - this.x; let dy = ty - this.y;
        let speed = 2.0;
        if (Math.abs(dx) > speed) this.vx = Math.sign(dx) * speed; else this.vx = dx;
        if (Math.abs(dy) > speed) this.vy = Math.sign(dy) * speed; else this.vy = dy;
        this.x += this.vx; this.y += this.vy;
    }
    draw(ctx) {
        ctx.fillStyle = COLORS.movingPlat; ctx.fillRect(this.x, this.y, this.width, this.height);
        if (COLORS.useBorders) {
            ctx.fillStyle = '#333'; for (let i = 0; i < this.width; i += 20) { ctx.fillRect(this.x + i, this.y, 5, this.height); }
            ctx.fillStyle = '#555'; ctx.fillRect(this.x, this.y, this.width, 2); ctx.fillRect(this.x, this.y + this.height - 2, this.width, 2);
        } else {
            // Flat for white theme
        }
    }
}
class Goal extends GameObject {
    constructor(x, y, triggerId, seq = null) {
        super(x, y, 40, 60, COLORS.portal);
        this.triggerId = triggerId;
        this.sequence = seq;
        this.isActive = !triggerId;
    }
    update(buttons, levers) {
        if (!this.triggerId) return;

        if (this.sequence) {
            let activeBtns = buttons.filter(b => b.targetDoorId === this.triggerId && b.isPressed);
            activeBtns.sort((a, b) => a.pressTime - b.pressTime);

            if (activeBtns.length === this.sequence.length) {
                let match = true;
                for (let i = 0; i < this.sequence.length; i++) {
                    if (activeBtns[i].id !== this.sequence[i]) { match = false; break; }
                }
                this.isActive = match;
            } else {
                this.isActive = false;
            }
        } else {
            let active = false;
            buttons.forEach(b => { if (b.targetDoorId === this.triggerId && b.isPressed) active = true; });
            // Levers... for now strict button logic for goal as requested
            this.isActive = active;
        }
    }
    draw(ctx) {
        if (!this.isActive) return;
        ctx.save();
        ctx.shadowBlur = 30; ctx.shadowColor = COLORS.portal;
        ctx.fillStyle = COLORS.portal;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Removed outline logic
        ctx.restore();
    }
}

class Button extends GameObject {
    constructor(x, y, t, isCeiling = false, id = 0) {
        super(x, y - 10, 40, 10, COLORS.button);
        this.oy = y - 10; this.py = y - 4; this.targetDoorId = t; this.isPressed = false; this.isCeiling = isCeiling; this.id = id;
        this.pressTime = 0;
        if (this.isCeiling) { this.y = y; this.oy = y; this.py = y + 6; }
    }
    update(ents) {
        let p = false;
        ents.forEach(e => {
            if (!e.isExpired) {
                if (this.isCeiling) {
                    let triggerBox = { x: this.x, y: this.y, width: this.width, height: this.height + 25 };
                    if (checkRectCollision(triggerBox, e)) p = true;
                }
                else {
                    if (e.x < this.x + this.width && e.x + e.width > this.x && e.y + e.height >= this.y && e.y < this.y + this.height + 5) p = true;
                }
            }
        });
        if (p && !this.isPressed) { playSound('button'); this.pressTime = Date.now(); }
        this.isPressed = p;
        if (this.isCeiling) { this.height = this.isPressed ? 4 : 10; }
        else { this.y = p ? this.py : this.oy; this.height = p ? 4 : 10; }
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.isPressed ? '#ddd' : COLORS.button;
        if (this.isPressed) { ctx.shadowBlur = 10; ctx.shadowColor = COLORS.buttonActive; }

        if (this.isCeiling) {
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = COLORS.rimLight; ctx.fillRect(this.x, this.y + this.height - 1, this.width, 1);
            ctx.fillStyle = COLORS.movingPlat; ctx.fillRect(this.x - 5, this.oy - 5, this.width + 10, 5);
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = COLORS.rimLight; ctx.fillRect(this.x, this.y, this.width, 1);

            if (COLORS.useBorders) {
                // Noir Style: Thick base
                ctx.fillStyle = '#222'; ctx.fillRect(this.x - 5, this.oy + 10, this.width + 10, 5);
            } else {
                // White Style: Thinner, grounded base
                ctx.fillStyle = '#444'; ctx.fillRect(this.x - 2, this.oy + 10, this.width + 4, 5);
            }
        }
        ctx.restore();
    }
}

class Door extends GameObject {
    constructor(x, y, h, id, req = 1, seq = null) { super(x, y, 20, h, COLORS.door); this.id = id; this.oh = 0; this.th = h; this.required = req; this.sequence = seq; }
    update(btns) {
        let shouldOpen = false;

        if (this.sequence) {
            // Logic: Get active buttons for this door, sort by pressTime, check IDs against sequence.
            let activeBtns = btns.filter(b => b.targetDoorId === this.id && b.isPressed);
            activeBtns.sort((a, b) => a.pressTime - b.pressTime);

            // If active count != sequence length, sequence is not complete.
            if (activeBtns.length === this.sequence.length) {
                let match = true;
                for (let i = 0; i < this.sequence.length; i++) {
                    if (activeBtns[i].id !== this.sequence[i]) { match = false; break; }
                }
                shouldOpen = match;
            }
        } else {
            let activeCount = 0;
            btns.forEach(b => { if (b.targetDoorId === this.id && b.isPressed) activeCount++; });
            shouldOpen = (activeCount >= this.required);
        }

        if (shouldOpen && this.oh < this.th) this.oh += 2; else if (!shouldOpen && this.oh > 0) this.oh -= 8;
    }
    getCurrentHeight() { return this.th - this.oh; }
    draw(ctx) {
        let h = this.getCurrentHeight(); if (h <= 0) return;
        ctx.fillStyle = (COLORS.useBorders) ? '#000' : COLORS.door;
        ctx.fillRect(this.x, this.y, this.width, h);

        if (COLORS.useBorders) {
            ctx.fillStyle = '#444'; ctx.fillRect(this.x, this.y, 2, h); ctx.fillRect(this.x + this.width - 2, this.y, 2, h);
            ctx.fillStyle = '#222'; for (let i = 10; i < h; i += 20) ctx.fillRect(this.x + 2, this.y + i, this.width - 4, 2);
        }
    }
}

class Particle {
    constructor(x, y, color) { this.x = x; this.y = y; this.vx = (Math.random() - 0.5) * 2; this.vy = (Math.random() - 0.5) * 2; this.life = 1; this.size = Math.random() * 3 + 1; this.color = color; }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.03; }
    draw(ctx) { ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1; }
}

class Player {
    constructor(x, y, isC = false, rec = []) {
        this.x = x; this.y = y; this.width = 20; this.height = 35;
        this.vx = 0; this.vy = 0; this.isGrounded = false;
        this.isClone = isC; this.history = rec; this.isExpired = false; this.wjp = false;
        this.portalLock = 0;
        this.animOffset = Math.random() * 1000;
    }

    resolveMapCollision(plats, doors, movingPlats) {
        let obs = [...plats];
        doors.forEach(d => { if (d.getCurrentHeight() > 5) obs.push({ x: d.x, y: d.y, width: d.width, height: d.getCurrentHeight() }); });
        obs.forEach(p => {
            if (checkRectCollision(this, p)) {
                let ox = (this.width + p.width) / 2 - Math.abs((this.x + this.width / 2) - (p.x + p.width / 2));
                let oy = (this.height + p.height) / 2 - Math.abs((this.y + this.height / 2) - (p.y + p.height / 2));
                if (ox < oy) { if (this.x < p.x) this.x = p.x - this.width; else this.x = p.x + p.width; this.vx = 0; }
                else { if (this.y < p.y) { this.y = p.y - this.height; this.vy = 0; this.isGrounded = true; } else { this.y = p.y + p.height; this.vy = 0; } }
            }
        });
        if (movingPlats) {
            movingPlats.forEach(mp => {
                if (checkRectCollision(this, mp)) {
                    let ox = (this.width + mp.width) / 2 - Math.abs((this.x + this.width / 2) - (mp.x + mp.width / 2));
                    let oy = (this.height + mp.height) / 2 - Math.abs((this.y + this.height / 2) - (mp.y + mp.height / 2));
                    if (ox < oy) { if (this.x < mp.x) this.x = mp.x - this.width; else this.x = mp.x + mp.width; this.vx = 0; }
                    else {
                        if (this.y < mp.y) { this.y = mp.y - this.height; this.vy = 0; this.isGrounded = true; this.x += mp.vx; this.y += mp.vy; }
                        else { this.y = mp.y + mp.height; this.vy = 0; }
                    }
                }
            });
        }
    }

    checkPortals(portals) {
        if (!portals) return;
        if (this.portalLock > 0) return;
        portals.forEach(p => {
            if (checkRectCollision(this, p)) {
                let target = portals.find(tp => tp.id === p.targetId);
                if (target) {
                    playSound('portal');
                    this.x = target.x + (target.width - this.width) / 2;
                    this.y = target.y + target.height + 2;
                    this.vy = 1;
                    this.vx = 0;
                    this.portalLock = 20;
                }
            }
        });
    }

    update(inp, plats, doors, movingPlats, portals, frame) {
        if (this.isClone) {
            if (frame === 0) this.isExpired = false; if (this.isExpired) return;
            if (frame < this.history.length) {
                let st = this.history[frame]; let tr = { x: st.x, y: st.y, width: 20, height: 35 }; let blocked = false;
                doors.forEach(d => { if (d.getCurrentHeight() > 5 && checkRectCollision(tr, { x: d.x, y: d.y, width: d.width, height: d.getCurrentHeight() })) blocked = true; });
                if (!blocked) { this.x = st.x; this.y = st.y; this.vx = st.vx || 0; }
                if (frame > 0) { let prev = this.history[frame - 1]; this.vx = this.x - prev.x; }
            } else { if (!this.isExpired) { this.isExpired = true; for (let i = 0; i < 8; i++) particles.push(new Particle(this.x, this.y, '#888')); } }
            return;
        }

        if (this.portalLock > 0) {
            this.portalLock--;
            this.vx = 0;
        } else {
            if (inp.left) this.vx -= ACCEL; else if (inp.right) this.vx += ACCEL; else this.vx *= FRICTION;
            if (this.vx > SPEED) this.vx = SPEED; if (this.vx < -SPEED) this.vx = -SPEED;
        }

        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        if (inp.jump && !this.wjp && this.isGrounded) { this.vy = -JUMP_FORCE; this.isGrounded = false; playSound('jump'); for (let i = 0; i < 5; i++) particles.push(new Particle(this.x, this.y + 35, '#fff')); }
        this.wjp = inp.jump;
        this.x += this.vx; this.y += this.vy; this.isGrounded = false;

        this.checkPortals(portals);
        this.resolveMapCollision(plats, doors, movingPlats);

        if (cloneCollisionEnabled) {
            clones.forEach(c => {
                if (!c.isExpired && checkRectCollision(this, c)) {
                    let dx = (this.x + this.width / 2) - (c.x + c.width / 2);
                    let dy = (this.y + this.height / 2) - (c.y + c.height / 2);
                    if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) this.x = c.x + c.width; else this.x = c.x - this.width; this.vx = 0; }
                    else { if (dy > 0) this.y = c.y + c.height; else { this.y = c.y - this.height; this.vy = 0; this.isGrounded = true; } }
                }
            });
        }
        this.resolveMapCollision(plats, doors, movingPlats);

        if (this.x < 0) this.x = 0; if (this.x > 800 - this.width) this.x = 800 - this.width;
        if (this.x < 0) this.x = 0; if (this.x > 800 - this.width) this.x = 800 - this.width;
        if (goal && goal.isActive && checkRectCollision(this, goal)) {
            gameOver = true; playSound('win');
            if (currentLevelIndex + 1 >= unlockedLevels) unlockedLevels = currentLevelIndex + 2;
            const allLevels = window.LEVELS || [];
            if (currentLevelIndex + 1 >= allLevels.length) { document.getElementById('winTitle').innerText = "GAME OVER"; document.getElementById('winMessage').innerText = "All Paradoxes Solved!"; winButtons.style.display = 'block'; }
            else {
                // Check if this is the end of Black Theme (Level 10 / Index 9)
                if (currentLevelIndex === 9) {
                    // Custom Comic Ending
                    ComicEnding.start(() => {
                        currentLevelIndex++;
                        loadLevel(currentLevelIndex);
                    });
                    // Do NOT show the standard win screen
                    return;
                }

                document.getElementById('winTitle').innerText = "LEVEL COMPLETED";
                document.getElementById('winMessage').innerText = "Next Paradox...";
                winButtons.style.display = 'none';
                setTimeout(() => {
                    winScreen.classList.remove('active');
                    currentLevelIndex++;
                    loadLevel(currentLevelIndex);
                }, 2000);
            }
            winScreen.classList.add('active');
        }
        if (this.y > 800) resetLevel(true);
        this.history.push({ x: this.x, y: this.y });
    }

    draw(ctx) {
        if (this.isClone && this.isExpired) return;
        ctx.save();

        let breatheOffset = 0;
        if (Math.abs(this.vx) < 0.1 && this.isGrounded) {
            breatheOffset = Math.sin((Date.now() + this.animOffset) / 200) * 1.5;
        }

        let lookDir = 0;
        if (this.vx > 0.1) lookDir = 1;
        else if (this.vx < -0.1) lookDir = -1;

        let drawY = this.y + breatheOffset;
        let drawHeight = this.height - breatheOffset;

        if (this.isClone) {
            ctx.fillStyle = COLORS.clone;
            ctx.fillRect(this.x, drawY, this.width, drawHeight);
            if (cloneCollisionEnabled) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(this.x, drawY, this.width, drawHeight); }
        } else {
            ctx.shadowBlur = 20; ctx.shadowColor = COLORS.player === '#000000' ? '#000' : '#fff';
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(this.x, drawY, this.width, drawHeight);
            ctx.shadowBlur = 0;

            // White outline for black player for visibility if needed? No usage asked, but good practice.
            // User requested white eyes for black player.
        }

        ctx.fillStyle = COLORS.player === '#000000' ? '#fff' : '#000'; // White eyes for black player, Black for white
        let eyeY = drawY + 8;
        let leftEyeX, rightEyeX;

        if (lookDir === 1) { leftEyeX = this.x + 8; rightEyeX = this.x + 15; }
        else if (lookDir === -1) { leftEyeX = this.x + 2; rightEyeX = this.x + 9; }
        else { leftEyeX = this.x + 5; rightEyeX = this.x + 12; }

        ctx.fillRect(leftEyeX, eyeY, 2, 5);
        ctx.fillRect(rightEyeX, eyeY, 2, 5);

        ctx.restore();
    }
}