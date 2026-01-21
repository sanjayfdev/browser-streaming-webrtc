export class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  create(sessionId) {
    const session = {
      id: sessionId,
      browser: null,
      page: null,
      ffmpeg: null,
      producer: null,
      plainTransport: null,
      transports: new Set(),
      viewport: null,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  get(sessionId) {
    return this.sessions.get(sessionId);
  }

  destroy(sessionId) {
    const s = this.sessions.get(sessionId);
    if (!s) return;

    s.ffmpeg?.kill();
    s.browser?.close();
    s.transports.forEach((t) => t.close());

    this.sessions.delete(sessionId);
  }
}
