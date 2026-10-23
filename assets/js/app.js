/**
 * NEVOXIO - Interactive Application & Physics Logic
 * 3D Letter Physics, Custom Cursor, Audio Synthesizer, & Contact Controls
 */

(function () {
  'use strict';

  // State
  let soundEnabled = true;
  let audioCtx = null;

  // DOM Elements
  const customCursor = document.querySelector('.custom-cursor');
  const cursorFollower = document.querySelector('.custom-cursor-follower');
  const letterWrappers = document.querySelectorAll('.letter-wrapper');
  const featureCards = document.querySelectorAll('.feature-card-glass');
  const contactModal = document.getElementById('contact-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const contactTriggers = document.querySelectorAll('[data-open-contact]');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');

  // Mouse Coordinates for UI
  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let follower = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  // --------------------------------------------------------------------------
  // 1. CUSTOM CURSOR & FOLLOWER (Smooth Spring Physics)
  // --------------------------------------------------------------------------
  if (customCursor && cursorFollower) {
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      customCursor.style.left = `${mouse.x}px`;
      customCursor.style.top = `${mouse.y}px`;
    });

    function renderCursor() {
      // Butter-smooth lerp
      follower.x += (mouse.x - follower.x) * 0.15;
      follower.y += (mouse.y - follower.y) * 0.15;

      cursorFollower.style.left = `${follower.x}px`;
      cursorFollower.style.top = `${follower.y}px`;

      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Hover scale effect on interactives
    const hoverTargets = document.querySelectorAll('a, button, .letter-wrapper, .feature-card-glass, input, textarea');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursorFollower.classList.add('hovered');
      });
      el.addEventListener('mouseleave', () => {
        cursorFollower.classList.remove('hovered');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 2. 3D INTERACTIVE LETTERS ("N E V O X I O")
  // --------------------------------------------------------------------------
  // Pentatonic frequencies for futuristic cyber chime on letter hover
  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]; // C5 to D6

  letterWrappers.forEach((wrapper, index) => {
    // Direct hover interaction
    wrapper.addEventListener('mouseenter', () => {
      playChime(notes[index % notes.length]);
      if (window.Nevoxio3D && window.Nevoxio3D.triggerPulse && index === 3) {
        window.Nevoxio3D.triggerPulse();
      }
    });
  });

  // Global mouse proximity physics on letters
  window.addEventListener('mousemove', (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    letterWrappers.forEach((wrapper, idx) => {
      const rect = wrapper.getBoundingClientRect();
      const lx = rect.left + rect.width / 2;
      const ly = rect.top + rect.height / 2;

      const dx = mx - lx;
      const dy = my - ly;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 320;

      if (dist < maxDist) {
        const factor = (1 - dist / maxDist);
        const rotY = (dx / maxDist) * 35 * factor;
        const rotX = -(dy / maxDist) * 35 * factor;
        const liftZ = factor * 48;
        const scale = 1 + factor * 0.12;

        wrapper.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${liftZ}px) scale(${scale})`;
      } else {
        wrapper.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. 3D PERSPECTIVE TILT ON FEATURE CARDS
  // --------------------------------------------------------------------------
  featureCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
    });

    card.addEventListener('mouseenter', () => {
      playSoftClick();
    });
  });

  // --------------------------------------------------------------------------
  // 3B. 3D PERSPECTIVE TILT & SPOTLIGHT ON PROJECT CARDS
  // --------------------------------------------------------------------------
  const projectCards = document.querySelectorAll('.project-card-3d');
  projectCards.forEach((card) => {
    const inner = card.querySelector('.project-card-inner');
    if (!inner) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -11;
      const rotateY = ((x - centerX) / centerX) * 11;

      inner.style.setProperty('--card-mouse-x', `${x}px`);
      inner.style.setProperty('--card-mouse-y', `${y}px`);

      inner.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      inner.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
    });

    card.addEventListener('mouseenter', () => {
      playSoftClick();
    });
  });

  // --------------------------------------------------------------------------
  // 3C. PROJECT FILTER TABS
  // --------------------------------------------------------------------------
  const filterBtns = document.querySelectorAll('.filter-pill-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      playChime(783.99);

      projectCards.forEach((card) => {
        const cat = card.getAttribute('data-category') || '';
        if (filter === 'all' || cat.includes(filter)) {
          card.style.display = 'block';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // 4. MAGNETIC BUTTONS (Subtle attraction toward cursor)
  // --------------------------------------------------------------------------
  const magneticButtons = document.querySelectorAll('.btn-primary-glow, .btn-secondary-glow, .btn-nav-cta, .btn-project-visit');
  magneticButtons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const bx = rect.left + rect.width / 2;
      const by = rect.top + rect.height / 2;
      const dx = (e.clientX - bx) * 0.28;
      const dy = (e.clientY - by) * 0.28;

      btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0px, 0px) scale(1)';
    });
  });

  // --------------------------------------------------------------------------
  // 5. WEB AUDIO SYNTHESIZER (High-Tech Sci-Fi Audio Design)
  // --------------------------------------------------------------------------
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playChime(freq) {
    if (!soundEnabled) return;
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      // Lowpass filter for smooth crystalline tone
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, audioCtx.currentTime);

      // Smooth envelope
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // Audio fallback silent
    }
  }

  function playSoftClick() {
    if (!soundEnabled) return;
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {}
  }

  function playModalOpenSound() {
    if (!soundEnabled) return;
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.07, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.36);
    } catch (e) {}
  }

  // Audio Toggle Button
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        initAudio();
        audioToggleBtn.classList.add('active');
        audioToggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
          Sound FX: ON
        `;
        playChime(659.25);
      } else {
        audioToggleBtn.classList.remove('active');
        audioToggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
          Sound FX: OFF
        `;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. CONTACT MODAL & CLIPBOARD COPY ACTIONS
  // --------------------------------------------------------------------------
  function openContactModal() {
    if (contactModal) {
      contactModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      playModalOpenSound();
    }
  }

  function closeContactModal() {
    if (contactModal) {
      contactModal.classList.remove('open');
      document.body.style.overflow = '';
      playSoftClick();
    }
  }

  contactTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openContactModal();
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeContactModal);
  }

  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        closeContactModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('open')) {
      closeContactModal();
    }
  });

  // One-Click Clipboard Copying
  const copyBtns = document.querySelectorAll('[data-copy-val]');
  copyBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-copy-val');
      try {
        await navigator.clipboard.writeText(val);
        const originalText = btn.textContent;
        btn.textContent = 'Copied! ✓';
        btn.style.background = '#10b981';
        btn.style.color = '#ffffff';
        playChime(880.0);
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
        }, 1800);
      } catch (err) {
        // Fallback prompt
        window.prompt('Copy to clipboard:', val);
      }
    });
  });

  // Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '70px';
        navLinks.style.left = '20px';
        navLinks.style.right = '20px';
        navLinks.style.background = 'rgba(8, 14, 30, 0.95)';
        navLinks.style.padding = '20px';
        navLinks.style.borderRadius = '20px';
        navLinks.style.border = '1px solid rgba(79, 140, 255, 0.3)';
        navLinks.style.backdropFilter = 'blur(20px)';
      }
    });
  }

})();
