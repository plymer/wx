export const MAP_TILE_CACHE_SIZE: number = 1024 * 1024 * 400; // in bytes

// settings for data layers
export const NUM_HRS_DATA: number = 3;

export const MAP_PROJECTIONS = ["mercator", "globe"] as const;

export const MAP_LINES = ["gfa", "lgf", "fir", "tafs", "bedposts", "publicRegions", "marineRegions"] as const;

export const MAP_OPTIONS_TABS = ["projection", "overlays"] as const;

export const LAYER_TABS = ["satellite", "radar", "other"] as const;

export const ZOOM_THRESHOLDS = { mini: 2.25, reduced: 4.5, maximum: 6 } as const;
