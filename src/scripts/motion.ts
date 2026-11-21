/**
 * All motion for this page, in five blocks that can each fail on their own.
 *
 * Ground rule: nothing here creates content. Every animated element already has
 * its final position in CSS, so if this file throws or never loads, the page is
 * complete and every link still works. `reduce` and missing-JS visitors skip
 * straight past it.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T | null;

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: "power3.out" });

// ---------------------------------------------------------------- guard

// The inline head script already decided whether motion runs. If it chose the
// static path, stop here: no listeners, no canvas, no scroll takeover.
if (root.classList.contains("motion")) {
  start();
}

function start() {
  const tally = { booted: false };

  // ------------------------------------------------------------- smooth

  // Wheel only. `syncTouch` stays false: the Lenis docs call it unstable on
  // iOS < 16, and stealing touch from the system is what makes pages feel
  // broken inside an in-app browser. Lenis also honours reduced-motion itself.
  const lenis = new Lenis({
    lerp: 0.12,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ------------------------------------------------------------- boot

  const boot = q(".boot");

  if (boot && !root.classList.contains("booted")) {
    // Lenis starts stopped so the page cannot be scrolled behind the curtain.
    lenis.stop();
    runBoot(boot, tally, lenis);
  } else if (boot) {
    boot.dataset.done = "";
  }

  // ------------------------------------------------------- sections

  // Sections can build immediately; the boot curtain covers them anyway, and
  // starting the hero while the curtain is still on screen removes the wait.
  buildHero();
  buildTicker();
  buildMagnet();
  buildSpecimenScroll();
  buildOutro();
  const stopDust = buildDust();

  ScrollTrigger.refresh();

  // Rotation and address-bar collapse change the viewport height; without a
  // refresh, every scrubbed trigger keeps a stale start/end position.
  let refreshTimer = 0;
  addEventListener(
    "resize",
    () => {
      clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 180);
    },
    { passive: true },
  );

  // Canvas must not burn battery while off-screen or in a hidden tab.
  const stop = () => stopDust();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  addEventListener("pagehide", stop);

  function runBoot(el: HTMLElement, state: { booted: boolean }, scroller: Lenis) {
    const counter = el.querySelector<HTMLElement>("[data-boot-count]");
    const panels = el.querySelectorAll<HTMLElement>(".boot__panel");
    const inner = el.querySelector<HTMLElement>(".boot__inner");
    if (!counter || !inner) {
      scroller.start();
      return;
    }

    // Skippable by tap, because an intro nobody can leave is worse than no
    // intro. The whole thing is under a second anyway.
    let done = false;
    const skip = () => finish(true);
    el.addEventListener("pointerdown", skip, { once: true });

    const tween = gsap.timeline({ onComplete: () => finish(false) });

    const value = { n: 0 };
    tween.to(value, {
      n: 100,
      duration: 0.62,
      ease: "power2.inOut",
      onUpdate: () => {
        counter.textContent = String(Math.round(value.n));
      },
    });
    tween.to(inner, { opacity: 0, y: -8, duration: 0.22, ease: "power2.in" }, "+=0.04");
    tween.to([...panels], { yPercent: (i) => (i === 0 ? -100 : 100), duration: 0.42, ease: "power4.inOut" }, "<");
    tween.to(el, { autoAlpha: 0, duration: 0.01 }, ">-0.02");

    function finish(bySkip: boolean) {
      if (done) return;
      done = true;
      state.booted = true;
      el.removeEventListener("pointerdown", skip);
      el.dataset.done = "";
      root.classList.add("booted");
      try {
        sessionStorage.setItem("xyenrae:boot", "1");
      } catch {
        // Nothing to do: the intro will simply replay next time.
      }
      if (bySkip) tween.progress(1).kill();
      scroller.start();
      ScrollTrigger.refresh();
    }
  }

  // ------------------------------------------------------ hero

  function buildHero() {
    const hero = q("[data-hero]");
    const mast = q("[data-masthead]");
    if (!hero || !mast) return;

    // SplitText waits for the webfonts: split lines measured against a fallback
    // face reflow into different lines and land as a visible jump.
    document.fonts.ready.then(() => {
      const split = SplitText.create(mast, {
        type: "lines,chars",
        linesClass: "line",
        charsClass: "char",
        mask: "lines",
      });

      gsap.from(split.chars, {
        yPercent: 118,
        rotate: 5,
        opacity: 0,
        duration: 0.85,
        ease: "power4.out",
        stagger: 0.014,
        delay: 0.06,
        onComplete: () => split.revert(),
      });

      // Only elements that exist: the hero no longer has its own CTA, because it
      // duplicated the first project row and pointed at that project instead of
      // letting the list speak for itself.
      gsap.from(".lede, .status", {
        y: 14,
        opacity: 0,
        duration: 0.7,
        stagger: 0.07,
        delay: 0.24,
      });
    });

    // Light fields follow the pointer. One passive listener feeds one rAF, and
    // quickTo keeps the tween allocation flat instead of creating a tween per
    // pointer event.
    const a = hero.querySelector(".hero__light--a");
    const b = hero.querySelector(".hero__light--b");

    gsap.set([a, b], { opacity: 1 });
    gsap.fromTo(
      [a, b],
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out", delay: 0.1 },
    );

    let queued = false;
    let px = 0.5;
    let py = 0.5;

    const paint = () => {
      queued = false;
      root.style.setProperty("--lx", px.toFixed(3));
      root.style.setProperty("--ly", py.toFixed(3));
    };

    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = hero.getBoundingClientRect();
        px = (event.clientX - rect.left) / rect.width;
        py = (event.clientY - rect.top) / rect.height;
        if (queued) return;
        queued = true;
        requestAnimationFrame(paint);
      },
      { passive: true },
    );
  }

  // ------------------------------------------------------ ticker

  function buildTicker() {
    const track = q("[data-ticker]");
    if (!track) return;

    // One measure, then a seamless loop: the track is duplicated in markup, so
    // shifting by exactly half its width puts the copy where the original was.
    const loop = gsap.to(track, {
      xPercent: -50,
      duration: 18,
      ease: "none",
      repeat: -1,
    });

    // Scroll direction drives the band: scrolling up reverses it, which makes
    // the band feel connected to the page instead of pasted on top.
    ScrollTrigger.create({
      onUpdate: (self) => {
        const dir = self.direction;
        gsap.to(loop, {
          timeScale: dir === 1 ? 1 : -1,
          duration: 0.4,
          overwrite: true,
        });
      },
    });
  }

  // ------------------------------------------------------ magnet

  function buildMagnet() {
    const targets = document.querySelectorAll<HTMLElement>("[data-magnet]");
    if (matchMedia("(hover: none)").matches) {
      // Touch devices have no hover to reward; the press state in CSS is the
      // whole interaction there, so building a magnet would be dead code.
      return;
    }

    targets.forEach((el) => {
      const strength = el.classList.contains("row__link") ? 4 : 5;
      const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });

      el.addEventListener(
        "pointermove",
        (event) => {
          const rect = el.getBoundingClientRect();
          const dx = (event.clientX - rect.left) / rect.width - 0.5;
          const dy = (event.clientY - rect.top) / rect.height - 0.5;
          xTo(dx * strength * 2);
          yTo(dy * strength);
          el.style.setProperty("--edge-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        },
        { passive: true },
      );

      el.addEventListener(
        "pointerleave",
        () => {
          xTo(0);
          yTo(0);
          el.style.removeProperty("--edge-x");
        },
        { passive: true },
      );
    });
  }

  // ------------------------------------------------------ specimen

  function buildSpecimenScroll() {
    const specimenEl = q("[data-specimen]");
    if (!specimenEl) return;

    ScrollTrigger.create({
      trigger: specimenEl,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        root.style.setProperty("--spec", self.progress.toFixed(3));
      },
    });
  }

  // ------------------------------------------------------ outro

  function buildOutro() {
    const outro = q("[data-outro]");
    if (!outro) return;

    gsap.to(outro, {
      scale: 0.88,
      opacity: 0.55,
      ease: "none",
      scrollTrigger: {
        trigger: outro,
        start: "top 85%",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }

  // ------------------------------------------------------ dust

  function buildDust() {
    const canvas = q<HTMLCanvasElement>("[data-dust]");
    const hero = q("[data-hero]");
    if (!canvas || !hero) return () => {};

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return () => {};

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const COUNT = window.innerWidth < 400 ? 42 : 64;
    const parts = Array.from({ length: COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00028,
      hue: Math.random() > 0.72 ? "232, 244, 238" : "242, 243, 245",
    }));

    let width = 0;
    let height = 0;
    let visible = true;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const dt = Math.min(now - last, 48);
      last = now;
      ctx.clearRect(0, 0, width, height);

      for (const p of parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue}, 0.55)`;
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    raf = requestAnimationFrame(draw);

    const ro = new ResizeObserver(resize);
    ro.observe(hero);

    // Stop the loop while the hero is off-screen: an always-running rAF under a
    // dark page is the fastest way to drain a phone battery for nothing.
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        last = performance.now();
      },
      { threshold: 0 },
    );
    io.observe(hero);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }

  // ------------------------------------------------------ easter egg

  // Five taps on the wordmark swap the two accent lights. Nothing announces it,
  // which is the point: it rewards the person who pokes at the page.
  let taps = 0;
  let resetTimer = 0;
  const egg = q("[data-egg]");
  egg?.addEventListener("pointerdown", () => {
    taps += 1;
    clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      taps = 0;
    }, 1200);

    if (taps < 5) return;
    taps = 0;
    const style = getComputedStyle(root);
    const cyan = style.getPropertyValue("--cyan").trim();
    const magenta = style.getPropertyValue("--magenta").trim();
    gsap.to(root, {
      duration: 0.45,
      ease: "power2.inOut",
      onStart: () => {
        root.style.setProperty("--cyan", magenta);
        root.style.setProperty("--magenta", cyan);
      },
    });
  });

  // ------------------------------------------------------ reduced motion

  // Lenis already stopped smoothing; this stops the scroll-scrubbed effects and
  // the canvas, so nothing keeps moving behind a user who asked it not to.
  if (reduce.matches) {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    stopDust();
    root.style.setProperty("--spec", "1");
  }

  reduce.addEventListener("change", () => location.reload());
}
