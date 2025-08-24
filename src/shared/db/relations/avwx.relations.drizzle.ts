import { relations } from "drizzle-orm";
import { metars, stations } from "../tables/avwx.drizzle.js";

// one station has many metars
// one metar belongs to one station
export const stationsRelations = relations(stations, ({ many }) => ({
  metars: many(metars),
}));

export const metarsRelations = relations(metars, ({ one }) => ({
  stations: one(stations, {
    fields: [metars.siteId],
    references: [stations.siteId],
  }),
}));
