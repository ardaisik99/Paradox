document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const shakeWrapper = document.getElementById('shake-wrapper');

    canvas.width = 1080;
    canvas.height = 1920;

    // --- ELEMENTLER ---
    const scoreValElement = document.getElementById('scoreValue');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreElement = document.getElementById('finalScore');
    const loadingScreen = document.getElementById('loadingScreen');
    const loaderContainer = document.getElementById('loaderContainer');
    const startButtonsGroup = document.getElementById('startButtonsGroup');
    const startButton = document.getElementById('startButton');
    const startSettingsBtn = document.getElementById('startSettingsBtn');
    
    // UI - Menüler
    const hudLayer = document.getElementById('hudLayer');
    const menuBtn = document.getElementById('menuBtn');
    const pauseMenu = document.getElementById('pauseMenu');
    const mainSettingsMenu = document.getElementById('mainSettingsMenu');
    const closeMainSettingsBtn = document.getElementById('closeMainSettingsBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const homeBtn = document.getElementById('homeBtn');
    const goHomeBtn = document.getElementById('goHomeBtn');
    
    // MARKET (YENİ)
    const startMarketBtn = document.getElementById('startMarketBtn');
    const marketScreen = document.getElementById('marketScreen');
    const closeMarketBtn = document.getElementById('closeMarketBtn');

    // Can & Powerup & Skor & GÖREV
    const heart1 = document.getElementById('heart1');
    const heart2 = document.getElementById('heart2');
    const heart3 = document.getElementById('heart3');
    const activePowerup = document.getElementById('activePowerup');
    const powerupText = document.getElementById('powerupText');
    const menuHighScore = document.getElementById('menuHighScore');
    const finalHighScore = document.getElementById('finalHighScore');
    
    // GÖREV ELEMENTLERİ
    const questBox = document.getElementById('questBox');
    const questText = document.getElementById('questText');
    const questBar = document.getElementById('questBar');

    // Ayarlar
    const mainMusicToggle = document.getElementById('mainMusicToggle');
    const mainDarkModeToggle = document.getElementById('mainDarkModeToggle');
    const gameMusicToggle = document.getElementById('gameMusicToggle');
    const gameDarkModeToggle = document.getElementById('gameDarkModeToggle');

    // --- SES ---
    const bgMusic = new Audio();
    bgMusic.src = 'assets/muzik.mp3';
    bgMusic.loop = true; bgMusic.volume = 0.5; bgMusic.load(); 

    // --- KAYIT SİSTEMİ ---
    function getHighScore() { return localStorage.getItem('blupPie_highScore') || 0; }
    function saveHighScore(newScore) {
        const currentHigh = parseInt(getHighScore());
        if (newScore > currentHigh) localStorage.setItem('blupPie_highScore', newScore);
    }
    menuHighScore.innerText = getHighScore();

    // --- AYAR FONKSİYONLARI ---
    function toggleMusic(isMuted) {
        bgMusic.muted = isMuted;
        mainMusicToggle.checked = !isMuted;
        gameMusicToggle.checked = !isMuted;
        if (!isMuted && (gameRunning || !gameRunning)) bgMusic.play().catch(e => {});
    }
    function toggleDarkMode(isDark) {
        if (isDark) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        mainDarkModeToggle.checked = isDark;
        gameDarkModeToggle.checked = isDark;
    }
    mainMusicToggle.addEventListener('change', () => toggleMusic(!mainMusicToggle.checked));
    mainDarkModeToggle.addEventListener('change', () => toggleDarkMode(mainDarkModeToggle.checked));
    gameMusicToggle.addEventListener('change', () => toggleMusic(!gameMusicToggle.checked));
    gameDarkModeToggle.addEventListener('change', () => toggleDarkMode(gameDarkModeToggle.checked));

    // --- RESİM YÜKLEME ---
    const images = {};
    const imageSources = {
        bg: 'assets/arkaplan.png',
        player: 'assets/karakter.png', 
        pie: 'assets/turta.png',
        ground: 'assets/zemin.png',
        bomb: 'assets/bomba.png',       
        p_expand: 'assets/power_buyuk.png', 
        p_2x: 'assets/power_2x.png'     
    };
    const eatFrameCount = 2; const eatImages = []; 

    let loadedCount = 0;
    const totalImages = Object.keys(imageSources).length + eatFrameCount;

    // YÜKLEME GÜVENLİĞİ
    const safetyTimeout = setTimeout(() => {
        if (loaderContainer.style.display !== 'none') {
            loaderContainer.style.display = 'none';
            startButtonsGroup.style.display = 'flex';
        }
    }, 3000);

    function checkAllAssetsLoaded() {
        loadedCount++;
        if (loadedCount >= totalImages) {
            clearTimeout(safetyTimeout);
            loaderContainer.style.display = 'none';
            startButtonsGroup.style.display = 'flex'; 
        }
    }

    for (let key in imageSources) {
        images[key] = new Image();
        images[key].onload = checkAllAssetsLoaded;
        images[key].onerror = checkAllAssetsLoaded; 
        images[key].src = imageSources[key];
        if (images[key].complete) checkAllAssetsLoaded();
    }
    for (let i = 0; i < eatFrameCount; i++) {
        const img = new Image();
        img.onload = checkAllAssetsLoaded;
        img.onerror = checkAllAssetsLoaded;
        img.src = `assets/karakter_yeme_${i}.png`; 
        eatImages.push(img);
        if (img.complete) checkAllAssetsLoaded();
    }

    // --- OYUN DEĞİŞKENLERİ ---
    let gameRunning = false; let isPaused = false; let score = 0;
    let lastTime = 0; let spawnTimer = 0;
    let dropSpeedPPS = 400; let spawnInterval = 1500; let health = 3; 

    let isBigMode = false; let isDoubleScore = false; let powerupTimer = 0;
    let objects = []; let particles = [];

    // --- GÖREV SİSTEMİ ---
    const quests = [
        { id: 1, type: 'collect', target: 5, text: "Collect 5 Pies", desc: "Collected" },
        { id: 2, type: 'score', target: 15, text: "Reach 15 Score", desc: "Score" },
        { id: 3, type: 'collect', target: 15, text: "Collect 15 More Pies", desc: "Collected" },
        { id: 4, type: 'score', target: 50, text: "Legend: Reach 50 Score", desc: "Score" },
        { id: 5, type: 'end', target: 1, text: "All Quests Completed!", desc: "" }
    ];
    let currentQuestIndex = 0;
    let questProgress = 0;

    function updateQuestUI() {
        const q = quests[currentQuestIndex];
        if (q.type === 'end') {
            questText.innerText = "All Quests Completed! 🏆";
            questBar.style.width = "100%";
            return;
        }
        let percentage = Math.min((questProgress / q.target) * 100, 100);
        questBar.style.width = percentage + "%";
        questText.innerText = `${q.text} (${questProgress}/${q.target})`;
    }

    function checkQuestProgress(type, amount) {
        const q = quests[currentQuestIndex];
        if (q.type === 'end') return;

        if (q.type === type) {
            if (type === 'collect') questProgress += amount;
            else if (type === 'score') questProgress = score;

            if (questProgress >= q.target) {
                questBox.classList.add('quest-complete');
                setTimeout(() => questBox.classList.remove('quest-complete'), 500);
                currentQuestIndex++;
                if (currentQuestIndex < quests.length && quests[currentQuestIndex].type === 'collect') {
                    questProgress = 0;
                }
            }
            updateQuestUI();
        }
    }

    // --- PARTICLE ---
    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            this.size = Math.random() * 8 + 4;
            this.speedX = Math.random() * 6 - 3; this.speedY = Math.random() * 6 - 3;
            this.life = 1.0;
        }
        update() { this.x += this.speedX; this.y += this.speedY; this.life -= 0.03; if(this.size > 0.5) this.size -= 0.2; }
        draw() {
            ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    function createParticles(x, y, color) {
        for(let i=0; i<10; i++) particles.push(new Particle(x, y, color));
    }

    function triggerShake() {
        shakeWrapper.classList.remove('shake-effect');
        void shakeWrapper.offsetWidth; shakeWrapper.classList.add('shake-effect');
        if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
    function triggerHaptic() {
        if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    // --- OYUNCU AYARLARI ---
    const player = {
        baseWidth: 280, baseHeight: 380, width: 280, height: 380,  
        x: (1080 / 2) - 140, 
        y: 1920 - 550, 
        speedPPS: 1200, facingRight: true,
        isEating: false, frameX: 0, frameTimer: 0, frameInterval: 150, maxFrames: eatFrameCount 
    };

    function updateHearts() {
        if (!heart1 || !heart2 || !heart3) return;

        if (health >= 3) { heart1.className = "heart-icon"; heart2.className = "heart-icon"; heart3.className = "heart-icon"; } 
        else if (health === 2) { heart1.className = "heart-icon"; heart2.className = "heart-icon"; heart3.className = "heart-icon heart-lost"; } 
        else if (health === 1) { heart1.className = "heart-icon"; heart2.className = "heart-icon heart-lost"; heart3.className = "heart-icon heart-lost"; } 
        else { heart1.className = "heart-icon heart-lost"; heart2.className = "heart-icon heart-lost"; heart3.className = "heart-icon heart-lost"; }
    }

    // --- BUTON İŞLEVLERİ ---
    startSettingsBtn.addEventListener('click', () => { startButtonsGroup.style.display = 'none'; mainSettingsMenu.style.display = 'flex'; });
    closeMainSettingsBtn.addEventListener('click', () => { mainSettingsMenu.style.display = 'none'; startButtonsGroup.style.display = 'flex'; });
    
    // MARKET BUTONLARI (YENİ)
    startMarketBtn.addEventListener('click', () => {
        startButtonsGroup.style.display = 'none';
        marketScreen.style.display = 'flex';
    });
    closeMarketBtn.addEventListener('click', () => {
        marketScreen.style.display = 'none';
        startButtonsGroup.style.display = 'flex';
    });

    startButton.addEventListener('click', () => {
        if (!bgMusic.muted) bgMusic.play().catch((err) => console.warn(err));
        loadingScreen.style.display = 'none';
        hudLayer.style.display = 'flex';
        gameRunning = true; isPaused = false;
        
        updateQuestUI();
        requestAnimationFrame(update);
    });

    menuBtn.addEventListener('click', () => { if(gameRunning) { isPaused = true; pauseMenu.style.display = 'flex'; } });
    resumeBtn.addEventListener('click', () => { isPaused = false; pauseMenu.style.display = 'none'; lastTime = 0; requestAnimationFrame(update); });

    const goToMainMenu = () => {
        gameRunning = false; isPaused = false;
        saveHighScore(score); menuHighScore.innerText = getHighScore();
        
        score = 0; dropSpeedPPS = 400; spawnInterval = 1500; spawnTimer = 0; health = 3; 
        updateHearts();
        isBigMode = false; isDoubleScore = false; powerupTimer = 0; activePowerup.style.display = 'none';
        player.width = player.baseWidth; player.height = player.baseHeight; 
        player.y = 1920 - 550; 
        objects = []; particles = []; player.x = (1080 / 2) - 140;

        currentQuestIndex = 0; questProgress = 0;

        scoreValElement.innerText = "0";
        hudLayer.style.display = 'none'; pauseMenu.style.display = 'none'; gameOverScreen.style.display = 'none';
        
        loadingScreen.style.display = 'flex'; 
        loaderContainer.style.display = 'none';
        startButtonsGroup.style.display = 'flex';
        
        if (bgMusic.muted) bgMusic.pause(); else { bgMusic.currentTime = 0; bgMusic.play().catch(e=>{}); }
    };
    homeBtn.addEventListener('click', goToMainMenu);
    goHomeBtn.addEventListener('click', goToMainMenu);

    // --- KONTROLLER ---
    let leftPressed = false; let rightPressed = false;
    document.addEventListener('keydown', (e) => { if(e.key === 'ArrowLeft') leftPressed = true; if(e.key === 'ArrowRight') rightPressed = true; });
    document.addEventListener('keyup', (e) => { if(e.key === 'ArrowLeft') leftPressed = false; if(e.key === 'ArrowRight') rightPressed = false; });
    document.addEventListener('touchstart', handleTouch, {passive: false});
    document.addEventListener('touchmove', handleTouch, {passive: false});
    document.addEventListener('touchend', () => { leftPressed = false; rightPressed = false; });
    function handleTouch(e) {
        if(e.type === 'touchmove') e.preventDefault(); 
        if (!gameRunning || isPaused) return;
        const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; 
        const touchX = (e.touches[0].clientX - rect.left) * scaleX;
        if (e.target.closest('button') || e.target.closest('.settings-box') || e.target.closest('.market-box')) return;
        if (touchX < canvas.width / 2) { leftPressed = true; rightPressed = false; } else { rightPressed = true; leftPressed = false; }
    }

    function spawnObject() {
        const size = 160; const x = Math.random() * (canvas.width - size);
        const rand = Math.random();
        let type = 'pie';
        if (rand < 0.15) type = 'bomb';
        else if (rand < 0.20) type = (Math.random() < 0.5) ? 'expand' : 'x2';
        
        objects.push({
            x: x, y: -150, size: size,
            speedPPS: dropSpeedPPS + Math.random() * 200,
            angle: 0, rotationSpeed: (Math.random() - 0.5) * 10, type: type
        });
    }

    function update(timestamp) {
        if (!gameRunning || isPaused) return;
        if (!lastTime) lastTime = timestamp;
        const deltaTime = (timestamp - lastTime) / 1000; lastTime = timestamp;
        if (deltaTime > 0.1) { requestAnimationFrame(update); return; }

        if (powerupTimer > 0) {
            powerupTimer -= deltaTime * 1000;
            if (powerupTimer <= 0) {
                isBigMode = false; isDoubleScore = false;
                player.width = player.baseWidth; player.height = player.baseHeight;
                player.y = 1920 - 550; activePowerup.style.display = 'none';
            }
        }

        if (player.isEating) {
            player.frameTimer += deltaTime * 1000;
            if (player.frameTimer > player.frameInterval) {
                player.frameX++; player.frameTimer = 0; 
                if (player.frameX >= player.maxFrames) { player.frameX = 0; player.isEating = false; }
            }
        }
        
        if (leftPressed && player.x > 0) { player.x -= player.speedPPS * deltaTime; player.facingRight = false; }
        if (rightPressed && player.x + player.width < canvas.width) { player.x += player.speedPPS * deltaTime; player.facingRight = true; }
        
        if (!isBigMode) player.y = 1920 - 450; else player.y = 1920 - (450 * 1.3) + 100; 

        spawnTimer += deltaTime * 1000; 
        if (spawnTimer > spawnInterval) { spawnObject(); spawnTimer = 0; }

        for (let i = 0; i < objects.length; i++) {
            let o = objects[i];
            o.y += o.speedPPS * deltaTime; o.angle += o.rotationSpeed * deltaTime;
            let hitBoxX = isBigMode ? 40 : 70; let hitBoxY = isBigMode ? 40 : 80; 

            if (o.x < player.x + player.width - hitBoxX && o.x + o.size > player.x + hitBoxX && o.y < player.y + player.height && o.y + o.size > player.y + hitBoxY) {
                // ÇARPIŞMA
                if (o.type === 'pie') {
                    let points = isDoubleScore ? 2 : 1; score += points; scoreValElement.innerText = score;
                    
                    checkQuestProgress('collect', 1);
                    checkQuestProgress('score', 0);

                    player.isEating = true; player.frameX = 0; player.frameTimer = 0;
                    createParticles(o.x+o.size/2, o.y+o.size/2, '#ff9f43'); triggerHaptic();
                    if (score % 5 === 0) { dropSpeedPPS += 50; if (spawnInterval > 400) spawnInterval -= 100; }
                } else if (o.type === 'bomb') {
                    health--; 
                    updateHearts(); 
                    triggerShake(); 
                    createParticles(o.x+o.size/2, o.y+o.size/2, '#2d3436');
                    if (health <= 0) gameOver();
                } else if (o.type === 'expand') {
                    isBigMode = true; player.width = player.baseWidth * 1.3; player.height = player.baseHeight * 1.3;
                    powerupTimer = 5000; activePowerup.style.display = 'block'; powerupText.innerText = "BIG MODE!"; triggerHaptic();
                } else if (o.type === 'x2') {
                    isDoubleScore = true; powerupTimer = 5000; activePowerup.style.display = 'block'; powerupText.innerText = "2X SCORE!"; triggerHaptic();
                }
                objects.splice(i, 1); i--;
            }
            else if (o.y > canvas.height - 350) { 
                if (o.type === 'pie') { gameOver(); } 
                else { objects.splice(i, 1); i--; }
            }
        }

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            if (particles[i].life <= 0) { particles.splice(i, 1); i--; }
        }
        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (images.bg.complete) ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#81ecec"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        if (images.ground.complete) ctx.drawImage(images.ground, -100, canvas.height - 1050, 1400, 1900);
        else { ctx.fillStyle = "#00b894"; ctx.fillRect(0, canvas.height - 100, 1080, 100); }

        if (images.player.complete) {
            ctx.save(); ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
            if (!player.facingRight) ctx.scale(-1, 1);
            if (player.isEating) {
                const img = eatImages[player.frameX];
                if (img && img.complete) ctx.drawImage(img, -player.width/2, -player.height/2, player.width, player.height);
            } else ctx.drawImage(images.player, -player.width/2, -player.height/2, player.width, player.height);
            ctx.restore(); 
        }

        for (let o of objects) {
            let img = null;
            if (o.type === 'pie') img = images.pie; else if (o.type === 'bomb') img = images.bomb; else if (o.type === 'expand') img = images.p_expand; else if (o.type === 'x2') img = images.p_2x;

            if (img && img.complete) {
                ctx.save(); ctx.translate(o.x + o.size/2, o.y + o.size/2);
                ctx.rotate(o.angle); ctx.drawImage(img, -o.size/2, -o.size/2, o.size, o.size); ctx.restore();
            } else { ctx.fillStyle = o.type==='bomb'?'black':'orange'; ctx.fillRect(o.x, o.y, o.size, o.size); }
        }
        for (let p of particles) p.draw();
    }

    function gameOver() {
        gameRunning = false; bgMusic.pause();
        hudLayer.style.display = 'none'; activePowerup.style.display = 'none';
        saveHighScore(score); finalHighScore.innerText = getHighScore();
        if(gameOverScreen) gameOverScreen.style.display = 'flex';
        if(finalScoreElement) finalScoreElement.innerText = score;
    }

    window.resetGame = function() { goToMainMenu(); }; 
});