export const MAP_TILE_CACHE_SIZE: number = 1024 * 1024 * 400; // in bytes

// settings for data layers
export const NUM_HRS_DATA: number = 3;

export const MAP_PROJECTIONS = ["mercator", "globe"] as const;

export const MAP_LINES = ["gfa", "lgf", "fir", "tafs", "bedposts", "publicRegions", "marineRegions"] as const;

export const LAYER_TABS = ["satellite", "radar", "other", "projection", "overlays"] as const;

export const ZOOM_THRESHOLDS = { mini: 2.25, reduced: 4.5, medium: 6, maximum: 8 } as const;

export const REALTIME_TILE_ZOOMS = { MIN: 2, MAX: 8 } as const;
