// --------------------------------------------------
// Browser-only p5.js orb
// Presence input: SPACEBAR (hold to activate)
// --------------------------------------------------

let presence = false;

// ––– TUNING –––
const maxPresence = 350;
const riseRate = 0.08;
const fallRate = 1.5;

let orb;
let particles = [];

let t = 0;
let hueShift = 0;
let presenceTime = 0;

let showInstructions = true;
let instructionFadeTime = 0;

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight, P2D);
  frameRate(60);
  colorMode(HSB, 360, 100, 100, 100);

  orb = createGraphics(width, height);
  orb.pixelDensity(1);
  orb.colorMode(HSB, 360, 100, 100, 100);

  for (let i = 0; i < 150; i++) particles.push(new Particle());

  // Auto-request fullscreen on any interaction
  document.addEventListener('click', enterFullscreen, { once: true });
  document.addEventListener('keydown', enterFullscreen, { once: true });
  
  // Try to enter fullscreen immediately (may be blocked by browser)
  enterFullscreen();
}

function enterFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      // Silently fail - browser requires user interaction first
    });
  }
}

function windowResized() {
  pixelDensity(1);
  resizeCanvas(windowWidth, windowHeight);

  orb = createGraphics(width, height);
  orb.pixelDensity(1);
  orb.colorMode(HSB, 360, 100, 100, 100);

  particles = [];
  for (let i = 0; i < 150; i++) particles.push(new Particle());
}

function keyPressed() {
  if (key === ' ') {
    presence = true;
    showInstructions = false;
    return false; // Prevent page scroll
  }
  
  // Press 'F' to toggle fullscreen
  if (key === 'f' || key === 'F') {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
  
  // Press ESC to exit fullscreen (browser does this by default)
}

function keyReleased() {
  if (key === ' ') {
    presence = false;
    return false;
  }
}

function draw() {
  background(0);

  presenceTime = presence
    ? min(presenceTime + riseRate, maxPresence)
    : max(presenceTime - fallRate, 0);

  const pct = presenceTime / maxPresence;

  const minDim = min(width, height);
  const baseRad = minDim * 0.25;
  const extraRad = minDim * 0.35;
  const radius = baseRad + pct * extraRad;

  const saturation = 80 + pct * 20;
  const brightness = 70 + pct * 30;
  const hueSpeed = 0.4 + pct * 1.5;
  hueShift = (hueShift + hueSpeed) % 360;

  drawOrganicOrb(
    orb,
    orb.width * 0.5,
    orb.height * 0.5,
    radius,
    hueShift,
    t,
    saturation,
    brightness,
    pct
  );

  image(orb, 0, 0);
  updateParticles(pct);

  drawInstructions();

  t += 0.01;
}

// -----------------------------
// ORB RENDERING
// -----------------------------
function drawOrganicOrb(pg, cx, cy, baseRadius, hueBase, time, sat, bright, pct) {
  pg.clear();
  pg.noStroke();

  const layers = 80;
  for (let i = 1; i <= layers; i++) {
    const layerPct = i / layers;
    const r = baseRadius * layerPct;

    const alpha = 80 * pow(1 - layerPct, 1.2) * pct;
    const rawHue =
      (hueBase + layerPct * 360 + sin(time + layerPct * 2.0) * 60) % 360;

    pg.fill(rawHue, sat, bright, alpha);
    drawBlobbyShape(pg, cx, cy, r, time + i * 0.015);
  }
}

function drawBlobbyShape(pg, cx, cy, radius, time) {
  pg.beginShape();
  const step = 0.1;

  for (let a = 0; a < TWO_PI + step; a += step) {
    const xoff = cos(a) * 0.8 + time;
    const yoff = sin(a) * 0.8 + time;
    const n = noise(xoff, yoff);

    const rOff = map(n, 0, 1, -15, 15);
    const r = radius + rOff;

    pg.curveVertex(cx + cos(a) * r, cy + sin(a) * r);
  }
  pg.endShape(CLOSE);
}

// -----------------------------
// PARTICLES
// -----------------------------
class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(width);
    this.y = random(height);
    this.ang = random(TWO_PI);
    this.spd = random(0.2, 0.6);
    this.sz = random(1, 2);
    this.hu = random(360);
  }

  update() {
    this.x += cos(this.ang) * this.spd;
    this.y += sin(this.ang) * this.spd;
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.reset();
    }
  }

  display(pct) {
    const alpha = 5 + pct * 30;
    const bright = 80 + pct * 20;
    noStroke();
    fill(this.hu, 30, bright, alpha);
    ellipse(this.x, this.y, this.sz, this.sz);
  }
}

function updateParticles(pct) {
  blendMode(ADD);
  for (const p of particles) {
    p.update();
    p.display(pct);
  }
  blendMode(BLEND);
}

// -----------------------------
// INSTRUCTIONS OVERLAY
// -----------------------------
function drawInstructions() {
  if (!showInstructions && instructionFadeTime <= 0) return;

  if (showInstructions) {
    instructionFadeTime = min(instructionFadeTime + 0.02, 1);
  } else {
    instructionFadeTime = max(instructionFadeTime - 0.02, 0);
  }

  push();
  noStroke();
  
  const alpha = 70 * instructionFadeTime;
  fill(0, 0, 0, alpha);
  rect(0, 0, width, height);

  const textAlpha = 100 * instructionFadeTime;
  fill(0, 0, 100, textAlpha);
  
  textAlign(CENTER, CENTER);
  textSize(32);
  text("Hold SPACEBAR to activate", width / 2, height / 2 - 40);
  
  textSize(16);
  fill(0, 0, 80, textAlpha);
  text("Press F to toggle fullscreen", width / 2, height / 2 + 20);
  
  if (!document.fullscreenElement) {
    text("Click or press any key to enter fullscreen", width / 2, height / 2 + 50);
  }
  
  pop();
}