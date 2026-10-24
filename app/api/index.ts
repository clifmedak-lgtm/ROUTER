import type { RouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";
import { createApp } from "./__core/app";
import { auth } from "./auth";
import { db } from "./database";
import { rides } from "./database/schema";
import { ping } from "./routes/ping";
import { me } from "./routes/me";
import { geo } from "./routes/geo";
import { rides as ridesRouter } from "./routes/rides";
import { driver as driverRouter } from "./routes/driver";
import { admin as adminRouter } from "./routes/admin";
import { payments as paymentsRouter, syncRidePayment } from "./routes/payments";

export const router = {
  ping,
  me,
  geo,
  rides: ridesRouter,
  driver: driverRouter,
  admin: adminRouter,
  payments: paymentsRouter,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// NotchPay webhook — we never trust the payload; we re-verify the transaction via the API.
app.post("/api/webhooks/notchpay", async (c) => {
  try {
    const body = (await c.req.json()) as { data?: { reference?: string; trxref?: string } };
    const ref = body.data?.reference;
    if (ref) {
      const [ride] = await db.select({ id: rides.id }).from(rides).where(eq(rides.paymentRef, ref));
      if (ride) await syncRidePayment(ride.id);
    }
  } catch {
    // ignore malformed payloads
  }
  return c.json({ received: true }, 200);
});

export default app;
