/** HttpOnly cookie storing the opaque Session.id (server validates against DB). */
export const SESSION_COOKIE_NAME = 'cratedb_session';

/** Session lifetime (sliding refresh deferred to later phases). */
export const SESSION_MAX_DAYS = 30;

export const SESSION_MAX_AGE_SEC = SESSION_MAX_DAYS * 24 * 60 * 60;
