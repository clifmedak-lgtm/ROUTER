import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { profiles } from "../database/schema";

export const me = {
  get: authed.handler(({ context }) => ({
    id: context.user.id,
    name: context.user.name,
    email: context.user.email,
    image: context.user.image ?? null,
    role: context.profile.role,
    phone: context.profile.phone,
  })),

  updatePhone: authed
    .input(z.object({ phone: z.string().min(6).max(20) }))
    .handler(async ({ input, context }) => {
      await db.update(profiles).set({ phone: input.phone }).where(eq(profiles.userId, context.user.id));
      return { ok: true };
    }),
};
