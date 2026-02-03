/* JavaScript Block 2 */
// Game State
        const state = {
            mode: 'sitaram', 
            score: 0,
            baseSpeedMultiplier: 1.0, 
            manualSpeedFactor: 1.0,
            activeBubbles: [],
            isMenuOpen: false,
            topBarVisible: true,
            lastSpawnTime: 0,
            spawnInterval: 1200, 
            gameLoopId: null
        };

        // Configuration
        const modes = {
            'sitaram': {
                text: 'सीता राम',
                colors: ['#1e293b', '#334155', '#1e1b4b'], 
                textColors: ['#fbbf24', '#f87171', '#60a5fa'], 
                borderColors: ['#fbbf24', '#f87171', '#60a5fa'],
                icon: '<i class="fas fa-om"></i>',
                class: 'text-sitaram'
            },
            'ram': {
                text: 'राम',
                colors: ['#271a10', '#431407', '#3f1807'], 
                textColors: ['#fb923c', '#fca5a5', '#fdba74'],
                borderColors: ['#fb923c', '#fca5a5', '#fdba74'],
                icon: '<i class="fas fa-sun"></i>',
                class: 'text-ram'
            },
            'radha': {
                text: 'राधा',
                colors: ['#380822', '#500724', '#4a044e'],
                textColors: ['#f472b6', '#e879f9', '#fb7185'],
                borderColors: ['#f472b6', '#e879f9', '#fb7185'],
                icon: '<i class="fas fa-heart"></i>',
                class: 'text-radha'
            }
        };

        // DOM Elements
        const gameContainer = document.getElementById('gameContainer');
        const scoreEl = document.getElementById('score');
        const menuBtn = document.getElementById('menuBtn');
        const optionsContainer = document.getElementById('optionsContainer');
        const milestoneModal = document.getElementById('milestoneModal');
        const deityIcon = document.getElementById('deityIcon');
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        const topBar = document.getElementById('topBar');
        const toggleBarBtn = document.getElementById('toggleBarBtn');

        // --- Initialization ---
        function init() {
            updateUI();
            requestAnimationFrame(gameLoop);
            document.getElementById(`check-${state.mode}`).classList.replace('opacity-0', 'opacity-100');
        }

        // --- Speed Logic ---
        speedSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            speedValue.innerText = val + '%';
            
            let factor;
            if (val <= 50) {
                factor = 0.5 + (val / 100); 
            } else {
                factor = 1.0 + ((val - 50) / 50);
            }
            state.manualSpeedFactor = factor;
        });

        // --- Layout Controls ---
        function toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => {
                    console.log(`Error attempting to enable full-screen mode: ${e.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            // Close menu after selection
            toggleMenu(false);
        }

        function toggleTopBar() {
            state.topBarVisible = !state.topBarVisible;
            
            if (state.topBarVisible) {
                // Show Bar
                topBar.classList.remove('hidden-bar');
                toggleBarBtn.innerHTML = '<i class="fas fa-eye-slash w-5 text-center"></i> <span class="text-sm font-bold">ऊपर की पट्टी हटाएं (Hide Bar)</span>';
                
                // Move button to top
                menuBtn.classList.remove('menu-bottom-pos');
                menuBtn.classList.add('menu-top-pos');
                
                // Set menu origin to top right
                optionsContainer.classList.remove('origin-bottom-right');
                optionsContainer.classList.add('origin-top-right');
            } else {
                // Hide Bar
                topBar.classList.add('hidden-bar');
                toggleBarBtn.innerHTML = '<i class="fas fa-eye w-5 text-center"></i> <span class="text-sm font-bold">ऊपर की पट्टी दिखाएं (Show Bar)</span>';
                
                // Move button to bottom
                menuBtn.classList.remove('menu-top-pos');
                menuBtn.classList.add('menu-bottom-pos');
                
                // Set menu origin to bottom right so it opens upwards
                optionsContainer.classList.remove('origin-top-right');
                optionsContainer.classList.add('origin-bottom-right');
            }
            
            toggleMenu(false);
        }

        function toggleMenu(show) {
            state.isMenuOpen = show;
            if (show) {
                optionsContainer.classList.remove('scale-0', 'opacity-0');
            } else {
                optionsContainer.classList.add('scale-0', 'opacity-0');
            }
        }

        // --- Game Loop ---
        function gameLoop(timestamp) {
            if (!state.lastSpawnTime) state.lastSpawnTime = timestamp;
            const delta = timestamp - state.lastSpawnTime;
            const effectiveSpawnInterval = state.spawnInterval / state.manualSpeedFactor;

            if (delta > effectiveSpawnInterval) {
                spawnBubble();
                state.lastSpawnTime = timestamp;
                if (state.spawnInterval > 400) state.spawnInterval -= 1; 
            }
            moveBubbles();
            state.gameLoopId = requestAnimationFrame(gameLoop);
        }

        // --- Spawning & Movement ---
        function spawnBubble() {
            const bubble = document.createElement('div');
            const modeConfig = modes[state.mode];
            const size = Math.random() * (110 - 75) + 75;
            const startX = Math.random() * (window.innerWidth - size);
            const colorIdx = Math.floor(Math.random() * modeConfig.colors.length);
            
            const baseRandomSpeed = Math.random() * 1.5 + 1; 
            const speed = baseRandomSpeed * state.baseSpeedMultiplier * state.manualSpeedFactor;

            bubble.classList.add('bubble');
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${startX}px`;
            bubble.style.top = `-${size}px`; 
            
            bubble.style.background = `radial-gradient(circle at 30% 30%, ${modeConfig.colors[colorIdx]}, #000)`;
            bubble.style.color = modeConfig.textColors[colorIdx];
            bubble.style.border = `1px solid ${modeConfig.borderColors[colorIdx]}40`;
            
            bubble.innerHTML = `<span>${modeConfig.text}</span>`;
            bubble.classList.add(modeConfig.class);

            bubble.dataset.speed = speed;
            bubble.dataset.y = -size;
            bubble.dataset.color = modeConfig.textColors[colorIdx];

            bubble.addEventListener('mousedown', (e) => popBubble(bubble, e));
            bubble.addEventListener('touchstart', (e) => {
                e.preventDefault(); 
                popBubble(bubble, e.touches[0]);
            });

            gameContainer.appendChild(bubble);
            state.activeBubbles.push(bubble);
        }

        function moveBubbles() {
            const screenHeight = window.innerHeight;
            for (let i = state.activeBubbles.length - 1; i >= 0; i--) {
                const bubble = state.activeBubbles[i];
                let y = parseFloat(bubble.dataset.y);
                
                if (!bubble.dataset.baseSpeed) {
                    bubble.dataset.baseSpeed = bubble.dataset.speed / state.manualSpeedFactor; 
                }
                const moveAmount = parseFloat(bubble.dataset.baseSpeed) * state.manualSpeedFactor;
                y += moveAmount;
                bubble.dataset.y = y;
                bubble.style.transform = `translateY(${y}px)`;

                if (y > screenHeight) {
                    bubble.remove();
                    state.activeBubbles.splice(i, 1);
                }
            }
        }

        // --- Interaction ---
        function popBubble(bubble, event) {
            if (bubble.classList.contains('bursting')) return;

            const rect = bubble.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const color = bubble.dataset.color || '#ea580c';

            createExplosion(centerX, centerY, color);

            bubble.classList.add('bursting');
            bubble.innerHTML = '<i class="fas fa-bahai text-yellow-200 text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"></i>'; 
            
            const index = state.activeBubbles.indexOf(bubble);
            if (index > -1) state.activeBubbles.splice(index, 1);

            showFloatingText(centerX, centerY);
            incrementScore();

            setTimeout(() => {
                if (bubble && bubble.parentNode) bubble.remove();
            }, 300);
        }

        function createExplosion(x, y, color) {
            const particleCount = 16;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * 120 + 60;
                particle.style.setProperty('--tx', (Math.cos(angle) * velocity) + 'px');
                particle.style.setProperty('--ty', (Math.sin(angle) * velocity) + 'px');
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.backgroundColor = color;
                particle.style.boxShadow = `0 0 10px ${color}`;
                const size = Math.random() * 8 + 4;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 800);
            }
        }

        function showFloatingText(x, y) {
            const el = document.createElement('div');
            el.className = 'float-text';
            el.innerText = 'ॐ'; 
            el.style.left = (x - 20) + 'px'; 
            el.style.top = (y - 20) + 'px';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 800);
        }

        function incrementScore() {
            state.score++;
            scoreEl.innerText = state.score;
            if (state.score % 10 === 0) state.baseSpeedMultiplier += 0.05;
            checkMilestones(state.score);
        }

        // --- Milestone Logic ---
        function checkMilestones(score) {
            // Updated Logic: 50, then 100, then every 100 (200, 300, 400...)
            let shouldShow = false;
            let title = "अद्भुत!";
            let text = score + " नाम पूरे हुए!";

            if (score === 50) {
                shouldShow = true;
                title = "बहुत अच्छे!";
            } else if (score >= 100 && score % 100 === 0) {
                shouldShow = true;
                if (score === 100) title = "अद्भुत!";
                else if (score === 200) title = "दिव्य!";
                else if (score === 500) title = "असाधारण!";
                else if (score === 1000) title = "अलौकिक!";
                else title = "जय हो!";
            }

            if (shouldShow) {
                showMilestone(title, text);
            }
        }

        function showMilestone(title, text) {
            document.getElementById('milestoneTitle').innerText = title;
            document.getElementById('milestoneText').innerText = text;
            milestoneModal.classList.add('show');
            triggerFlowerRain();
            setTimeout(() => {
                milestoneModal.classList.remove('show');
            }, 3000);
        }

        function triggerFlowerRain() {
            const flowers = ['🌸', '🌺', '🌹', '🌻', '🌼', '🌷'];
            const duration = 4000; 
            const interval = setInterval(() => {
                const f = document.createElement('div');
                f.classList.add('flower');
                f.innerText = flowers[Math.floor(Math.random() * flowers.length)];
                f.style.left = Math.random() * 95 + 'vw';
                f.style.animationDuration = Math.random() * 2 + 3 + 's';
                document.body.appendChild(f);
                setTimeout(() => f.remove(), 5000);
            }, 150);
            setTimeout(() => clearInterval(interval), duration);
        }

        // --- Menu Logic ---
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu(!state.isMenuOpen);
        });

        document.addEventListener('click', (e) => {
            if (state.isMenuOpen && !optionsContainer.contains(e.target) && e.target !== menuBtn) {
                toggleMenu(false);
            }
        });

        window.changeMode = function(modeName) {
            state.mode = modeName;
            const config = modes[modeName];
            deityIcon.innerHTML = config.icon;
            document.querySelectorAll('.select-indicator').forEach(el => el.classList.remove('opacity-100'));
            document.querySelectorAll('.select-indicator').forEach(el => el.classList.add('opacity-0'));
            const check = document.getElementById(`check-${modeName}`);
            if(check) {
                check.classList.remove('opacity-0');
                check.classList.add('opacity-100');
            }
            toggleMenu(false);
        }

        function updateUI() {
            deityIcon.innerHTML = modes[state.mode].icon;
        }

        // Keyboard Controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); 
                popNearestBubble();
            }
        });

        function popNearestBubble() {
            if (state.activeBubbles.length === 0) return;
            let lowestBubble = state.activeBubbles.reduce((prev, current) => {
                return (parseFloat(prev.dataset.y) > parseFloat(current.dataset.y)) ? prev : current;
            });
            if (lowestBubble) popBubble(lowestBubble, null);
        }

        // Start
        init();