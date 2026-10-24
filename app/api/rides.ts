import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { drivers, profiles, rides as ridesTable, user } from "../database/schema";
import { computeFare, routeInfo } from "../lib/pricing";

export const ACTIVE_STATUSES = ["requested", "accepted", "arriving", "in_progress"] as const;

/** Ride row + driver and rider public info. */
export async function rideDetails(id: number) {
  const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, id));
  if (!ride) return null;
  let driver: null | {
    name: string;
    image: string | null;
    phone: string;
    vehicleModel: string;
    vehicleColor: string;
    plate: string;
    photoUrl: string | null;
    rating: number | null;
    lat: number | null;
    lng: number | null;
  } = null;
  if (ride.driverId) {
    const [d] = await db
      .select({ u: user, d: drivers })
      .from(drivers)
      .innerJoin(user, eq(user.id, drivers.userId))
      .where(eq(drivers.userId, ride.driverId));
    if (d) {
      driver = {
        name: d.u.name,
        image: d.u.image ?? null,
        phone: d.d.phone,
        vehicleModel: d.d.vehicleModel,
        vehicleColor: d.d.vehicleColor,
        plate: d.d.plate,
        photoUrl: d.d.photoUrl,
        rating: d.d.ratingCount ? Math.round((d.d.ratingSum / d.d.ratingCount) * 10) / 10 : null,
        lat: d.d.lat,
        lng: d.d.lng,
      };
    }
  }
  const [r] = await db.select({ name: user.name }).from(user).where(eq(user.id, ride.riderId));
  return { ...ride, driver, riderName: r?.name ?? "Rider" };
}

const point = z.object({ lat: z.number(), lng: z.number(), address: z.string().min(1) });

export const rides = {
  create: authed
    .input(
      z.object({
        pickup: point,
        drop: point,
        rideType: z.enum(["moto", "eco", "comfort", "xl"]),
        paymentMethod: z.enum(["cash", "online"]),
        phone: z.string().min(6).max(20).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [existing] = await db
        .select({ id: ridesTable.id })
        .from(ridesTable)
        .where(and(eq(ridesTable.riderId, context.user.id), inArray(ridesTable.status, [...ACTIVE_STATUSES])));
      if (existing) {
        throw new ORPCError("CONFLICT", { message: "You already have an active ride" });
      }
      const r = await routeInfo(input.pickup, input.drop);
      const fare = computeFare(input.rideType, r.distanceKm, r.durationMin);
      if (input.phone) {
        await db.update(profiles).set({ phone: input.phone }).where(eq(profiles.userId, context.user.id));
      }
      const [ride] = await db
        .insert(ridesTable)
        .values({
          riderId: context.user.id,
          rideType: input.rideType,
          pickupAddress: input.pickup.address,
          pickupLat: input.pickup.lat,
          pickupLng: input.pickup.lng,
          dropAddress: input.drop.address,
          dropLat: input.drop.lat,
          dropLng: input.drop.lng,
          distanceKm: r.distanceKm,
          durationMin: r.durationMin,
          fare,
          paymentMethod: input.paymentMethod,
          riderPhone: input.phone ?? context.profile.phone ?? null,
        })
        .returning();
      return ride!;
    }),

  active: authed.handler(async ({ context }) => {
    const [ride] = await db
      .select({ id: ridesTable.id })
      .from(ridesTable)
      .where(and(eq(ridesTable.riderId, context.user.id), inArray(ridesTable.status, [...ACTIVE_STATUSES])))
      .orderBy(desc(ridesTable.createdAt))
      .limit(1);
    return ride ? await rideDetails(ride.id) : null;
  }),

  get: authed.input(z.object({ id: z.number() })).handler(async ({ input, context }) => {
    const ride = await rideDetails(input.id);
    if (!ride) throw new ORPCError("NOT_FOUND", { message: "Ride not found" });
    const allowed =
      ride.riderId === context.user.id ||
      ride.driverId === context.user.id ||
      context.profile.role === "admin";
    if (!allowed) throw new ORPCError("FORBIDDEN");
    return ride;
  }),

  history: authed.handler(async ({ context }) => {
    return db
      .select()
      .from(ridesTable)
      .where(eq(ridesTable.riderId, context.user.id))
      .orderBy(desc(ridesTable.createdAt))
      .limit(100);
  }),

  cancel: authed.input(z.object({ id: z.number() })).handler(async ({ input, context }) => {
    const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, input.id));
    if (!ride || ride.riderId !== context.user.id) throw new ORPCError("NOT_FOUND");
    if (!["requested", "accepted", "arriving"].includes(ride.status)) {
      throw new ORPCError("BAD_REQUEST", { message: "This ride can no longer be cancelled" });
    }
    await db
      .update(ridesTable)
      .set({ status: "cancelled", cancelledBy: "rider", updatedAt: new Date() })
      .where(eq(ridesTable.id, input.id));
    return { ok: true };
  }),

  rate: authed
    .input(z.object({ id: z.number(), rating: z.number().int().min(1).max(5) }))
    .handler(async ({ input, context }) => {
      const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, input.id));
      if (!ride || ride.riderId !== context.user.id) throw new ORPCError("NOT_FOUND");
      if (ride.status !== "completed" || ride.riderRating || !ride.driverId) {
        throw new ORPCError("BAD_REQUEST", { message: "Cannot rate this ride" });
      }
      await db.update(ridesTable).set({ riderRating: input.rating }).where(eq(ridesTable.id, input.id));
      await db
        .update(drivers)
        .set({
          ratingSum: sql`${drivers.ratingSum} + ${input.rating}`,
          ratingCount: sql`${drivers.ratingCount} + 1`,
        })
        .where(eq(drivers.userId, ride.driverId));
      return { ok: true };
    }),
};
