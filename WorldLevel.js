class WorldLevel {
  constructor(json) {
    this.schemaVersion = json.schemaVersion ?? 1;

    this.w = json.world?.w ?? 2400;
    this.h = json.world?.h ?? 1600;
    this.bg = json.world?.bg ?? [235, 235, 235];
    this.gridStep = json.world?.gridStep ?? 160;

    this.regions = json.regions ?? {};
    this.activeRegion = "center";

    this.obstacles = json.obstacles ?? [];
    this.generateRandomObstaclesPerRegion();

    // Camera tuning
    this.camLerp = json.camera?.lerp ?? 0.12;

    // Region display names
    this.regionNames = {
      center: "⚪ Stillness Circle",
      north: " 🔵Deep Sea",
      east: "🔴 Shaking Smoothie",
      south: "🟢 Dreamy Drift",
      west: "🟡 Shifting Sands",
    };
  }

  // --- generate random obstacles per wedge ---
  generateRandomObstaclesPerRegion() {
    const numObstaclesPerRegion = 12;
    const center = this.regions.center;
    if (!center) return;

    // clear existing so they don't stack
    this.obstacles = [];

    const regionConfig = {
      east: { shape: "circle", angleMin: -PI / 4, angleMax: PI / 4 },
      south: { shape: "triangle", angleMin: PI / 4, angleMax: (3 * PI) / 4 },
      north: { shape: "rect", angleMin: (-3 * PI) / 4, angleMax: -PI / 4 },
      west: { shape: "circle", angleMin: (3 * PI) / 4, angleMax: (5 * PI) / 4 },
    };

    const maxRadius = dist(0, 0, this.w, this.h); // farthest possible

    for (const key in regionConfig) {
      const cfg = regionConfig[key];

      for (let i = 0; i < numObstaclesPerRegion; i++) {
        let x, y, size;
        let tries = 0;

        do {
          const angle = random(cfg.angleMin, cfg.angleMax);
          const radius = random(center.radius + 60, maxRadius);

          x = center.x + cos(angle) * radius;
          y = center.y + sin(angle) * radius;

          size = random(40, 80);

          tries++;
          if (tries > 100) break;
        } while (
          // inside neutral circle
          dist(x, y, center.x, center.y) < center.radius + size ||
          // outside canvas bounds (ensure full shape fits)
          x - size / 2 < 0 ||
          x + size / 2 > this.w ||
          y - size / 2 < 0 ||
          y + size / 2 > this.h
        );

        this.obstacles.push({
          x,
          y,
          w: size,
          h: size,
          shape: cfg.shape,
          region: key,
        });
      }
    }
  }

  // --- draw background ---
  drawBackground() {
    background(220);
  }

  // --- draw world ---
  drawWorld() {
    noStroke();
    const r = this.regions[this.activeRegion];
    const col = r?.color ?? this.bg;
    fill(col[0], col[1], col[2]);
    rect(0, 0, this.w, this.h);

    // --- grid ---
    stroke(245);
    for (let x = 0; x <= this.w; x += this.gridStep) line(x, 0, x, this.h);
    for (let y = 0; y <= this.h; y += this.gridStep) line(0, y, this.w, y);

    // --- obstacles ---
    this.drawObstacles();

    // --- region wedges ---
    const center = this.regions.center;
    if (center) {
      const drawWedge = (startAngle, endAngle, col) => {
        push();
        noStroke();
        fill(col[0], col[1], col[2], 60);
        arc(
          center.x,
          center.y,
          this.w * 2,
          this.h * 2,
          startAngle,
          endAngle,
          PIE,
        );
        pop();
      };

      drawWedge(-PI / 4, PI / 4, this.regions.east.color);
      drawWedge(PI / 4, (3 * PI) / 4, this.regions.south.color);
      drawWedge(-(3 * PI) / 4, -PI / 4, this.regions.north.color);
      drawWedge((3 * PI) / 4, (5 * PI) / 4, this.regions.west.color);
    }

    // --- neutral circle boundary ---
    if (center) {
      push();
      noFill();
      stroke(150, 150, 150, 60);
      strokeWeight(6);
      circle(center.x, center.y, center.radius * 2);

      stroke(150, 150, 150, 25);
      strokeWeight(14);
      circle(center.x, center.y, center.radius * 2);
      pop();
    }
  }

  // --- draw obstacles ---
  drawObstacles() {
    for (const o of this.obstacles) {
      push();
      noStroke();

      switch (o.shape) {
        case "circle":
          if (o.region === "west") {
            fill(240, 210, 90, 100); // yellow west circles
          } else {
            fill(200, 100, 100, 100); // red east circles
          }
          ellipse(o.x, o.y, o.w, o.h);
          break;

        case "triangle":
          fill(100, 200, 100, 100); // south
          triangle(o.x, o.y + o.h, o.x + o.w / 2, o.y, o.x + o.w, o.y + o.h);
          break;

        case "rect":
        default:
          fill(170, 190, 210, 100); // north
          rect(o.x, o.y, o.w, o.h, o.r ?? 0);
          break;
      }

      pop();
    }
  }

  // --- region behavior ---
  applyRegionBehavior(player) {
    const r = this.regions[this.activeRegion];
    if (!r) return;
    this.targetCamLerp = r.camLerp ?? this.camLerp;
    this.currentCamMode = r.camMode ?? "normal";
    this.currentPlayerSpeed = r.playerSpeed ?? player.s;
  }

  // --- HUD ---
  drawHUD(player, camX, camY) {
    noStroke();
    fill(20);
    textAlign(CENTER);
    textStyle(BOLD);
    textFont("Courier New", 24);
    text("Mental Meditative World", width / 2, 30);
    textStyle(NORMAL);
    textFont("Courier New", 14);
    text(
      `camLerp(JSON): ${this.camLerp}  Player: ${player.x | 0},${player.y | 0}  Cam: ${camX | 0},${camY | 0}`,
      width / 2,
      50,
    );
    const regionName = this.regionNames[this.activeRegion] ?? this.activeRegion;
    text("Region: " + regionName, width / 2, 70);
  }

  // --- update region based on player position ---
  updateRegion(px, py) {
    const center = this.regions.center;
    if (!center) return;

    const dx = px - center.x;
    const dy = py - center.y;
    const distSq = dx * dx + dy * dy;
    const radius = center.radius;

    if (distSq <= radius * radius) {
      this.activeRegion = "center";
      this.regionWeight = 1;
      return;
    }

    const angle = atan2(dy, dx);
    let primary = "";
    if (angle >= -PI / 4 && angle < PI / 4) primary = "east";
    else if (angle >= PI / 4 && angle < (3 * PI) / 4) primary = "south";
    else if (angle >= -(3 * PI) / 4 && angle < -PI / 4) primary = "north";
    else primary = "west";

    this.activeRegion = primary;

    const dist = sqrt(distSq) - radius;
    const maxBlend = 150;
    this.regionWeight = constrain(dist / maxBlend, 0, 1);
  }
}
