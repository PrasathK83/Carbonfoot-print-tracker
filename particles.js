// ── Ambient Particle System ──
(function () {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width, height;
  let particles = [];
  let mouse = { x: -999, y: -999 };
  const PARTICLE_COUNT = 55;
  const CONNECTION_DISTANCE = 140;
  const MOUSE_RADIUS = 180;

  const COLORS = [
    "rgba(16, 185, 129, 0.5)",   // emerald
    "rgba(6, 182, 212, 0.4)",    // cyan
    "rgba(59, 130, 246, 0.35)",  // blue
    "rgba(245, 158, 11, 0.3)",   // gold
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2.2 + 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p, i) => {
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.015;

      // Wrap around edges
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      // Mouse interaction — gentle push
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.015;
        p.vx += dx * force;
        p.vy += dy * force;
      }

      // Dampen velocity
      p.vx *= 0.995;
      p.vy *= 0.995;

      // Draw particle with pulsing glow
      const pulseScale = 1 + Math.sin(p.pulse) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * (0.7 + Math.sin(p.pulse) * 0.3);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw connections to nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const ddx = p.x - other.x;
        const ddy = p.y - other.y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < CONNECTION_DISTANCE) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.08 * (1 - d / CONNECTION_DISTANCE)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    resize();
  });

  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener("mouseleave", () => {
    mouse.x = -999;
    mouse.y = -999;
  });

  init();
  animate();
})();

// ── Splash Screen Handler ──
(function () {
  const splash = document.getElementById("splash-overlay");
  if (!splash) return;

  // Fade out after a brief period to show loading animation
  setTimeout(() => {
    splash.classList.add("fade-out");
    setTimeout(() => {
      splash.style.display = "none";
    }, 600);
  }, 1400);
})();

// ── Mobile Menu Toggle ──
(function () {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const closeBtn = document.getElementById("mobile-menu-close");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.add("mobile-open");
      document.body.style.overflow = "hidden";
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
      document.body.style.overflow = "";
    });
  }

  // Close on nav item click (mobile)
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove("mobile-open");
        document.body.style.overflow = "";
      }
    });
  });
})();
