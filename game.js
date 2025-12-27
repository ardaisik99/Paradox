document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('scoreBoard');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreElement = document.getElementById('finalScore');
    const loadingScreen = document.getElementById('loadingScreen'); // Yeni element

    if (!gameOverScreen || !scoreElement || !loadingScreen) {
        console.error("HATA: HTML elementleri bulunamadı!");
        return;
    }

    // --- RESİM YÖNETİMİ VE YÜKLEME EKRANI MANTIĞI ---
    const images = {};
    const imageSources = {
        bg: 'assets/arkaplan.png',
        player: 'assets/karakter.png',
        pie: 'assets/turta.png',
        ground: 'assets/zemin.png'
    };

    let loadedCount = 0;
    const totalImages = Object.keys(imageSources).length;

    // Resim yüklendikçe çalışacak fonksiyon
    function checkAllImagesLoaded() {
        loadedCount++;
        if (loadedCount === totalImages) {
            // Hepsi yüklendi!
            console.log("Tüm resimler hazır. Oyun başlıyor...");
            
            // Yükleme ekranını gizle
            loadingScreen.style.display = 'none';
            
            // Oyunu başlat
            update();
        }
    }

    // Resimleri döngüyle yükle ve dinle
    for (let key in imageSources) {
        images[key] = new Image();
        images[key].onload = checkAllImagesLoaded; // Yüklenince sayacı artır
        images[key].onerror = checkAllImagesLoaded; // Hata olsa bile oyunu kilitlemesin, devam etsin
        images[key].src = imageSources[key];
    }

    // --- ÇÖZÜNÜRLÜK AYARLARI ---
    canvas.width = 1080;
    canvas.height = 1920;

    // --- OYUN DEĞİŞKENLERİ ---
    let gameRunning = true;
    let score = 0;
    let frames = 0;
    
    // Zorluk
    let dropSpeed = 6;   
    let spawnRate = 100; 

    // Oyuncu
    const player = {
        width: 280,   
        height: 380,  
        x: (1080 / 2) - 140, 
        y: 1920 - 470,       
        speed: 15     
    };

    let pies = [];
    let leftPressed = false;
    let rightPressed = false;

    // --- KONTROLLER ---
    document.addEventListener('keydown', (e) => {
        if(e.key === 'ArrowLeft') leftPressed = true;
        if(e.key === 'ArrowRight') rightPressed = true;
    });
    document.addEventListener('keyup', (e) => {
        if(e.key === 'ArrowLeft') leftPressed = false;
        if(e.key === 'ArrowRight') rightPressed = false;
    });

    document.addEventListener('touchstart', handleTouch, {passive: false});
    document.addEventListener('touchmove', handleTouch, {passive: false});
    document.addEventListener('touchend', () => {
        leftPressed = false;
        rightPressed = false;
    });

    function handleTouch(e) {
        if(e.type === 'touchmove') e.preventDefault(); 

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width; 
        const touchX = (e.touches[0].clientX - rect.left) * scaleX;

        if (touchX < canvas.width / 2) {
            leftPressed = true;
            rightPressed = false;
        } else {
            rightPressed = true;
            leftPressed = false;
        }
    }

    // --- OYUN FONKSİYONLARI ---
    function spawnPie() {
        const size = 160; 
        const x = Math.random() * (canvas.width - size);
        pies.push({
            x: x,
            y: -150, 
            size: size,
            speed: dropSpeed + Math.random() * 2 
        });
    }

    function update() {
        if (!gameRunning) return;

        // Oyuncu Hareketi
        if (leftPressed && player.x > 0) {
            player.x -= player.speed;
        }
        if (rightPressed && player.x + player.width < canvas.width) {
            player.x += player.speed;
        }
        
        player.y = canvas.height - 470; 

        if (frames % spawnRate === 0) { 
            spawnPie();
        }

        for (let i = 0; i < pies.length; i++) {
            let p = pies[i];
            p.y += p.speed;

            // Hitbox
            let hitBoxX = 70; 
            let hitBoxY = 80; 

            if (
                p.x < player.x + player.width - hitBoxX && 
                p.x + p.size > player.x + hitBoxX &&       
                p.y < player.y + player.height &&          
                p.y + p.size > player.y + hitBoxY          
            ) {
                score++;
                scoreElement.innerText = "Skor: " + score;
                pies.splice(i, 1);
                i--;

                if (score % 5 === 0) {
                    dropSpeed += 0.8;
                    if (spawnRate > 40) spawnRate -= 5;
                }

            }
            else if (p.y > canvas.height - 350) { 
                gameOver();
            }
        }

        frames++;
        requestAnimationFrame(draw);
        requestAnimationFrame(update);
    }

    function draw() {
        if (!gameRunning) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // A. Arkaplan
        if (images.bg.complete) ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        // B. Zemin
        if (images.ground.complete) ctx.drawImage(images.ground, -100, canvas.height - 1030, 1400, 1820);
        else { ctx.fillStyle = "#4CAF50"; ctx.fillRect(0, canvas.height - 100, 1080, 100); }

        // C. Karakter
        if (images.player.complete) ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
        else { ctx.fillStyle = "red"; ctx.fillRect(player.x, player.y, player.width, player.height); }

        // D. Turtalar
        for (let p of pies) {
            if (images.pie.complete) ctx.drawImage(images.pie, p.x, p.y, p.size, p.size);
            else { ctx.fillStyle = "orange"; ctx.fillRect(p.x, p.y, p.size, p.size); }
        }
    }

    function gameOver() {
        gameRunning = false;
        if(gameOverScreen) gameOverScreen.style.display = 'block';
        if(finalScoreElement) finalScoreElement.innerText = "Skorun: " + score;
    }

    window.resetGame = function() {
        score = 0;
        frames = 0;
        dropSpeed = 6; 
        spawnRate = 100;
        pies = [];
        
        if(scoreElement) scoreElement.innerText = "Skor: 0";
        if(gameOverScreen) gameOverScreen.style.display = 'none';
        
        gameRunning = true;
        requestAnimationFrame(draw);
        update();
    }
});