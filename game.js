// ============================================
// CUTESY CAT GAME — Phase 1
// ML CONCEPT: Vector math for eye tracking =
// same math as attention in neural networks!
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const moodLabel = document.getElementById('mood-label');

// --- Canvas fills the window ---
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ============================================
// CAT STATE
// ML CONCEPT: This is the "agent state" in RL
// ============================================
const cat = {
  // Current position (where cat is drawn)
  x: canvas.width / 2,
  y: canvas.height / 2,

  // Target position (where cat wants to go)
  // ML CONCEPT: This is the "goal" the policy aims for
  targetX: canvas.width / 2,
  targetY: canvas.height / 2,

  size: 50,         // body radius
  speed: 0.03,      // lerp speed (0 = never moves, 1 = teleports)
  mood: 'curious',  // idle | walking | curious | happy
  isMoving: false,

  // RL: interaction log — we'll use this in Phase 4
  // to train the cat's behavior from YOUR patterns
  interactionLog: []
};

// Mouse position tracker
const mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// ============================================
// CLICK HANDLER
// ML CONCEPT: Each click = a "reward signal"
// logged with timestamp for RL training later
// ============================================
window.addEventListener('click', (e) => {
  cat.targetX = e.clientX;
  cat.targetY = e.clientY;
  cat.mood = 'walking';
  cat.isMoving = true;

  // Log click for RL (Phase 4 will use this!)
  cat.interactionLog.push({
    time: Date.now(),
    x: e.clientX,
    y: e.clientY,
    catX: cat.x,
    catY: cat.y,
    // distance cat needs to travel
    dist: Math.hypot(e.clientX - cat.x, e.clientY - cat.y)
  });

  // Keep log last 50 interactions only
  if (cat.interactionLog.length > 50) cat.interactionLog.shift();
});

// ============================================
// LERP FUNCTION
// ML CONCEPT: Lerp = linear interpolation.
// Used in neural net weight updates too!
// lerp(a, b, t) = a + t*(b-a)
// t=0 → stays at a | t=1 → jumps to b
// ============================================
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ============================================
// DRAW CAT — SVG-style on Canvas
// Matches the Pinterest design: big oval eyes,
// round body, pointed ears, curled tail
// ============================================
// ============================================
// DRAW LEGS
// ML CONCEPT: Sin wave phase offset =
// same idea as positional encoding in GPT!
// sin(t) and sin(t+π) are always opposite
// just like left and right legs should be
// ============================================
function drawLegs(s) {
  const legLength = s * 0.55;
  const legWidth  = s * 0.18;
  const legY      = s * 0.55; // how far down from center legs start

  // 4 legs: front-left, front-right, back-left, back-right
  const legs = [
    { x: -s * 0.5, phase: 0           },  // front left
    { x:  s * 0.28, phase: Math.PI      },  // front right (opposite)
    { x: -s * 0.25,  phase: Math.PI      },  // back left
    { x:  s * 0.05,  phase: 0            },  // back right
  ];

  legs.forEach(leg => {
    // Swing angle using sine wave + phase offset
    const swing = Math.sin(cat.walkCycle + leg.phase) * 0.2;

    ctx.save();
    ctx.translate(leg.x, legY);
    ctx.rotate(swing); // rotate the leg

    // Upper leg
    ctx.beginPath();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = legWidth;
    ctx.lineCap = 'round';
    ctx.moveTo(0, 0);
    ctx.lineTo(0, legLength * 0.55);
    ctx.stroke();

    // Lower leg (shin) — slight bend
    ctx.translate(0, legLength * 0.55);
    ctx.rotate(swing * 0.5); // knee bends half as much
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, legLength * 0.5);
    ctx.stroke();

    // Tiny paw at the end 🐾
    ctx.beginPath();
    ctx.fillStyle = '#111';
    ctx.ellipse(0, legLength * 0.52, legWidth * 0.6, legWidth * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}
function drawCat(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // Head turn — rotate slightly toward mouse
const angle = Math.atan2(mouse.y - y, mouse.x - x);
const tilt = (angle / Math.PI) * 0.05; // subtle tilt
ctx.rotate(tilt);

  const s = cat.size;

  // --- TAIL (curled behind) ---
  ctx.beginPath();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = s * 0.2;
  ctx.lineCap = 'round';
  // Bezier curl
  ctx.moveTo(s * 0.25, s * 0.55);
  ctx.bezierCurveTo(
    s * 1.2,  s * 0.9,
    s * 1.3,  s * 0.3,
    s * 0.5,  s * 0.2);
  ctx.stroke();
// Draw legs BEFORE body so body covers the tops
drawLegs(s);

// --- BODY ---
ctx.beginPath();
ctx.fillStyle = '#111';
// Body bobs up and down while walking
// ML CONCEPT: Adding noise/variation = dropout-like regularization
const bob = cat.isMoving ? Math.sin(cat.walkCycle * 2) * 1.8 : 0;
ctx.ellipse(0, s * 0.15 + bob, s * 0.75, s * 0.7, 0, 0, Math.PI * 2);
ctx.fill();

  // --- LEFT EAR ---
  ctx.beginPath();
  ctx.fillStyle = '#111';
  ctx.moveTo(-s * 0.45, -s * 0.35);
  ctx.lineTo(-s * 0.65, -s * 0.75);
  ctx.lineTo(-s * 0.2,  -s * 0.45);
  ctx.closePath();
  ctx.fill();

  // --- RIGHT EAR ---
  ctx.beginPath();
  ctx.fillStyle = '#111';
  ctx.moveTo(s * 0.3,  -s * 0.45);
  ctx.lineTo(s * 0.55, -s * 0.78);
  ctx.lineTo(s * 0.55, -s * 0.35);
  ctx.closePath();
  ctx.fill();

  // --- RIGHT EAR INNER (white) ---
  ctx.beginPath();
  ctx.fillStyle = '#322626';
  ctx.moveTo(s * 0.45, -s * 0.46);
  ctx.lineTo(s * 0.52, -s * 0.68);
  ctx.lineTo(s * 0.52, -s * 0.38);
  ctx.closePath();
  ctx.fill();

  // ============================================
  // EYES — the magic part!
  // ML CONCEPT: We compute a direction VECTOR
  // from cat position to mouse position.
  // This is identical to how transformers compute
  // attention: "where should I look?"
  // ============================================

  // Eye socket positions (white ovals)
  const leftEye  = { x: -s * 0.45, y: -s * 0.08 };
  const rightEye = { x:  s * 0.22, y: -s * 0.12 };
  const eyeRx = s * 0.28;  // eye oval width
  const eyeRy = s * 0.29;  // eye oval height

  // Draw white eye sockets
  [leftEye, rightEye].forEach(eye => {
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.ellipse(eye.x, eye.y, eyeRx, eyeRy, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- PUPIL TRACKING ---
  // Step 1: vector from cat center to mouse (in world space)
  const worldMouseX = mouse.x - x;
  const worldMouseY = mouse.y - y;

  // Step 2: normalize the vector (make length = 1)
  // ML CONCEPT: Normalization is used everywhere in ML
  // — batch norm, layer norm, unit vectors in embeddings
  const dist = Math.hypot(worldMouseX, worldMouseY) || 1;
  const nx = worldMouseX / dist;
  const ny = worldMouseY / dist;

  // Step 3: offset pupils by a small amount in mouse direction
  const pupilOffset = s * 0.1;

  [leftEye, rightEye].forEach(eye => {
    const px = eye.x + nx * pupilOffset;
    const py = eye.y + ny * pupilOffset;

    // Pupil (black circle)
    ctx.beginPath();
    ctx.fillStyle = '#111';
    ctx.ellipse(px, py, eyeRx * 0.55, eyeRy * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiny white glint ✨
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.ellipse(px - eyeRx*0.15, py - eyeRy*0.18, eyeRx*0.13, eyeRy*0.13, 0, 0, Math.PI*2);
    ctx.fill();
  });

  ctx.restore();
}

// ============================================
// DRAW FLOOR — cozy room feel
// ============================================
function drawRoom() {
  // Floor line
  const floorY = canvas.height * 0.82;
  ctx.fillStyle = '#2a1f3d';
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);

  // Skirting board
  ctx.fillStyle = '#3d2e57';
  ctx.fillRect(0, floorY, canvas.width, 8);

  // Tiny star particles on wall
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  // Static stars (use fixed positions)
  [[120,80],[340,150],[600,60],[800,200],[200,300],
   [950,100],[1100,250],[400,350],[700,180]].forEach(([sx,sy]) => {
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI*2);
    ctx.fill();
  });
}

// ============================================
// DRAW CLICK TARGET — little paw print marker
// ============================================
function drawTarget() {
  if (!cat.isMoving) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#c084fc';
  ctx.beginPath();
  ctx.arc(cat.targetX, cat.targetY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ============================================
// UPDATE — runs every frame
// ML CONCEPT: This loop = the RL "time step"
// Each frame: observe state → take action → update
// ============================================
function update() {
  // Move cat toward target using LERP
  // ML CONCEPT: Lerp is like gradient descent —
  // take a small step toward the goal each frame
  cat.x = lerp(cat.x, cat.targetX, cat.speed);
  cat.y = lerp(cat.y, cat.targetY, cat.speed);

  // Check if cat reached target
  const distToTarget = Math.hypot(cat.targetX - cat.x, cat.targetY - cat.y);
  if (distToTarget < 3) {
    cat.isMoving = false;
    cat.walkCycle = 0;
    cat.walkSpeed = 0.18;
    cat.mood = 'curious';
  }
// Only advance walk cycle when moving
// ML CONCEPT: This is a gated update —
// only learn/change when there's signal!
if (cat.isMoving) {
  cat.walkCycle += cat.walkSpeed;
}
  // Update mood label
  moodLabel.textContent =
    cat.mood === 'walking'  ? '🐾 walking...' :
    cat.mood === 'happy'    ? '😻happy!'     :
    cat.mood === 'curious'  ? ' curious'    : ' idle';
}

// ============================================
// MAIN GAME LOOP
// requestAnimationFrame = ~60fps
// ML CONCEPT: Same as a training loop —
// observe → compute → update → repeat
// ============================================
function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw everything
  drawRoom();
  drawTarget();
  drawCat(cat.x, cat.y);

  // Update state
  update();

  // Schedule next frame
  requestAnimationFrame(gameLoop);
}

// START!
gameLoop();