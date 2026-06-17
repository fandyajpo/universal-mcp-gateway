export const MAX_BUFFER_SIZE = 100;
export const HIGH_WATERMARK = 50;
export const LOW_WATERMARK = 20;

export class BackpressureController {
  private count = 0;
  private _paused = false;

  get paused(): boolean {
    return this._paused;
  }

  get size(): number {
    return this.count;
  }

  push(): void {
    this.count = Math.min(this.count + 1, MAX_BUFFER_SIZE);

    if (this.count >= HIGH_WATERMARK && !this._paused) {
      this._paused = true;
    }
  }

  pop(): void {
    this.count = Math.max(this.count - 1, 0);

    if (this.count <= LOW_WATERMARK && this._paused) {
      this._paused = false;
    }
  }

  reset(): void {
    this.count = 0;
    this._paused = false;
  }
}
