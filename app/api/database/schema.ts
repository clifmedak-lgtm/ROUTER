import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

/** App-level profile attached to every Better Auth user. */
export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["rider", "driver", "admin"] }).notNull().default("rider"),
  phone: text("phone"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Driver application + live state. */
export const drivers = sqliteTable("drivers", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  vehicleType: text("vehicle_type", { enum: ["moto", "eco", "comfort", "xl"] }).notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleColor: text("vehicle_color").notNull(),
  plate: text("plate").notNull(),
  licenseNumber: text("license_number").notNull(),
  photoUrl: text("photo_url"),
  licensePhotoUrl: text("license_photo_url"),
  status: text("status", { enum: ["pending", "approved", "rejected", "suspended"] })
    .notNull()
    .default("pending"),
  online: integer("online", { mode: "boolean" }).notNull().default(false),
  lat: real("lat"),
  lng: real("lng"),
  ratingSum: integer("rating_sum").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const rides = sqliteTable("rides", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  riderId: text("rider_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  driverId: text("driver_id").references(() => user.id, { onDelete: "set null" }),
  rideType: text("ride_type", { enum: ["moto", "eco", "comfort", "xl"] }).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: real("pickup_lat").notNull(),
  pickupLng: real("pickup_lng").notNull(),
  dropAddress: text("drop_address").notNull(),
  dropLat: real("drop_lat").notNull(),
  dropLng: real("drop_lng").notNull(),
  distanceKm: real("distance_km").notNull(),
  durationMin: integer("duration_min").notNull(),
  /** Fare in XAF (whole francs). */
  fare: integer("fare").notNull(),
  status: text("status", {
    enum: ["requested", "accepted", "arriving", "in_progress", "completed", "cancelled"],
  })
    .notNull()
    .default("requested"),
  paymentMethod: text("payment_method", { enum: ["cash", "online"] }).notNull().default("cash"),
  paymentStatus: text("payment_status", { enum: ["unpaid", "pending", "paid"] })
    .notNull()
    .default("unpaid"),
  paymentRef: text("payment_ref"),
  riderPhone: text("rider_phone"),
  riderRating: integer("rider_rating"),
  cancelledBy: text("cancelled_by"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
