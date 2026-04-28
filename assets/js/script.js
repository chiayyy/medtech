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

    // ============== Subtle dust burst ==============
    function spawnParticles(x, y) {
        const DUST_COUNT = 22;
        for (let i = 0; i < DUST_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 200;
            const size  = 1.2 + Math.random() * 1.4;

            const p = document.createElement('div');
            p.style.cssText = `
                position: fixed;
                left: ${x}px; top: ${y}px;
                width: ${size}px; height: ${size}px;
                background: #ffffff;
                border-radius: 50%;
                pointer-events: none;
                box-shadow: 0 0 ${size * 3}px rgba(255,255,255,0.85);
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
                life -= dt * 1.0;
                if (life <= 0) { p.remove(); return; }
                const twinkle = 0.6 + 0.4 * Math.sin(now / 80 + phase);
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
