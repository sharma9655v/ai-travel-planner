// ============================================================
// Structured JSON logger — one JSON object per line to
// stdout/stderr so production log aggregators can parse the
// whole AI pipeline without ad-hoc text scraping.
//
// Logging rules enforced here:
//   - Never log secrets (API keys are logged as booleans only).
//   - User content (prompts, itineraries, chat history) is never
//     logged; only failure bodies are captured, truncated, and
//     even then only a parsed error hint is preferred.
//   - `isDev()` re-reads NODE_ENV per call so tests can flip it.
// ============================================================

type LogLevel = 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

export function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function emit(level: LogLevel, namespace: string, event: string, fields: Fields) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    namespace,
    event,
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export interface Logger {
  info: (event: string, fields?: Fields) => void;
  warn: (event: string, fields?: Fields) => void;
  error: (event: string, fields?: Fields) => void;
}

export function createLogger(namespace: string): Logger {
  return {
    info: (event, fields = {}) => emit('info', namespace, event, fields),
    warn: (event, fields = {}) => emit('warn', namespace, event, fields),
    error: (event, fields = {}) => emit('error', namespace, event, fields),
  };
}
