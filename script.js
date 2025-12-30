document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initLevelButtons();
    setTimeout(() => { document.getElementById('loadingScreen').style.display = 'none'; }, 1000);
    if (!window.LEVELS || window.LEVELS.length === 0) console.error("Levels not loaded!");
    gameState = 'MENU';
    initVisuals(); 
    loop();
});

const COLORS = {
    solid: '#000000', rimLight: '#555555', player: '#ffffff', clone: '#888888', door: '#111111', button: '#aaaaaa', dust: '#ffffff',
    movingPlat: '#333333', 
    leverBase: '#222222', leverStick: '#cccccc' 
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
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

const GRAVITY = 0.6; const FRICTION = 0.8; const SPEED = 3; const JUMP_FORCE = 12;

let gameState = 'MENU';
let currentLevelIndex = 0;
let unlockedLevels = 99; 
let frameCount = 0;
let gameOver = false;
let keys = {};
let cloneCollisionEnabled = false;
let soundEnabled = true;

let player, clones = [], platforms = [], buttons = [], doors = [], particles = [], goal = null;
let movingPlatforms = [], levers = []; 
let atmosphericDust = []; let lightRays = [];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function bindEvents() {
    document.getElementById('btnPlayMain').addEventListener('click', startGame);
    document.getElementById('btnLevelsMain').addEventListener('click', openLevels);
    document.getElementById('btnSettingsMain').addEventListener('click', openSettings);
    document.getElementById('btnResume').addEventListener('click', resumeGame);
    document.getElementById('btnRestart').addEventListener('click', restartLevel);
    document.getElementById('btnSettingsPause').addEventListener('click', openSettings);
    document.getElementById('btnExit').addEventListener('click', goToMainMenu);
    document.getElementById('btnBackLevels').addEventListener('click', closeLevels);
    document.getElementById('btnCloseSettings').addEventListener('click', closeSettings);
    document.getElementById('soundToggle').addEventListener('change', (e) => toggleSound(e.target.checked));
    document.getElementById('btnWinMain').addEventListener('click', goToMainMenu);
}

function initLevelButtons() {
    const grid = document.querySelector('.level-grid');
    grid.innerHTML = ''; 
    if(!window.LEVELS) return;
    window.LEVELS.forEach((_, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn level-btn';
        btn.innerText = index + 1;
        if (index >= unlockedLevels) btn.classList.add('locked');
        btn.onclick = () => selectLevel(index);
        grid.appendChild(btn);
    });
}

function playSound(type) {
    if (!soundEnabled || audioCtx.state === 'suspended') { if(type==='click') audioCtx.resume(); else return; }
    try {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
        if (type === 'jump') { osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(300, now+0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.15); osc.start(now); osc.stop(now+0.15); }
        else if (type === 'button') { osc.type='square'; osc.frequency.setValueAtTime(80, now); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now+0.1); osc.start(now); osc.stop(now+0.1); }
        else if (type === 'lever') { osc.type='sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.linearRampToValueAtTime(50, now+0.2); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now+0.2); osc.start(now); osc.stop(now+0.2); } 
        else if (type === 'click') { osc.type='triangle'; osc.frequency.setValueAtTime(600, now); gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now+0.05); osc.start(now); osc.stop(now+0.05); }
        else if (type === 'win') { osc.type='sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(600, now+1.0); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now+1.5); osc.start(now); osc.stop(now+1.5); }
        else if (type === 'rewind') { osc.type='sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now+0.4); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now+0.4); osc.start(now); osc.stop(now+0.4); }
    } catch(e){}
}
function toggleIngameMenu() { playSound('click'); if (gameState === 'PLAYING') { gameState = 'PAUSED'; ingameMenu.classList.add('active'); } else if (gameState === 'PAUSED') resumeGame(); }
function resumeGame() { playSound('click'); gameState = 'PLAYING'; ingameMenu.classList.remove('active'); }
function goToMainMenu() { playSound('click'); gameState = 'MENU'; mainMenu.classList.add('active'); ingameMenu.classList.remove('active'); levelsMenu.classList.remove('active'); settingsMenu.classList.remove('active'); winScreen.classList.remove('active'); gameUI.classList.remove('visible'); }
function restartLevel() { playSound('click'); resetLevel(true); resumeGame(); }
function startGame() { playSound('click'); loadLevel(currentLevelIndex); gameState = 'PLAYING'; mainMenu.classList.remove('active'); gameUI.classList.add('visible'); winScreen.classList.remove('active'); }
function openLevels() { playSound('click'); initLevelButtons(); levelsMenu.classList.add('active'); if(gameState === 'MENU') mainMenu.classList.remove('active'); if(gameState === 'PAUSED') ingameMenu.classList.remove('active'); }
function closeLevels() { playSound('click'); levelsMenu.classList.remove('active'); if(gameState === 'MENU') mainMenu.classList.add('active'); else if(gameState === 'PAUSED') ingameMenu.classList.add('active'); }
function openSettings() { playSound('click'); document.getElementById('soundToggle').checked = soundEnabled; settingsMenu.classList.add('active'); if(gameState === 'MENU') mainMenu.classList.remove('active'); if(gameState === 'PAUSED') ingameMenu.classList.remove('active'); }
function closeSettings() { playSound('click'); settingsMenu.classList.remove('active'); if(gameState === 'MENU') mainMenu.classList.add('active'); else if(gameState === 'PAUSED') ingameMenu.classList.add('active'); }
function selectLevel(index) { if (index >= unlockedLevels) return; playSound('click'); currentLevelIndex = index; levelsMenu.classList.remove('active'); startGame(); }
function toggleSound(enabled) { soundEnabled = enabled; playSound('click'); }
function toggleCollision() { playSound('click'); cloneCollisionEnabled = !cloneCollisionEnabled; collisionTextUI.innerText = `COLLISION: ${cloneCollisionEnabled ? 'ON' : 'OFF'} [C]`; collisionTextUI.style.color = cloneCollisionEnabled ? '#fff' : '#888'; }

function initVisuals() {
    atmosphericDust = []; lightRays = [];
    for(let i=0; i<60; i++) atmosphericDust.push(new DustParticle());
    for(let i=0; i<6; i++) lightRays.push(new LightRay());
}
class DustParticle {
    constructor() { this.reset(); this.x = Math.random() * 800; }
    reset() { this.x = Math.random() * 800; this.y = Math.random() * 450; this.vx = (Math.random()-0.5)*0.3; this.vy = (Math.random()-0.5)*0.3; this.size = Math.random()*2+0.5; this.alpha = Math.random()*0.3+0.1; }
    update() { this.x+=this.vx; this.y+=this.vy; if(this.x<0||this.x>800||this.y<0||this.y>450) this.reset(); }
    draw(ctx) { ctx.fillStyle = COLORS.dust; ctx.globalAlpha = this.alpha; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1; }
}
class LightRay {
    constructor() { this.x = Math.random()*800; this.width = Math.random()*60+40; this.angle = 0.3; this.speed = Math.random()*0.1+0.05; this.alpha = Math.random()*0.08+0.03; }
    update() { this.x+=this.speed; if(this.x>900) this.x=-100; }
    draw(ctx) {
        ctx.save(); let grad = ctx.createLinearGradient(this.x, 0, this.x+Math.tan(this.angle)*450, 450);
        grad.addColorStop(0, `rgba(255,255,255,${this.alpha})`); grad.addColorStop(0.5, `rgba(255,255,255,${this.alpha*0.5})`); grad.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.beginPath(); ctx.moveTo(this.x, -50); ctx.lineTo(this.x+this.width, -50); ctx.lineTo(this.x+this.width+150, 500); ctx.lineTo(this.x+150, 500); ctx.closePath();
        ctx.fillStyle = grad; ctx.fill(); ctx.restore();
    }
}
function drawBackgroundEffects() { ctx.clearRect(0,0,800,450); lightRays.forEach(r => { r.update(); r.draw(ctx); }); atmosphericDust.forEach(d => { d.update(); d.draw(ctx); }); }

// --- GAME LOGIC ---
function loadLevel(index) {
    const allLevels = window.LEVELS || [];
    if (index >= allLevels.length) { 
        document.getElementById('winTitle').innerText="GAME OVER"; document.getElementById('winMessage').innerText="All Paradoxes Solved!";
        winButtons.style.display='block'; winScreen.classList.add('active'); return; 
    }
    const ld = allLevels[index];
    platforms=[]; doors=[]; buttons=[]; clones=[]; particles=[]; movingPlatforms=[]; levers=[];
    frameCount=0; gameOver=false;
    
    ld.platforms.forEach(p => platforms.push(new GameObject(p.x, p.y, p.w, p.h, COLORS.solid)));
    ld.doors.forEach(d => doors.push(new Door(d.x, d.y, d.h, d.id)));
    ld.buttons.forEach(b => buttons.push(new Button(b.x, b.y, b.target)));
    if(ld.movingPlatforms) ld.movingPlatforms.forEach(mp => movingPlatforms.push(new MovingPlatform(mp.x, mp.y, mp.w, mp.h, mp.endX, mp.endY, mp.triggerId)));
    
    if(ld.levers) ld.levers.forEach(l => levers.push(new Lever(l.x, l.y, l.triggerId)));

    goal = ld.goal ? new Goal(ld.goal.x, ld.goal.y) : null;
    player = new Player(ld.start.x, ld.start.y);
    
    levelTextUI.innerText = `LEVEL ${index + 1}`; cloneTextUI.innerText = `CLONES: 0`;
    levelIndicator.innerText = `LEVEL ${index + 1}`; levelIndicator.style.opacity = 1; setTimeout(() => { levelIndicator.style.opacity = 0; }, 2000);
    for(let i=0; i<10; i++) particles.push(new Particle(ld.start.x, ld.start.y, '#fff'));
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
    for(let i=0; i<10; i++) particles.push(new Particle(ld.start.x, ld.start.y, '#aaa'));
}
function resetLevel(full) {
    if(full) { playSound('click'); loadLevel(currentLevelIndex); }
    else { const ld = window.LEVELS[currentLevelIndex]; player = new Player(ld.start.x, ld.start.y); frameCount = 0; clones.forEach(c => c.isExpired = false); }
}
function checkRectCollision(r1, r2) { return (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y); }

function update() {
    if (gameState !== 'PLAYING' || gameOver) return;
    particles.forEach((p,i) => { p.update(); if(p.life<=0) particles.splice(i,1); });
    const input = { left: keys['ArrowLeft'] || keys['KeyA'], right: keys['ArrowRight'] || keys['KeyD'], jump: keys['ArrowUp'] || keys['KeyW'] || keys['Space'] };
    
    const entities = [player, ...clones];
    buttons.forEach(b => b.update(entities));
    doors.forEach(d => d.update(buttons));
    
    levers.forEach(l => l.update(entities));

    movingPlatforms.forEach(mp => mp.update(buttons, levers)); 

    clones.forEach(c => c.update(null, platforms, doors, movingPlatforms, frameCount));
    player.update(input, platforms, doors, movingPlatforms, frameCount);
    frameCount++;
}

function draw() {
    drawBackgroundEffects();
    if (gameState === 'MENU') return;
    platforms.forEach(p => p.draw(ctx));
    movingPlatforms.forEach(mp => mp.draw(ctx)); 
    buttons.forEach(b => b.draw(ctx));
    levers.forEach(l => l.draw(ctx)); 
    doors.forEach(d => d.draw(ctx));
    if (goal) goal.draw(ctx);
    clones.forEach(c => c.draw(ctx));
    if (player) player.draw(ctx);
    particles.forEach(p => p.draw(ctx));
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
    constructor(x, y, w, h, c) { this.x=x; this.y=y; this.width=w; this.height=h; this.color=c; }
    draw(ctx) { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.fillStyle = COLORS.rimLight; ctx.fillRect(this.x, this.y, this.width, 2); }
}

class Lever extends GameObject {
    constructor(x, y, triggerId) {
        super(x, y, 40, 10, COLORS.leverBase); 
        this.triggerId = triggerId;
        this.isActive = false; 
        this.stickAngle = -0.5; 
    }
    update(entities) {
        entities.forEach(e => {
            if(!e.isExpired && checkRectCollision(this, e)) {
                let center = this.x + this.width / 2;
                let pCenter = e.x + e.width / 2;
                // SADECE Ters taraftan gelince çalışır
                if(pCenter > center && !this.isActive) { this.isActive = true; playSound('lever'); }
                else if(pCenter < center && this.isActive) { this.isActive = false; playSound('lever'); }
            }
        });
        let targetAngle = this.isActive ? 0.5 : -0.5;
        this.stickAngle += (targetAngle - this.stickAngle) * 0.2;
    }
    draw(ctx) {
        // 1. Çubuk (Arkada olsun)
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + 5);
        ctx.rotate(this.stickAngle);
        
        ctx.fillStyle = COLORS.leverStick;
        ctx.fillRect(-3, -35, 6, 40);
        
        // Topuz (Renksiz, gri ton)
        ctx.beginPath();
        ctx.arc(0, -35, 6, 0, Math.PI*2);
        ctx.fillStyle = this.isActive ? '#fff' : '#888'; 
        ctx.fill();
        ctx.restore();

        // 2. Taban (Önde olsun, çubuğun altını kessin)
        ctx.fillStyle = COLORS.leverBase;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // İnce detay
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 2, this.width - 10, 6);
    }
}

class MovingPlatform extends GameObject {
    constructor(x, y, w, h, endX, endY, triggerId) {
        super(x, y, w, h, COLORS.movingPlat);
        this.startX = x; this.startY = y;
        this.endX = endX; this.endY = endY;
        this.triggerId = triggerId;
        this.vx = 0; this.vy = 0;
    }
    update(btns, levers) {
        let active = false;
        btns.forEach(b => { if(b.targetDoorId === this.triggerId && b.isPressed) active = true; });
        if(levers) { levers.forEach(l => { if(l.triggerId === this.triggerId && l.isActive) active = true; }); }

        let tx = active ? this.endX : this.startX;
        let ty = active ? this.endY : this.startY;
        let dx = tx - this.x; let dy = ty - this.y;
        let speed = 2.0; 
        if (Math.abs(dx) > speed) this.vx = Math.sign(dx) * speed; else this.vx = dx;
        if (Math.abs(dy) > speed) this.vy = Math.sign(dy) * speed; else this.vy = dy;
        this.x += this.vx; this.y += this.vy;
    }
    draw(ctx) {
        ctx.fillStyle = '#222'; ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#444'; for(let i=0; i<this.width; i+=20) { ctx.fillRect(this.x + i, this.y, 5, this.height); }
        ctx.fillStyle = '#666'; ctx.fillRect(this.x, this.y, this.width, 2); ctx.fillRect(this.x, this.y+this.height-2, this.width, 2);
    }
}
class Goal extends GameObject {
    constructor(x, y) { super(x, y, 40, 60, '#fff'); }
    draw(ctx) { ctx.save(); ctx.shadowBlur=25; ctx.shadowColor='#fff'; ctx.fillStyle='#fff'; ctx.fillRect(this.x,this.y,this.width,this.height); ctx.restore(); }
}
class Button extends GameObject {
    constructor(x, y, t) { super(x, y-10, 40, 10, COLORS.button); this.oy=y-10; this.py=y-4; this.targetDoorId=t; this.isPressed=false; }
    update(ents) {
        let p = false; ents.forEach(e => { if(!e.isExpired && e.x < this.x+this.width && e.x+e.width > this.x && e.y+e.height >= this.y && e.y < this.y+this.height+5) p=true; });
        if(p && !this.isPressed) playSound('button'); this.isPressed = p; this.y = p ? this.py : this.oy; this.height = p ? 4 : 10;
    }
    draw(ctx) { ctx.fillStyle = this.isPressed ? '#ddd' : COLORS.button; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.fillStyle = '#fff'; ctx.fillRect(this.x, this.y, this.width, 1); ctx.fillStyle = '#222'; ctx.fillRect(this.x-5, this.oy+10, this.width+10, 5); }
}
class Door extends GameObject {
    constructor(x, y, h, id) { super(x, y, 20, h, COLORS.door); this.id=id; this.oh=0; this.th=h; }
    update(btns) { let a = false; btns.forEach(b => { if(b.targetDoorId===this.id && b.isPressed) a=true; }); if(a && this.oh < this.th) this.oh+=2; else if(!a && this.oh > 0) this.oh-=8; }
    getCurrentHeight() { return this.th - this.oh; }
    draw(ctx) { let h = this.getCurrentHeight(); if(h <= 0) return; ctx.fillStyle = '#000'; ctx.fillRect(this.x, this.y, this.width, h); ctx.fillStyle = '#333'; ctx.fillRect(this.x, this.y, 2, h); ctx.fillRect(this.x + this.width - 2, this.y, 2, h); }
}
class Particle {
    constructor(x, y, color) { this.x=x; this.y=y; this.vx=(Math.random()-0.5)*2; this.vy=(Math.random()-0.5)*2; this.life=1; this.size=Math.random()*3+1; this.color = color; }
    update() { this.x+=this.vx; this.y+=this.vy; this.life-=0.03; }
    draw(ctx) { ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1; }
}

class Player {
    constructor(x,y,isC=false,rec=[]) { this.x=x; this.y=y; this.width=15; this.height=35; this.vx=0; this.vy=0; this.isGrounded=false; this.isClone=isC; this.history=rec; this.isExpired=false; this.wjp=false; }
    
    resolveMapCollision(plats, doors, movingPlats) {
        let obs = [...plats];
        doors.forEach(d => { if(d.getCurrentHeight() > 5) obs.push({x:d.x, y:d.y, width:d.width, height:d.getCurrentHeight()}); });

        obs.forEach(p => {
            if(checkRectCollision(this, p)) {
                let ox = (this.width + p.width)/2 - Math.abs((this.x + this.width/2) - (p.x + p.width/2));
                let oy = (this.height + p.height)/2 - Math.abs((this.y + this.height/2) - (p.y + p.height/2));
                if(ox < oy) { if(this.x < p.x) this.x = p.x - this.width; else this.x = p.x + p.width; this.vx = 0; }
                else { if(this.y < p.y) { this.y = p.y - this.height; this.vy = 0; this.isGrounded = true; } else { this.y = p.y + p.height; this.vy = 0; } }
            }
        });

        if(movingPlats) {
            movingPlats.forEach(mp => {
                if(checkRectCollision(this, mp)) {
                    let ox = (this.width + mp.width)/2 - Math.abs((this.x + this.width/2) - (mp.x + mp.width/2));
                    let oy = (this.height + mp.height)/2 - Math.abs((this.y + this.height/2) - (mp.y + mp.height/2));
                    if(ox < oy) { if(this.x < mp.x) this.x = mp.x - this.width; else this.x = mp.x + mp.width; this.vx = 0; }
                    else { 
                        if(this.y < mp.y) { this.y = mp.y - this.height; this.vy = 0; this.isGrounded = true; this.x += mp.vx; this.y += mp.vy; } 
                        else { this.y = mp.y + mp.height; this.vy = 0; } 
                    }
                }
            });
        }
    }

    update(inp, plats, doors, movingPlats, frame) {
        if(this.isClone) {
            if(frame===0) this.isExpired=false; if(this.isExpired) return;
            if(frame<this.history.length) {
                let st=this.history[frame]; let tr={x:st.x, y:st.y, width:15, height:35}; let blocked=false;
                doors.forEach(d => { if(d.getCurrentHeight()>5 && checkRectCollision(tr, {x:d.x, y:d.y, width:d.width, height:d.getCurrentHeight()})) blocked=true; });
                if(!blocked) { this.x=st.x; this.y=st.y; }
            } else { if(!this.isExpired) { this.isExpired=true; for(let i=0;i<8;i++) particles.push(new Particle(this.x,this.y, '#888')); } }
            return;
        }

        if(inp.left) this.vx-=1; else if(inp.right) this.vx+=1; else this.vx*=FRICTION;
        if(this.vx>SPEED) this.vx=SPEED; if(this.vx<-SPEED) this.vx=-SPEED;
        this.vy+=GRAVITY;
        if(inp.jump && !this.wjp && this.isGrounded) { this.vy=-JUMP_FORCE; this.isGrounded=false; playSound('jump'); for(let i=0;i<5;i++) particles.push(new Particle(this.x, this.y+35, '#fff')); }
        this.wjp=inp.jump;
        this.x+=this.vx; this.y+=this.vy; this.isGrounded=false;

        this.resolveMapCollision(plats, doors, movingPlats);

        if(cloneCollisionEnabled) {
            clones.forEach(c => {
                if(!c.isExpired && checkRectCollision(this, c)) {
                    let dx = (this.x + this.width/2) - (c.x + c.width/2);
                    let dy = (this.y + this.height/2) - (c.y + c.height/2);
                    if(Math.abs(dx) > Math.abs(dy)) { if(dx > 0) this.x = c.x + c.width; else this.x = c.x - this.width; this.vx = 0; }
                    else { if(dy > 0) this.y = c.y + c.height; else { this.y = c.y - this.height; this.vy = 0; this.isGrounded = true; } }
                }
            });
        }
        this.resolveMapCollision(plats, doors, movingPlats);

        if(this.x<0) this.x=0; if(this.x>800-this.width) this.x=800-this.width;
        if(goal && checkRectCollision(this, goal)) { 
            gameOver=true; playSound('win');
            if(currentLevelIndex+1>=unlockedLevels) unlockedLevels=currentLevelIndex+2;
            const allLevels = window.LEVELS || [];
            if(currentLevelIndex+1>=allLevels.length) { document.getElementById('winTitle').innerText="GAME OVER"; document.getElementById('winMessage').innerText="All Paradoxes Solved!"; winButtons.style.display='block'; }
            else { document.getElementById('winTitle').innerText="LEVEL COMPLETED"; document.getElementById('winMessage').innerText="Next Paradox..."; winButtons.style.display='none'; setTimeout(()=>{ winScreen.classList.remove('active'); currentLevelIndex++; loadLevel(currentLevelIndex); }, 2000); }
            winScreen.classList.add('active');
        }
        if(this.y>450) resetLevel(true);
        this.history.push({x:this.x, y:this.y});
    }
    
    draw(ctx) {
        if(this.isClone && this.isExpired) return;
        ctx.save();
        if(this.isClone) { ctx.fillStyle = COLORS.clone; ctx.fillRect(this.x,this.y,this.width,this.height); if(cloneCollisionEnabled) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(this.x,this.y,this.width,this.height); } }
        else { ctx.shadowBlur = 20; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff'; ctx.fillRect(this.x,this.y,this.width,this.height); ctx.shadowBlur = 0; ctx.fillStyle = '#000'; let eyeOffsetX = (this.vx > 0.1) ? 8 : (this.vx < -0.1 ? 2 : 5); ctx.fillRect(this.x + eyeOffsetX, this.y + 8, 2, 5); ctx.fillRect(this.x + eyeOffsetX + 4, this.y + 8, 2, 5); }
        ctx.restore();
    }
}