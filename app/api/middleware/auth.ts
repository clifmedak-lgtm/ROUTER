import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { base } from "../__core/app";
import { auth } from "../auth";
import { db } from "../database";
import { profiles } from "../database/schema";

/** Loads (or lazily creates) the app profile for a user. */
export async function getProfile(userId: string) {
  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (existing) return existing;
  const [created] = await db
    .insert(profiles)
    .values({ userId, role: "rider" })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [again] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return again!;
}

/** Optional auth — `context.user` is the session user or null. */
export const withUser = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return next({ context: { user: session?.user ?? null } });
});

/** Protected procedures — rejects unauthenticated calls. */
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED", { message: "Please sign in" });
  const profile = await getProfile(session.user.id);
  return next({ context: { user: session.user, profile } });
});

/** Admin-only procedures. */
export const adminOnly = authed.use(async ({ context, next }) => {
  if (context.profile.role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Admins only" });
  }
  return next();
});
