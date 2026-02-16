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

    stroke(245);
    for (let x = 0; x <= this.w; x += this.gridStep) line(x, 0, x, this.h);
    for (let y = 0; y <= this.h; y += this.gridStep) line(0, y, this.w, y);

    noStroke();
    fill(170, 190, 210);
    for (const o of this.obstacles) rect(o.x, o.y, o.w, o.h, o.r ?? 0);
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
    text("Mental Meditative World", 12, 20);
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
      12,
      40,
    );
    const regionName = this.regionNames[this.activeRegion] ?? this.activeRegion;
    text("Region: " + regionName, 12, 60);
  }
  updateRegion(px, py) {
    const center = this.regions.center;
    if (!center) return;

    const dx = px - center.x;
    const dy = py - center.y;
    const distSq = dx * dx + dy * dy;

    // --- inside neutral circle ---
    if (distSq <= center.radius * center.radius) {
      this.activeRegion = "center";
      return;
    }

    // --- determine direction from center ---
    const angle = atan2(dy, dx); // -PI to PI

    // right = east, up = north (screen coords: y increases downward)
    if (angle >= -PI / 4 && angle < PI / 4) {
      this.activeRegion = "east";
    } else if (angle >= PI / 4 && angle < (3 * PI) / 4) {
      this.activeRegion = "south";
    } else if (angle >= -(3 * PI) / 4 && angle < -PI / 4) {
      this.activeRegion = "north";
    } else {
      this.activeRegion = "west";
    }
  }
}
