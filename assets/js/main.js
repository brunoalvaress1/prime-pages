/* ===========================
   MENU MOBILE
=========================== */
const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector("nav ul");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
  });

  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      menu.classList.remove("open");
    }
  });
}

/* ===========================
   FOOTER YEAR
=========================== */
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

/* ===========================
   SCROLL REVEAL AVANÇADO
=========================== */
const revealElements = document.querySelectorAll(
  ".section, .highlight-card, .service-item, .metric, .portfolio-item, .timeline-premium .step, .comparison-grid > div"
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach((el) => revealObserver.observe(el));

/* ===========================
   ANIMAÇÃO DE CONTADOR
=========================== */
function animateCounter(el, start, end, duration) {
  let startTime = null;

  function animation(currentTime) {
    if (!startTime) startTime = currentTime;

    const progress = Math.min((currentTime - startTime) / duration, 1);
    el.textContent = Math.floor(progress * (end - start) + start);

    if (progress < 1) requestAnimationFrame(animation);
  }

  requestAnimationFrame(animation);
}

const metricNumbers = document.querySelectorAll(".metric h3");

metricNumbers.forEach((num) => {
  const finalValue = parseInt(num.textContent.replace(/\D/g, ""));
  num.dataset.value = finalValue;
  num.textContent = "0";
});

const metricObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target.querySelector("h3");
        animateCounter(el, 0, parseInt(el.dataset.value), 1800);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll(".metric").forEach((m) => metricObserver.observe(m));

/* ===========================
   TILT 3D EM ELEMENTOS
=========================== */
const tiltElements = document.querySelectorAll(
  ".highlight-card, .service-item, .metric, .portfolio-item"
);

tiltElements.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    card.style.transform = `rotateX(${(-y / 20)}deg) rotateY(${x / 20}deg) scale(1.03)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = `rotateX(0) rotateY(0) scale(1)`;
  });
});

/* ===========================
   PARALLAX DO MOUSE NO HERO
=========================== */
const hero = document.querySelector(".hero");
if (hero) {
  hero.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    hero.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
  });
}

/* ===========================
   FLOATING ORGÂNICO
=========================== */
function floatElement(el, delay = 0) {
  el.animate(
    [
      { transform: "translateY(0px)" },
      { transform: "translateY(-12px)" },
      { transform: "translateY(0px)" },
    ],
    {
      duration: 4500 + Math.random() * 2000,
      iterations: Infinity,
      delay: delay,
      easing: "ease-in-out",
    }
  );
}

document.querySelectorAll(".hero-floating").forEach((el, i) => {
  floatElement(el, i * 400);
});

/* ===========================
   PARTICLES AVANÇADAS
=========================== */
const particlesContainer = document.createElement("div");
particlesContainer.className = "particles";
document.body.appendChild(particlesContainer);

for (let i = 0; i < 40; i++) {
  const p = document.createElement("span");
  p.className = "particle";
  p.style.left = Math.random() * 100 + "%";
  p.style.animationDuration = 5 + Math.random() * 10 + "s";
  p.style.animationDelay = Math.random() * 5 + "s";
  particlesContainer.appendChild(p);
}

/* ===========================
   TESTIMONIALS SLIDER
=========================== */
const testimonials = document.querySelectorAll(".testimonial");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let index = 0;

function showTestimonial(i) {
  testimonials.forEach((t) => t.classList.remove("active"));
  testimonials[i].classList.add("active");
}

if (testimonials.length) {
  showTestimonial(index);

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      index = (index + 1) % testimonials.length;
      showTestimonial(index);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      index = (index - 1 + testimonials.length) % testimonials.length;
      showTestimonial(index);
    });
  }
}

/* ===========================
   FAQ TOGGLE
=========================== */
document.querySelectorAll(".faq-item").forEach((item) => {
  const question = item.querySelector(".faq-question");
  question.addEventListener("click", () => {
    item.classList.toggle("open");
  });
});





















/* ===========================
   PORTFÓLIO: Parallax da tela
=========================== */
document.querySelectorAll(".mockup").forEach(mockup => {
  const screen = mockup.querySelector(".mockup-screen img");

  mockup.addEventListener("mousemove", (e) => {
    const rect = mockup.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    screen.style.transform = `translate(${x * 12}px, ${y * 12}px) scale(1.03)`;
  });

  mockup.addEventListener("mouseleave", () => {
    screen.style.transform = `translate(0,0) scale(1)`;
  });
});

/* ===========================
   SCROLL REVEAL PARA O PORTFÓLIO
=========================== */
const portfolioItems = document.querySelectorAll(".portfolio-item-full");

const portObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("revealed");
    }
  });
}, { threshold: 0.25 });

portfolioItems.forEach(item => portObserver.observe(item));

/* ===========================
   MAGNET HOVER BUTTON
=========================== */
document.querySelectorAll(".btn-ghost, .btn-primary").forEach(btn => {
  btn.classList.add("btn-magnet");

  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    btn.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.transform = `translate(0,0)`;
  });
});

/* ===========================
   PARTICLE ACCELERATION
=========================== */
let scrollTimeout;
window.addEventListener("scroll", () => {
  document.body.classList.add("scrolling");
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    document.body.classList.remove("scrolling");
  }, 350);
});


// ===============================
// REVEAL PARA OS CARDS DE CONTATO
// ===============================
document.querySelectorAll(".contact-form-card, .contact-info-card").forEach((el) => {
  revealObserver.observe(el);
});
