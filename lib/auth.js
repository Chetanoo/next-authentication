import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import db from "@/lib/db";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import { cookies } from "next/headers";

const adapter = new BetterSqlite3Adapter(db, {
  user: "users",
  session: "sessions",
});

const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
});

async function setSessionCookie(sessionId) {
  const sessionCookie = lucia.createSessionCookie(sessionId);

  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}

async function deleteSessionCookie() {
  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}

export async function createAuthSession(userId) {
  const session = await lucia.createSession(userId, {});
  await setSessionCookie(session.id);
}

export async function verifyAuth() {
  const sessionCookie = (await cookies()).get(lucia.sessionCookieName);

  const sessionId = sessionCookie?.value;

  if (!sessionCookie || !sessionId) {
    return { user: null, session: null };
  }

  const result = await lucia.validateSession(sessionId);

  try {
    if (result.session && result.session.fresh) {
      await setSessionCookie(result.session.id);
    } else {
      await deleteSessionCookie();
    }
  } catch {}

  return result;
}

export async function destroySession() {
  const { session } = await verifyAuth();
  if (!session) {
    return { error: "unauthorized" };
  }

  await lucia.invalidateSession(session.id);

  await deleteSessionCookie();
}
