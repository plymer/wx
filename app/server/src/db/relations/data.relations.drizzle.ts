import { relations } from "drizzle-orm";
import { metars, stations, tafs } from "../tables/data.drizzle.js";

// one station has many metars
// one metar belongs to one station
export const stationsRelations = relations(stations, ({ many }) => ({
  metars: many(metars),
  tafs: many(tafs),
}));

export const metarsRelations = relations(metars, ({ one }) => ({
  stations: one(stations, {
    fields: [metars.siteId],
    references: [stations.siteId],
  }),
}));

export const tafsRelations = relations(tafs, ({ one }) => ({
  stations: one(stations, {
    fields: [tafs.siteId],
    references: [stations.siteId],
  }),
}));
