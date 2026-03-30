import "dotenv/config";
import { load } from "cheerio";
import type { StationData } from "../lib/types.js";
import { generateDbConnection } from "../lib/utils.js";
import { stations } from "../db/tables/avwx.drizzle.js";

const DB_NAME = "avwx";

const PROVINCES = {
  AB: "Alberta",
  MB: "Manitoba",
  SK: "Saskatchewan",
  ON: "Ontario",
  QC: "Quebec",
  NB: "New_Brunswick",
  PE: "Prince_Edward_Island",
  NS: "Nova_Scotia",
  NL: "Newfoundland_and_Labrador",
  YT: "Yukon",
  NT: "the_Northwest_Territories",
  NU: "Nunavut",
};

const baseUrl = "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_airports_in_";

type WikiParseResponse = {
  parse?: {
    text?: {
      "*"?: string;
    };
  };
};

function normalizeCellText(value: string): string {
  return value
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value: string): string {
  return normalizeCellText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map((candidate) => candidate.toLowerCase().replace(/[^a-z0-9]/g, ""));
  return headers.findIndex((header) => normalizedCandidates.includes(header));
}

function parseCoordinates(value: string): { lat: number; lon: number } | null {
  const normalized = value.replace(/[−–—]/g, "-");
  const directMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*;\s*(-?\d+(?:\.\d+)?)/);

  if (!directMatch) {
    return null;
  }

  const lat = Number.parseFloat(directMatch[1]);
  const lon = Number.parseFloat(directMatch[2]);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  return { lat, lon };
}

function parseAirportTable(
  code: string,
  parseHtml: ReturnType<typeof load>,
  table: Parameters<ReturnType<typeof load>>[0],
): StationData[] {
  const rows = parseHtml(table).find("tr");
  if (rows.length < 2) {
    return [];
  }

  const headerCells = parseHtml(rows[0]).find("th");
  const headers = headerCells.map((_, cell) => normalizeHeader(parseHtml(cell).text())).get();

  const airportIdx = findHeaderIndex(headers, ["airport", "airportname", "name", "aerodrome"]);
  const icaoIdx = findHeaderIndex(headers, ["icao", "icaoidentifier"]);
  const tcIdx = findHeaderIndex(headers, ["tc", "transportcanada", "tcidentifier", "tcid"]);
  const iataIdx = findHeaderIndex(headers, ["iata", "iataidentifier"]);
  const coordIdx = findHeaderIndex(headers, ["coordinates", "coord"]);

  if (airportIdx === -1 || coordIdx === -1) {
    return [];
  }

  const output: StationData[] = [];

  rows.slice(1).each((_, row) => {
    const cells = parseHtml(row).find("td");
    if (!cells.length) {
      return;
    }

    const airportName = normalizeCellText(parseHtml(cells[airportIdx]).text());
    if (!airportName) {
      return;
    }

    const maybeIds = [icaoIdx, tcIdx, iataIdx]
      .filter((idx) => idx >= 0)
      .map((idx) => normalizeCellText(parseHtml(cells[idx]).text()))
      .filter(Boolean);

    const siteId = maybeIds[0];
    if (!siteId) {
      return;
    }

    const coordinateCellText = normalizeCellText(parseHtml(cells[coordIdx]).text());
    const coordinates = parseCoordinates(coordinateCellText);

    if (!coordinates) {
      return;
    }

    output.push({
      name: airportName,
      siteId,
      lat: coordinates.lat,
      lon: coordinates.lon,
      elev_f: null,
      elev_m: null,
      country: "CA",
      state: code,
    });
  });

  return output;
}

async function scrapeProvince(code: string, name: string): Promise<StationData[]> {
  const url = `${baseUrl}${name}&format=json`;

  const json = (await fetch(url).then((res) => res.json())) as WikiParseResponse;
  const pageHtml = String(json?.parse?.text?.["*"] || "");
  const parseHtml = load(pageHtml);

  const tableResults: StationData[][] = [];

  parseHtml("table.wikitable").each((_, table) => {
    tableResults.push(parseAirportTable(code, parseHtml, table));
  });

  const deduped = new Map<string, StationData>();

  for (const list of tableResults) {
    for (const station of list) {
      deduped.set(`${station.state}:${station.siteId}`, station);
    }
  }

  return Array.from(deduped.values());
}

export async function scrapeWiki() {
  const db = await generateDbConnection(DB_NAME, { stations });

  if (!db) {
    console.error(`[${DB_NAME.toUpperCase()}] (Stations) Database connection failed.`);
    process.exit(1);
  }

  const results = await Promise.allSettled(
    Array.from(Object.entries(PROVINCES)).map(async (p) => {
      const [code, name] = p;
      console.log(`Scraping ${name}...`);
      try {
        const features = await scrapeProvince(code, name);

        return features;
      } catch (err) {
        console.error(`Failed to scrape ${name}: ${baseUrl}${name}&format=json\n\n${err}`);
        return [];
      }
    }),
  );

  // Process results sequentially to ensure all insertions complete
  for (const provinceList of results) {
    if (provinceList.status === "fulfilled") {
      const values = provinceList.value;
      console.log(`[${DB_NAME.toUpperCase()}] Inserting ${values.length} stations...`);

      // insert the station data, or update each station if it already exists
      await Promise.allSettled(
        values.map(async (station) => {
          await db
            .insert(stations)
            .values(station)
            .onDuplicateKeyUpdate({
              set: {
                lat: station.lat,
                lon: station.lon,
                country: station.country,
                state: station.state,
              },
            });
        }),
      );
    }
  }

  console.log(`[${DB_NAME.toUpperCase()}] Done updating stations from WikiPedia.`);
}

scrapeWiki();
