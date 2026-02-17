class WorldLevel {
  constructor(json) {
    this.schemaVersion = json.schemaVersion ?? 1;

    this.w = json.world?.w ?? 2400;
    this.h = json.world?.h ?? 1600;
    this.bg = json.world?.bg ?? [235, 235, 235];
    this.gridStep = json.world?.gridStep ?? 160;

    this.obstacles = json.obstacles ?? [];

    // NEW: camera tuning knob from JSON (data-driven)
    this.camLerp = json.camera?.lerp ?? 0.12;
    this.regions = json.regions ?? {};
    this.activeRegion = "center";
    this.regionNames = {
      center: "⚪ Stillness Circle",
      north: " 🔵Deep Sea",
      east: "🔴 Shaking Smoothie",
      south: "🟢 Dreamy Drift",
      west: "🟡 Shifting Sands",
    };
  }

  drawBackground() {
    background(220);
  }

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
    this.drawObstacles(); // call the new obstacle function

    // --- region wedges ---
    const center = this.regions.center;
    const c = this.regions.center;
    if (c) {
      const drawWedge = (startAngle, endAngle, col) => {
        push();
        noStroke();
        fill(col[0], col[1], col[2], 60);
        arc(c.x, c.y, this.w * 2, this.h * 2, startAngle, endAngle, PIE);
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

  // --- new helper function for obstacles ---
  drawObstacles() {
    for (const o of this.obstacles) {
      push();
      noStroke();
      // Simple example: choose shape based on region key if you want
      let shapeType = o.shape ?? "rect"; // default rectangle
      switch (shapeType) {
        case "circle":
          fill(200, 100, 100);
          ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w, o.h);
          break;
        case "triangle":
          fill(100, 200, 100);
          triangle(o.x, o.y + o.h, o.x + o.w / 2, o.y, o.x + o.w, o.y + o.h);
          break;
        default: // rectangle
          fill(170, 190, 210);
          rect(o.x, o.y, o.w, o.h, o.r ?? 0);
          break;
      }
      pop();
    }
  }

  applyRegionBehavior(player) {
    const r = this.regions[this.activeRegion];
    if (!r) return;

    this.targetCamLerp = r.camLerp ?? this.camLerp;
    this.currentCamMode = r.camMode ?? "normal";
    this.currentPlayerSpeed = r.playerSpeed ?? player.s;
  }
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
      "camLerp(JSON): " +
        this.camLerp +
        "  Player: " +
        (player.x | 0) +
        "," +
        (player.y | 0) +
        "  Cam: " +
        (camX | 0) +
        "," +
        (camY | 0),
      width / 2,
      50,
    );
    const regionName = this.regionNames[this.activeRegion] ?? this.activeRegion;
    text("Region: " + regionName, width / 2, 70);
  }
  updateRegion(px, py) {
    const center = this.regions.center;
    if (!center) return;

    const dx = px - center.x;
    const dy = py - center.y;
    const distSq = dx * dx + dy * dy;
    const radius = center.radius;

    // Inside neutral circle
    if (distSq <= radius * radius) {
      this.activeRegion = "center";
      this.regionWeight = 1; // fully in center
      return;
    }

    // Angle from center
    const angle = atan2(dy, dx); // -PI to PI

    // Determine primary region
    let primary = "";
    if (angle >= -PI / 4 && angle < PI / 4) primary = "east";
    else if (angle >= PI / 4 && angle < (3 * PI) / 4) primary = "south";
    else if (angle >= -(3 * PI) / 4 && angle < -PI / 4) primary = "north";
    else primary = "west";

    this.activeRegion = primary;

    // Smooth weight based on distance from center edge
    const dist = sqrt(distSq) - radius; // distance outside neutral circle
    const maxBlend = 150; // distance over which blending occurs
    this.regionWeight = constrain(dist / maxBlend, 0, 1); // 0=center, 1=full region
  }
}
