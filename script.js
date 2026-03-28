/* ============================================
   Naam Jaap - Enhanced Script
   ============================================ */

// Game State
const state = {
    mode: 'sitaram',
    score: 0,
    totalSkips: 0,
    baseSpeedMultiplier: 1.0,
    manualSpeedFactor: 1.0,
    activeBubbles: [],
    isMenuOpen: false,
    topBarVisible: true,
    isPaused: false,
    isQuickHidden: false,
    lastSpawnTime: 0,
    spawnInterval: 1200,
    gameLoopId: null,
    startTime: Date.now()
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
const pausePlayBtn = document.getElementById('pausePlayBtn');
const pausePlayIcon = document.getElementById('pausePlayIcon');
const pausePlayText = document.getElementById('pausePlayText');
const counterBox = document.getElementById('counterBox');
const statsPopup = document.getElementById('statsPopup');

// --- Initialization ---
function init() {
    updateUI();
    requestAnimationFrame(gameLoop);
    document.getElementById(`check-${state.mode}`).classList.replace('opacity-0', 'opacity-100');
    setupLongPress();
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

// --- Layout Controls (Original Buttons) ---
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
    toggleMenu(false);
}

function toggleTopBar() {
    state.topBarVisible = !state.topBarVisible;

    if (state.topBarVisible) {
        topBar.classList.remove('hidden-bar');
        toggleBarBtn.innerHTML = '<i class="fas fa-eye-slash w-5 text-center"></i> <span class="text-sm font-bold">ऊपर की पट्टी हटाएं (Hide Bar)</span>';
        menuBtn.classList.remove('menu-bottom-pos');
        menuBtn.classList.add('menu-top-pos');
        optionsContainer.classList.remove('origin-bottom-right');
        optionsContainer.classList.add('origin-top-right');
    } else {
        topBar.classList.add('hidden-bar');
        toggleBarBtn.innerHTML = '<i class="fas fa-eye w-5 text-center"></i> <span class="text-sm font-bold">ऊपर की पट्टी दिखाएं (Show Bar)</span>';
        menuBtn.classList.remove('menu-top-pos');
        menuBtn.classList.add('menu-bottom-pos');
        optionsContainer.classList.remove('origin-top-right');
        optionsContainer.classList.add('origin-bottom-right');
    }

    toggleMenu(false);
}

// --- Quick Hide & Full Screen (Combined One Button) ---
function quickHideAndFullScreen() {
    state.isQuickHidden = !state.isQuickHidden;

    if (state.isQuickHidden) {
        // Hide top bar
        topBar.classList.add('hidden-bar');
        state.topBarVisible = false;

        // Move menu button to bottom
        menuBtn.classList.remove('menu-top-pos');
        menuBtn.classList.add('menu-bottom-pos');
        optionsContainer.classList.remove('origin-top-right');
        optionsContainer.classList.add('origin-bottom-right');

        // Enter fullscreen
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => {
                console.log(`Fullscreen error: ${e.message}`);
            });
        }

        // Update button text
        const btn = document.getElementById('quickHideFullBtn');
        btn.innerHTML = '<i class="fas fa-undo w-5 text-center"></i><span class="text-sm font-bold">वापस दिखाएं (Restore)</span>';
    } else {
        // Show top bar
        topBar.classList.remove('hidden-bar');
        state.topBarVisible = true;

        // Move menu button to top
        menuBtn.classList.remove('menu-bottom-pos');
        menuBtn.classList.add('menu-top-pos');
        optionsContainer.classList.remove('origin-bottom-right');
        optionsContainer.classList.add('origin-top-right');

        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        // Update button text
        const btn = document.getElementById('quickHideFullBtn');
        btn.innerHTML = '<i class="fas fa-bolt w-5 text-center"></i><span class="text-sm font-bold">क्विक हाइड + फुल स्क्रीन</span>';
    }

    toggleMenu(false);
}

// --- Pause / Play (Screen freeze only, menu stays) ---
function togglePausePlay() {
    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        pausePlayIcon.classList.remove('fa-pause');
        pausePlayIcon.classList.add('fa-play');
        pausePlayText.innerText = 'चलाएं (Play)';
    } else {
        pausePlayIcon.classList.remove('fa-play');
        pausePlayIcon.classList.add('fa-pause');
        pausePlayText.innerText = 'रुकें (Pause)';
        state.lastSpawnTime = 0; // Reset to avoid burst spawn
    }
    // Menu stays open - don't close it
}

// Make functions global
window.togglePausePlay = togglePausePlay;
window.quickHideAndFullScreen = quickHideAndFullScreen;
window.toggleFullScreen = toggleFullScreen;
window.toggleTopBar = toggleTopBar;

// --- Long Press on Counter for Stats ---
function setupLongPress() {
    let longPressTimer = null;
    let isLongPress = false;

    const startPress = (e) => {
        isLongPress = false;
        counterBox.classList.add('counter-long-press');
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            counterBox.classList.remove('counter-long-press');
            showStatsPopup();
        }, 600);
    };

    const endPress = (e) => {
        clearTimeout(longPressTimer);
        counterBox.classList.remove('counter-long-press');
    };

    counterBox.addEventListener('mousedown', startPress);
    counterBox.addEventListener('mouseup', endPress);
    counterBox.addEventListener('mouseleave', endPress);
    counterBox.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startPress(e);
    });
    counterBox.addEventListener('touchend', endPress);
    counterBox.addEventListener('touchcancel', endPress);
}

function showStatsPopup() {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const rate = elapsed > 0 ? Math.round((state.score / elapsed) * 60) : 0;

    document.getElementById('statTotalClicks').innerText = state.score;
    document.getElementById('statTotalSkips').innerText = state.totalSkips;
    document.getElementById('statTime').innerText = timeStr;
    document.getElementById('statRate').innerText = rate;

    statsPopup.classList.add('show');
}

function closeStatsPopup() {
    statsPopup.classList.remove('show');
}
window.closeStatsPopup = closeStatsPopup;

// Close stats on background click
statsPopup.addEventListener('click', (e) => {
    if (e.target === statsPopup) closeStatsPopup();
});

// --- Menu Logic ---
function toggleMenu(show) {
    state.isMenuOpen = show;
    if (show) {
        optionsContainer.classList.remove('scale-0', 'opacity-0');
    } else {
        optionsContainer.classList.add('scale-0', 'opacity-0');
    }
}

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu(!state.isMenuOpen);
});

document.addEventListener('click', (e) => {
    if (state.isMenuOpen && !optionsContainer.contains(e.target) && e.target !== menuBtn) {
        toggleMenu(false);
    }
});

// --- Game Loop ---
function gameLoop(timestamp) {
    if (!state.isPaused) {
        if (!state.lastSpawnTime) state.lastSpawnTime = timestamp;
        const delta = timestamp - state.lastSpawnTime;
        const effectiveSpawnInterval = state.spawnInterval / state.manualSpeedFactor;

        if (delta > effectiveSpawnInterval) {
            spawnBubble();
            state.lastSpawnTime = timestamp;
            if (state.spawnInterval > 400) state.spawnInterval -= 1;
        }
        moveBubbles();
    }
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
            state.totalSkips++; // Track skipped bubbles
        }
    }
}

// --- Interaction (Enhanced Pop) ---
function popBubble(bubble, event) {
    if (bubble.classList.contains('bursting')) return;

    const rect = bubble.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const color = bubble.dataset.color || '#ea580c';

    // Multiple effects for richer animation
    createExplosion(centerX, centerY, color);
    createRingBurst(centerX, centerY, color);
    createShockwave(centerX, centerY, color);
    createSparkles(centerX, centerY, color);

    bubble.classList.add('bursting');
    bubble.innerHTML = '<i class="fas fa-bahai text-yellow-200 text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"></i>';

    const index = state.activeBubbles.indexOf(bubble);
    if (index > -1) state.activeBubbles.splice(index, 1);

    showFloatingText(centerX, centerY);
    incrementScore();

    setTimeout(() => {
        if (bubble && bubble.parentNode) bubble.remove();
    }, 400);
}

function createExplosion(x, y, color) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.3);
        const velocity = Math.random() * 140 + 70;
        particle.style.setProperty('--tx', (Math.cos(angle) * velocity) + 'px');
        particle.style.setProperty('--ty', (Math.sin(angle) * velocity) + 'px');
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 12px ${color}, 0 0 24px ${color}`;
        const size = Math.random() * 8 + 3;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 900);
    }
}

function createRingBurst(x, y, color) {
    const ring = document.createElement('div');
    ring.classList.add('ring-burst');
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.width = '40px';
    ring.style.height = '40px';
    ring.style.borderColor = color;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
}

function createShockwave(x, y, color) {
    const wave = document.createElement('div');
    wave.classList.add('shockwave');
    wave.style.left = x + 'px';
    wave.style.top = y + 'px';
    wave.style.color = color;
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 500);
}

function createSparkles(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        sparkle.style.left = (x + offsetX) + 'px';
        sparkle.style.top = (y + offsetY) + 'px';
        sparkle.style.color = color;
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 600);
    }
}


function showFloatingText(x, y) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.innerText = 'ॐ';
    el.style.left = (x - 20) + 'px';
    el.style.top = (y - 20) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
}

function incrementScore() {
    state.score++;
    scoreEl.innerText = state.score;

    // Score pop animation
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth; // Trigger reflow
    scoreEl.classList.add('score-pop');

    if (state.score % 10 === 0) state.baseSpeedMultiplier += 0.05;
    checkMilestones(state.score);
}

// --- Milestone Logic ---
// At 50: NO flower rain, nothing
// At 100, 200, 300...: ONLY flower rain, no popup/counting number
function checkMilestones(score) {
    if (score >= 100 && score % 100 === 0) {
        triggerFlowerRain();
    }
    // 50 - do nothing (no flower rain, no popup)
}

function triggerFlowerRain() {
    const flowers = ['🌸', '🌺', '🌹', '🌻', '🌼', '🌷', '💐', '🪷'];
    const duration = 4500;
    const interval = setInterval(() => {
        const f = document.createElement('div');
        f.classList.add('flower');
        f.innerText = flowers[Math.floor(Math.random() * flowers.length)];
        f.style.left = Math.random() * 95 + 'vw';
        f.style.animationDuration = Math.random() * 2 + 3 + 's';
        f.style.fontSize = (Math.random() * 16 + 22) + 'px';
        document.body.appendChild(f);
        setTimeout(() => f.remove(), 5500);
    }, 120);
    setTimeout(() => clearInterval(interval), duration);
}

// --- Mode Change ---
window.changeMode = function(modeName) {
    state.mode = modeName;
    const config = modes[modeName];
    deityIcon.innerHTML = config.icon;
    document.querySelectorAll('.select-indicator').forEach(el => el.classList.remove('opacity-100'));
    document.querySelectorAll('.select-indicator').forEach(el => el.classList.add('opacity-0'));
    const check = document.getElementById(`check-${modeName}`);
    if (check) {
        check.classList.remove('opacity-0');
        check.classList.add('opacity-100');
    }
    toggleMenu(false);
}

function updateUI() {
    deityIcon.innerHTML = modes[state.mode].icon;
}

// --- Keyboard Controls ---
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!state.isPaused) popNearestBubble();
    }
});

function popNearestBubble() {
    if (state.activeBubbles.length === 0) return;
    let lowestBubble = state.activeBubbles.reduce((prev, current) => {
        return (parseFloat(prev.dataset.y) > parseFloat(current.dataset.y)) ? prev : current;
    });
    if (lowestBubble) popBubble(lowestBubble, null);
}

// --- Handle fullscreen exit via ESC ---
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && state.isQuickHidden) {
        // User exited fullscreen via ESC, restore UI
        state.isQuickHidden = false;
        topBar.classList.remove('hidden-bar');
        state.topBarVisible = true;
        menuBtn.classList.remove('menu-bottom-pos');
        menuBtn.classList.add('menu-top-pos');
        optionsContainer.classList.remove('origin-bottom-right');
        optionsContainer.classList.add('origin-top-right');
        const btn = document.getElementById('quickHideFullBtn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-eye-slash w-5 text-center"></i><span class="text-sm font-bold">क्विक हाइड + फुल स्क्रीन</span>';
        }
    }
});

// Start
init();