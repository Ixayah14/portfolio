/**
 * Portfolio Client Script
 * Themed after 21st.dev Dye Whorl Navier-Stokes Fluid Background
 */

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initThemeToggle();
    initSiteNavigation();
    initOpeningIntro();
    initScrollObserver();
    initScrollSpy();
    initKatanaUnsheathing();
    initSkillsArsenal();
    initFluidInteractivity();
    initDyeWhorlBackground();
});

// Theme Toggle with LocalStorage & Live Fluid Palette Adaptation
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const mobileToggleBtn = document.getElementById('theme-toggle-mobile');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    setTheme(currentTheme);

    function onToggle() {
        const activeTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        setTheme(activeTheme);
        if (window.dyeWhorlInstance) {
            window.dyeWhorlInstance.dropBead(window.innerWidth / 2, window.innerHeight * 0.4, 0.1, 300);
        }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', onToggle);
    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', onToggle);

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (toggleBtn) {
            const label = toggleBtn.querySelector('.theme-label');
            if (label) {
                label.textContent = theme === 'light' ? '和紙 LIGHT' : '漆黒 DARK';
            }
        }
        if (mobileToggleBtn) {
            const mText = mobileToggleBtn.querySelector('.mobile-theme-text');
            if (mText) {
                mText.textContent = theme === 'light' ? 'THEME // 和紙 LIGHT' : 'THEME // 漆黒 DARK';
            }
        }
    }
}

// Master Site Navigation & Mobile Drawer Overlay
function initSiteNavigation() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-nav-drawer');
    const closeBtn = document.getElementById('mobile-drawer-close');
    const backdrop = document.getElementById('mobile-drawer-backdrop');

    function openDrawer() {
        if (!drawer) return;
        drawer.classList.add('active');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflowY = 'hidden';
    }

    function closeDrawer() {
        if (!drawer) return;
        drawer.classList.remove('active');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflowY = '';
    }

    if (menuBtn) menuBtn.addEventListener('click', () => {
        if (drawer && drawer.classList.contains('active')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer && drawer.classList.contains('active')) {
            closeDrawer();
        }
    });

    // Auto-close drawer on link click
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            closeDrawer();
        });
    });
}

// ScrollSpy across Top Header, Mobile Drawer, and Katana Rail Waypoints
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const headerLinks = document.querySelectorAll('.nav-item-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    const katanaNodes = document.querySelectorAll('.katana-waypoint-node');

    if (!sections.length) return;

    function updateActiveNav() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 220;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (!currentSectionId && window.scrollY < 300) {
            currentSectionId = 'hero';
        }

        if (currentSectionId) {
            headerLinks.forEach(link => {
                if (link.getAttribute('data-section') === currentSectionId || link.getAttribute('href') === '#' + currentSectionId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            mobileLinks.forEach(link => {
                if (link.getAttribute('data-section') === currentSectionId || link.getAttribute('href') === '#' + currentSectionId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            katanaNodes.forEach(node => {
                if (node.getAttribute('data-section') === currentSectionId || node.getAttribute('href') === '#' + currentSectionId) {
                    node.classList.add('active');
                } else {
                    node.classList.remove('active');
                }
            });
        }
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
}

// Shared state for Katana Sheath Dragging vs Clicking
let isKatanaDragging = false;
let katanaDragOccurred = false;

// Master Katana Scrolling Unsheathing Engine & Interactive Drag Scrubber
function initKatanaUnsheathing() {
    const sayaEl = document.getElementById('katana-saya-sheath');
    const katanaSvgStage = document.getElementById('katana-svg-stage');
    const depthNum = document.getElementById('katana-depth-num');
    const stanceText = document.getElementById('katana-stance-text');
    const sparkEl = document.getElementById('katana-sheath-spark');
    const glintEl = document.getElementById('katana-blade-glint');
    const mobileProgress = document.getElementById('mobile-katana-blade-progress');
    const mobilePct = document.getElementById('mobile-katana-pct');

    // Scabbard travel physics for elongated Katana
    const maxTravel = 470; // Max downward pixel slide of saya along elongated blade
    let targetSayaY = 0;
    let currentSayaY = 0;
    let targetPct = 0;
    let currentPct = 0;
    let lastScrollY = window.scrollY;
    let isTicking = false;
    let sparkTimeout = null;

    function onScroll() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentScroll = window.scrollY;
        if (maxScroll <= 0) {
            targetPct = 0;
        } else if (currentScroll <= 6) {
            targetPct = 0;
        } else if (maxScroll - currentScroll <= 6) {
            targetPct = 100;
        } else {
            targetPct = Math.min(100, Math.max(0, (currentScroll / maxScroll) * 100));
        }
        targetSayaY = (targetPct / 100) * maxTravel;

        // Spark pulse when unsheathing
        const scrollDelta = Math.abs(currentScroll - lastScrollY);
        lastScrollY = currentScroll;

        if (sparkEl && scrollDelta > 1.5) {
            sparkEl.style.opacity = '1';
            clearTimeout(sparkTimeout);
            sparkTimeout = setTimeout(() => {
                if (sparkEl) sparkEl.style.opacity = '0';
            }, 180);
        }

        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(animateUnsheathe);
        }
    }

    function animateUnsheathe() {
        // Smooth lerp easing for heavy mechanical weight of the scabbard
        const diff = targetSayaY - currentSayaY;
        currentSayaY += diff * 0.22;

        const pctDiff = targetPct - currentPct;
        currentPct += pctDiff * 0.22;

        // Clean edge snapping at extremities
        if (targetPct === 100 && currentPct > 96.5) {
            currentPct = 100;
            currentSayaY = maxTravel;
        } else if (targetPct === 0 && currentPct < 3.5) {
            currentPct = 0;
            currentSayaY = 0;
        }

        if (sayaEl) {
            sayaEl.style.transform = 'translateY(' + currentSayaY.toFixed(2) + 'px)';
        }

        const roundedPct = Math.round(currentPct);

        // Update HUD Depth text
        if (depthNum) {
            depthNum.textContent = roundedPct + '%';
        }

        // Update Stance Badge based on unsheathing depth
        if (stanceText) {
            if (roundedPct < 15) {
                stanceText.textContent = '居合 // IAI';
            } else if (roundedPct < 45) {
                stanceText.textContent = '抜刀 // DRAWING';
            } else if (roundedPct < 80) {
                stanceText.textContent = '刃文 // HAMON';
            } else {
                stanceText.textContent = '一刀 // BATTLE';
            }
        }

        // Specular Glint position along elongated blade edge
        if (glintEl) {
            const glintY = 90 + (currentSayaY * 0.98);
            glintEl.setAttribute('cy', Math.min(550, glintY).toFixed(1));
            glintEl.style.opacity = roundedPct > 5 ? '0.9' : '0';
        }

        // Mobile Progress Bar
        if (mobileProgress) {
            mobileProgress.style.width = roundedPct + '%';
        }
        if (mobilePct) {
            mobilePct.textContent = roundedPct + '% 抜刀';
        }

        if (Math.abs(diff) > 0.1 || Math.abs(pctDiff) > 0.1) {
            requestAnimationFrame(animateUnsheathe);
        } else {
            currentSayaY = targetSayaY;
            currentPct = targetPct;
            if (sayaEl) sayaEl.style.transform = 'translateY(' + currentSayaY.toFixed(2) + 'px)';
            if (depthNum) depthNum.textContent = Math.round(currentPct) + '%';
            if (mobileProgress) mobileProgress.style.width = Math.round(currentPct) + '%';
            if (mobilePct) mobilePct.textContent = Math.round(currentPct) + '% 抜刀';
            isTicking = false;
        }
    }

    // Interactive Drag-to-Scroll (Hold scabbard and drag vertically to scrub the page)
    let dragStartY = 0;
    let dragStartScrollY = 0;

    function handlePointerDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        isKatanaDragging = true;
        katanaDragOccurred = false;
        dragStartY = e.clientY;
        dragStartScrollY = window.scrollY;

        // Temporarily disable smooth scroll so dragging tracks 1:1 with zero lag
        document.documentElement.style.scrollBehavior = 'auto';

        try {
            if (katanaSvgStage && typeof katanaSvgStage.setPointerCapture === 'function') {
                katanaSvgStage.setPointerCapture(e.pointerId);
            }
        } catch (err) {}

        document.body.classList.add('sheath-dragging');
        if (sayaEl) {
            sayaEl.classList.add('is-dragging');
            sayaEl.classList.add('sheath-moving');
        }
    }

    function handlePointerMove(e) {
        if (!isKatanaDragging) return;
        const deltaY = e.clientY - dragStartY;
        if (Math.abs(deltaY) > 2) {
            katanaDragOccurred = true;
        }

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) return;

        const stageRect = katanaSvgStage.getBoundingClientRect();
        // The scabbard travel track is proportional to the elongated SVG height
        const travelSpan = stageRect.height * (maxTravel / 620);
        if (travelSpan <= 0) return;

        const targetScroll = Math.max(0, Math.min(maxScroll, dragStartScrollY + (deltaY / travelSpan) * maxScroll));
        window.scrollTo(0, targetScroll);
    }

    function handlePointerUp(e) {
        if (!isKatanaDragging) return;
        isKatanaDragging = false;

        // Restore smooth scrolling for anchor links and buttons
        document.documentElement.style.scrollBehavior = '';

        try {
            if (katanaSvgStage && typeof katanaSvgStage.releasePointerCapture === 'function') {
                katanaSvgStage.releasePointerCapture(e.pointerId);
            }
        } catch (err) {}

        document.body.classList.remove('sheath-dragging');
        if (sayaEl) {
            sayaEl.classList.remove('is-dragging');
            sayaEl.classList.remove('sheath-moving');
        }

        setTimeout(() => {
            katanaDragOccurred = false;
        }, 120);
    }

    if (katanaSvgStage) {
        katanaSvgStage.addEventListener('pointerdown', handlePointerDown);
        katanaSvgStage.addEventListener('pointermove', handlePointerMove);
        katanaSvgStage.addEventListener('pointerup', handlePointerUp);
        katanaSvgStage.addEventListener('pointercancel', handlePointerUp);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// Custom Interactive Cursor
function initCursor() {
    const cursor = document.querySelector('.cursor');
    if (!cursor) return;

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    const hoverSelectors = 'a, button, .hover-glow, .card, .btn-primary, .btn-secondary, .btn-subtle, .form-input, .form-textarea, .social-icon-btn';
    document.querySelectorAll(hoverSelectors).forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });
}

// Fluid Micro-Interactions (Katana Blade Strike & Fluid Splashes)
function initFluidInteractivity() {
    const toast = document.getElementById('ink-toast');
    const toastText = document.getElementById('ink-toast-text');
    let toastTimeout = null;

    function showToast(msg, icon = '⚔️', duration = 3000) {
        if (!toast || !toastText) return;
        const iconEl = toast.querySelector('.ink-toast-icon');
        if (iconEl) iconEl.textContent = icon;
        toastText.textContent = msg;
        toast.classList.add('active');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, duration);
    }

    // Katana Ink Cleave Strike (抜刀一閃)
    const railStrikeBtn = document.getElementById('katana-rail-strike');
    const katanaSvgStage = document.getElementById('katana-svg-stage');
    const strikeOverlay = document.getElementById('katana-strike-overlay');
    let isStriking = false;

    function executeKatanaStrike() {
        if (isStriking) return;
        isStriking = true;

        const strikeTextEl = railStrikeBtn ? railStrikeBtn.querySelector('.strike-text') : null;
        const strikeKanjiEl = railStrikeBtn ? railStrikeBtn.querySelector('.strike-kanji') : null;
        if (strikeTextEl) strikeTextEl.textContent = 'SLASH!';
        if (strikeKanjiEl) strikeKanjiEl.textContent = '一閃!';

        // 1. Trigger Screen Slash Overlay & Recoil
        if (strikeOverlay) {
            strikeOverlay.classList.remove('active');
            void strikeOverlay.offsetWidth; // Force reflow
            strikeOverlay.classList.add('active');
        }
        document.body.classList.remove('screen-katana-recoil');
        void document.body.offsetWidth;
        document.body.classList.add('screen-katana-recoil');

        // 2. Execute Navier-Stokes Blade Cleave in fluid simulation
        if (window.dyeWhorlInstance) {
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (typeof window.dyeWhorlInstance.strikeSlash === 'function') {
                window.dyeWhorlInstance.strikeSlash(w * 0.9, h * 0.12, w * 0.1, h * 0.88, 2.6);
            } else {
                window.dyeWhorlInstance.dropBead(w / 2, h / 2, 0.14, 400);
            }
        }

        // 3. Status Notification
        showToast('抜刀一閃 // KATANA CLEAVE: Blade cleaves across the fluid canvas!', '⚔️', 3000);

        // 4. Reset after animation completes
        setTimeout(() => {
            document.body.classList.remove('screen-katana-recoil');
        }, 350);

        setTimeout(() => {
            if (strikeOverlay) strikeOverlay.classList.remove('active');
            if (strikeTextEl) strikeTextEl.textContent = 'STRIKE';
            if (strikeKanjiEl) strikeKanjiEl.textContent = '一閃';
            isStriking = false;
        }, 1000);
    }

    if (railStrikeBtn) railStrikeBtn.addEventListener('click', executeKatanaStrike);
    if (katanaSvgStage) {
        katanaSvgStage.addEventListener('click', (e) => {
            if (katanaDragOccurred) {
                e.stopPropagation();
                return;
            }
            e.stopPropagation();
            executeKatanaStrike();
        });
    }

    // Glass cards gentle ripple on click
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (window.dyeWhorlInstance && e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                window.dyeWhorlInstance.dropBead(e.clientX, e.clientY, 0.065, 180);
            }
        });
    });

    // Back to top button
    const backToTopBtn = document.querySelector('.back-to-top-btn');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Contact Form submission feedback
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalContent = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="btn-text">MESSAGE SENT // 送信完了 ✓</span>';
                if (window.dyeWhorlInstance) {
                    const rect = submitBtn.getBoundingClientRect();
                    window.dyeWhorlInstance.dropBead(rect.left + rect.width / 2, rect.top, 0.12, 320);
                }
                showToast('拝謁受理 // MESSAGE DISPATCHED TO ISAIAH', '✓', 3500);
                setTimeout(() => {
                    contactForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalContent;
                }, 3500);
            }
        });
    }
}

// 21st.dev Dye Whorl Fluid Preloader / Intro Screen
function initOpeningIntro() {
    const introScreen = document.getElementById('intro-screen');
    const canvas = document.getElementById('intro-shader-canvas');
    const bar = document.getElementById('loader-bar');
    const percentEl = document.getElementById('loader-percent');
    const phaseEl = document.getElementById('loader-phase');
    const skipBtn = document.getElementById('loader-skip');

    if (!introScreen || !canvas) {
        return;
    }

    document.body.classList.add('loading-active');

    let startTime = performance.now();
    let animId = null;

    try {
        const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) || canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
        if (gl) {
            const vsSource = `
                attribute vec2 position;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `;

            const fsSource = `
                #define TWO_PI 6.2831853072
                #define PI 3.14159265359

                precision highp float;
                uniform vec2 resolution;
                uniform float time;

                void main(void) {
                    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
                    float t = time * 0.04;
                    float lineWidth = 0.0025;

                    vec3 color = vec3(0.0);
                    for(int j = 0; j < 3; j++){
                        for(int i = 0; i < 5; i++){
                            color[j] += lineWidth * float(i * i) / abs(fract(t - 0.012 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
                        }
                    }
                    
                    gl_FragColor = vec4(color[0], color[1], color[2], 1.0);
                }
            `;

            function createShader(gl, type, source) {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    gl.deleteShader(shader);
                    return null;
                }
                return shader;
            }

            const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
            const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
            if (vertexShader && fragmentShader) {
                const program = gl.createProgram();
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);

                if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    const positionBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                        -1.0, -1.0,
                         1.0, -1.0,
                        -1.0,  1.0,
                        -1.0,  1.0,
                         1.0, -1.0,
                         1.0,  1.0,
                    ]), gl.STATIC_DRAW);

                    const positionLocation = gl.getAttribLocation(program, 'position');
                    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
                    const timeLocation = gl.getUniformLocation(program, 'time');

                    function resizeCanvas() {
                        const displayWidth = window.innerWidth;
                        const displayHeight = window.innerHeight;
                        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                            canvas.width = displayWidth;
                            canvas.height = displayHeight;
                            gl.viewport(0, 0, canvas.width, canvas.height);
                        }
                    }

                    window.addEventListener('resize', resizeCanvas);
                    resizeCanvas();

                    function render(currentTime) {
                        const elapsedTime = (currentTime - startTime) * 0.001;
                        gl.useProgram(program);
                        gl.enableVertexAttribArray(positionLocation);
                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

                        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
                        gl.uniform1f(timeLocation, elapsedTime);
                        gl.drawArrays(gl.TRIANGLES, 0, 6);

                        animId = requestAnimationFrame(render);
                    }
                    animId = requestAnimationFrame(render);
                }
            }
        }
    } catch (e) {
        console.warn('WebGL shader fallback:', e);
    }

    // Fluid calibration phase progression
    const phases = [
        { threshold: 0, text: 'HONING THE BLADE // 研磨...' },
        { threshold: 25, text: 'INJECTING VORTICITY CONFINEMENT...' },
        { threshold: 50, text: 'SOLVING PRESSURE POISSON EQUATION...' },
        { threshold: 75, text: 'DISPERSING MACCORMACK DYE TANGENTS...' },
        { threshold: 96, text: 'EQUILIBRIUM ACHIEVED. READY.' }
    ];

    let progress = 0;
    let isFinished = false;

    const progressInterval = setInterval(() => {
        if (isFinished) return;
        progress += Math.floor(Math.random() * 5) + 3;
        if (progress > 100) progress = 100;

        if (bar) bar.style.width = progress + '%';
        if (percentEl) percentEl.textContent = progress + '%';

        const currentPhase = [...phases].reverse().find(p => progress >= p.threshold);
        if (currentPhase && phaseEl) {
            phaseEl.textContent = currentPhase.text;
        }

        if (progress >= 100) {
            clearInterval(progressInterval);
            // Brief moment at 100% before the blade strikes
            setTimeout(() => finishIntro(), 280);
        }
    }, 45);

    // Synthesize an authentic, metallic Katana air slash and impact sound using Web Audio API
    function playKatanaSlashSound() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const now = ctx.currentTime;

            // 1. Air blade whoosh (filtered white noise burst)
            const bufferSize = Math.floor(ctx.sampleRate * 0.35);
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(700, now);
            filter.frequency.exponentialRampToValueAtTime(3400, now + 0.07);
            filter.frequency.exponentialRampToValueAtTime(350, now + 0.32);
            filter.Q.setValueAtTime(3.8, now);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.01, now);
            noiseGain.gain.linearRampToValueAtTime(0.85, now + 0.04);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

            whiteNoise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            whiteNoise.start(now);

            // 2. High-frequency metallic steel blade resonance (sharp "SHIIING")
            const steelOsc = ctx.createOscillator();
            const steelGain = ctx.createGain();
            steelOsc.type = 'sine';
            steelOsc.frequency.setValueAtTime(2600, now + 0.02);
            steelOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.48);

            steelGain.gain.setValueAtTime(0.01, now + 0.02);
            steelGain.gain.linearRampToValueAtTime(0.45, now + 0.05);
            steelGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

            steelOsc.connect(steelGain);
            steelGain.connect(ctx.destination);
            steelOsc.start(now + 0.02);
            steelOsc.stop(now + 0.48);

            // 3. Low-frequency punch / physical impact
            const subOsc = ctx.createOscillator();
            const subGain = ctx.createGain();
            subOsc.type = 'triangle';
            subOsc.frequency.setValueAtTime(130, now + 0.02);
            subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

            subGain.gain.setValueAtTime(0.6, now + 0.02);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            subOsc.connect(subGain);
            subGain.connect(ctx.destination);
            subOsc.start(now + 0.02);
            subOsc.stop(now + 0.28);
        } catch (e) {
            // Audio context restricted or unavailable; continue smoothly
        }
    }

    // Spawn sparks radiating outward from along the diagonal cut line
    function spawnCutSparks(container) {
        if (!container) return;
        container.innerHTML = '';
        const sparkCount = 26;
        const w = window.innerWidth;
        const h = window.innerHeight;

        for (let i = 0; i < sparkCount; i++) {
            const spark = document.createElement('span');
            spark.className = 'slash-spark-particle';

            // Point along diagonal from (w*1.0, h*0.38) to (0, h*0.62)
            const t = Math.random();
            const x = (1 - t) * (w * 0.95) + t * (w * 0.05);
            const y = (1 - t) * (h * 0.40) + t * (h * 0.60);

            // Burst outward perpendicularly
            const angle = (Math.random() - 0.5) * Math.PI + Math.PI / 4;
            const dist = 40 + Math.random() * 120;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;

            spark.style.left = `${x}px`;
            spark.style.top = `${y}px`;
            spark.style.setProperty('--tx', `${tx}px`);
            spark.style.setProperty('--ty', `${ty}px`);
            spark.style.animationDelay = `${Math.random() * 0.06}s`;

            container.appendChild(spark);
        }
    }

    // Cinematic Katana Slash Slice: At 100%, slice the intro visibly in two and reveal portfolio!
    function finishIntro() {
        if (isFinished) return;
        isFinished = true;
        clearInterval(progressInterval);
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('resize', resizeCanvas);

        if (bar) bar.style.width = '100%';
        if (percentEl) percentEl.textContent = '100%';
        if (phaseEl) phaseEl.textContent = '抜刀両断 // BLADE CLEAVE EXECUTION';

        const introLiveStage = document.getElementById('intro-live-stage');
        const introSliceTop = document.getElementById('intro-slice-top');
        const introSliceBottom = document.getElementById('intro-slice-bottom');
        const introSlashSvg = document.getElementById('intro-slash-svg');
        const introSlashFlash = document.getElementById('intro-slash-flash');
        const introSlashSparks = document.getElementById('intro-slash-sparks');

        if (introLiveStage && introSliceTop && introSliceBottom && introSlashSvg && introSlashFlash) {
            try {
                // Play metallic katana air slice
                playKatanaSlashSound();

                // 1. Snapshot the shader canvas frame
                let snapshot = '';
                try {
                    snapshot = canvas.toDataURL('image/png');
                } catch (e) {}

                // 2. Clone the visual DOM into both diagonal halves
                const liveContentHtml = introLiveStage.innerHTML;
                introSliceTop.innerHTML = `<div class="intro-slice-half-inner">${liveContentHtml}</div>`;
                introSliceBottom.innerHTML = `<div class="intro-slice-half-inner">${liveContentHtml}</div>`;

                if (snapshot) {
                    introSliceTop.style.backgroundImage = `url(${snapshot})`;
                    introSliceBottom.style.backgroundImage = `url(${snapshot})`;
                }

                // Strip the skip button from sliced panels
                const topSkip = introSliceTop.querySelector('#loader-skip');
                if (topSkip) topSkip.remove();
                const btmSkip = introSliceBottom.querySelector('#loader-skip');
                if (btmSkip) btmSkip.remove();

                // 3. Switch seamlessly from live stage to complementary halves
                introLiveStage.style.display = 'none';
                introSliceTop.style.display = 'block';
                introSliceBottom.style.display = 'block';

                // 4. Trigger the blinding Katana slash beam, flash & screen shake
                introSlashSvg.classList.remove('slashing', 'sheared');
                introSlashFlash.classList.remove('flashing');
                void introSlashSvg.offsetWidth;
                void introSlashFlash.offsetWidth;

                introSlashSvg.classList.add('slashing');
                introSlashFlash.classList.add('flashing');
                introScreen.classList.add('screen-katana-recoil');

                // Burst sparks
                spawnCutSparks(introSlashSparks);

                // 5. In Navier-Stokes fluid background, unleash an ink slash
                if (window.dyeWhorlInstance && typeof window.dyeWhorlInstance.strikeSlash === 'function') {
                    const w = window.innerWidth;
                    const h = window.innerHeight;
                    window.dyeWhorlInstance.strikeSlash(w * 0.95, h * 0.38, w * 0.05, h * 0.62, 3.5);
                }

                // 6. PHASE 1: THE CUT SHEAR (Halves offset slightly so the cut is unmistakably visible!)
                setTimeout(() => {
                    introSliceTop.classList.add('sheared');
                    introSliceBottom.classList.add('sheared');
                    introSlashSvg.classList.add('sheared');
                }, 40);

                // 7. PHASE 2: THE CLEAVE PARTING (Halves slide smoothly off-screen, revealing the portfolio)
                setTimeout(() => {
                    introSliceTop.classList.remove('sheared');
                    introSliceBottom.classList.remove('sheared');
                    introSliceTop.classList.add('parted');
                    introSliceBottom.classList.add('parted');
                }, 480);

                // 8. PHASE 3: ARRIVAL IN PORTFOLIO (Dismiss preloader and stir entrance plume)
                setTimeout(() => {
                    introScreen.style.display = 'none';
                    document.body.classList.remove('loading-active');
                    document.body.classList.remove('screen-katana-recoil');

                    // Stir entrance plume in portfolio hero
                    if (window.dyeWhorlInstance) {
                        window.dyeWhorlInstance.dropBead(window.innerWidth / 2, window.innerHeight * 0.35, 0.1, 240);
                    }
                }, 1200);

                return;
            } catch (err) {
                console.warn('Katana slice fallback to fade out:', err);
            }
        }

        // Graceful fallback
        introScreen.classList.add('intro-fade-out');
        document.body.classList.remove('loading-active');

        // Stir starting plume once user enters
        setTimeout(() => {
            if (window.dyeWhorlInstance) {
                window.dyeWhorlInstance.dropBead(window.innerWidth / 2, window.innerHeight * 0.35, 0.08, 200);
            }
        }, 500);
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            finishIntro();
        });
    }

    introScreen.addEventListener('click', () => finishIntro());

    window.addEventListener('keydown', (e) => {
        if (!isFinished && (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')) {
            finishIntro();
        }
    });
}

// Lovable-Style Scroll-Driven Reveal System
function initScrollObserver() {
    const elementsToReveal = document.querySelectorAll('.reveal-on-scroll, .observe, .card, .katana-divider');
    if (!elementsToReveal.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                entry.target.classList.add('visible');

                // If parent contains stagger children or dividers, reveal them
                const children = entry.target.querySelectorAll('.stagger-child, .katana-divider');
                children.forEach(child => {
                    child.classList.add('is-revealed');
                    child.classList.add('visible');
                });

                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.08, 
        rootMargin: '0px 0px -40px 0px' 
    });

    elementsToReveal.forEach(el => observer.observe(el));

    // Immediate reveal for elements visible on load (e.g. Hero section)
    function checkInitialViewport() {
        const vh = window.innerHeight;
        elementsToReveal.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < vh * 0.92) {
                el.classList.add('is-revealed');
                el.classList.add('visible');
                const children = el.querySelectorAll('.stagger-child, .katana-divider');
                children.forEach(child => {
                    child.classList.add('is-revealed');
                    child.classList.add('visible');
                });
            }
        });
    }

    // Run check after preloader / initial paint
    setTimeout(checkInitialViewport, 150);

    // Scroll listener fallback for rapid scrolling
    window.addEventListener('scroll', () => {
        const trigger = window.innerHeight * 1.05;
        elementsToReveal.forEach(el => {
            if (!el.classList.contains('is-revealed')) {
                const rect = el.getBoundingClientRect();
                if (rect.top < trigger) {
                    el.classList.add('is-revealed');
                    el.classList.add('visible');
                    const children = el.querySelectorAll('.stagger-child, .katana-divider');
                    children.forEach(child => {
                        child.classList.add('is-revealed');
                        child.classList.add('visible');
                    });
                }
            }
        });
    }, { passive: true });
}

// 21st.dev Dye Whorl Fluid Background Initialization with Particle Fallback
function initDyeWhorlBackground() {
    const container = document.getElementById('dye-whorl-container');
    const canvas = document.getElementById('dye-whorl-canvas');
    if (!container || !canvas) {
        initParticlesFallback();
        return;
    }

    if (typeof initDyeWhorl === 'function') {
        const instance = initDyeWhorl(container, canvas, {
            speed: 1.0,
            density: 1.0,
            stir: 1.0
        });

        if (instance) {
            window.dyeWhorlInstance = instance;
            return;
        }
    }

    // Fallback if WebGL2 is unsupported
    initParticlesFallback();
}

function initParticlesFallback() {
    const fallbackCanvas = document.getElementById('particles-canvas');
    if (!fallbackCanvas) return;
    fallbackCanvas.style.display = 'block';

    const ctx = fallbackCanvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = fallbackCanvas.width = window.innerWidth;
        height = fallbackCanvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.life = Math.random() * 100;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
            this.life += 0.01;
        }
        draw() {
            const theme = document.documentElement.getAttribute('data-theme');
            const baseAlpha = (Math.sin(this.life) * 0.5 + 0.5) * 0.8;
            ctx.fillStyle = theme === 'light' ? `rgba(185, 28, 28, ${baseAlpha})` : `rgba(217, 56, 58, ${baseAlpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const particleCount = Math.min(window.innerWidth / 15, 80);
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    animate();
}

// ==========================================================================
// Interactive Bento Arsenal & Live Forge Inspector (#skills)
// ==========================================================================
function initSkillsArsenal() {
    const techTiles = document.querySelectorAll('.tech-weapon-tile');
    
    // Inspector elements
    const inspectorAvatar = document.getElementById('inspector-avatar');
    const inspectorTag = document.getElementById('inspector-tag');
    const inspectorName = document.getElementById('inspector-name');
    const inspectorKanji = document.getElementById('inspector-kanji');
    const inspectorDiscipline = document.getElementById('inspector-discipline');
    const inspectorLevel = document.getElementById('inspector-level');
    const inspectorDesc = document.getElementById('inspector-desc');
    const inspectorTags = document.getElementById('inspector-tags');
    const inspectorStatus = document.getElementById('inspector-status');
    const inspectorBody = document.getElementById('inspector-display');

    if (!techTiles.length || !inspectorBody) return;

    const TECH_DATA = {
        javascript: {
            avatar: 'JS',
            avatarStyle: 'background: rgba(247, 223, 30, 0.15); color: #f7df1e; border-color: rgba(247, 223, 30, 0.4);',
            tag: 'FRONTEND RUNTIME & LOGIC',
            name: 'JavaScript (ES6+)',
            kanji: '瞬発力 // EXECUTION ENGINE',
            discipline: 'Core Web Development',
            level: '80% · Practical Proficiency',
            desc: 'Solid, growing foundation in modern ECMAScript standards, asynchronous control flow (async/await, promises), DOM manipulation, and interactive web application logic.',
            tags: ['ES6+', 'Async / Await', 'DOM APIs', 'Event Loop', 'Fetch / REST'],
            status: 'ACTIVE IN PROJECTS · CONTINUOUSLY EXPANDING'
        },
        typescript: {
            avatar: 'TS',
            avatarStyle: 'background: rgba(49, 120, 198, 0.15); color: #38bdf8; border-color: rgba(49, 120, 198, 0.4);',
            tag: 'STATIC TYPE ARCHITECTURE',
            name: 'TypeScript',
            kanji: '剛健 // TYPE INTEGRITY',
            discipline: 'Type-Safe Engineering',
            level: '74% · Intermediate',
            desc: 'Actively learning and applying static type safety, interfaces, union types, and type contracts to write cleaner, more predictable code.',
            tags: ['Generics', 'Type Narrowing', 'Interfaces', 'Union Types', 'Strict Mode'],
            status: 'BUILDING WITH TYPE SAFETY'
        },
        react: {
            avatar: '⚛',
            avatarStyle: 'background: rgba(97, 218, 251, 0.15); color: #61dafb; border-color: rgba(97, 218, 251, 0.4);',
            tag: 'REACTIVE COMPONENT ARCHITECTURE',
            name: 'React.js',
            kanji: '構造 // REACTIVE DISCIPLINE',
            discipline: 'Component Tree Engineering',
            level: '78% · Practical Proficiency',
            desc: 'Building responsive user interfaces with reusable functional components, React hooks (useState, useEffect), and modular component hierarchies.',
            tags: ['Functional Components', 'Hooks', 'State Management', 'JSX', 'Virtual DOM'],
            status: 'CORE FRONTEND LIBRARY IN ACTIVE USE'
        },
        tailwind: {
            avatar: 'TW',
            avatarStyle: 'background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);',
            tag: 'DESIGN TOKEN UTILITY SYSTEM',
            name: 'Tailwind CSS',
            kanji: '流麗 // FLUID HARMONY',
            discipline: 'Design Systems & Layouts',
            level: '82% · Practical Proficiency',
            desc: 'Rapid styling of responsive, clean interfaces using utility classes, mobile-first design, flexbox/grid layouts, and cohesive color schemes.',
            tags: ['Responsive Layouts', 'Flexbox / Grid', 'Utility Classes', 'Custom Themes'],
            status: 'PRIMARY STYLING WORKFLOW'
        },
        nodejs: {
            avatar: 'NODE',
            avatarStyle: 'background: rgba(34, 197, 94, 0.15); color: #4ade80; border-color: rgba(34, 197, 94, 0.4);',
            tag: 'SERVER RUNTIME & API FABRIC',
            name: 'Node.js & Express',
            kanji: '中枢 // SYSTEM ENGINE',
            discipline: 'Backend Services',
            level: '75% · Intermediate',
            desc: 'Building server-side REST API endpoints, routing, and basic middleware with Node.js and Express to power fullstack applications.',
            tags: ['Express.js', 'REST APIs', 'Middleware', 'HTTP Methods', 'JSON APIs'],
            status: 'BACKEND INTEGRATION & APIS'
        },
        'html-css': {
            avatar: 'HTML',
            avatarStyle: 'background: rgba(228, 77, 38, 0.15); color: #ff6a3d; border-color: rgba(228, 77, 38, 0.4);',
            tag: 'SEMANTIC DOM & MODERN STYLING',
            name: 'HTML5 & Modern CSS3',
            kanji: '骨格 // STRUCTURAL FOUNDATION',
            discipline: 'Semantic Web & Styling',
            level: '84% · Practical Proficiency',
            desc: 'Core architecture behind this portfolio: semantic HTML5 markup, responsive CSS Grid and Flexbox, CSS custom properties, glassmorphism, and responsive cross-device fluid layouts.',
            tags: ['Semantic HTML5', 'CSS Grid', 'Flexbox', 'Custom Properties', 'Glassmorphism', 'Responsive Design'],
            status: 'PRIMARY FOUNDATION OF THIS PORTFOLIO'
        },
        webgl: {
            avatar: 'GLSL',
            avatarStyle: 'background: rgba(168, 85, 247, 0.15); color: #c084fc; border-color: rgba(168, 85, 247, 0.4);',
            tag: 'GRAPHICS ENGINE & FLUID SIMULATION',
            name: 'WebGL & GLSL Shaders',
            kanji: '墨痕 // FLUID MECHANICS',
            discipline: 'Canvas & Graphics Programming',
            level: '76% · Intermediate',
            desc: 'Interactive visual engine powering this portfolio: Navier-Stokes Eulerian fluid simulation, custom GLSL fragment shaders, interactive particle dynamics, and 60 FPS hardware acceleration.',
            tags: ['WebGL', 'GLSL Shaders', 'Navier-Stokes', 'Canvas 2D/3D', 'Fluid Dynamics', 'Frame Buffers'],
            status: 'LIVE ENGINE IN THIS PORTFOLIO'
        },
        postgresql: {
            avatar: 'SQL',
            avatarStyle: 'background: rgba(249, 115, 22, 0.15); color: #fb923c; border-color: rgba(249, 115, 22, 0.4);',
            tag: 'PERSISTENCE & RELATIONAL SCHEMAS',
            name: 'PostgreSQL & MySQL',
            kanji: '根基 // RELATIONAL ANCHOR',
            discipline: 'Data Modeling & Persistence',
            level: '70% · Foundational',
            desc: 'Working knowledge of relational data schemas, table relationships, SQL queries, and database integrations for fullstack projects.',
            tags: ['SQL Queries', 'Table Schema', 'Foreign Keys', 'CRUD Operations', 'Relational DBs'],
            status: 'RELATIONAL DATA LAYER IN PRACTICE'
        }
    };

    function inspectTech(techKey) {
        const data = TECH_DATA[techKey];
        if (!data) return;

        // Visual highlight on tiles
        techTiles.forEach(tile => {
            const isMatch = tile.getAttribute('data-tech') === techKey;
            tile.classList.toggle('active', isMatch);
            tile.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
        });

        // Update inspector DOM
        if (inspectorAvatar) {
            inspectorAvatar.textContent = data.avatar;
            inspectorAvatar.setAttribute('style', data.avatarStyle);
        }
        if (inspectorTag) inspectorTag.textContent = data.tag;
        if (inspectorName) inspectorName.textContent = data.name;
        if (inspectorKanji) inspectorKanji.textContent = data.kanji;
        if (inspectorDiscipline) inspectorDiscipline.textContent = data.discipline;
        if (inspectorLevel) inspectorLevel.textContent = data.level;
        if (inspectorDesc) inspectorDesc.textContent = data.desc;
        if (inspectorStatus) inspectorStatus.textContent = data.status;

        // Render tag pills
        if (inspectorTags) {
            inspectorTags.innerHTML = '';
            data.tags.forEach(tagText => {
                const pill = document.createElement('span');
                pill.className = 'spec-pill';
                pill.textContent = tagText;
                inspectorTags.appendChild(pill);
            });
        }
    }

    // Attach click and hover listeners to weapon tiles
    techTiles.forEach(tile => {
        const techKey = tile.getAttribute('data-tech');
        
        tile.addEventListener('mouseenter', () => {
            inspectTech(techKey);
        });

        tile.addEventListener('click', () => {
            inspectTech(techKey);
        });

        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inspectTech(techKey);
            }
        });
    });
}

