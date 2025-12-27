document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('scoreBoard');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreElement = document.getElementById('finalScore');
    const loadingScreen = document.getElementById('loadingScreen');

    if (!gameOverScreen || !scoreElement || !loadingScreen) {
        console.error("HATA: HTML elementleri bulunamadı!");
        return;
    }

    // --- RESİM YÖNETİMİ ---
    const images = {};
    const imageSources = {
        bg: 'assets/arkaplan.png',
        player: 'assets/karakter.png',
        pie: 'assets/turta.png',
        ground: 'assets/zemin.png'
    };

    let loadedCount = 0;
    const totalImages = Object.keys(imageSources).length;

    function checkAllImagesLoaded() {
        loadedCount++;
        if (loadedCount === totalImages) {
            loadingScreen.style.display = 'none';
            // Oyunu başlatırken zaman damgasını gönderiyoruz
            requestAnimationFrame(update);
        }
    }

    for (let key in imageSources) {
        images[key] = new Image();
        images[key].onload = checkAllImagesLoaded;
        images[key].onerror = checkAllImagesLoaded;
        images[key].src = imageSources[key];
    }

    // --- ÇÖZÜNÜRLÜK AYARLARI ---
    canvas.width = 1080;
    canvas.height = 1920;

    // --- OYUN DEĞİŞKENLERİ ---
    let gameRunning = true;
    let score = 0;
    
    // DELTA TIME İÇİN ZAMAN DEĞİŞKENLERİ (YENİ)
    let lastTime = 0;
    let spawnTimer = 0;

    // --- HIZ AYARLARI (ARTIK "PİKSEL/SANİYE" CİNSİNDEN) ---
    // Not: Delta Time kullandığımız için sayılar büyüdü.
    // Eskiden frame başına 6 gidiyordu (6 x 60fps = 360).
    let dropSpeedPPS = 400; // Saniyede 400 piksel aşağı düşüş hızı
    let spawnInterval = 1500; // Milisaniye cinsinden turta doğma süresi (1.5 saniye)

    // OYUNCU AYARLARI
    const player = {
        width: 280,   
        height: 380,  
        x: (1080 / 2) - 140, 
        y: 1920 - 470,       
        speedPPS: 1200 // Player Speed Per Second (Saniyede 1200 piksel hız)
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
            // Hızlar da artık saniyelik bazda hesaplanıyor
            speedPPS: dropSpeedPPS + Math.random() * 200 
        });
    }

    // UPDATE FONKSİYONU (ZAMAN BAZLI GÜNCELLENDİ)
    function update(timestamp) {
        if (!gameRunning) return;

        // Delta Time Hesabı: İki kare arasında geçen süreyi (saniye cinsinden) bul.
        if (!lastTime) lastTime = timestamp;
        const deltaTime = (timestamp - lastTime) / 1000; // ms'yi saniyeye çevir
        lastTime = timestamp;

        // Çok büyük takılmalarda (örn: tarayıcı sekmesi değiştiğinde) hatayı önle
        if (deltaTime > 0.1) {
            requestAnimationFrame(update);
            return;
        }

        // 1. OYUNCU HAREKETİ (Hız * DeltaTime)
        // Artık 120Hz'de de 60Hz'de de aynı mesafeyi gider.
        if (leftPressed && player.x > 0) {
            player.x -= player.speedPPS * deltaTime;
        }
        if (rightPressed && player.x + player.width < canvas.width) {
            player.x += player.speedPPS * deltaTime;
        }
        
        player.y = canvas.height - 470; 

        // 2. TURTA ÜRETİMİ (ZAMAN SAYACINA GÖRE)
        spawnTimer += deltaTime * 1000; // ms olarak ekle
        if (spawnTimer > spawnInterval) {
            spawnPie();
            spawnTimer = 0; // Sayacı sıfırla
        }

        // 3. TURTALARI GÜNCELLE
        for (let i = 0; i < pies.length; i++) {
            let p = pies[i];
            
            // Turtayı aşağı indir (Piksel/Saniye * Geçen Süre)
            p.y += p.speedPPS * deltaTime;

            // Hitbox (Değişmedi, aynı mantık)
            let hitBoxX = 70; 
            let hitBoxY = 80; 

            if (
                p.x < player.x + player.width - hitBoxX && 
                p.x + p.size > player.x + hitBoxX &&       
                p.y < player.y + player.height &&          
                p.y + p.size > player.y + hitBoxY          
            ) {
                // Skor
                score++;
                scoreElement.innerText = "Skor: " + score;
                pies.splice(i, 1);
                i--;

                // Zorluk Artırma
                if (score % 5 === 0) {
                    dropSpeedPPS += 50; // Hızı artır
                    if (spawnInterval > 400) spawnInterval -= 100; // Süreyi kısalt
                }

            }
            else if (p.y > canvas.height - 350) { 
                gameOver();
            }
        }

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
        
        // Çizim fonksiyonunu sürekli çağırmaya gerek yok, Update içinde requestAnimationFrame zaten ekranı yeniler.
        // Ancak çizimin logic'ten ayrılması iyidir. Burada basitlik için update içine almadım ama
        // frame senkronizasyonu için update döngüsü içinde çizimi çağırmak daha doğru olabilir.
        // Aşağıdaki "loop" mantığını kullanacağız.
    }
    
    // Çizim ve Mantığı Tek Döngüde Birleştirelim (En pürüzsüz görüntü için)
    // Yukarıdaki update fonksiyonunun en sonundaki requestAnimationFrame'i değiştirdim.
    // Artık update fonksiyonu hem hesaplama yapıyor hem de draw'ı çağırıyor.
    
    // NOT: draw() fonksiyonunu update'in sonuna eklemeliyiz.
    // (JavaScript'te fonksiyonlar hoisting olduğu için yerini değiştirmene gerek yok ama
    // update fonksiyonunun sonuna "draw();" ekledim varsay.)

    // DÜZELTME: update fonksiyonunun sonunu şöyle yapıyoruz:
    /*
        draw();
        requestAnimationFrame(update);
    */
    // Kodun içinde bu yapıyı aşağıda güncelledim.
    
    // --- GÜNCELLENMİŞ UPDATE SONU ---
    // (Yukarıdaki update fonksiyonunu kopyalarken draw'ı çağırmayı unutmaman için 
    // fonksiyonu tekrar yazmak yerine buraya overwrite ediyorum)
    
    const originalUpdate = update;
    update = function(timestamp) {
        originalUpdate(timestamp);
        draw(); // Her hesaplamadan sonra çizim yap
    };

    function gameOver() {
        gameRunning = false;
        if(gameOverScreen) gameOverScreen.style.display = 'block';
        if(finalScoreElement) finalScoreElement.innerText = "Skorun: " + score;
    }

    window.resetGame = function() {
        score = 0;
        
        // Reset Değerleri
        dropSpeedPPS = 400; 
        spawnInterval = 1500;
        spawnTimer = 0;
        lastTime = 0; // Zamanı sıfırla
        
        pies = [];
        
        if(scoreElement) scoreElement.innerText = "Skor: 0";
        if(gameOverScreen) gameOverScreen.style.display = 'none';
        
        gameRunning = true;
        requestAnimationFrame(update);
    }
});