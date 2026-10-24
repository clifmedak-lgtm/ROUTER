import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { drivers, profiles, rides, user } from "../database/schema";
import { COMMISSION, haversineKm } from "../lib/pricing";
import { ACTIVE_STATUSES, rideDetails } from "./rides";

async function requireApproved(userId: string) {
  const [d] = await db.select().from(drivers).where(eq(drivers.userId, userId));
  if (!d) throw new ORPCError("FORBIDDEN", { message: "Apply as a driver first" });
  if (d.status !== "approved") {
    throw new ORPCError("FORBIDDEN", { message: "Your driver account is not approved yet" });
  }
  return d;
}

const NEXT: Record<string, string> = {
  accepted: "arriving",
  arriving: "in_progress",
  in_progress: "completed",
};

export const driver = {
  me: authed.handler(async ({ context }) => {
    const [d] = await db.select().from(drivers).where(eq(drivers.userId, context.user.id));
    return d ?? null;
  }),

  apply: authed
    .input(
      z.object({
        phone: z.string().min(6).max(20),
        city: z.string().min(2),
        vehicleType: z.enum(["moto", "eco", "comfort", "xl"]),
        vehicleModel: z.string().min(2),
        vehicleColor: z.string().min(2),
        plate: z.string().min(3),
        licenseNumber: z.string().min(3),
        photoUrl: z.string().url().nullable().optional(),
        licensePhotoUrl: z.string().url().nullable().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [existing] = await db.select().from(drivers).where(eq(drivers.userId, context.user.id));
      if (existing && existing.status === "approved") {
        throw new ORPCError("BAD_REQUEST", { message: "You're already an approved driver" });
      }
      if (existing) {
        await db
          .update(drivers)
          .set({ ...input, status: "pending" })
          .where(eq(drivers.userId, context.user.id));
      } else {
        await db.insert(drivers).values({ ...input, userId: context.user.id });
      }
      if (context.profile.role === "rider") {
        await db.update(profiles).set({ role: "driver" }).where(eq(profiles.userId, context.user.id));
      }
      return { ok: true };
    }),

  setOnline: authed
    .input(z.object({ online: z.boolean(), lat: z.number().optional(), lng: z.number().optional() }))
    .handler(async ({ input, context }) => {
      await requireApproved(context.user.id);
      await db
        .update(drivers)
        .set({ online: input.online, lat: input.lat ?? null, lng: input.lng ?? null })
        .where(eq(drivers.userId, context.user.id));
      return { ok: true };
    }),

  updateLocation: authed
    .input(z.object({ lat: z.number(), lng: z.number() }))
    .handler(async ({ input, context }) => {
      await db.update(drivers).set(input).where(eq(drivers.userId, context.user.id));
      return { ok: true };
    }),

  /** Open requests for this driver's vehicle class, nearest first. */
  requests: authed.handler(async ({ context }) => {
    const d = await requireApproved(context.user.id);
    if (!d.online) return [];
    const list = await db
      .select({ ride: rides, riderName: user.name })
      .from(rides)
      .innerJoin(user, eq(user.id, rides.riderId))
      .where(
        and(eq(rides.status, "requested"), isNull(rides.driverId), eq(rides.rideType, d.vehicleType)),
      )
      .orderBy(desc(rides.createdAt))
      .limit(30);
    return list
      .map(({ ride, riderName }) => ({
        ...ride,
        riderName,
        awayKm:
          d.lat != null && d.lng != null
            ? Math.round(haversineKm({ lat: d.lat, lng: d.lng }, { lat: ride.pickupLat, lng: ride.pickupLng }) * 10) / 10
            : null,
      }))
      .filter((r) => r.awayKm == null || r.awayKm < 40)
      .sort((a, b) => (a.awayKm ?? 0) - (b.awayKm ?? 0));
  }),

  current: authed.handler(async ({ context }) => {
    const [ride] = await db
      .select({ id: rides.id })
      .from(rides)
      .where(and(eq(rides.driverId, context.user.id), inArray(rides.status, [...ACTIVE_STATUSES])))
      .limit(1);
    return ride ? await rideDetails(ride.id) : null;
  }),

  accept: authed.input(z.object({ id: z.number() })).handler(async ({ input, context }) => {
    await requireApproved(context.user.id);
    const [busy] = await db
      .select({ id: rides.id })
      .from(rides)
      .where(and(eq(rides.driverId, context.user.id), inArray(rides.status, [...ACTIVE_STATUSES])));
    if (busy) throw new ORPCError("CONFLICT", { message: "Finish your current trip first" });
    const updated = await db
      .update(rides)
      .set({ driverId: context.user.id, status: "accepted", updatedAt: new Date() })
      .where(and(eq(rides.id, input.id), eq(rides.status, "requested"), isNull(rides.driverId)))
      .returning();
    if (!updated.length) throw new ORPCError("CONFLICT", { message: "Ride was taken by another driver" });
    return { ok: true };
  }),

  advance: authed.input(z.object({ id: z.number() })).handler(async ({ input, context }) => {
    const [ride] = await db.select().from(rides).where(eq(rides.id, input.id));
    if (!ride || ride.driverId !== context.user.id) throw new ORPCError("NOT_FOUND");
    const next = NEXT[ride.status];
    if (!next) throw new ORPCError("BAD_REQUEST", { message: "Nothing to advance" });
    await db
      .update(rides)
      .set({ status: next as typeof ride.status, updatedAt: new Date() })
      .where(eq(rides.id, input.id));
    return { status: next };
  }),

  cancel: authed.input(z.object({ id: z.number() })).handler(async ({ input, context }) => {
    const [ride] = await db.select().from(rides).where(eq(rides.id, input.id));
    if (!ride || ride.driverId !== context.user.id) throw new ORPCError("NOT_FOUND");
    if (!["accepted", "arriving"].includes(ride.status)) {
      throw new ORPCError("BAD_REQUEST", { message: "Cannot cancel at this stage" });
    }
    // Put the ride back in the pool so another driver can take it
    await db
      .update(rides)
      .set({ status: "requested", driverId: null, updatedAt: new Date() })
      .where(eq(rides.id, input.id));
    return { ok: true };
  }),

  confirmCash: authed.input(z.object({ id: z.number() })).handler(async ({ input, context }) => {
    const [ride] = await db.select().from(rides).where(eq(rides.id, input.id));
    if (!ride || ride.driverId !== context.user.id) throw new ORPCError("NOT_FOUND");
    await db.update(rides).set({ paymentStatus: "paid" }).where(eq(rides.id, input.id));
    return { ok: true };
  }),

  earnings: authed.handler(async ({ context }) => {
    const list = await db
      .select()
      .from(rides)
      .where(and(eq(rides.driverId, context.user.id), eq(rides.status, "completed")))
      .orderBy(desc(rides.updatedAt))
      .limit(200);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const gross = list.reduce((s, r) => s + r.fare, 0);
    const today = list.filter((r) => r.updatedAt >= startOfDay).reduce((s, r) => s + r.fare, 0);
    return {
      trips: list.length,
      gross,
      net: Math.round(gross * (1 - COMMISSION)),
      todayNet: Math.round(today * (1 - COMMISSION)),
      commissionRate: COMMISSION,
      recent: list.slice(0, 20),
    };
  }),
};
