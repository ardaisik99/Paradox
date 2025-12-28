const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('uiOverlay');
const rotateView = document.getElementById('rotateView');
const loadingView = document.getElementById('loadingView');
const gameContainer = document.getElementById('gameContainer');
const errorMsg = document.getElementById('errorMsg');

// Telegram Başlatma
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Ekranı tam boyuta aç
}

const gameWidth = 1920; 
const gameHeight = 1080;
let assetsLoaded = 0;
const totalAssets = 5;
const assets = {
    bg: new Image(), player: new Image(), door: new Image(),
    btnOff: new Image(), btnOn: new Image()
};

// Resim Yükleme Kontrolü
function checkAssets() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        loadingView.style.display = 'none';
        checkOrientation(); // Dosyalar bitti, yönü kontrol et
        loop();
    }
}

// Resim Hata Kontrolü
function assetError(e) {
    errorMsg.innerText = "Dosya eksik: " + e.target.src.split('/').pop();
}

assets.bg.onload = checkAssets; assets.bg.onerror = assetError; assets.bg.src = 'assets/map_level1.png';
assets.player.onload = checkAssets; assets.player.onerror = assetError; assets.player.src = 'assets/character.png';
assets.door.onload = checkAssets; assets.door.onerror = assetError; assets.door.src = 'assets/door.png';
assets.btnOff.onload = checkAssets; assets.btnOff.onerror = assetError; assets.btnOff.src = 'assets/button_off.png';
assets.btnOn.onload = checkAssets; assets.btnOn.onerror = assetError; assets.btnOn.src = 'assets/button_on.png';

// --- KRİTİK: YÖN VE EKRAN KONTROLÜ ---
function checkOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isLandscape) {
        // Yatay ise: Oyunu göster
        if (assetsLoaded === totalAssets) {
            uiOverlay.style.display = 'none';
            gameContainer.style.display = 'flex';
            resize();
        }
    } else {
        // Dikey ise: Uyarıyı göster
        uiOverlay.style.display = 'flex';
        rotateView.style.display = 'block';
        gameContainer.style.display = 'none';
    }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

function resize() {
    const scale = Math.min(window.innerWidth / gameWidth, window.innerHeight / gameHeight);
    canvas.style.width = (gameWidth * scale) + "px";
    canvas.style.height = (gameHeight * scale) + "px";
    canvas.width = gameWidth;
    canvas.height = gameHeight;
}

// --- OYUN MANTIĞI ---
let keys = { Right: false, Left: false, Up: false };
let gameWon = false; 
let frameCount = 0; 
let allRecordings = []; 
let currentRecording = []; 

const PLAYER_SETTINGS = { width: 80, height: 270, startX: 200, startY: 700, speed: 8, jump: -14 };
const player = { ...PLAYER_SETTINGS, x: PLAYER_SETTINGS.startX, y: PLAYER_SETTINGS.startY, vx: 0, vy: 0, grounded: false, w: 80, h: 270 };
const door = { x: 550, y: 30, w: 1600, h: 1000, open: false };
const button = { x: 400, y: 560, w: 800, h: 500, pressed: false };

function update() {
    if (gameWon || assetsLoaded < totalAssets || window.innerHeight > window.innerWidth) return;

    if (keys.Right) player.vx += 1;
    if (keys.Left) player.vx -= 1;
    player.vx *= 0.85;
    player.vy += 0.8; // Gravity
    player.x += player.vx;
    player.y += player.vy;

    // Zemin ve Sınırlar
    if (player.y + player.h > 850) { player.y = 850 - player.h; player.vy = 0; player.grounded = true; }
    if (keys.Up && player.grounded) { player.vy = player.jump; player.grounded = false; }
    if (player.x < 0) player.x = 0;

    currentRecording.push({ x: player.x, y: player.y });

    // Buton ve Klon Mantığı
    let playerOnBtn = (player.x > 560 && player.x < 920 && player.y + player.h > 560);
    let cloneOnBtn = false;
    allRecordings.forEach(run => {
        if (frameCount < run.length) {
            let p = run[frameCount];
            if (p.x > 560 && p.x < 920) cloneOnBtn = true;
        }
    });

    button.pressed = playerOnBtn || cloneOnBtn;
    door.open = button.pressed;

    // Kapı Duvarı
    if (!door.open) {
        let dSol = door.x + 750;
        let dSag = dSol + 150;
        if (player.x + player.w > dSol && player.x < dSag) {
            if (player.x + player.w / 2 < dSol + 75) player.x = dSol - player.w;
            else player.x = dSag;
            player.vx = 0;
        }
    }

    if (player.x > gameWidth - 100) gameWon = true;
    frameCount++;
}

function draw() {
    if (assetsLoaded < totalAssets || window.innerHeight > window.innerWidth) return;
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    ctx.drawImage(assets.bg, 0, 0);
    if (!door.open) ctx.drawImage(assets.door, door.x, door.y);
    ctx.drawImage(button.pressed ? assets.btnOn : assets.btnOff, button.x, button.y);

    ctx.globalAlpha = 0.4;
    allRecordings.forEach(run => {
        if (frameCount < run.length) ctx.drawImage(assets.player, run[frameCount].x, run[frameCount].y);
    });
    ctx.globalAlpha = 1.0;
    ctx.drawImage(assets.player, player.x, player.y);

    if (gameWon) {
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0,0,gameWidth,gameHeight);
        ctx.fillStyle = "white"; ctx.font = "80px Arial"; ctx.textAlign = "center";
        ctx.fillText("OYUN BİTTİ - TIKLA", gameWidth/2, gameHeight/2);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Klonlama ve Restart
function createClone() {
    allRecordings.push([...currentRecording]);
    player.x = PLAYER_SETTINGS.startX; player.y = PLAYER_SETTINGS.startY;
    currentRecording = []; frameCount = 0;
}

// Kontrolleri bağla
document.getElementById('leftBtn').ontouchstart = (e) => { e.preventDefault(); keys.Left = true; };
document.getElementById('leftBtn').ontouchend = () => keys.Left = false;
document.getElementById('rightBtn').ontouchstart = (e) => { e.preventDefault(); keys.Right = true; };
document.getElementById('rightBtn').ontouchend = () => keys.Right = false;
document.getElementById('actionBtn').ontouchstart = (e) => { e.preventDefault(); keys.Up = true; };
document.getElementById('actionBtn').ontouchend = () => keys.Up = false;
document.getElementById('cloneBtn').ontouchstart = (e) => { e.preventDefault(); createClone(); };

canvas.ontouchstart = () => { if(gameWon) location.reload(); };