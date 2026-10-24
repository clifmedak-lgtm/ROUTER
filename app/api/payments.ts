import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { base } from "../__core/app";
import { db } from "../database";
import { rides } from "../database/schema";
import { initializePayment, notchpayConfigured, verifyPayment } from "../lib/notchpay";
import { cloudinaryConfigured, signUpload } from "../lib/cloudinary";

/** Re-checks a ride's NotchPay transaction and marks it paid if complete. */
export async function syncRidePayment(rideId: number) {
  const [ride] = await db.select().from(rides).where(eq(rides.id, rideId));
  if (!ride?.paymentRef || ride.paymentStatus === "paid") return ride?.paymentStatus ?? "unpaid";
  const trx = await verifyPayment(ride.paymentRef);
  if (trx?.status === "complete" && trx.amount >= ride.fare) {
    await db.update(rides).set({ paymentStatus: "paid" }).where(eq(rides.id, rideId));
    return "paid" as const;
  }
  if (trx && ["failed", "canceled", "expired"].includes(trx.status)) {
    await db.update(rides).set({ paymentStatus: "unpaid" }).where(eq(rides.id, rideId));
    return "unpaid" as const;
  }
  return ride.paymentStatus;
}

export const payments = {
  config: base.handler(() => ({
    online: notchpayConfigured(),
    uploads: cloudinaryConfigured(),
  })),

  start: authed
    .input(z.object({ rideId: z.number(), origin: z.string().url() }))
    .handler(async ({ input, context }) => {
      if (!notchpayConfigured()) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: "Online payments are not set up yet. Please pay the driver in cash.",
        });
      }
      const [ride] = await db.select().from(rides).where(eq(rides.id, input.rideId));
      if (!ride || ride.riderId !== context.user.id) throw new ORPCError("NOT_FOUND");
      if (ride.paymentStatus === "paid") throw new ORPCError("BAD_REQUEST", { message: "Already paid" });
      if (ride.status === "cancelled" || ride.status === "requested") {
        throw new ORPCError("BAD_REQUEST", { message: "Payment opens once a driver accepts" });
      }
      const { url, reference } = await initializePayment({
        amount: ride.fare,
        email: context.user.email,
        name: context.user.name,
        phone: ride.riderPhone,
        reference: `router-ride-${ride.id}-${Date.now()}`,
        description: `Router ride #${ride.id}`,
        callback: `${input.origin}/ride/${ride.id}?payment=return`,
      });
      await db
        .update(rides)
        .set({ paymentRef: reference, paymentStatus: "pending", paymentMethod: "online" })
        .where(eq(rides.id, ride.id));
      return { url };
    }),

  verify: authed.input(z.object({ rideId: z.number() })).handler(async ({ input, context }) => {
    const [ride] = await db.select().from(rides).where(eq(rides.id, input.rideId));
    if (!ride || (ride.riderId !== context.user.id && ride.driverId !== context.user.id)) {
      throw new ORPCError("NOT_FOUND");
    }
    if (!notchpayConfigured()) return { status: ride.paymentStatus };
    return { status: await syncRidePayment(ride.id) };
  }),

  /** Signed Cloudinary upload params for driver photos/documents. */
  signUpload: authed
    .input(z.object({ kind: z.enum(["driver-photo", "license"]) }))
    .handler(({ input, context }) => {
      if (!cloudinaryConfigured()) {
        throw new ORPCError("PRECONDITION_FAILED", { message: "Image uploads are not set up yet" });
      }
      return signUpload(`router/${input.kind}/${context.user.id}`);
    }),
};
