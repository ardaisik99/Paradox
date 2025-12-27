document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('scoreBoard');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreElement = document.getElementById('finalScore');

    if (!gameOverScreen || !scoreElement) {
        console.error("HATA: HTML elementleri bulunamadı!");
        return;
    }

    // --- RESİMLER ---
    const bgImg = new Image();
    bgImg.src = 'assets/arkaplan.png'; 

    const playerImg = new Image();
    playerImg.src = 'assets/karakter.png'; 

    const pieImg = new Image();
    pieImg.src = 'assets/turta.png'; 

    const groundImg = new Image();
    groundImg.src = 'assets/zemin.png';

    // --- ÇÖZÜNÜRLÜK AYARLARI (SABİT 1080x1920) ---
    canvas.width = 1080;
    canvas.height = 1920;

    // --- OYUN DEĞİŞKENLERİ ---
    let gameRunning = true;
    let score = 0;
    let frames = 0;
    
    // ZORLUK AYARLARI
    let dropSpeed = 6;   
    let spawnRate = 100; 

    // OYUNCU AYARLARI
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

    // --- BİLGİSAYAR KONTROLLERİ (KLAVYE) ---
    document.addEventListener('keydown', (e) => {
        if(e.key === 'ArrowLeft') leftPressed = true;
        if(e.key === 'ArrowRight') rightPressed = true;
    });
    document.addEventListener('keyup', (e) => {
        if(e.key === 'ArrowLeft') leftPressed = false;
        if(e.key === 'ArrowRight') rightPressed = false;
    });

    // --- MOBİL DOKUNMATİK KONTROLLERİ (GÜNCELLENDİ) ---
    
    // 1. Ekrana ilk dokunuş
    document.addEventListener('touchstart', handleTouch, {passive: false});
    
    // 2. Parmağı kaldırmadan sürükleme (Yön değiştirmek için)
    document.addEventListener('touchmove', handleTouch, {passive: false});

    // 3. Parmak ekrandan çekilince dur
    document.addEventListener('touchend', () => {
        leftPressed = false;
        rightPressed = false;
    });

    function handleTouch(e) {
        // Sayfanın kaymasını engelle (Scroll olmasın)
        if(e.type === 'touchmove') {
            e.preventDefault(); 
        }

        // Dokunulan noktanın oyun içindeki gerçek yerini hesapla
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width; 
        
        // İlk parmağın X koordinatı
        const touchX = (e.touches[0].clientX - rect.left) * scaleX;

        // EKRANIN ORTASINA GÖRE HESAP:
        // Eğer dokunulan yer 1080'in yarısından (540) küçükse -> SOL
        if (touchX < canvas.width / 2) {
            leftPressed = true;
            rightPressed = false;
        } 
        // Eğer büyükse -> SAĞ
        else {
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

        // Oyuncu Hareketi (Sınırları aşmasın)
        if (leftPressed && player.x > 0) {
            player.x -= player.speed;
        }
        if (rightPressed && player.x + player.width < canvas.width) {
            player.x += player.speed;
        }
        
        // Zemin konumu sabit
        player.y = canvas.height - 470; 

        // Turta Üretimi
        if (frames % spawnRate === 0) { 
            spawnPie();
        }

        // Turtaları Güncelle
        for (let i = 0; i < pies.length; i++) {
            let p = pies[i];
            p.y += p.speed;

            // --- ÇARPIŞMA KONTROLÜ (Daraltılmış Hitbox) ---
            let hitBoxX = 70; // Yanlardan pay
            let hitBoxY = 80; // Üstten pay

            if (
                p.x < player.x + player.width - hitBoxX && 
                p.x + p.size > player.x + hitBoxX &&       
                p.y < player.y + player.height &&          
                p.y + p.size > player.y + hitBoxY          
            ) {
                // YAKALANDI!
                score++;
                scoreElement.innerText = "Skor: " + score;
                pies.splice(i, 1);
                i--;

                // Zorluk Artırma (Her 5 puanda bir)
                if (score % 5 === 0) {
                    dropSpeed += 0.8;
                    if (spawnRate > 40) spawnRate -= 5;
                }

            }
            // Yere çarptı mı?
            else if (p.y > canvas.height - 320) { 
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
        if (bgImg.complete && bgImg.naturalWidth !== 0) {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // B. Zemin
        if (groundImg.complete && groundImg.naturalWidth !== 0) {
            ctx.drawImage(groundImg, -100, canvas.height - 1000, 1400, 1800);
        } else {
            ctx.fillStyle = "#4CAF50"; ctx.fillRect(0, canvas.height - 100, 1080, 100);
        }

        // C. Karakter
        if (playerImg.complete && playerImg.naturalWidth !== 0) {
            ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = "red"; ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // D. Turtalar
        for (let p of pies) {
            if (pieImg.complete && pieImg.naturalWidth !== 0) {
                ctx.drawImage(pieImg, p.x, p.y, p.size, p.size);
            } else {
                ctx.fillStyle = "orange"; ctx.fillRect(p.x, p.y, p.size, p.size);
            }
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
        
        // Reset Değerleri
        dropSpeed = 6; 
        spawnRate = 100;
        
        pies = [];
        
        if(scoreElement) scoreElement.innerText = "Skor: 0";
        if(gameOverScreen) gameOverScreen.style.display = 'none';
        
        gameRunning = true;
        requestAnimationFrame(draw);
        update();
    }

    update();
});