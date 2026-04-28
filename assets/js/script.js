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

    // ============== ID card pointer-tracked 3D tilt ==============
    const idCard = document.getElementById('idCard');
    if (idCard) {
        idCard.addEventListener('pointermove', (e) => {
            const r = idCard.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            const rx = (-y * 14).toFixed(2);
            const ry = (x * 18).toFixed(2);
            idCard.style.animation = 'none';
            idCard.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
        });
        idCard.addEventListener('pointerleave', () => {
            idCard.style.transform = '';
            idCard.style.animation = '';
        });
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
