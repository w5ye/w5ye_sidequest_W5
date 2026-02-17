/*
Week 5 — Example 4: Data-driven world with JSON + Smooth Camera

Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
Date: Feb. 12, 2026

Move: WASD/Arrows

Learning goals:
- Extend the JSON-driven world to include camera parameters
- Implement smooth camera follow using interpolation (lerp)
- Separate camera behavior from player/world logic
- Tune motion and feel using external data instead of hard-coded values
- Maintain player visibility with soft camera clamping
- Explore how small math changes affect “game feel”
*/

const VIEW_W = 800;
const VIEW_H = 480;

let worldData;
let level;
let player;

let camX = 0;
let camY = 0;

function preload() {
  worldData = loadJSON("world.json"); // load JSON before setup [web:122]
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  textFont("sans-serif");
  textSize(14);

  level = new WorldLevel(worldData);

  const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
  player = new Player(start.x, start.y, start.speed);

  camX = player.x - width / 2;
  camY = player.y - height / 2;
}

function draw() {
  player.updateInput();

  // Keep player inside world
  player.x = constrain(player.x, 0, level.w);
  player.y = constrain(player.y, 0, level.h);
  // Apply region behaviour
  // Apply region behaviour
  level.updateRegion(player.x, player.y);
  level.applyRegionBehavior(player);
  player.s = lerp(player.s, level.currentPlayerSpeed, 0.08);

  // --- update player properties with smooth weight ---
  const activeRegionData = level.regions[level.activeRegion];
  if (activeRegionData) {
    activeRegionData.key = level.activeRegion;
    // pass regionWeight from WorldLevel for smooth blending
    player.setRegionProperties(activeRegionData, level.regionWeight);
  }

  player.update(); // breathing size updated

  player.s = lerp(player.s, level.currentPlayerSpeed, 0.08);

  // Smoothly transition camera lerp
  level.camLerp = lerp(level.camLerp, level.targetCamLerp, 0.05);
  const camLerp = level.camLerp;

  // Base target
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  // --- camera behaviour modes ---
  if (level.currentCamMode === "lag") {
    targetX -= (player.x - camX - width / 2) * 0.2;
    targetY -= (player.y - camY - height / 2) * 0.2;
  }

  if (level.currentCamMode === "drift") {
    targetX += sin(frameCount * 0.02) * 40;
    targetY += cos(frameCount * 0.015) * 30;
  }

  if (level.currentCamMode === "float") {
    targetX += sin(frameCount * 0.01) * 20;
    targetY += sin(frameCount * 0.008) * 20;
  }

  // Clamp camera
  const maxCamX = max(0, level.w - width);
  const maxCamY = max(0, level.h - height);
  targetX = constrain(targetX, 0, maxCamX);
  targetY = constrain(targetY, 0, maxCamY);

  // Smooth follow
  camX = lerp(camX, targetX, camLerp);
  camY = lerp(camY, targetY, camLerp);

  level.drawBackground();

  push();
  translate(-camX, -camY);
  level.drawWorld();
  player.draw();
  pop();

  level.drawHUD(player, camX, camY);
}

function keyPressed() {
  if (key === "r" || key === "R") {
    const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
    player = new Player(start.x, start.y, start.speed);
  }
}
