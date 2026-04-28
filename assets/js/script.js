/* ===================================================
   MEDTECH — Interaction & Reveal
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Add reveal class to elements that should animate in (excluding sensors —
    // they have their own dedicated animation defined in CSS)
    const revealTargets = [
        '.section__head',
        '.intro__lead',
        '.intro__body',
        '.video-frame',
        '.step',
        '.connect__content',
        '.connect__qr'
    ];
    revealTargets.forEach(sel => {
        document.querySelectorAll(sel).forEach((el, idx) => {
            el.classList.add('reveal');
            if (idx % 4 === 1) el.classList.add('reveal--delay-1');
            if (idx % 4 === 2) el.classList.add('reveal--delay-2');
            if (idx % 4 === 3) el.classList.add('reveal--delay-3');
        });
    });

    // IntersectionObserver to trigger reveals (and sensor stagger)
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal, .sensor, .step').forEach(el => io.observe(el));

    // 3D pointer tilt on sensor cards
    document.querySelectorAll('.sensor').forEach(card => {
        const reset = () => {
            card.style.transform = '';
        };
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            const rx = (-y * 8).toFixed(2);
            const ry = (x * 10).toFixed(2);
            card.style.transform = `translateY(-8px) scale(1.02) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
        card.addEventListener('pointerleave', reset);
    });

    // Smooth-scroll offset for fixed nav (already smooth via CSS, but adjust anchor offset)
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    // Parallax pulse in hero
    const pulse = document.querySelector('.hero__pulse');
    if (pulse) {
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (y < 800) pulse.style.transform = `translateY(calc(-50% + ${y * 0.15}px))`;
        }, { passive: true });
    }

    // ============== ID card random tumbling + drag + click particles ==============
    const idCard = document.getElementById('idCard');
    const idCardInner = document.getElementById('idCardInner');
    if (idCard && idCardInner) {
        // Multi-axis rotation state
        let angleX = 0, angleY = 0, angleZ = 0;
        let velX = 6, velY = 22, velZ = 0;
        const BASE_X = 6;
        const BASE_Y = 22;
        const BASE_Z = 0;
        const DECAY = 1.3;
        const DRAG_SENS = 1.4;

        let lastTime = performance.now();
        let dragging = false;
        let lastPointerX = 0, lastPointerY = 0;
        let totalMove = 0;
        let pointerId = null;

        // Random impulses periodically to make rotation feel alive / non-repetitive
        const scheduleImpulse = () => {
            const t = 2000 + Math.random() * 3500;
            setTimeout(() => {
                velX += (Math.random() - 0.5) * 60;
                velZ += (Math.random() - 0.5) * 30;
                if (Math.random() < 0.35) velY += (Math.random() - 0.5) * 90;
                scheduleImpulse();
            }, t);
        };
        scheduleImpulse();

        const onPointerDown = (e) => {
            dragging = true;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            totalMove = 0;
            pointerId = e.pointerId;
            try { idCard.setPointerCapture(e.pointerId); } catch (_) {}
            e.preventDefault();
        };
        const onPointerMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - lastPointerX;
            const dy = e.clientY - lastPointerY;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            totalMove += Math.abs(dx) + Math.abs(dy);
            velY += dx * DRAG_SENS;
            velX -= dy * DRAG_SENS * 0.7;
        };
        const onPointerUp = (e) => {
            if (!dragging) return;
            dragging = false;
            try { idCard.releasePointerCapture(pointerId); } catch (_) {}
            // Treat near-stationary release as a click → particle burst
            if (totalMove < 8) {
                spawnParticles(e.clientX, e.clientY);
                // Add a fun spin kick so the click "reacts"
                velY += (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 120);
                velX += (Math.random() - 0.5) * 80;
                velZ += (Math.random() - 0.5) * 40;
            }
        };

        idCard.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        const decayTo = (v, base, dt) => base + (v - base) * Math.exp(-DECAY * dt);

        const tick = (now) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            velX = decayTo(velX, BASE_X, dt);
            velY = decayTo(velY, BASE_Y, dt);
            velZ = decayTo(velZ, BASE_Z, dt);

            angleX += velX * dt;
            angleY += velY * dt;
            angleZ += velZ * dt;

            idCardInner.style.transform =
                `rotateX(${angleX.toFixed(2)}deg) ` +
                `rotateY(${angleY.toFixed(2)}deg) ` +
                `rotateZ(${angleZ.toFixed(2)}deg)`;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    // ============== Galaxy burst ==============
    function spawnParticles(x, y) {
        const HOT  = ['#ffffff', '#fff0fa', '#fff3a8'];           // core stars
        const WARM = ['#ff77e0', '#ff3d57', '#a06bff'];           // mid arm
        const COOL = ['#2f6bff', '#00e0c6', '#5fc8ff'];           // outer arm
        const DUST = ['#ffffff', '#ffe5f0', '#bce8ff', '#a5ffe6'];

        const direction = Math.random() < 0.5 ? 1 : -1;   // random spin direction
        const baseAngle = Math.random() * Math.PI * 2;

        // ===== 1. Bright core flash =====
        const core = document.createElement('div');
        core.style.cssText = `
            position: fixed; left: ${x}px; top: ${y}px;
            width: 26px; height: 26px;
            border-radius: 50%;
            background: radial-gradient(circle,
                #ffffff 0%,
                #ffd9f5 30%,
                rgba(255,170,240,0.5) 55%,
                transparent 75%);
            box-shadow:
                0 0 40px #ffffff,
                0 0 90px #ff77e0,
                0 0 160px #7a5cff;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%) scale(0);
            will-change: transform, opacity;
        `;
        document.body.appendChild(core);
        const coreStart = performance.now();
        const animateCore = (now) => {
            const t = (now - coreStart) / 700;
            if (t >= 1) { core.remove(); return; }
            const scale = t < 0.18 ? (t / 0.18) * 1.6 : 1.6 + (t - 0.18) * 0.9;
            core.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(2)})`;
            core.style.opacity = (1 - t).toFixed(3);
            requestAnimationFrame(animateCore);
        };
        requestAnimationFrame(animateCore);

        // ===== 2. Nebula cloud (soft purple/cyan blur) =====
        const nebula = document.createElement('div');
        nebula.style.cssText = `
            position: fixed; left: ${x}px; top: ${y}px;
            width: 220px; height: 220px;
            border-radius: 50%;
            background: radial-gradient(circle,
                rgba(160,107,255,0.55) 0%,
                rgba(47,107,255,0.30) 35%,
                rgba(0,224,198,0.15) 60%,
                transparent 80%);
            filter: blur(18px);
            pointer-events: none;
            z-index: 9998;
            transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
            opacity: 0;
            will-change: transform, opacity;
            mix-blend-mode: screen;
        `;
        document.body.appendChild(nebula);
        const nebulaStart = performance.now();
        const animateNebula = (now) => {
            const t = (now - nebulaStart) / 1600;
            if (t >= 1) { nebula.remove(); return; }
            const scale = 0.3 + t * 1.6;
            const opacity = t < 0.18 ? (t / 0.18) : (1 - (t - 0.18) / 0.82);
            nebula.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(2)}) rotate(${(t * 80 * direction).toFixed(1)}deg)`;
            nebula.style.opacity = opacity.toFixed(3);
            requestAnimationFrame(animateNebula);
        };
        requestAnimationFrame(animateNebula);

        // ===== 3. Spiral arms =====
        const ARMS = 3;
        const PER_ARM = 24;
        for (let arm = 0; arm < ARMS; arm++) {
            const armSeed = (arm / ARMS) * Math.PI * 2 + baseAngle;
            for (let i = 0; i < PER_ARM; i++) {
                const k = i / PER_ARM;       // 0 (inner) → 1 (outer)
                const initRadius = 4 + k * 26;
                const initAngle  = armSeed + k * 1.4 * direction;

                let palette;
                if (k < 0.3)      palette = HOT;
                else if (k < 0.65) palette = WARM;
                else               palette = COOL;
                const color = palette[Math.floor(Math.random() * palette.length)];
                const size  = 2.5 + (1 - k) * 4 + Math.random() * 2;

                const startX = x + Math.cos(initAngle) * initRadius;
                const startY = y + Math.sin(initAngle) * initRadius;

                const p = document.createElement('div');
                p.style.cssText = `
                    position: fixed;
                    left: ${startX}px; top: ${startY}px;
                    width: ${size}px; height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    pointer-events: none;
                    box-shadow: 0 0 ${size * 3}px ${color}, 0 0 ${size * 6}px ${color};
                    z-index: 9999;
                    transform: translate(-50%, -50%);
                    will-change: transform, opacity;
                `;
                document.body.appendChild(p);

                let angle  = initAngle;
                let radius = initRadius;
                const rotSpeed = direction * (1.8 - k * 0.9);          // rad/sec, faster inner
                const expandSpeed = 70 + k * 200 + Math.random() * 60; // px/sec
                let life = 1;
                let lastT = performance.now();

                const animate = (now) => {
                    const dt = (now - lastT) / 1000;
                    lastT = now;
                    angle  += rotSpeed * dt;
                    radius += expandSpeed * dt;
                    life -= dt * 0.75;
                    if (life <= 0) { p.remove(); return; }
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    p.style.left = px + 'px';
                    p.style.top  = py + 'px';
                    p.style.opacity = life.toFixed(3);
                    p.style.transform = `translate(-50%, -50%) scale(${(0.5 + life * 0.5).toFixed(2)})`;
                    requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        }

        // ===== 4. Twinkling star dust =====
        const DUST_COUNT = 32;
        for (let i = 0; i < DUST_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 90 + Math.random() * 320;
            const size  = 1.4 + Math.random() * 2;
            const color = DUST[Math.floor(Math.random() * DUST.length)];

            const p = document.createElement('div');
            p.style.cssText = `
                position: fixed;
                left: ${x}px; top: ${y}px;
                width: ${size}px; height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                box-shadow: 0 0 ${size * 5}px ${color};
                z-index: 9999;
                transform: translate(-50%, -50%);
                will-change: transform, opacity;
            `;
            document.body.appendChild(p);

            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            let posX = x, posY = y;
            let life = 1;
            const phase = Math.random() * Math.PI * 2;
            let lastT = performance.now();
            const animate = (now) => {
                const dt = (now - lastT) / 1000;
                lastT = now;
                posX += vx * dt;
                posY += vy * dt;
                vx *= 0.985;
                vy *= 0.985;
                life -= dt * 0.65;
                if (life <= 0) { p.remove(); return; }
                const twinkle = 0.55 + 0.45 * Math.sin(now / 75 + phase);
                p.style.left = posX + 'px';
                p.style.top  = posY + 'px';
                p.style.opacity = (life * twinkle).toFixed(3);
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        }
    }

    // Breakdown video — silent autoplay loop, audio fade-in on user interaction
    const video = document.getElementById('breakdownVideo');
    if (video) {
        // Critical: stay muted for autoplay to be allowed by browsers.
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');

        const tryPlay = () => {
            const p = video.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {
                    // Retry once on next animation frame
                    requestAnimationFrame(() => video.play().catch(() => {}));
                });
            }
        };

        // Kick off playback as early as possible
        tryPlay();
        video.addEventListener('loadedmetadata', tryPlay, { once: true });
        video.addEventListener('canplay', tryPlay, { once: true });

        // If anything pauses it (tab switch, codec hiccup), resume the loop
        video.addEventListener('pause', () => {
            if (!video.ended && document.visibilityState === 'visible') {
                setTimeout(tryPlay, 100);
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') tryPlay();
        });

        // Audio: unmute the instant the video is in view AND the user has
        // produced a gesture the browser counts as "activation". Browsers do
        // NOT count plain scroll as activation — but wheel, pointerdown, key,
        // touch, and click all do. We listen for all of them.
        let fadeStarted = false;
        let userActivated = false;
        let videoInView = false;

        const FADE_DURATION_MS = 400; // near-instant ramp
        const fadeInVolume = () => {
            if (fadeStarted) return;
            fadeStarted = true;
            video.volume = 0;
            video.muted = false;
            tryPlay();
            const start = performance.now();
            const step = (now) => {
                const t = Math.min((now - start) / FADE_DURATION_MS, 1);
                video.volume = t;
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        const maybeStart = () => {
            if (userActivated && videoInView) fadeInVolume();
        };

        const audioObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    videoInView = true;
                    maybeStart();
                }
            });
        }, { threshold: 0.25 });
        audioObserver.observe(video);

        const onActivation = () => {
            userActivated = true;
            maybeStart();
        };
        ['pointerdown', 'mousedown', 'click', 'keydown', 'touchstart', 'wheel']
            .forEach(evt => window.addEventListener(evt, onActivation, { once: true, passive: true }));
    }
});
