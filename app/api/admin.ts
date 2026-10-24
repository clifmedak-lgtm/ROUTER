import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { adminOnly, authed } from "../middleware/auth";
import { db } from "../database";
import { drivers, profiles, rides, user } from "../database/schema";
import { COMMISSION } from "../lib/pricing";

export const admin = {
  /** True when no admin exists yet — the first signed-in user can claim it. */
  canClaim: authed.handler(async () => {
    const [row] = await db.select({ n: count() }).from(profiles).where(eq(profiles.role, "admin"));
    return { canClaim: (row?.n ?? 0) === 0 };
  }),

  claim: authed.handler(async ({ context }) => {
    const [row] = await db.select({ n: count() }).from(profiles).where(eq(profiles.role, "admin"));
    if ((row?.n ?? 0) > 0) throw new ORPCError("FORBIDDEN", { message: "An admin already exists" });
    await db.update(profiles).set({ role: "admin" }).where(eq(profiles.userId, context.user.id));
    return { ok: true };
  }),

  stats: adminOnly.handler(async () => {
    const [users] = await db.select({ n: count() }).from(user);
    const [driverRow] = await db
      .select({
        total: count(),
        pending: sql<number>`sum(case when ${drivers.status} = 'pending' then 1 else 0 end)`,
        online: sql<number>`sum(case when ${drivers.online} = 1 and ${drivers.status} = 'approved' then 1 else 0 end)`,
      })
      .from(drivers);
    const [rideRow] = await db
      .select({
        total: count(),
        completed: sql<number>`sum(case when ${rides.status} = 'completed' then 1 else 0 end)`,
        active: sql<number>`sum(case when ${rides.status} in ('requested','accepted','arriving','in_progress') then 1 else 0 end)`,
        gross: sql<number>`coalesce(sum(case when ${rides.status} = 'completed' then ${rides.fare} else 0 end), 0)`,
      })
      .from(rides);
    const gross = Number(rideRow?.gross ?? 0);
    return {
      users: users?.n ?? 0,
      drivers: driverRow?.total ?? 0,
      pendingDrivers: Number(driverRow?.pending ?? 0),
      onlineDrivers: Number(driverRow?.online ?? 0),
      rides: rideRow?.total ?? 0,
      completedRides: Number(rideRow?.completed ?? 0),
      activeRides: Number(rideRow?.active ?? 0),
      gross,
      revenue: Math.round(gross * COMMISSION),
    };
  }),

  drivers: adminOnly.handler(async () => {
    return db
      .select({
        userId: drivers.userId,
        name: user.name,
        email: user.email,
        phone: drivers.phone,
        city: drivers.city,
        vehicleType: drivers.vehicleType,
        vehicleModel: drivers.vehicleModel,
        vehicleColor: drivers.vehicleColor,
        plate: drivers.plate,
        licenseNumber: drivers.licenseNumber,
        photoUrl: drivers.photoUrl,
        licensePhotoUrl: drivers.licensePhotoUrl,
        status: drivers.status,
        online: drivers.online,
        ratingSum: drivers.ratingSum,
        ratingCount: drivers.ratingCount,
        createdAt: drivers.createdAt,
      })
      .from(drivers)
      .innerJoin(user, eq(user.id, drivers.userId))
      .orderBy(desc(drivers.createdAt));
  }),

  setDriverStatus: adminOnly
    .input(
      z.object({ userId: z.string(), status: z.enum(["pending", "approved", "rejected", "suspended"]) }),
    )
    .handler(async ({ input }) => {
      await db
        .update(drivers)
        .set({ status: input.status, ...(input.status !== "approved" ? { online: false } : {}) })
        .where(eq(drivers.userId, input.userId));
      return { ok: true };
    }),

  rides: adminOnly.handler(async () => {
    return db
      .select({ ride: rides, riderName: user.name })
      .from(rides)
      .innerJoin(user, eq(user.id, rides.riderId))
      .orderBy(desc(rides.createdAt))
      .limit(200);
  }),

  users: adminOnly.handler(async () => {
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        role: profiles.role,
        phone: profiles.phone,
      })
      .from(user)
      .leftJoin(profiles, eq(profiles.userId, user.id))
      .orderBy(desc(user.createdAt))
      .limit(500);
  }),

  setRole: adminOnly
    .input(z.object({ userId: z.string(), role: z.enum(["rider", "driver", "admin"]) }))
    .handler(async ({ input, context }) => {
      if (input.userId === context.user.id && input.role !== "admin") {
        throw new ORPCError("BAD_REQUEST", { message: "You can't remove your own admin role" });
      }
      await db
        .insert(profiles)
        .values({ userId: input.userId, role: input.role })
        .onConflictDoUpdate({ target: profiles.userId, set: { role: input.role } });
      return { ok: true };
    }),
};
