class CyberAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playHit(combo = 1) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const baseFreq = 440 + Math.min(combo * 70, 600);
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.15);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playMiss() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }
}

const audio = new CyberAudio();

const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');

function resizeBg() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeBg);
resizeBg();

let gridOffset = 0;
function drawBgGrid() {
    bgCtx.fillStyle = '#030308';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    bgCtx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    bgCtx.lineWidth = 1;

    const gridSize = 40;
    gridOffset = (gridOffset + 0.5) % gridSize;

    for (let x = 0; x < bgCanvas.width; x += gridSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, bgCanvas.height);
        bgCtx.stroke();
    }

    for (let y = gridOffset; y < bgCanvas.height; y += gridSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(bgCanvas.width, y);
        bgCtx.stroke();
    }

    requestAnimationFrame(drawBgGrid);
}
drawBgGrid();

const fxCanvas = document.getElementById('fxCanvas');
const fxCtx = fxCanvas.getContext('2d');
let particles = [];

function resizeFx() {
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeFx);
resizeFx();

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 4 + 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.015;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.alpha -= this.decay;
    }

    draw() {
        fxCtx.save();
        fxCtx.globalAlpha = Math.max(0, this.alpha);
        fxCtx.fillStyle = this.color;
        fxCtx.shadowColor = this.color;
        fxCtx.shadowBlur = 10;
        fxCtx.beginPath();
        fxCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        fxCtx.fill();
        fxCtx.restore();
    }
}

function spawnExplosion(x, y, isSuccess) {
    const count = isSuccess ? 40 : 25;
    const colors = isSuccess 
        ? ['#10b981', '#34d399', '#6ee7b7', '#fbbf24'] 
        : ['#ef4444', '#f87171', '#dc2626'];

    for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, color));
    }
}

function renderFx() {
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(renderFx);
}
renderFx();

const laserPointer = document.getElementById('laserPointer');
const targetZone = document.getElementById('targetZone');
const barWrapper = document.getElementById('barWrapper');
const actionBtn = document.getElementById('actionBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const resetStatsBtn = document.getElementById('resetStatsBtn');
const statusBanner = document.getElementById('statusBanner');
const gameContainer = document.getElementById('gameContainer');
const floatingTextContainer = document.getElementById('floatingTextContainer');

const scoreText = document.getElementById('scoreText');
const highScoreText = document.getElementById('highScoreText');
const comboText = document.getElementById('comboText');
const accuracyText = document.getElementById('accuracyText');
const speedIndicator = document.getElementById('speedIndicator');

const targetNumberDisplay = document.getElementById('targetNumberDisplay');
const currentValueDisplay = document.getElementById('currentValueDisplay');
const targetZoneNum = document.getElementById('targetZoneNum');
const pointerTooltip = document.getElementById('pointerTooltip');

let position = 0;
let direction = 1;
let baseSpeed = 1.1;
let currentSpeed = 1.1;
let isRunning = true;

let score = 0;
let highScore = 0;
let combo = 1;
let totalHits = 0;
let totalRounds = 0;

const MAX_SCALE = 60;
let targetNumber = 30;
let currentValue = 0;

let targetMin = 0;
let targetMax = 0;

function relocateTargetZone() {
    targetNumber = Math.floor(Math.random() * 41) + 10;
    
    const targetCenterPercent = (targetNumber / MAX_SCALE) * 100;
    const zoneWidthPercent = 35; 

    targetMin = Math.max(0, Math.min(65, targetCenterPercent - (zoneWidthPercent / 2)));
    targetMax = targetMin + zoneWidthPercent;

    targetZone.style.left = `${targetMin}%`;
    targetZone.style.width = `${zoneWidthPercent}%`;

    if (targetNumberDisplay) targetNumberDisplay.innerText = targetNumber;
    if (targetZoneNum) targetZoneNum.innerText = targetNumber;
}

relocateTargetZone();

function loop() {
    if (isRunning) {
        position += currentSpeed * direction;

        if (position >= 100) {
            position = 100;
            direction = -1;
        } else if (position <= 0) {
            position = 0;
            direction = 1;
        }

        laserPointer.style.left = `${position}%`;

        currentValue = Math.round((position / 100) * MAX_SCALE);
        if (currentValueDisplay) currentValueDisplay.innerText = currentValue;
        if (pointerTooltip) pointerTooltip.innerText = currentValue;
    }
    requestAnimationFrame(loop);
}
loop();

function showFloatingText(text, colorClass) {
    const el = document.createElement('div');
    el.className = `floating-text font-black font-orbitron text-2xl sm:text-4xl ${colorClass} glow-cyan`;
    el.innerText = text;
    floatingTextContainer.appendChild(el);

    setTimeout(() => el.remove(), 850);
}

function triggerScreenShake() {
    gameContainer.classList.remove('shake-active');
    void gameContainer.offsetWidth;
    gameContainer.classList.add('shake-active');
}

function handleLock() {
    audio.init();

    if (isRunning) {
        isRunning = false;
        totalRounds++;

        const isExactHit = (currentValue === targetNumber);
        const isZoneHit = (position >= targetMin && position <= targetMax);

        const laserRect = laserPointer.getBoundingClientRect();
        const burstX = laserRect.left + laserRect.width / 2;
        const burstY = laserRect.top + laserRect.height / 2;

        if (isZoneHit || isExactHit) {
            totalHits++;
            const bonusMultiplier = isExactHit ? 2 : 1;
            const gainedScore = 100 * combo * bonusMultiplier;
            score += gainedScore;
            if (score > highScore) highScore = score;

            audio.playHit(combo);
            spawnExplosion(burstX, burstY, true);
            triggerScreenShake();

            const messageText = isExactHit ? `NÚMERO EXATO ${targetNumber}! BÔNUS DOUBLE!` : `ACERTOU O ALVO ${targetNumber}!`;
            showFloatingText(`${messageText} +${gainedScore}`, 'text-emerald-400');

            statusBanner.innerText = `🎯 ALVO ALCANÇADO! PAROU EM ${currentValue} (ALVO: ${targetNumber}) [+${gainedScore} PTS]`;
            statusBanner.className = "w-full py-2.5 px-4 rounded-xl text-center font-orbitron font-bold text-xs sm:text-sm tracking-wide bg-emerald-950/80 border border-emerald-500/50 text-emerald-300";

            combo++;
            currentSpeed = Math.min(3.2, baseSpeed + (combo * 0.12));

        } else {
            audio.playMiss();
            spawnExplosion(burstX, burstY, false);
            triggerScreenShake();

            const diff = Math.abs(currentValue - targetNumber);
            showFloatingText(`ERROU POR ${diff}!`, 'text-rose-500');

            score = 0;
            combo = 1;
            currentSpeed = baseSpeed;

            statusBanner.innerText = `❌ DESALINHADO! PAROU EM ${currentValue} (ALVO ERA ${targetNumber}). REINICIANDO.`;
            statusBanner.className = "w-full py-2.5 px-4 rounded-xl text-center font-orbitron font-bold text-xs sm:text-sm tracking-wide bg-rose-950/80 border border-rose-500/50 text-rose-300";
        }

        updateStatsHUD();
        actionBtn.innerText = "PRÓXIMO NÚMERO";

    } else {
        audio.playClick();
        relocateTargetZone();

        isRunning = true;
        actionBtn.innerText = "TRAVAR PULSO [ESPAÇO]";

        statusBanner.innerText = "PRESSIONE ESPAÇO OU TOQUE NO BOTÃO PARA TRAVAR";
        statusBanner.className = "w-full py-2.5 px-4 rounded-xl text-center font-orbitron font-bold text-xs sm:text-sm tracking-wide bg-slate-900/80 border border-slate-800 text-slate-300";
    }
}

function updateStatsHUD() {
    scoreText.innerText = score;
    highScoreText.innerText = highScore;
    comboText.innerText = `x${combo}`;

    const accuracy = totalRounds > 0 ? Math.round((totalHits / totalRounds) * 100) : 0;
    accuracyText.innerText = `${accuracy}%`;

    speedIndicator.innerText = `VELOCIDADE: ${currentSpeed.toFixed(1)}x`;
}

actionBtn.addEventListener('click', handleLock);
barWrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    handleLock();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return;
        handleLock();
    }
});

soundToggleBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    soundToggleBtn.innerText = audio.muted ? "🔇 ÁUDIO: DESLIGADO" : "🔊 ÁUDIO: LIGADO";
});

resetStatsBtn.addEventListener('click', () => {
    audio.playClick();
    score = 0;
    highScore = 0;
    combo = 1;
    totalHits = 0;
    totalRounds = 0;
    currentSpeed = baseSpeed;
    updateStatsHUD();

    statusBanner.innerText = "ESTATÍSTICAS ZERADAS";
    statusBanner.className = "w-full py-2.5 px-4 rounded-xl text-center font-orbitron font-bold text-xs sm:text-sm tracking-wide bg-slate-900/80 border border-slate-800 text-slate-300";

    if (!isRunning) {
        isRunning = true;
        actionBtn.innerText = "TRAVAR PULSO [ESPAÇO]";
    }
});