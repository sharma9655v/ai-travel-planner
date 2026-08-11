export class PlanningProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanningProviderError';
  }
}

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

export async function fetchPlanningJson<T>(
  input: URL | string,
  init: RequestInit = {},
  timeoutMs = 7_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      cache: init.cache ?? 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new PlanningProviderError(`Planning provider returned ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof PlanningProviderError) throw error;
    if (controller.signal.aborted) {
      throw new PlanningProviderError('Planning provider timed out.');
    }
    throw new PlanningProviderError('Planning provider is unavailable.');
  } finally {
    clearTimeout(timer);
  }
}
