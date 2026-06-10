export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = Math.min(options.initialDelay * Math.pow(2, attempt), options.maxDelay);
  if (options.jitter) {
    return Math.round(delay * (0.5 + Math.random() * 0.5));
  }
  return delay;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts: Required<RetryOptions> = {
    maxRetries: options?.maxRetries ?? 3,
    initialDelay: options?.initialDelay ?? 1000,
    maxDelay: options?.maxDelay ?? 30000,
    jitter: options?.jitter ?? true,
    onRetry: options?.onRetry ?? (() => {}), // eslint-disable-line @typescript-eslint/no-empty-function,@typescript-eslint/explicit-function-return-type
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < opts.maxRetries) {
        opts.onRetry(error, attempt + 1);
        const delay = calculateDelay(attempt, opts);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
  });

  return Promise.race([
    promise.finally(() => { clearTimeout(timer); }),
    timeoutPromise,
  ]);
}

export async function parallel<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  const entries = tasks.entries();

  async function worker(): Promise<void> {
    for (const [index, task] of entries) {
      results[index] = await task();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, ms);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}

export function raceWithTimeout<T>(
  promises: Promise<T>[],
  ms: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
  });

  return Promise.race([
    Promise.race(promises).finally(() => { clearTimeout(timer); }),
    timeoutPromise,
  ]);
}
