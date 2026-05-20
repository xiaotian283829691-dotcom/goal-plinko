/**
 * Matter.js Plinko physics engine.
 *
 * Handles pin layout, ball dropping, collision detection, and bin scoring.
 * Renders via custom canvas drawing (not Matter.Render) so we have full visual control.
 */

import Matter from 'matter-js';
import { type RowCount, MULTIPLIERS, type RiskLevel } from '../config/multipliers';
import { soundManager } from './sound';

// Collision categories
const PIN_CATEGORY = 0x0001;
const BALL_CATEGORY = 0x0002;

// Ball friction tuning per row count (controls distribution spread)
const FRICTION_AIR_BY_ROWS: Record<RowCount, number> = {
  8: 0.040,
  12: 0.042,
  16: 0.037,
};

export interface BallResult {
  ballId: number;
  binIndex: number;
  multiplier: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
}

export type OnBallLand = (result: BallResult) => void;

export class PlinkoEngine {
  private engine: Matter.Engine;
  private runner: Matter.Runner;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private pins: Matter.Body[] = [];
  private walls: Matter.Body[] = [];
  private sensor: Matter.Body | null = null;
  private balls: Map<number, { body: Matter.Body; betAmount: number }> = new Map();

  // Last row pin x-coordinates for bin detection
  private lastRowXCoords: number[] = [];

  // Current config
  private _rows: RowCount = 8;
  private _risk: RiskLevel = 'low';

  // Callbacks
  private onBallLand: OnBallLand | null = null;
  private onPinHit: (() => void) | null = null;

  // Animation
  private animFrameId: number = 0;
  private running = false;

  // Pin hit sound throttle
  private lastPinSoundTime = 0;

  // Pre-loaded image assets
  private ballImg: HTMLImageElement | null = null;
  private bgImg: HTMLImageElement | null = null;
  private slotImgs: (HTMLImageElement | null)[] = [null, null, null, null, null];
  private teamBallImgs: Map<string, HTMLImageElement> = new Map();

  // External state hooks
  private _teamBallSrc: string | null = null;
  private _multiplierBoost: number = 1;

  // Particle system
  private particles: Particle[] = [];
  private static MAX_PARTICLES = 50;

  // Screen flash effect
  private _flashAlpha = 0;
  private _flashColor = '#ffffff';

  // Layout constants
  static WIDTH = 390;
  static HEIGHT = 400;
  private static PADDING_X = 30;
  private static PADDING_TOP = 20;
  private static PADDING_BOTTOM = 38;
  private static PIN_RADIUS = 3;
  private static MAX_BALL_RADIUS = 7;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.engine = Matter.Engine.create({
      timing: { timeScale: 1 },
    });

    // Increase gravity slightly for snappier feel
    this.engine.gravity.y = 1.2;

    this.runner = Matter.Runner.create();

    this.loadAssets();
    this.buildLayout();
    this.setupCollisionDetection();
  }

  private loadAssets() {
    const load = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });

    load('/images/football.png').then((img) => { this.ballImg = img; });
    load('/images/background.png').then((img) => { this.bgImg = img; });
    for (let i = 0; i < 5; i++) {
      load(`/images/slot-tier-${i + 1}.png`).then((img) => { this.slotImgs[i] = img; });
    }
  }

  get rows(): RowCount { return this._rows; }
  get risk(): RiskLevel { return this._risk; }

  setOnBallLand(cb: OnBallLand) {
    this.onBallLand = cb;
  }

  setOnPinHit(cb: () => void) {
    this.onPinHit = cb;
  }

  setRows(rows: RowCount) {
    if (rows === this._rows) return;
    this._rows = rows;
    this.removeAllBalls();
    this.buildLayout();
  }

  setRisk(risk: RiskLevel) {
    this._risk = risk;
  }

  setTeamBall(src: string | null) {
    if (src === this._teamBallSrc) return;
    this._teamBallSrc = src;
    if (src && !this.teamBallImgs.has(src)) {
      const img = new Image();
      img.onload = () => this.teamBallImgs.set(src, img);
      img.src = src;
    }
  }

  setMultiplierBoost(boost: number) {
    this._multiplierBoost = boost;
  }

  /**
   * Get the multiplier values for current rows/risk config.
   */
  getMultipliers(): number[] {
    return MULTIPLIERS[this._rows][this._risk];
  }

  /**
   * Get last row X coordinates (for rendering multiplier slots externally).
   */
  getLastRowXCoords(): number[] {
    return [...this.lastRowXCoords];
  }

  /**
   * Pin distance X for current layout.
   */
  get pinDistanceX(): number {
    const lastRowPinCount = 3 + this._rows - 1;
    return (this.canvas.width - PlinkoEngine.PADDING_X * 2) / (lastRowPinCount - 1);
  }

  private get pinRadius(): number {
    return PlinkoEngine.PIN_RADIUS;
  }

  private get ballRadius(): number {
    const gap = this.pinDistanceX - 2 * PlinkoEngine.PIN_RADIUS;
    return Math.min(PlinkoEngine.MAX_BALL_RADIUS, gap / 2 - 1);
  }

  /**
   * Drop a ball from the top center with slight random offset.
   */
  dropBall(betAmount: number): number {
    const offsetRange = this.pinDistanceX * 0.3;

    const ball = Matter.Bodies.circle(
      this.canvas.width / 2 + (Math.random() - 0.5) * offsetRange * 2,
      0,
      this.ballRadius,
      {
        restitution: 0.5,
        friction: 0.5,
        frictionAir: FRICTION_AIR_BY_ROWS[this._rows],
        collisionFilter: {
          category: BALL_CATEGORY,
          mask: PIN_CATEGORY,
        },
      },
    );

    Matter.Composite.add(this.engine.world, ball);
    this.balls.set(ball.id, { body: ball, betAmount });
    return ball.id;
  }

  /**
   * Start the engine and render loop.
   */
  start() {
    if (this.running) return;
    this.running = true;
    Matter.Runner.run(this.runner, this.engine);
    this.renderLoop();
  }

  /**
   * Stop everything.
   */
  stop() {
    this.running = false;
    Matter.Runner.stop(this.runner);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  /**
   * Clean up for unmount.
   */
  destroy() {
    this.stop();
    Matter.Engine.clear(this.engine);
  }

  // --- Particle system ---

  spawnParticles(x: number, y: number, count: number, color: string) {
    const available = PlinkoEngine.MAX_PARTICLES - this.particles.length;
    const toSpawn = Math.min(count, available);
    for (let i = 0; i < toSpawn; i++) {
      const angle = (Math.PI * 2 * i) / toSpawn + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // bias upward
        life: 40,
        maxLife: 40,
        color,
        radius: 1.5 + Math.random() * 2.5,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  triggerScreenFlash(color: string) {
    this._flashAlpha = 0.4;
    this._flashColor = color;
  }

  // --- Private ---

  private buildLayout() {
    const { PADDING_X, PADDING_TOP, PADDING_BOTTOM } = PlinkoEngine;

    // Remove old pins/walls
    if (this.pins.length > 0) {
      Matter.Composite.remove(this.engine.world, this.pins);
      this.pins = [];
    }
    if (this.walls.length > 0) {
      Matter.Composite.remove(this.engine.world, this.walls);
      this.walls = [];
    }
    if (this.sensor) {
      Matter.Composite.remove(this.engine.world, this.sensor);
      this.sensor = null;
    }
    this.lastRowXCoords = [];

    const w = this.canvas.width;
    const h = this.canvas.height;
    const rows = this._rows;

    // Place pins in triangular arrangement
    for (let row = 0; row < rows; row++) {
      const rowY = PADDING_TOP + ((h - PADDING_TOP - PADDING_BOTTOM) / (rows - 1)) * row;
      const pinsInRow = 3 + row;
      const rowPaddingX = PADDING_X + ((rows - 1 - row) * this.pinDistanceX) / 2;

      for (let col = 0; col < pinsInRow; col++) {
        const colX = pinsInRow > 1
          ? rowPaddingX + ((w - rowPaddingX * 2) / (pinsInRow - 1)) * col
          : w / 2;

        const pin = Matter.Bodies.circle(colX, rowY, this.pinRadius, {
          isStatic: true,
          collisionFilter: {
            category: PIN_CATEGORY,
            mask: BALL_CATEGORY,
          },
        });
        this.pins.push(pin);

        if (row === rows - 1) {
          this.lastRowXCoords.push(colX);
        }
      }
    }
    Matter.Composite.add(this.engine.world, this.pins);

    // Angled walls on left and right to keep balls in bounds
    const firstPinX = this.pins[0].position.x;
    const leftMostLastPin = this.lastRowXCoords[0];
    const wallAngle = Math.atan2(
      firstPinX - leftMostLastPin,
      h - PADDING_TOP - PADDING_BOTTOM,
    );
    const wallCenterX = firstPinX - (firstPinX - leftMostLastPin) / 2 - this.pinDistanceX * 0.3;

    const leftWall = Matter.Bodies.rectangle(
      wallCenterX,
      h / 2,
      10,
      h,
      { isStatic: true, angle: wallAngle, render: { visible: false } },
    );
    const rightWall = Matter.Bodies.rectangle(
      w - wallCenterX,
      h / 2,
      10,
      h,
      { isStatic: true, angle: -wallAngle, render: { visible: false } },
    );
    this.walls.push(leftWall, rightWall);
    Matter.Composite.add(this.engine.world, this.walls);

    // Bottom sensor for detecting ball landing
    this.sensor = Matter.Bodies.rectangle(
      w / 2,
      h - PADDING_BOTTOM + 10,
      w,
      10,
      { isSensor: true, isStatic: true },
    );
    Matter.Composite.add(this.engine.world, this.sensor);
  }

  private setupCollisionDetection() {
    Matter.Events.on(this.engine, 'collisionStart', ({ pairs }) => {
      for (const pair of pairs) {
        // Ball hitting sensor (landing in bin)
        if (pair.bodyA === this.sensor && this.balls.has(pair.bodyB.id)) {
          this.handleBallLand(pair.bodyB);
        } else if (pair.bodyB === this.sensor && this.balls.has(pair.bodyA.id)) {
          this.handleBallLand(pair.bodyA);
        }

        // Ball hitting pin (sound)
        const now = performance.now();
        if (now - this.lastPinSoundTime > 30) {
          const isPin = this.pins.includes(pair.bodyA) || this.pins.includes(pair.bodyB);
          if (isPin) {
            soundManager.playPinHit();
            this.lastPinSoundTime = now;
            this.onPinHit?.();
          }
        }
      }
    });
  }

  private handleBallLand(ball: Matter.Body) {
    const entry = this.balls.get(ball.id);
    if (!entry) return;

    // Determine which bin the ball landed in
    const ballX = ball.position.x;
    const coords = this.lastRowXCoords;
    let binIndex = coords.findIndex((pinX, i) => {
      if (i === coords.length - 1) return true;
      const midpoint = (pinX + coords[i + 1]) / 2;
      return ballX < midpoint;
    });

    // Clamp to valid range
    if (binIndex < 0) binIndex = 0;
    if (binIndex >= coords.length) binIndex = coords.length - 1;

    const multipliers = MULTIPLIERS[this._rows][this._risk];
    const multIndex = Math.min(binIndex, multipliers.length - 1);
    const multiplier = multipliers[multIndex] * this._multiplierBoost;

    // Play result sound + spawn particles for big wins
    if (multiplier >= 10) {
      soundManager.playMegaWin();
      // Big particle burst + screen flash for jackpot
      const slotX = coords.length > 1 && multIndex < coords.length - 1
        ? (coords[multIndex] + coords[multIndex + 1]) / 2
        : coords[coords.length - 1];
      const slotY = this.canvas.height - PlinkoEngine.PADDING_BOTTOM + 18;
      this.spawnParticles(slotX, slotY, 30, '#ff003f');
      this.spawnParticles(slotX, slotY, 15, '#ffaa00');
      this.triggerScreenFlash('#ffffff');
    } else if (multiplier >= 5) {
      soundManager.playBigWin();
      // Particle burst for big win
      const slotX = coords.length > 1 && multIndex < coords.length - 1
        ? (coords[multIndex] + coords[multIndex + 1]) / 2
        : coords[coords.length - 1];
      const slotY = this.canvas.height - PlinkoEngine.PADDING_BOTTOM + 18;
      this.spawnParticles(slotX, slotY, 20, '#ffaa00');
    } else if (multiplier >= 1) {
      soundManager.playWin(multiplier);
    } else {
      soundManager.playLoss();
    }

    // Callback
    if (this.onBallLand) {
      this.onBallLand({
        ballId: ball.id,
        binIndex: multIndex,
        multiplier,
      });
    }

    // Remove ball
    Matter.Composite.remove(this.engine.world, ball);
    this.balls.delete(ball.id);
  }

  private removeAllBalls() {
    for (const [, entry] of this.balls) {
      Matter.Composite.remove(this.engine.world, entry.body);
    }
    this.balls.clear();
  }

  // --- Rendering ---

  private renderLoop = () => {
    if (!this.running) return;
    this.draw();
    this.animFrameId = requestAnimationFrame(this.renderLoop);
  };

  private draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    if (this.bgImg) {
      ctx.drawImage(this.bgImg, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0a1a0f';
      ctx.fillRect(0, 0, w, h);
    }

    // Draw pins with metallic gradient
    const r = this.pinRadius;
    for (const pin of this.pins) {
      const px = pin.position.x;
      const py = pin.position.y;
      const grad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#c0c0c0');
      grad.addColorStop(1, '#666666');
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    this.drawMultiplierSlots(ctx);

    for (const [, entry] of this.balls) {
      this.drawBall(ctx, entry.body);
    }

    // Update and draw particles
    this.updateParticles();
    this.drawParticles(ctx);

    // Screen flash effect
    if (this._flashAlpha > 0) {
      ctx.globalAlpha = this._flashAlpha;
      ctx.fillStyle = this._flashColor;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      this._flashAlpha -= 0.02;
      if (this._flashAlpha < 0) this._flashAlpha = 0;
    }
  }

  private drawBall(ctx: CanvasRenderingContext2D, ball: Matter.Body) {
    const x = ball.position.x;
    const y = ball.position.y;
    const r = this.ballRadius;

    const teamImg = this._teamBallSrc ? this.teamBallImgs.get(this._teamBallSrc) : null;
    const img = teamImg ?? this.ballImg;
    if (img) {
      ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }

  private getSlotTier(mult: number): number {
    if (mult >= 10) return 4;
    if (mult >= 2) return 3;
    if (mult >= 1) return 2;
    if (mult >= 0.5) return 1;
    return 0;
  }

  private drawMultiplierSlots(ctx: CanvasRenderingContext2D) {
    const multipliers = this.getMultipliers();
    const coords = this.lastRowXCoords;
    if (coords.length < 2) return;

    const slotWidth = coords.length > 1 ? (coords[1] - coords[0]) * 0.85 : 30;
    const slotHeight = slotWidth * 0.75;
    const slotY = this.canvas.height - PlinkoEngine.PADDING_BOTTOM + 14;

    for (let i = 0; i < multipliers.length; i++) {
      const mult = multipliers[i];
      const centerX = i < coords.length - 1
        ? (coords[i] + coords[i + 1]) / 2
        : coords[coords.length - 1] + (coords[1] - coords[0]) / 2;

      const tier = this.getSlotTier(mult);
      const slotImg = this.slotImgs[tier];
      const sx = centerX - slotWidth / 2;
      const sy = slotY - slotHeight / 2;

      if (slotImg) {
        ctx.drawImage(slotImg, sx, sy, slotWidth, slotHeight);
      } else {
        const colors = ['#444444', '#555555', '#33aa33', '#d4a853', '#ff003f'];
        ctx.fillStyle = colors[tier];
        ctx.beginPath();
        ctx.roundRect(sx, sy, slotWidth, slotHeight, 4);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${slotWidth < 25 ? 7 : 9}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeText(`${mult}x`, centerX, slotY);
      ctx.fillText(`${mult}x`, centerX, slotY);
    }
  }
}
