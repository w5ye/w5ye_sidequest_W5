class Player {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.s = speed ?? 3;

    // --- breathing blob properties ---
    this.baseSize = 40;
    this.size = this.baseSize;
    this.breathSpeed = 0.05; // speed of breathing
    this.breathAmplitude = 4; // how much the blob expands/contracts
    this.color = [255, 255, 255]; // initial color
    this.frameOffset = random(1000); // for smooth phase offset
  }

  setRegionProperties(region, weight = 1) {
    if (!region) return;

    // --- color blending ---
    const baseColors = {
      center: [255, 255, 255],
      north: [0, 102, 204],
      east: [255, 51, 51],
      south: [0, 204, 102],
      west: [255, 204, 0],
    };

    const targetColor = baseColors[region.key] ?? [50, 110, 255];
    // smooth blend with weight
    this.color = this.color.map((c, i) => lerp(c, targetColor[i], weight));

    // --- breathing blending ---
    const breathSettings = {
      center: [0.02, 3],
      north: [0.04, 5],
      east: [0.08, 6],
      south: [0.06, 4],
      west: [0.03, 7],
    }[region.key] ?? [0.05, 4];

    const factor = 0.15; // bigger = faster transition
    this.breathSpeed = lerp(
      this.breathSpeed,
      breathSettings[0],
      factor * weight,
    );
    this.breathAmplitude = lerp(
      this.breathAmplitude,
      breathSettings[1],
      factor * weight,
    );
  }

  updateInput() {
    const dx =
      (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) -
      (keyIsDown(LEFT_ARROW) || keyIsDown(65));
    const dy =
      (keyIsDown(DOWN_ARROW) || keyIsDown(83)) -
      (keyIsDown(UP_ARROW) || keyIsDown(87));

    const len = max(1, abs(dx) + abs(dy));
    this.x += (dx / len) * this.s;
    this.y += (dy / len) * this.s;
  }

  update() {
    // --- breathing effect ---
    this.size =
      this.baseSize +
      sin(frameCount * this.breathSpeed + this.frameOffset) *
        this.breathAmplitude;
  }

  draw() {
    fill(this.color[0], this.color[1], this.color[2]);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }
}
