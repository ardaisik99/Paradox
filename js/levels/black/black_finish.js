
const ComicEnding = {
    active: false,
    elements: [],

    start(callback) {
        this.active = true;
        this.callback = callback;

        // Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'comic-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000';
        overlay.style.zIndex = '1000';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.fontFamily = 'Courier New, monospace';
        overlay.style.color = '#fff';
        overlay.style.overflow = 'hidden';

        // Background Image Container (for opacity "sönümleme")
        const bgDiv = document.createElement('div');
        bgDiv.style.position = 'absolute';
        bgDiv.style.top = '0';
        bgDiv.style.left = '0';
        bgDiv.style.width = '100%';
        bgDiv.style.height = '100%';
        bgDiv.style.backgroundImage = "url('assets/black_ending.png')";
        bgDiv.style.backgroundSize = 'cover';
        bgDiv.style.backgroundPosition = 'center';
        bgDiv.style.opacity = '0.4'; // Dimmed as requested
        bgDiv.style.zIndex = '-1';
        overlay.appendChild(bgDiv);

        document.body.appendChild(overlay);
        this.elements.push(overlay);

        // Panel 1: "The Paradox is Solved..."
        this.createPanel(overlay, "The loops are closed...", 500, () => {
            // Panel 2: "But the void..."
            this.createPanel(overlay, "But the void remains...", 2000, () => {
                // Panel 3: "Entering White Dimension"
                this.createBigText(overlay, "ENTERING WHITE DIMENSION", 3500, () => {
                    // Click to continue
                    const btn = document.createElement('button');
                    btn.innerText = "CONTINUE >";
                    btn.style.marginTop = '50px';
                    btn.style.padding = '15px 30px';
                    btn.style.fontSize = '24px';
                    btn.style.background = '#fff';
                    btn.style.color = '#000';
                    btn.style.border = '4px solid #fff';
                    btn.style.cursor = 'pointer';
                    btn.style.fontFamily = 'monospace';
                    btn.style.fontWeight = 'bold';
                    btn.style.opacity = '0';
                    btn.style.transition = 'opacity 1s';

                    btn.onclick = () => {
                        this.cleanup();
                        if (this.callback) this.callback();
                    };

                    overlay.appendChild(btn);
                    setTimeout(() => btn.style.opacity = '1', 100);
                });
            });
        });
    },

    createPanel(parent, text, delay, next) {
        setTimeout(() => {
            const panel = document.createElement('div');
            panel.style.border = '2px solid white';
            panel.style.padding = '20px';
            panel.style.margin = '10px';
            panel.style.background = '#111';
            panel.style.maxWidth = '600px';
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(20px)';
            panel.style.transition = 'all 0.5s ease-out';

            const p = document.createElement('p');
            p.innerText = text;
            p.style.fontSize = '20px';
            p.style.margin = '0';
            panel.appendChild(p);

            parent.appendChild(panel);

            // Animate in
            requestAnimationFrame(() => {
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0)';
            });

            if (next) next();
        }, delay);
    },

    createBigText(parent, text, delay, next) {
        setTimeout(() => {
            const div = document.createElement('div');
            div.innerText = text;
            div.style.fontSize = '40px';
            div.style.fontWeight = 'bold';
            div.style.marginTop = '40px';
            div.style.color = '#fff';
            div.style.textShadow = '0 0 10px #fff';
            div.style.opacity = '0';
            div.style.transition = 'all 1s';
            div.style.transform = 'scale(1.5)';

            parent.appendChild(div);

            requestAnimationFrame(() => {
                div.style.opacity = '1';
                div.style.transform = 'scale(1)';
            });

            if (next) next();
        }, delay);
    },

    cleanup() {
        this.elements.forEach(el => el.remove());
        this.elements = [];
        this.active = false;
    }
};
