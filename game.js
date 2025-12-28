const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loadingScreen');

// Telegram WebApp Ayarları
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// ==========================================
// 🔥 GÖRSEL YÜKLEME VE BAŞLATMA 🔥
// ==========================================

const gameWidth = 1920; 
const gameHeight = 1080;

const assets = {
    bg: new Image(),
    player: new Image(),
    door: new Image(),
    btnOff: new Image(),
    btnOn: new Image()
};

// Görsellerin kaçının yüklendiğini sayalım
let assetsLoaded = 0;
const totalAssets = 5;

function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        // Hepsi yüklendiğinde yükleme ekranını kaldır ve oyunu başlat
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                resize(); // Ekran boyutunu ayarla
                loop();   // Oyunu başlat
            }, 500);
        }, 1000); // En az 1 saniye loading görünsün (Şekil olsun diye)
    }
}

assets.bg.src = 'assets/map_level1.png';
assets.bg.onload = assetLoaded;

assets.player.src = 'assets/character.png';
assets.player.onload = assetLoaded;

assets.door.src = 'assets/door.png';
assets.door.onload = assetLoaded;

assets.btnOff.src = 'assets/button_off.png';
assets.btnOff.onload = assetLoaded;

assets.btnOn.src = 'assets/button_on.png';
assets.btnOn.onload = assetLoaded;


// ==========================================
// 🔥 OYUN AYARLARI 🔥
// ==========================================

// 1. KARAKTER
const PLAYER_SETTINGS = {
    width: 80,    
    height: 300,  
    startX: 200,  
    startY: 700,  
    speed: 8,     
    jump: -14     
};

const GROUND_Y = 850; 
const GRAVITY = 0.8;

// 3. OBJELER
const DOOR_SETTINGS = {
    width: 1600,   
    height: 1000, 
    x: 550,       
    y: 30        
};

const BUTTON_SETTINGS = {
    width: 800,
    height: 500,
    x: 400,
    y: 560
};

// ==========================================
//           SİSTEM KODLARI
// ==========================================

canvas.width = gameWidth;
canvas.height = gameHeight;

let keys = { Right: false, Left: false, Up: false, Action: false };
let gameWon = false; 
let frameCount = 0; 

// --- ÇOKLU KLON SİSTEMİ ---
let allRecordings = []; 
let currentRecording = []; 

const player = {
    x: PLAYER_SETTINGS.startX,
    y: PLAYER_SETTINGS.startY,
    w: PLAYER_SETTINGS.width,
    h: PLAYER_SETTINGS.height,
    vx: 0, vy: 0,
    grounded: false
};

const door = { 
    x: DOOR_SETTINGS.x, 
    y: DOOR_SETTINGS.y, 
    w: DOOR_SETTINGS.width, 
    h: DOOR_SETTINGS.height, 
    open: false 
};

const button = { 
    x: BUTTON_SETTINGS.x, 
    y: BUTTON_SETTINGS.y, 
    w: BUTTON_SETTINGS.width, 
    h: BUTTON_SETTINGS.height, 
    pressed: false 
};

// --- EKRAN BOYUTLANDIRMA (RESPONSIVE) ---
function resize() {
    // Telefonun ekran boyutlarını al
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    // En boy oranını koruyarak canvas'ı sığdır
    let scale = Math.min(windowWidth / gameWidth, windowHeight / gameHeight);
    
    canvas.style.width = (gameWidth * scale) + "px";
    canvas.style.height = (gameHeight * scale) + "px";
}
window.addEventListener('resize', resize);


function checkButtonHitbox(x, y, w, h) {
    let activeStart = 560; 
    let activeEnd = 920; 

    if (
        x > activeStart &&      
        x < activeEnd &&        
        y + h > button.y
    ) {
        return true;
    }
    return false;
}

function update() {
    if (gameWon) return;

    // --- OYUNCU HAREKETİ ---
    if (keys.Right) player.vx += 1;
    if (keys.Left) player.vx -= 1;
     
    player.vx *= 0.85; 
    if(Math.abs(player.vx) > PLAYER_SETTINGS.speed) player.vx = PLAYER_SETTINGS.speed * Math.sign(player.vx);

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    if (player.y + player.h > GROUND_Y) {
        player.y = GROUND_Y - player.h;
        player.vy = 0;
        player.grounded = true;
    } else {
        player.grounded = false;
    }

    if (keys.Up && player.grounded) {
        player.vy = PLAYER_SETTINGS.jump;
        player.grounded = false;
    }

    if (player.x < 0) player.x = 0;

    // --- KAYIT SİSTEMİ ---
    currentRecording.push({ x: player.x, y: player.y });

    // --- KLONLARI KONTROL ET ---
    let anyCloneOnButton = false;

    for (let i = 0; i < allRecordings.length; i++) {
        let run = allRecordings[i];
        if (frameCount < run.length) {
            let clonePos = run[frameCount];
            if (checkButtonHitbox(clonePos.x, clonePos.y, player.w, player.h)) {
                anyCloneOnButton = true;
            }
        }
    }

    let playerOnButton = checkButtonHitbox(player.x, player.y, player.w, player.h);

    if (playerOnButton || anyCloneOnButton) {
        button.pressed = true;
        door.open = true;
    } else {
        button.pressed = false;
        door.open = false;
    }

    // --- KAPI FİZİĞİ ---
    if (!door.open) {
        let boslukMiktari = 750; 
        let duvarKalinligi = 170; 
        let duvarSol = door.x + boslukMiktari;
        let duvarSag = duvarSol + duvarKalinligi;

        if (player.x + player.w > duvarSol && player.x < duvarSag) {
            let playerCenter = player.x + player.w / 2;
            let wallCenter = duvarSol + duvarKalinligi / 2;
            if (playerCenter < wallCenter) {
                player.x = duvarSol - player.w;
            } else {
                player.x = duvarSag;
            }
            player.vx = 0;
        }
    }

    // --- OYUN BİTİŞİ ---
    if (player.x > gameWidth - 100) {
        gameWon = true; 
    }

    frameCount++;
}

function createClone() {
    if (gameWon) return;

    allRecordings.push([...currentRecording]);

    player.x = PLAYER_SETTINGS.startX;
    player.y = PLAYER_SETTINGS.startY;
    player.vx = 0;
    player.vy = 0;

    currentRecording = []; 
    frameCount = 0; 
}

function resetLevel() {
    player.x = PLAYER_SETTINGS.startX;
    player.y = PLAYER_SETTINGS.startY;
    door.open = false;
    button.pressed = false;
    player.vx = 0;
    player.vy = 0;
    
    allRecordings = [];
    currentRecording = [];
    frameCount = 0;
    gameWon = false; 
}

function draw() {
    ctx.clearRect(0, 0, gameWidth, gameHeight);

    // ÇİZİM SIRASI
    ctx.drawImage(assets.bg, 0, 0, gameWidth, gameHeight);
    
    // Kapı (Karakterin arkasında)
    if (!door.open) {
        ctx.drawImage(assets.door, door.x, door.y, door.w, door.h);
    }

    let btnImg = button.pressed ? assets.btnOn : assets.btnOff;
    ctx.drawImage(btnImg, button.x, button.y, button.w, button.h);
    
    // Klonlar
    ctx.save();
    ctx.globalAlpha = 0.4; 
    for (let i = 0; i < allRecordings.length; i++) {
        let run = allRecordings[i];
        if (frameCount < run.length) {
            let pos = run[frameCount];
            ctx.drawImage(assets.player, pos.x, pos.y, player.w, player.h);
        }
    }
    ctx.restore();

    // Oyuncu
    ctx.drawImage(assets.player, player.x, player.y, player.w, player.h);

    // Game Over
    if (gameWon) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, gameWidth, gameHeight);

        ctx.fillStyle = "white";
        ctx.font = "bold 150px Arial";
        ctx.textAlign = "center";
        ctx.fillText("OYUN BİTTİ", gameWidth / 2, gameHeight / 2 - 50);

        ctx.font = "50px Arial";
        ctx.fillText("Tekrar oynamak için ekrana tıkla", gameWidth / 2, gameHeight / 2 + 50);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// --- MOBİL DOKUNMATİK KONTROLLERİ ---
const btnLeft = document.getElementById('leftBtn');
const btnRight = document.getElementById('rightBtn');
const btnAction = document.getElementById('actionBtn'); // Zıpla
const btnClone = document.getElementById('cloneBtn');   // Klonla

// Dokunmatik olayları (mouse ve touch destekli)
function addTouch(btn, key, isClick = false) {
    if(!btn) return;

    // Dokunma Başladı
    btn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        if(isClick) {
            if(key === 'clone') createClone();
        } else {
            keys[key] = true; 
        }
        btn.style.transform = "scale(0.9)"; // Basma efekti
    });

    // Dokunma Bitti
    btn.addEventListener('touchend', (e) => { 
        e.preventDefault(); 
        if(!isClick) keys[key] = false; 
        btn.style.transform = "scale(1)"; 
    });

    // Mouse Desteği (PC testi için)
    btn.addEventListener('mousedown', (e) => {
        if(isClick) {
            if(key === 'clone') createClone();
        } else {
            keys[key] = true;
        }
    });
    btn.addEventListener('mouseup', () => { if(!isClick) keys[key] = false; });
}

addTouch(btnLeft, 'Left');
addTouch(btnRight, 'Right');
addTouch(btnAction, 'Up');
addTouch(btnClone, 'clone', true); // True: Bu bir tuş değil, tetikleyici

// Klavye (PC için)
document.addEventListener('keydown', (e) => {
    if (gameWon && (e.key === 'r' || e.key === 'R')) resetLevel();
    if (e.key === 'ArrowRight' || e.key === 'd') keys.Right = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.Left = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.Up = true;
    if (e.key === 'c' || e.key === 'C') createClone();
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd') keys.Right = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.Left = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.Up = false;
});

// Restart için ekrana tıklama
canvas.addEventListener('touchstart', () => { if (gameWon) resetLevel(); });
canvas.addEventListener('mousedown', () => { if (gameWon) resetLevel(); });