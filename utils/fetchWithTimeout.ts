/**
 * Wrapper pour fetch avec timeout automatique
 * Évite les requêtes bloquées indéfiniment
 */

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 60000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new TimeoutError(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
};

export const promiseWithTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = `Operation timed out after ${timeoutMs}ms`
): Promise<T> => {
  // ROBUSTESSE: Validation des paramètres
  if (!promise || typeof timeoutMs !== 'number' || timeoutMs <= 0) {
    return Promise.reject(new Error('Invalid parameters for promiseWithTimeout'));
  }

  let timeoutId: NodeJS.Timeout | number | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new TimeoutError(errorMessage)), timeoutMs);
  });

  // FIX CRITIQUE: Nettoyer le timer si la promesse se résout avant le timeout
  return Promise.race([
    promise.then(
      (value) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        return value;
      },
      (error) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        throw error;
      }
    ),
    timeoutPromise,
  ]);
};
