
const WhiteEnding = {
    active: false,
    elements: [],

    start(callback) {
        this.active = true;
        this.callback = callback;

        // Create Overlay - White Background Base
        const overlay = document.createElement('div');
        overlay.id = 'white-ending-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#fff';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'flex-end'; // Align to bottom centered
        overlay.style.alignItems = 'center';
        overlay.style.fontFamily = "'Courier New', monospace";
        overlay.style.color = '#000';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 2s ease-in-out';

        // Background Image - Full Screen Cover
        const bg = document.createElement('div');
        bg.style.position = 'absolute';
        bg.style.top = '0';
        bg.style.left = '0';
        bg.style.width = '100%';
        bg.style.height = '100%';
        bg.style.backgroundImage = "url('assets/white_finish.png')";
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center center';
        bg.style.zIndex = '-1';
        overlay.appendChild(bg);

        document.body.appendChild(overlay);
        this.elements.push(overlay);

        // Fade In Overlay
        requestAnimationFrame(() => overlay.style.opacity = '1');

        // Text Container (Centered/Bottom)
        const textContainer = document.createElement('div');
        textContainer.style.zIndex = '1';
        textContainer.style.marginBottom = '15%'; // Adjusted position
        textContainer.style.textAlign = 'center';
        textContainer.style.width = '100%';
        overlay.appendChild(textContainer);

        // Text: TO BE CONTINUED
        setTimeout(() => {
            const h1 = document.createElement('h1');
            h1.innerText = "TO BE CONTINUED";
            h1.style.color = '#000'; // Black Text
            h1.style.fontSize = '80px';
            h1.style.fontWeight = '100';
            h1.style.letterSpacing = '10px';
            h1.style.margin = '0 auto';
            h1.style.textShadow = '0 0 30px rgba(255,255,255,0.9)';
            h1.style.opacity = '0';
            h1.style.transform = 'scale(0.9)';
            h1.style.transition = 'all 2s ease-out';

            textContainer.appendChild(h1);

            requestAnimationFrame(() => {
                h1.style.opacity = '1';
                h1.style.transform = 'scale(1)';
                h1.style.letterSpacing = '15px'; // Expanding effect
            });

        }, 1500);

        // Button: MAIN MENU
        setTimeout(() => {
            const btn = document.createElement('button');
            btn.innerText = "RETURN TO MENU";
            btn.style.marginTop = '40px';
            btn.style.background = 'transparent'; // Transparent fill
            btn.style.border = '2px solid #000'; // Black border
            btn.style.padding = '15px 40px';
            btn.style.fontSize = '16px';
            btn.style.fontWeight = 'bold';
            btn.style.letterSpacing = '3px';
            btn.style.cursor = 'pointer';
            btn.style.color = '#000';
            btn.style.opacity = '0';
            btn.style.transition = 'all 0.5s';

            // Hover effects handled via JS events since inline styles
            btn.onmouseenter = () => {
                btn.style.background = '#000';
                btn.style.color = '#fff';
            };
            btn.onmouseleave = () => {
                btn.style.background = 'transparent';
                btn.style.color = '#000';
            };

            btn.onclick = () => {
                location.reload();
            };

            textContainer.appendChild(btn);

            requestAnimationFrame(() => {
                btn.style.opacity = '1';
            });
        }, 3500);
    },

    cleanup() {
        this.elements.forEach(el => el.remove());
        this.elements = [];
        this.active = false;
    }
};
