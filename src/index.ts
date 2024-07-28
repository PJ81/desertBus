import { HEIGHT, WIDTH } from "./low/const.js";
import Game from "./low/game.js";
import Input from "./low/input.js";

const
  MAX_KMpH = 60,
  KMpS = MAX_KMpH / 3600,
  SKY = 0,
  GRASS_L = 1,
  GRASS_D = 2,
  CLIP_L = 3,
  CLIP_D = 4,
  ROAD = 5,
  MID = 6;

class Color {
  hex: string;
  r: number;
  g: number;
  b: number;

  constructor(h: string) {
    this.hex = h;
    h = h.replace(/^#/, '');

    this.r = parseInt(h.substring(0, 2), 16);
    this.g = parseInt(h.substring(2, 4), 16);
    this.b = parseInt(h.substring(4, 6), 16);
  }
}

class DesertBus extends Game {
  fDistance: number;
  fSpeed: number;
  fCenter: number;
  input: Input;
  pixelScale: number;
  imgData: ImageData;
  img: Uint8ClampedArray;
  kmDriven: number;
  colors: Color[];

  constructor() {
    super();

    this.input = new Input({
      a: "KeyA", w: "KeyW", d: "KeyD", left: "ArrowLeft",
      up: "ArrowUp", right: "ArrowRight"
    });

    this.pixelScale = 1;
    this.fDistance = this.fSpeed = this.fCenter = this.kmDriven = 0;

    this.colors = [
      new Color("#24528F"),
      new Color("#D8923A"),
      new Color("#955a0f"),
      new Color("#796005"),
      new Color("#3a300a"),
      new Color("#444444"),
      new Color("#888800")
    ];

    this.loop();
  }

  fillPixel(clr: Color, x: number, y: number): void {
    const idx = ((~~x) + (~~y) * WIDTH) << 2;
    this.img[idx + 0] = clr.r;
    this.img[idx + 1] = clr.g;
    this.img[idx + 2] = clr.b;
  }

  update(dt: number): void {
    // accelerate
    if (this.input.isDown("up")) {
      this.fSpeed += .35 * dt;
    } else {
      this.fSpeed -= .35 * dt;
    }

    // break if too to the right or left
    if (Math.abs(this.fCenter) > .45) {
      this.fSpeed -= 2.1 * dt;
    }

    // steering
    if (this.fSpeed > 0) {
      if (this.input.isDown("left")) {
        this.fCenter += .05 * dt;
      }

      if (this.input.isDown("right")) {
        this.fCenter -= .05 * dt;
      }

      // drifting
      this.fCenter += dt * .007;
    }

    // clamp speed
    if (this.fSpeed < 0.0) this.fSpeed = 0.0;
    if (this.fSpeed > 1.0) this.fSpeed = 1.0;

    // update road
    this.fDistance += (20.0 * this.fSpeed) * dt;

    // add kilometers
    this.kmDriven += KMpS * this.fSpeed * dt;
  }

  draw(): void {
    // background
    this.ctx.fillStyle = this.colors[SKY].hex;
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw track to the image data
    this.imgData = this.ctx.getImageData(0, 0, WIDTH, HEIGHT);
    this.img = this.imgData.data;
    this.drawTrack();

    // draw horizont line
    this.ctx.fillStyle = "#6087b9";
    this.ctx.fillRect(0, HEIGHT / 2, WIDTH, 3);

    // blit text onto screen
    this.ctx.fillStyle = "#fff";
    this.ctx.fillText(`${(MAX_KMpH * this.fSpeed).toFixed(2)} Km/h`, 10, 16);
    this.ctx.fillText(`${this.kmDriven.toFixed(2)} Km`, 10, 32);
  }

  drawTrack(): void {
    let clr: Color;
    let useBackbuffer = true;

    for (let y = 0; y < HEIGHT / 2; y += this.pixelScale) {
      for (let x = 0; x < WIDTH; x += this.pixelScale) {
        let fPerspective = y / (HEIGHT / 2.0),
          fRoadWidth = fPerspective * 0.95,
          fClipWidth = fRoadWidth * 0.15,
          fLaneLine = fRoadWidth * .03;

        fRoadWidth *= 0.5;

        let fMiddlePoint = 0.5 + this.fCenter,
          nLeftGrass = (fMiddlePoint - fRoadWidth - fClipWidth) * WIDTH,
          nLeftClip = (fMiddlePoint - fRoadWidth) * WIDTH,
          nRightClip = (fMiddlePoint + fRoadWidth) * WIDTH,
          nRightGrass = (fMiddlePoint + fRoadWidth + fClipWidth) * WIDTH,
          nMidLineLeft = (fMiddlePoint - fLaneLine) * WIDTH,
          nMidLineRight = (fMiddlePoint + fLaneLine) * WIDTH,
          nRow = HEIGHT / 2 + y;

        let nRoadColour = this.colors[ROAD];

        let nGrassColour = Math.sin(20.0 * Math.pow(1.0 - fPerspective, 3) + this.fDistance * 0.1) > 0.0 ? this.colors[GRASS_L] : this.colors[GRASS_D],
          nClipColour = Math.sin(80.0 * Math.pow(1.0 - fPerspective, 2) + this.fDistance) > 0.0 ? this.colors[CLIP_L] : this.colors[CLIP_D],
          nMidLineColour = Math.sin(40.0 * Math.pow(1.0 - fPerspective, 3) + this.fDistance) > 0.0 ? this.colors[MID] : nRoadColour;

        // draw track to backbuffer (ctx.ImageData)  
        if (useBackbuffer) {
          if (x >= 0 && x < nLeftGrass) clr = nGrassColour;
          if (x >= nLeftGrass && x < nLeftClip) clr = nClipColour;
          if (x >= nLeftClip && x < nRightClip) clr = nRoadColour;
          if (x >= nMidLineLeft && x <= nMidLineRight) clr = nMidLineColour;
          if (x >= nRightClip && x < nRightGrass) clr = nClipColour;
          if (x >= nRightGrass && x < WIDTH) clr = nGrassColour;

          this.fillPixel(clr, x, nRow);

        } else {
          // draw track filling rects
          if (x >= 0 && x < nLeftGrass) this.ctx.fillStyle = nGrassColour.hex;
          if (x >= nLeftGrass && x < nLeftClip) this.ctx.fillStyle = nClipColour.hex;
          if (x >= nLeftClip && x < nRightClip) this.ctx.fillStyle = nRoadColour.hex;
          if (x >= nMidLineLeft && x <= nMidLineRight) this.ctx.fillStyle = nMidLineColour.hex;
          if (x >= nRightClip && x < nRightGrass) this.ctx.fillStyle = nClipColour.hex;
          if (x >= nRightGrass && x < WIDTH) this.ctx.fillStyle = nGrassColour.hex;

          this.ctx.fillRect(x, nRow, this.pixelScale, this.pixelScale);
        }
      }
    }

    // put the image data back to ctx
    if (useBackbuffer) this.ctx.putImageData(this.imgData, 0, 0);
  }
}

const t = new DesertBus();