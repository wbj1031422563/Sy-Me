const sessions = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000;

function createSessionToken() {
  return `local-asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function stageLocalAsset(file, report = null) {
  if (!file) return null;
  const token = createSessionToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { file, report, objectUrl: URL.createObjectURL(file), expiresAt });
  window.setTimeout(() => {
    const session = sessions.get(token);
    if (session?.expiresAt <= Date.now()) {
      URL.revokeObjectURL(session.objectUrl);
      sessions.delete(token);
    }
  }, SESSION_TTL_MS);
  return token;
}

export function consumeLocalAsset(token) {
  if (!token) return null;
  const session = sessions.get(token);
  sessions.delete(token);
  if (!session || session.expiresAt <= Date.now()) return null;
  return session;
}

export function discardLocalAsset(token) {
  const session = sessions.get(token);
  if (!session) return;
  URL.revokeObjectURL(session.objectUrl);
  sessions.delete(token);
}
