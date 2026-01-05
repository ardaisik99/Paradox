document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initLevelButtons();
    setTimeout(() => { document.getElementById('loadingScreen').style.display = 'none'; }, 1000);
    if (!window.LEVELS || window.LEVELS.length === 0) console.error("Levels not loaded!");

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    gameState = 'MENU';
    initVisuals();
    initYandex(); // Yandex SDK
    bindTouchEvents(); // Mobile Controls
    updateTexts();
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
    portal: '#00ffff',
    leverKnobInactive: '#888888'
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
        COLORS.door = '#d0d0d0'; // Light Grey Door for White Theme (Logic update)
        COLORS.button = '#666666';
        COLORS.movingPlat = '#bbbbbb'; // Lighter platform
        COLORS.leverBase = '#ffffff';
        COLORS.portal = '#000000';
        COLORS.leverKnobInactive = '#333333';
    } else {
        COLORS.dust = '#ffffff';
        COLORS.door = '#222222';
        COLORS.button = '#aaaaaa';
        COLORS.dust = '#ffffff';
        COLORS.door = '#222222';
        COLORS.button = '#aaaaaa';
        COLORS.movingPlat = '#666666'; // FIX: Visible against #333 BG
        COLORS.leverBase = '#222222';
        COLORS.portal = '#ffffff'; // White portal for Noir theme
        COLORS.leverKnobInactive = '#888888';
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shadowCanvas = document.createElement('canvas');
const shadowCtx = shadowCanvas.getContext('2d');


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
    shadowCanvas.width = canvas.width;
    shadowCanvas.height = canvas.height;


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
let unlockedLevels = parseInt(localStorage.getItem('paradoks_unlocked')) || 1;
let frameCount = 0;
let gameOver = false;
let keys = {};
let cloneCollisionEnabled = false;
let soundEnabled = true;
let darknessLevel = false;
let invertedMap = false;

let player, clones = [], platforms = [], buttons = [], doors = [], particles = [], goal = null;
let movingPlatforms = [], levers = [], portals = [], texts = [], lasers = [];
let atmosphericDust = []; let lightRays = [];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// --- NAMESPACE & CONCEPTS ---
let levelSequence = 0; // Global sequence counter for puzzle levels
let ysdk = null; // Yandex SDK Instance

function initYandex() {
    if (typeof YaGames === 'undefined') return;
    YaGames.init().then(ysdk_instance => {
        ysdk = ysdk_instance;
        // Language
        let lang = ysdk.environment.i18n.lang;
        if (LANGS[lang]) {
            currentLang = lang;
            updateTexts();
        }

        // Mobile Check
        if (ysdk.deviceInfo.isMobile()) {
            document.getElementById('mobileControls').style.display = 'block';
        }

        // Notify Ready
        ysdk.features.LoadingAPI.ready();
    }).catch(err => console.error('YSDK Init Error:', err));
}

function bindTouchEvents() {
    const bindBtn = (id, k) => {
        const b = document.getElementById(id);
        if (!b) return;
        b.addEventListener('touchstart', (e) => { e.preventDefault(); keys[k] = true; });
        b.addEventListener('touchend', (e) => { e.preventDefault(); keys[k] = false; });
        b.addEventListener('mousedown', (e) => { keys[k] = true; });
        b.addEventListener('mouseup', (e) => { keys[k] = false; });
    };

    bindBtn('btnLeft', 'ArrowLeft');
    bindBtn('btnRight', 'ArrowRight');
    bindBtn('btnJump', 'ArrowUp');
    bindBtn('btnClone', 'r');
    bindBtn('btnRewindMobile', 'r');

    const menuBtn = document.getElementById('btnMenuMobile');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            if (gameState === 'PLAYING') {
                gameState = 'PAUSED';
                ingameMenu.classList.add('active');
            }
            else if (gameState === 'PAUSED') {
                gameState = 'PLAYING';
                ingameMenu.classList.remove('active');
            }
        });
    }
}

// Handle Visibility (Mute Audio)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            ingameMenu.classList.add('active');
        }
        if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    } else {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }
});


const LANGS = {
    en: {
        play: "PLAY", levels: "LEVELS", settings: "SETTINGS",
        resume: "RESUME", restart: "RESTART", mainMenu: "MAIN MENU",
        paused: "PAUSED",
        sound: "SOUND", close: "CLOSE",
        selectOne: "SELECT CONCEPT", back: "BACK",
        level: "LEVEL", clones: "CLONES",
        collisionOn: "COLLISION: ON [C]", collisionOff: "COLLISION: OFF [C]",
        rewind: "[R] REWIND", menu: "[ESC] MENU",
        gameOver: "GAME OVER", completed: "COMPLETED",
        msgOver: "All Paradoxes Solved!", msgWin: "Timeline restored.",
        nextLevel: "Next Paradox...",
        limit: "CLONE LIMIT REACHED!",
        concepts: {
            noir: { name: "NOIR", desc: "The Beginning" },
            white: { name: "BLANC", desc: "Inversion" }
        }
    },
    ru: {
        play: "ИГРАТЬ", levels: "УРОВНИ", settings: "НАСТРОЙКИ",
        resume: "ПРОДОЛЖИТЬ", restart: "РЕСТАРТ", mainMenu: "ГЛАВНОЕ МЕНЮ",
        paused: "ПАУЗА",
        sound: "ЗВУК", close: "ЗАКРЫТЬ",
        selectOne: "ВЫБЕРИТЕ КОНЦЕПТ", back: "НАЗАД",
        level: "УРОВЕНЬ", clones: "КЛОНЫ",
        collisionOn: "КОЛЛИЗИЯ: ВКЛ [C]", collisionOff: "КОЛЛИЗИЯ: ВЫКЛ [C]",
        rewind: "[R] ПЕРЕМОТКА", menu: "[ESC] МЕНЮ",
        gameOver: "ИГРА ОКОНЧЕНА", completed: "ЗАВЕРШЕНО",
        msgOver: "Все парадоксы решены!", msgWin: "Временная линия восстановлена.",
        nextLevel: "Следующий парадокс...",
        limit: "ПРЕДЕЛ КЛОНОВ!",
        concepts: {
            noir: { name: "НУАР", desc: "Начало" },
            white: { name: "БЛАНК", desc: "Инверсия" }
        }
    },
    tr: {
        play: "OYNA", levels: "BÖLÜMLER", settings: "AYARLAR",
        resume: "DEVAM ET", restart: "YENİDEN BAŞLA", mainMenu: "ANA MENÜ",
        paused: "DURAKLATILDI",
        sound: "SES", close: "KAPAT",
        selectOne: "KONSEPT SEÇ", back: "GERİ",
        level: "BÖLÜM", clones: "KLONLAR",
        collisionOn: "ÇARPIŞMA: AÇIK [C]", collisionOff: "ÇARPIŞMA: KAPALI [C]",
        rewind: "[R] GERİ SAR", menu: "[ESC] MENÜ",
        gameOver: "OYUN BİTTİ", completed: "TAMAMLANDI",
        msgOver: "Tüm Paradokslar Çözüldü!", msgWin: "Zaman çizgisi onarıldı.",
        nextLevel: "Sıradaki Paradoks...",
        limit: "KLON LİMİTİ DOLDU!",
        concepts: {
            noir: { name: "NOIR", desc: "Başlangıç" },
            white: { name: "BEYAZ", desc: "Tersine" }
        }
    }
};

let currentLang = 'en';

function toggleLanguage() {
    if (currentLang === 'en') currentLang = 'ru';
    else if (currentLang === 'ru') currentLang = 'tr';
    else currentLang = 'en';
    updateTexts();
}

function updateTexts() {
    const t = LANGS[currentLang];

    // Main Menu
    document.getElementById('btnPlayMain').innerText = t.play;
    document.getElementById('btnLevelsMain').innerText = t.levels;
    document.getElementById('btnSettingsMain').innerText = t.settings;

    // Ingame Menu
    document.querySelector('#ingameMenu .menu-title').innerText = t.paused;
    document.getElementById('btnResume').innerText = t.resume;
    document.getElementById('btnRestart').innerText = t.restart;
    document.getElementById('btnSettingsPause').innerText = t.settings;
    document.getElementById('btnExit').innerText = t.mainMenu;

    // Levels Menu
    document.querySelector('#conceptSelectView h2').innerText = t.selectOne;
    document.getElementById('btnBackToMain').innerText = t.mainMenu;
    document.getElementById('btnBackToConcepts').innerText = t.back;
    document.getElementById('selectedConceptTitle').innerText = t.concepts['noir'].name; // Gets overwritten by selection anyway

    // Settings
    document.querySelector('#settingsMenu .menu-title').innerText = t.settings;
    document.querySelector('#settingsMenu .setting-row span').innerText = t.sound;
    document.getElementById('btnCloseSettings').innerText = t.close;

    // Win Screen
    document.getElementById('winTitle').innerText = t.completed;
    document.getElementById('winMessage').innerText = t.msgWin;
    // Win Buttons if any

    // Game UI
    // Note: Some UI is updated in loop/loadLevel. We update static parts here or flags.
    // Static help text:
    const helpDiv = document.querySelector('#gameUI div');
    if (helpDiv) {
        helpDiv.children[0].innerText = t.rewind;
        helpDiv.children[1].innerText = t.menu;
    }

    document.getElementById('collisionText').innerText = cloneCollisionEnabled ? t.collisionOn : t.collisionOff;

    renderConcepts(); // Re-render concepts with new language
}

const CONCEPTS = [
    { id: 'noir', name: 'NOIR', desc: 'The Beginning', start: 0, count: 10, cssClass: 'card-black' },
    { id: 'white', name: 'BLANC', desc: 'Inversion', start: 10, count: 10, cssClass: 'card-white' }
];

function bindEvents() {
    document.getElementById('btnPlayMain').addEventListener('click', startGame);
    document.getElementById('btnLevelsMain').addEventListener('click', openLevels); // Calls new openLevels
    document.getElementById('btnSettingsMain').addEventListener('click', openSettings);
    document.getElementById('btnLanguage').addEventListener('click', () => { playSound('click'); toggleLanguage(); });
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
        title.innerText = LANGS[currentLang].concepts[c.id].name;

        const desc = document.createElement('div');
        desc.className = 'concept-desc';
        desc.innerText = LANGS[currentLang].concepts[c.id].desc;

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
function goToMainMenu() {
    playSound('click');
    gameState = 'MENU';
    setTheme('noir');
    // WIPE LEVEL DATA
    platforms = []; doors = []; buttons = []; clones = []; movingPlatforms = []; levers = []; portals = []; texts = []; lasers = [];
    player = null; goal = null;

    mainMenu.classList.add('active');
    ingameMenu.classList.remove('active');
    levelsMenu.classList.remove('active');
    settingsMenu.classList.remove('active');
    winScreen.classList.remove('active');
    gameUI.classList.remove('visible');
    initVisuals(); // Reset rays and dust
}
function restartLevel() { playSound('click'); resetLevel(true); resumeGame(); }
function startGame() { playSound('click'); loadLevel(currentLevelIndex); gameState = 'PLAYING'; mainMenu.classList.remove('active'); gameUI.classList.add('visible'); winScreen.classList.remove('active'); }

function openSettings() { playSound('click'); document.getElementById('soundToggle').checked = soundEnabled; settingsMenu.classList.add('active'); if (gameState === 'MENU') mainMenu.classList.remove('active'); if (gameState === 'PAUSED') ingameMenu.classList.remove('active'); }
function closeSettings() { playSound('click'); settingsMenu.classList.remove('active'); if (gameState === 'MENU') mainMenu.classList.add('active'); else if (gameState === 'PAUSED') ingameMenu.classList.add('active'); }
function selectLevel(index) { if (index >= unlockedLevels) return; playSound('click'); currentLevelIndex = index; levelsMenu.classList.remove('active'); startGame(); }
function toggleSound(enabled) { soundEnabled = enabled; playSound('click'); }
function toggleCollision() { playSound('click'); cloneCollisionEnabled = !cloneCollisionEnabled; collisionTextUI.innerText = cloneCollisionEnabled ? LANGS[currentLang].collisionOn : LANGS[currentLang].collisionOff; collisionTextUI.style.color = cloneCollisionEnabled ? '#fff' : '#888'; }

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
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to clear FULL screen
    ctx.fillStyle = COLORS.bg || '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

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

function drawDarkness() {
    if (!darknessLevel) return;

    // 1. Clear and Fill Shadow Canvas with Darkness
    shadowCtx.globalCompositeOperation = 'source-over';
    shadowCtx.fillStyle = '#000000'; // Pitch black
    shadowCtx.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);

    // 2. Punch Holes (Lights)
    shadowCtx.globalCompositeOperation = 'destination-out';

    // Helper to draw light
    const drawLight = (entity) => {
        let x = entity.x + entity.width / 2;
        let y = entity.y + entity.height / 2;

        // Scale coordinates for the shadow canvas (which matches internal resolution)
        // Note: ctx is scaled by scaleFactor, but shadowCtx is raw pixels? 
        // No, we need to match the transform.
        // Easiest way: Apply same scale to shadowCtx.
    };

    shadowCtx.save();
    // Re-apply the same scaling as the main context to match logic
    // We calculated scaleFactor in resizeCanvas, but it's local.
    // However, canvas.width/800 is the scale X.
    let sX = canvas.width / 800;
    let sY = canvas.height / 450;
    shadowCtx.scale(sX, sY);

    const entities = [player, ...clones];
    entities.forEach(e => {
        if (!e.isExpired) {
            let cx = e.x + e.width / 2;
            let cy = e.y + e.height / 2;
            let r = 110; // Increased Light Radius

            let g = shadowCtx.createRadialGradient(cx, cy, 30, cx, cy, r);
            g.addColorStop(0, 'rgba(0,0,0,1)'); // Remove fully at center
            g.addColorStop(0.6, 'rgba(0,0,0,0.8)'); // Soft mid
            g.addColorStop(1, 'rgba(0,0,0,0)'); // Soft edge

            shadowCtx.fillStyle = g;
            shadowCtx.beginPath();
            shadowCtx.arc(cx, cy, r, 0, Math.PI * 2);
            shadowCtx.fill();
        }
    });

    // Also light up the Goal so we know where to go? "ben yolumu böyle bulmaya çalışıcam"
    // User wants to find the way, so maybe NO goal light.
    // But buttons? Let's keep it strictly players for the "Flashlight" feel.

    shadowCtx.restore();

    // 3. Draw Shadow onto Main Canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to draw full screen overlay
    ctx.drawImage(shadowCanvas, 0, 0);
    ctx.restore();
}

function loadLevel(index) {
    const allLevels = window.LEVELS || [];
    if (index >= allLevels.length) {
        document.getElementById('winTitle').innerText = LANGS[currentLang].gameOver; document.getElementById('winMessage').innerText = LANGS[currentLang].msgOver;
        winButtons.style.display = 'block'; winScreen.classList.add('active'); return;
    }
    const ld = allLevels[index];
    setTheme(ld.theme || 'noir');
    platforms = []; doors = []; buttons = []; clones = []; particles = []; movingPlatforms = []; levers = []; portals = []; texts = []; lasers = [];
    frameCount = 0; gameOver = false; levelSequence = 0; darknessLevel = !!ld.darkness; invertedMap = !!ld.inverted;

    if (ld.platforms) ld.platforms.forEach(p => platforms.push(new GameObject(p.x, p.y, p.w, p.h, COLORS.solid)));
    if (ld.doors) ld.doors.forEach(d => doors.push(new Door(d.x, d.y, d.h, d.id, d.req, d.sequence)));
    if (ld.buttons) ld.buttons.forEach(b => buttons.push(new Button(b.x, b.y, b.target, b.isCeiling, b.id, b.isSequencer)));
    if (ld.movingPlatforms) ld.movingPlatforms.forEach(mp => movingPlatforms.push(new MovingPlatform(mp.x, mp.y, mp.w, mp.h, mp.endX, mp.endY, mp.triggerId, mp.weightSensitive, mp.requiredWeight, mp.movementType, mp.sequenceVal, mp.speed)));
    if (ld.levers) ld.levers.forEach(l => levers.push(new Lever(l.x, l.y, l.triggerId)));
    if (ld.portals) ld.portals.forEach(p => portals.push(new Portal(p.x, p.y, p.w, p.h, p.targetId, p.id)));
    if (ld.lasers) ld.lasers.forEach(l => lasers.push(new Laser(l.x, l.y, l.w, l.h, l.direction, l.type)));
    if (ld.texts) ld.texts.forEach(t => texts.push(new TextObject(t.x, t.y, t.text, t.size, t.color)));

    goal = ld.goal ? new Goal(ld.goal.x, ld.goal.y, ld.goal.triggerId, ld.goal.sequence) : null;
    player = new Player(ld.start.x, ld.start.y);

    let maxDisplay = ld.maxClones !== undefined ? ld.maxClones : "∞";
    levelTextUI.innerText = `${LANGS[currentLang].level} ${index + 1}`;
    cloneTextUI.innerText = `${LANGS[currentLang].clones}: ${clones.length} / ${maxDisplay}`;
    levelIndicator.innerText = `${LANGS[currentLang].level} ${index + 1}`; levelIndicator.style.color = '#fff'; levelIndicator.style.opacity = 1; setTimeout(() => { levelIndicator.style.opacity = 0; }, 2000);
    for (let i = 0; i < 10; i++) particles.push(new Particle(ld.start.x, ld.start.y, '#fff'));
}

function createCloneAndReset() {
    if (gameState !== 'PLAYING') return;
    const ld = window.LEVELS[currentLevelIndex];
    if (ld.maxClones !== undefined && clones.length >= ld.maxClones) {
        levelIndicator.innerText = LANGS[currentLang].limit;
        levelIndicator.style.color = '#ff4444';
        levelIndicator.style.opacity = 1;
        setTimeout(() => { levelIndicator.style.opacity = 0; }, 1000);
        return;
    }

    if (player.history.length > 0) {
        playSound('rewind');
        clones.push(new Player(ld.start.x, ld.start.y, true, [...player.history]));
        let maxDisplay = ld.maxClones !== undefined ? ld.maxClones : "∞";
        cloneTextUI.innerText = `CLONES: ${clones.length} / ${maxDisplay}`;
    }
    player = new Player(ld.start.x, ld.start.y);
    frameCount = 0; clones.forEach(c => c.isExpired = false);
    for (let i = 0; i < 10; i++) particles.push(new Particle(ld.start.x, ld.start.y, '#aaa'));

    gameOver = false; // RESURRECT!
}
function resetLevel(full) {
    if (full) { playSound('click'); loadLevel(currentLevelIndex); }
    else { const ld = window.LEVELS[currentLevelIndex]; player = new Player(ld.start.x, ld.start.y); frameCount = 0; clones.forEach(c => c.isExpired = false); gameOver = false; }
}
function checkRectCollision(r1, r2) { return (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y); }

function update() {
    if (gameState !== 'PLAYING') return; // Allow update to process one last frame even if gameOver set? No. gameOver stops 'future' updates.
    if (gameOver) return;

    particles.forEach((p, i) => { p.update(); if (p.life <= 0) particles.splice(i, 1); });
    const input = { left: keys['ArrowLeft'] || keys['KeyA'], right: keys['ArrowRight'] || keys['KeyD'], jump: keys['ArrowUp'] || keys['KeyW'] || keys['Space'] };

    if (invertedMap) {
        let temp = input.left;
        input.left = input.right;
        input.right = temp;
    }

    const entities = [player, ...clones];
    buttons.forEach(b => b.update(entities));
    doors.forEach(d => d.update(buttons));
    levers.forEach(l => l.update(entities));
    if (goal) goal.update(buttons, levers);
    movingPlatforms.forEach(mp => mp.update(buttons, levers, entities));
    portals.forEach(p => p.update());
    portals.forEach(p => p.update());
    lasers.forEach(l => l.update(entities));

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
    lasers.forEach(l => l.draw(ctx));
    doors.forEach(d => d.draw(ctx));

    if (goal) goal.draw(ctx);

    clones.forEach(c => c.draw(ctx));
    if (player) player.draw(ctx);

    particles.forEach(p => p.draw(ctx));
    texts.forEach(t => t.draw(ctx));

    drawDarkness(); // Darkness Overlay
    drawPostProcess(); // Vignette ve Scanlines
}
function loop() { update(); draw(); requestAnimationFrame(loop); }

window.addEventListener('keydown', (e) => {
    if (gameState === 'PLAYING') {
        const key = e.key.toLowerCase();
        keys[e.key] = true; keys[e.code] = true;

        // Allowed keys even during 'gameOver'
        if (key === 'r') createCloneAndReset();

        if (key === 'escape') toggleIngameMenu();
        if (key === 'c') toggleCollision();
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

        // Circular Portal
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, (this.width / 2) * Math.abs(Math.sin(this.pulse * 0.5)), 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.portal;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
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
                if (pCenter > center && !this.isActive) {
                    this.isActive = true;
                    playSound('lever');
                }
                else if (pCenter < center && this.isActive) {
                    this.isActive = false;
                    playSound('lever');
                }
            }
        });
        let targetAngle = this.isActive ? 0.5 : -0.5;
        this.stickAngle += (targetAngle - this.stickAngle) * 0.2;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x + this.width / 2, this.y + 5); ctx.rotate(this.stickAngle);
        ctx.fillStyle = COLORS.leverStick; ctx.fillRect(-3, -35, 6, 40);
        ctx.beginPath(); ctx.arc(0, -35, 6, 0, Math.PI * 2); ctx.fillStyle = this.isActive ? COLORS.rimLight : COLORS.leverKnobInactive;
        if (this.isActive) { ctx.shadowBlur = 15; ctx.shadowColor = COLORS.rimLight; }
        ctx.fill(); ctx.restore();
        ctx.fillStyle = COLORS.leverBase; ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = COLORS.player === '#000000' ? '#ddd' : '#000'; ctx.fillRect(this.x + 5, this.y + 2, this.width - 10, 6);
    }
}

class MovingPlatform extends GameObject {
    constructor(x, y, w, h, endX, endY, triggerId, weightSensitive = false, requiredWeight = 1, movementType = 'direct', sequenceVal = null, speed = 2.0) {
        super(x, y, w, h, COLORS.movingPlat);
        this.startX = x; this.startY = y; this.endX = endX; this.endY = endY; this.triggerId = triggerId; this.vx = 0; this.vy = 0;
        this.weightSensitive = weightSensitive;
        this.requiredWeight = requiredWeight;
        this.movementType = movementType; // 'direct', 'patrol' (oscillate)
        this.sequenceVal = sequenceVal; // If set, active ONLY when levelSequence == this.sequenceVal
        this.patrolState = 0; // 0: toEnd, 1: toStart
        this.speed = speed;
    }
    update(btns, levers, entities) {
        let active = false;

        if (this.sequenceVal !== null) {
            // Sequence Mode: Active only if sequence matches.
            // When inactive, if using 'freeze' logic implicitly (Patrol mode often implies freezing on stop for puzzles),
            // we will handle movement or lack thereof.
            if (levelSequence === this.sequenceVal) active = true;
        } else if (this.triggerId) {
            btns.forEach(b => { if (b.targetDoorId === this.triggerId && b.isPressed) active = true; });
            if (levers) { levers.forEach(l => { if (l.triggerId === this.triggerId && l.isActive) active = true; }); }
        } else {
            active = true; // Default active if no trigger
        }

        if (this.weightSensitive && entities) {
            let count = 0;
            let ridingBox = { x: this.x, y: this.y - 10, width: this.width, height: this.height + 20 };
            entities.forEach(e => {
                if (!e.isExpired && checkRectCollision(ridingBox, e)) count++;
            });
            if (count < this.requiredWeight) active = false;
        }

        let targetX, targetY;

        if (this.movementType === 'patrol') {
            if (active) {
                // Ping Pong Logic
                let destX = (this.patrolState === 0) ? this.endX : this.startX;
                let destY = (this.patrolState === 0) ? this.endY : this.startY;

                let dx = destX - this.x;
                let dy = destY - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.speed) {
                    this.x = destX; this.y = destY;
                    this.patrolState = 1 - this.patrolState; // Swap target
                } else {
                    this.vx = (dx / dist) * this.speed;
                    this.vy = (dy / dist) * this.speed;
                    this.x += this.vx; this.y += this.vy;
                }
            } else {
                // Freeze in place if patrol + sequence (Puzzle behavior)
                // If standard patrol, maybe return to start? 
                // For this game's request ("stops"), we freeze.
                this.vx = 0; this.vy = 0;
            }
            return; // Custom update done
        }

        // Default 'direct' behavior
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
            if (levers) { levers.forEach(l => { if (l.triggerId === this.triggerId && l.isActive) active = true; }); }
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
    constructor(x, y, t, isCeiling = false, id = 0, isSequencer = false) {
        super(x, y - 10, 40, 10, COLORS.button);
        this.oy = y - 10; this.py = y - 4; this.targetDoorId = t; this.isPressed = false; this.isCeiling = isCeiling; this.id = id;
        this.pressTime = 0;
        this.isSequencer = isSequencer;
        this.wasPressed = false;
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
        if (p && !this.isPressed) {
            playSound('button');
            this.pressTime = Date.now();
            if (this.isSequencer && !this.wasPressed) {
                levelSequence++;
                playSound('portal'); // Affirmation sound
            }
        }
        this.wasPressed = p;
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

class Laser extends GameObject {
    constructor(x, y, w, h, direction = 'right', type = 'laser') {
        super(x, y, w, h, '#ff0000');
        this.direction = direction; // 'right' (Left->Right) or 'left' (Right->Left)
        this.type = type; // 'laser' or 'spike'
        this.activeWidth = w;
    }
    update(entities) {
        // If spike, we might not need "shrinking" beam logic unless bodies cover it.
        // User wants bodies to be stepping stones.
        // If body is ON the spike, the spike is effectively "covered" at that spot.
        // But our current logic shrinks the WHOLE beam.
        // For a spike pit, we probably want individual spikes to be covered?
        // OR simpler: The body lands on top. The player steps on the BODY.
        // The body is safe.
        // The player only dies if touching the spike directly.
        // So standard collision check handles "Touching Spike -> Die".
        // If player is on top of body, player touches body, not spike (hopefully).
        // Let's keep simpler logic first: Spikes don't shrink like lasers. They are static.
        // But if we want the "corpse covers spikes" logic, we rely on the corpse being a physical object you stand on.
        // As long as the corpse hitbox > spike hitbox, you stand on corpse and don't touch spike.

        if (this.type === 'spike') {
            // Standard Kill Logic (Static Hazard)
            entities.forEach(e => {
                if (!e.isDead && !e.isExpired && checkRectCollision(this, e)) {
                    e.isDead = true;
                    playSound('portal');
                }
            });
            return;
        }

        // Standard Laser Logic (Shrinkable Beam)
        this.activeWidth = this.width;
        let blockingEntity = null;

        // 1. Find the closest blocking DEAD entity
        entities.forEach(e => {
            if (e.isDead && checkRectCollision(this, e)) {
                if (this.direction === 'right') {
                    let dist = e.x - this.x;
                    if (dist < this.activeWidth && dist >= 0) {
                        this.activeWidth = dist;
                        blockingEntity = e;
                    }
                } else {
                    let beamEnd = e.x + e.width;
                    let dist = (this.x + this.width) - beamEnd;
                    if (dist < this.activeWidth && dist >= 0) {
                        this.activeWidth = dist;
                        blockingEntity = e;
                    }
                }
            }
        });

        // 2. Kill Active Players
        entities.forEach(e => {
            if (!e.isDead && !e.isExpired) {
                let hit = false;
                if (e.y < this.y + this.height && e.y + e.height > this.y) {
                    if (this.direction === 'right') {
                        if (e.x < this.x + this.activeWidth && e.x + e.width > this.x) hit = true;
                    } else {
                        let startX = this.x + this.width - this.activeWidth;
                        if (e.x < this.x + this.width && e.x + e.width > startX) hit = true;
                    }
                }

                if (hit) {
                    e.isDead = true;
                    playSound('portal');
                }
            }
        });
    }

    draw(ctx) {
        ctx.save();

        if (this.type === 'spike') {
            // Draw Spikes
            ctx.fillStyle = '#ff0000';
            // Draw a row of triangles
            let spikeCount = Math.floor(this.width / 15);
            let spikeW = this.width / spikeCount;

            ctx.beginPath();
            for (let i = 0; i < spikeCount; i++) {
                let bx = this.x + i * spikeW;
                let by = this.y + this.height; // Base of spike
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + spikeW / 2, this.y); // Tip
                ctx.lineTo(bx + spikeW, by); // End base
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
            return;
        }

        let drawX = this.x;
        let drawW = this.activeWidth;
        if (this.direction === 'left') {
            drawX = (this.x + this.width) - this.activeWidth;
        }
        let midY = this.y + this.height / 2;

        // 1. Ultra-Thin Core Beam (Physics Light)
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff3333';
        ctx.fillRect(drawX, midY, drawW, 1);

        // 2. Subtle Glow
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        ctx.fillRect(drawX, midY - 2, drawW, 5);

        // 3. Flow Animation (High Visibility)
        ctx.beginPath();
        ctx.rect(drawX, this.y, drawW, this.height);
        ctx.clip();

        ctx.fillStyle = '#ffaaaa'; // Brighter pink/white
        let time = Date.now() / 2; // Faster speed (2x)
        let spacing = 15; // Closer particles

        for (let i = 0; i < drawW + spacing; i += spacing) {
            let offset = (time % spacing);
            let px;

            if (this.direction === 'left') {
                // Right -> Left flow
                px = (drawX + drawW) - i - offset;
            } else {
                // Left -> Right flow
                px = drawX + i + offset - spacing;
            }

            // Random jitter for 'energy' feel
            let jitterY = (Math.sin(i + time) * 2);

            ctx.fillRect(px, midY + jitterY - 1, 6, 2);
        }
        ctx.restore();

        // 4. Projection Source Visual - REMOVED per user request
        // Just the laser beam.
        ctx.restore();
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
        this.ignorePortalId = null; // New logic: Ignore the specific portal we just exited
        this.animOffset = Math.random() * 1000;
        this.isDead = false;
    }

    resolveMapCollisionX(plats, doors, movingPlats) {
        let obs = [...plats];
        doors.forEach(d => { if (d.getCurrentHeight() > 5) obs.push({ x: d.x, y: d.y, width: d.width, height: d.getCurrentHeight() }); });

        // Static Objects
        obs.forEach(p => {
            if (checkRectCollision(this, p)) {
                // We know we just moved X, so fix X.
                let ox = (this.width + p.width) / 2 - Math.abs((this.x + this.width / 2) - (p.x + p.width / 2));
                if (ox > 0) {
                    if (this.x < p.x) this.x = p.x - this.width; else this.x = p.x + p.width;
                    this.vx = 0;
                }
            }
        });

        // Moving Platforms (X)
        if (movingPlats) {
            movingPlats.forEach(mp => {
                let checkBounds = { x: mp.x, y: mp.y, width: mp.width, height: mp.height };
                if (checkRectCollision(this, checkBounds)) {
                    // Check purely for overlapping.
                    // IMPORTANT: We need to distinguish side hit vs riding.
                    // If we are strictly INSIDE the box on X axis.
                    let ox = (this.width + mp.width) / 2 - Math.abs((this.x + this.width / 2) - (mp.x + mp.width / 2));
                    let oy = (this.height + mp.height) / 2 - Math.abs((this.y + this.height / 2) - (mp.y + mp.height / 2));

                    // If overlap is significant on X and we are "deep" in Y (not just feet touching top)
                    if (ox > 0 && oy > 2) {
                        // If we are somewhat vertically aligned, it might be a vertical landing, ignore in X step?
                        // NO, Split axis means we solve X irrespective of Y intent, IF we are colliding.
                        // But we want to allow "riding" on top without getting pushed left/right if we are technically 1px intersecting.
                        // Standard Platformer rule: Collision is resolved in the direction of movement or shallowest penetration.
                        // Since we move X then Check X: penetration should be strictly X based?

                        // BUT, if we are on top (y + h ~ mp.y), we don't want X resolution to push us off.
                        // "Riding" check:
                        let isRiding = (this.y + this.height <= mp.y + 10 && this.vy >= 0);

                        if (!isRiding) {
                            if (this.x < mp.x) this.x = mp.x - this.width; else this.x = mp.x + mp.width;
                            this.vx = 0;
                        }
                    }
                }
            });
        }
    }

    resolveMapCollisionY(plats, doors, movingPlats) {
        let obs = [...plats];
        doors.forEach(d => { if (d.getCurrentHeight() > 5) obs.push({ x: d.x, y: d.y, width: d.width, height: d.getCurrentHeight() }); });

        // Static
        obs.forEach(p => {
            if (checkRectCollision(this, p)) {
                let oy = (this.height + p.height) / 2 - Math.abs((this.y + this.height / 2) - (p.y + p.height / 2));
                if (oy > 0) {
                    if (this.y < p.y) { this.y = p.y - this.height; this.vy = 0; this.isGrounded = true; }
                    else { this.y = p.y + p.height; this.vy = 0; }
                }
            }
        });

        // Moving Platforms (Y)
        if (movingPlats) {
            movingPlats.forEach(mp => {
                let checkBounds = { x: mp.x, y: mp.y, width: mp.width, height: mp.height };
                // Sticky check downward
                if (this.vy >= 0) checkBounds.y -= 5;

                if (checkRectCollision(this, checkBounds)) {
                    let ox = (this.width + mp.width) / 2 - Math.abs((this.x + this.width / 2) - (mp.x + mp.width / 2));
                    let oy = (this.height + mp.height) / 2 - Math.abs((this.y + this.height / 2) - (mp.y + mp.height / 2));

                    // If good X overlap (meaning we are actually ON it, not just brushing side)
                    if (ox > 2) {
                        if (this.y + this.height <= mp.y + mp.height / 2 + 10) {
                            // Land on top
                            this.y = mp.y - this.height;
                            this.vy = 0;
                            this.isGrounded = true;

                            // Only apply sticky movement to REAL players.
                            // Clones have recorded history that SHOULD already contain this movement.
                            // Applying it again causes double-movement bugs.
                            if (!this.isClone) {
                                this.x += mp.vx;
                                this.y += mp.vy;
                            }
                        } else {
                            // Hit bottom
                            this.y = mp.y + mp.height; this.vy = 0;
                        }
                    }
                }
            });
        }
    }

    checkPortals(portals) {
        if (!portals) return;

        // Cleanup Ignore State
        if (this.ignorePortalId) {
            let ignoredFn = portals.find(p => p.id === this.ignorePortalId);
            if (ignoredFn) {
                if (!checkRectCollision(this, ignoredFn)) {
                    this.ignorePortalId = null; // We walked out!
                }
            } else {
                this.ignorePortalId = null; // Portal doesn't exist? Clear.
            }
        }

        if (this.portalLock > 0) return; // Cooldown active

        portals.forEach(p => {
            // Skip processing for the portal we are ignoring (the one we just came from)
            if (this.ignorePortalId === p.id) return;

            if (checkRectCollision(this, p)) {
                let target = portals.find(tp => tp.id === p.targetId);
                if (target) {
                    playSound('portal');

                    // Center X
                    this.x = target.x + (target.width - this.width) / 2;
                    // Place at bottom of target to avoid falling through, but -2 to be inside for 'ignore' logic
                    this.y = target.y + target.height - this.height - 2;

                    // Set Ignore Logic
                    this.ignorePortalId = target.id;
                    this.portalLock = 10; // Short cooldown to prevent double-trigger in same frame logic
                }
            }
        });
    }

    update(inp, plats, doors, movingPlats, portals, frame) {
        if (this.isExpired) return;

        // 1. UNIVERSAL DEATH PHYSICS (Ragdoll)
        if (this.isDead) {
            this.vy += GRAVITY;
            this.vy *= FRICTION;

            // X Only
            this.x += this.vx;
            this.resolveMapCollisionX(plats, doors, movingPlats);

            // Y Only
            this.y += this.vy;
            this.resolveMapCollisionY(plats, doors, movingPlats);

            // Real Player: Record the fall
            if (!this.isClone) {
                // LEVEL 20 HARDCORE MODE: If you die (laser etc), Game Restarts!
                if (currentLevelIndex === 19) {
                    resetLevel(true); // Restart the LEVEL completely (wipes clones)
                    return;
                }

                this.history.push({ x: this.x, y: this.y, isDead: true });
                // Reset INSTANTLY
                createCloneAndReset();
            }
            return;
        }

        // 2. Clone Replay Logic
        if (this.isClone) {
            if (frame === 0) {
                this.isExpired = false;
                this.isDead = false;
                this.deathTimer = 0;
                if (this.history.length > 0) { this.x = this.history[0].x; this.y = this.history[0].y; }
            }

            if (frame < this.history.length) {
                let st = this.history[frame];

                // If history says we died here, switch to Ragdoll Mode
                if (st.isDead) {
                    this.isDead = true;
                    return;
                }

                // Delta Movement Logic (Relative Replay)
                if (frame > 0) {
                    let prev = this.history[frame - 1];
                    this.x += (st.x - prev.x);
                    this.resolveMapCollisionX(plats, doors, movingPlats); // Resolve X

                    this.y += (st.y - prev.y);
                    this.resolveMapCollisionY(plats, doors, movingPlats); // Resolve Y
                } else {
                    this.x = st.x; this.y = st.y;
                    // Ensure collision logic runs even if we didn't move much (e.g. elevators)
                    this.resolveMapCollisionX(plats, doors, movingPlats);
                    this.resolveMapCollisionY(plats, doors, movingPlats);
                }

                this.vx = st.vx || 0;
            } else {
                if (!this.isExpired) {
                    this.isExpired = true;
                    // Only spawn particles if it wasn't a death expire
                    for (let i = 0; i < 8; i++) particles.push(new Particle(this.x, this.y, '#888'));
                }
            }
            return;
        }

        // 3. Live Player Logic
        if (this.portalLock > 0) {
            this.portalLock--;
            // Do not freeze velocity; allow momentum to exit the portal
        } else {
            if (inp.left) this.vx -= ACCEL; else if (inp.right) this.vx += ACCEL; else this.vx *= FRICTION;
            if (this.vx > SPEED) this.vx = SPEED; if (this.vx < -SPEED) this.vx = -SPEED;
        }

        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        if (inp.jump && !this.wjp && this.isGrounded) { this.vy = -JUMP_FORCE; this.isGrounded = false; playSound('jump'); for (let i = 0; i < 5; i++) particles.push(new Particle(this.x, this.y + 35, '#fff')); }
        this.wjp = inp.jump;

        // --- SPLIT AXIS MOVEMENT (Standard Fix) ---
        // 1. Move X
        this.x += this.vx;
        // 2. Resolve X
        this.resolveMapCollisionX(plats, doors, movingPlats);

        // 3. Move Y
        this.y += this.vy;
        this.isGrounded = false; // Assume air
        // 4. Resolve Y
        this.resolveMapCollisionY(plats, doors, movingPlats);

        this.checkPortals(portals);

        if (cloneCollisionEnabled) {
            clones.forEach(c => {
                if (!c.isExpired && checkRectCollision(this, c)) {
                    let dx = (this.x + this.width / 2) - (c.x + c.width / 2);
                    let dy = (this.y + this.height / 2) - (c.y + c.height / 2);

                    // IF TOO CLOSE (Spawn Protection):
                    // If center distance is very small, we are likely overlapping at spawn.
                    // Ignore collision to prevent getting stuck or ejected violently.
                    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

                    if (Math.abs(dx) > Math.abs(dy)) {
                        // X collision
                        if (dx > 0) this.x = c.x + c.width; else this.x = c.x - this.width;
                        this.vx = 0;
                    } else {
                        // Y collision
                        if (dy > 0) {
                            if (!this.isGrounded) this.y = c.y + c.height;
                        }
                        else { this.y = c.y - this.height; this.vy = 0; this.isGrounded = true; }
                    }
                }
            });
            // Re-solve map collision to prevent being pushed INTO walls/floors by clones
            this.resolveMapCollisionX(plats, doors, movingPlats);
            this.resolveMapCollisionY(plats, doors, movingPlats);
        }

        // Final Bounds Safety
        if (this.x < 0) this.x = 0; if (this.x > 800 - this.width) this.x = 800 - this.width;

        if (goal && goal.isActive && checkRectCollision(this, goal)) {
            gameOver = true; playSound('win');
            if (currentLevelIndex + 1 >= unlockedLevels) {
                unlockedLevels = currentLevelIndex + 2;
                localStorage.setItem('paradoks_unlocked', unlockedLevels);
            }
            const allLevels = window.LEVELS || [];
            if (currentLevelIndex + 1 >= allLevels.length) {
                // Show White Theme Finish Screen
                WhiteEnding.start();
                return;
            }
            else {
                if (currentLevelIndex === 9) {
                    ComicEnding.start(() => {
                        currentLevelIndex++;
                        loadLevel(currentLevelIndex);
                    });
                    return;
                }
                document.getElementById('winTitle').innerText = LANGS[currentLang].completed;
                document.getElementById('winMessage').innerText = LANGS[currentLang].nextLevel;
                winButtons.style.display = 'none';
                setTimeout(() => { winScreen.classList.remove('active'); currentLevelIndex++; loadLevel(currentLevelIndex); }, 2000);
            }
            winScreen.classList.add('active');
        }
        if (this.y > 800) resetLevel(true);
        this.history.push({ x: this.x, y: this.y, isDead: false });
    }

    draw(ctx) {
        if (this.isClone && this.isExpired) return;
        ctx.save();

        let breatheOffset = 0;
        // Only breathe if Alive, Idle, and Grounded
        if (!this.isDead && Math.abs(this.vx) < 0.1 && this.isGrounded) {
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
