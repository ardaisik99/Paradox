const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. AYARLAR ---
const gameWidth = 1920;
const gameHeight = 1080;
canvas.width = gameWidth;
canvas.height = gameHeight;

const PLAYER_SETTINGS = { startX: 200, startY: 500, w: 80, h: 270 };
const GROUND_Y = 850;

// Telegram Ready
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// --- 2. ASSETS ---
const assets = {
    bg: new Image(), player: new Image(), door: new Image(),
    btnOff: new Image(), btnOn: new Image()
};

let loaded = 0;
function itemLoaded() {
    loaded++;
    if (loaded === 5) {
        document.getElementById('uiOverlay').style.display = 'none';
        resize();
        loop();
    }
}

assets.bg.src = 'assets/map_level1.png';
assets.player.src = 'assets/character.png';
assets.door.src = 'assets/door.png';
assets.btnOff.src = 'assets/button_off.png';
assets.btnOn.src = 'assets/button_on.png';
Object.values(assets).forEach(img => img.onload = itemLoaded);

// --- 3. DEĞİŞKENLER ---
let keys = { Left: false, Right: false, Up: false };
let allRecordings = [];
let currentRecording = [];
let frameCount = 0;
let gameWon = false;

const player = { 
    x: PLAYER_SETTINGS.startX, y: PLAYER_SETTINGS.startY, 
    w: PLAYER_SETTINGS.w, h: PLAYER_SETTINGS.h, 
    vx: 0, vy: 0, grounded: false 
};

// --- 4. BUTON SİSTEMİ (KESİN ÇÖZÜM) ---
function bindControl(id, key, isTrigger = false) {
    const el = document.getElementById(id);
    if (!el) return;

    const press = (e) => {
        e.preventDefault();
        if (isTrigger) {
            if (key === 'clone') createClone();
        } else {
            keys[key] = true;
        }
    };
    const release = (e) => {
        e.preventDefault();
        if (!isTrigger) keys[key] = false;
    };

    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
    el.addEventListener('mouseleave', release);
}

bindControl('leftBtn', 'Left');
bindControl('rightBtn', 'Right');
bindControl('actionBtn', 'Up');
bindControl('cloneBtn', 'clone', true);

// --- 5. OYUN MANTIĞI ---
function update() {
    if (gameWon || window.innerHeight > window.innerWidth) return;

    if (keys.Left) player.vx -= 0.8;
    if (keys.Right) player.vx += 0.8;
    player.vx *= 0.85;
    player.vy += 0.8; // Yerçekimi

    player.x += player.vx;
    player.y += player.vy;

    if (player.y + player.h > GROUND_Y) {
        player.y = GROUND_Y - player.h;
        player.vy = 0;
        player.grounded = true;
    }

    if (keys.Up && player.grounded) {
        player.vy = -16;
        player.grounded = false;
    }

    if (player.x < 0) player.x = 0;

    currentRecording.push({ x: player.x, y: player.y });

    // Buton & Kapı (560-920 arası aktif)
    let isPressed = (player.x > 560 && player.x < 920);
    allRecordings.forEach(rec => {
        if (frameCount < rec.length && rec[frameCount].x > 560 && rec[frameCount].x < 920) isPressed = true;
    });

    // Kapı Engel (Fizik)
    if (!isPressed) {
        let wallX = 550 + 750;
        if (player.x + player.w > wallX && player.x < wallX + 150) {
            if (player.x + player.w / 2 < wallX + 75) player.x = wallX - player.w;
            else player.x = wallX + 150;
            player.vx = 0;
        }
    }

    if (player.x > gameWidth - 150) gameWon = true;
    frameCount++;
}

function createClone() {
    allRecordings.push([...currentRecording]);
    player.x = PLAYER_SETTINGS.startX;
    player.y = PLAYER_SETTINGS.startY;
    player.vx = 0; player.vy = 0;
    currentRecording = [];
    frameCount = 0;
}

function draw() {
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    ctx.drawImage(assets.bg, 0, 0, gameWidth, gameHeight);

    let isPressed = (player.x > 560 && player.x < 920);
    allRecordings.forEach(rec => {
        if (frameCount < rec.length && rec[frameCount].x > 560 && rec[frameCount].x < 920) isPressed = true;
    });

    ctx.drawImage(isPressed ? assets.btnOn : assets.btnOff, 400, 560, 800, 500);
    if (!isPressed) ctx.drawImage(assets.door, 550, 30, 1600, 1000);

    // Klonlar
    ctx.globalAlpha = 0.4;
    allRecordings.forEach(rec => {
        if (frameCount < rec.length) ctx.drawImage(assets.player, rec[frameCount].x, rec[frameCount].y, player.w, player.h);
    });
    ctx.globalAlpha = 1.0;

    ctx.drawImage(assets.player, player.x, player.y, player.w, player.h);

    if (gameWon) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0,0,gameWidth,gameHeight);
        ctx.fillStyle = "white"; ctx.font = "80px Arial"; ctx.textAlign = "center";
        ctx.fillText("BÖLÜM GEÇİLDİ!", gameWidth/2, gameHeight/2);
    }
}

function resize() {
    const scale = Math.min(window.innerWidth / gameWidth, window.innerHeight / gameHeight);
    canvas.style.width = (gameWidth * scale) + "px";
    canvas.style.height = (gameHeight * scale) + "px";
}

window.addEventListener('resize', resize);
function loop() { update(); draw(); requestAnimationFrame(loop); }

// Klavye (PC testi için)
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.Left = true;
    if (e.key === 'ArrowRight') keys.Right = true;
    if (e.key === 'ArrowUp') keys.Up = true;
    if (e.key.toLowerCase() === 'c') createClone();
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.Left = false;
    if (e.key === 'ArrowRight') keys.Right = false;
    if (e.key === 'ArrowUp') keys.Up = false;
});