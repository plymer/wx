import axios from "axios";
import "dotenv/config";
import { XMLParser } from "fast-xml-parser";
import type { StationData } from "../../shared/lib/types.js";
import { generateDbConnection } from "../../shared/lib/utils.js";
import { stations } from "../../shared/db/tables/avwx.drizzle.js";

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

type RawTableData = {
  td: [
    { span: string; a: string }, // community name
    { a: string }, // airport name
    string | undefined, // icao code
    string | undefined, // tc code
    string | undefined, // iata code
    {
      span: {
        link: string;
        span: {
          a: {
            span: [
              { span: string[] },
              "/",
              { span: { span: [string, { span: string; "#text": string }, { span: string; "#text": string }] } }, // coords
            ];
          };
        };
      };
    },
  ];
};

const parser = new XMLParser({
  ignoreAttributes: true,
  unpairedTags: ["hr", "br", "link", "meta", "img"],
  stopNodes: ["*.pre", "*.script"],
  processEntities: true,
  htmlEntities: true,
});

function extractCoordinates(coordinateCell: any): { lat: number; lon: number } | null {
  try {
    // Try to find the coordinate string by traversing the nested structure
    function findCoordinateString(obj: any): string | null {
      if (typeof obj === "string") {
        // Check if this string contains coordinates (format: "lat; lon")
        if (/^-?\d+\.?\d*;\s*-?\d+\.?\d*$/.test(obj.trim())) {
          return obj.trim();
        }
        return null;
      }

      if (Array.isArray(obj)) {
        for (const item of obj) {
          const result = findCoordinateString(item);
          if (result) return result;
        }
      }

      if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj)) {
          const result = findCoordinateString(obj[key]);
          if (result) return result;
        }
      }

      return null;
    }

    const coordString = findCoordinateString(coordinateCell);
    if (!coordString) return null;

    const [lat, lon] = coordString.split(";").map((coord) => parseFloat(coord.trim()));

    if (isNaN(lat) || isNaN(lon)) return null;

    return { lat, lon };
  } catch (error) {
    console.warn("Failed to extract coordinates:", error);
    return null;
  }
}

async function scrapeProvince(code: string, name: string): Promise<StationData[]> {
  const url = `${baseUrl}${name}&format=json`;

  const { data: json } = await axios.get(url);

  const html = parser.parse(`<html><body>${json.parse.text["*"]}</body></html>`);

  // we'll need to do something specific for Ontario *(of course)*

  const tableBody = html.html.body.div.table[code === "ON" ? 1 : 0].tbody;
  // remove the header
  const tableRows = tableBody.tr.slice(1);

  const sites: StationData[] = tableRows.reduce((acc: StationData[], row: RawTableData) => {
    const siteId = row.td[2] || row.td[3] || row.td[4];

    if (!siteId) {
      console.warn(`No siteId found for entry: ${row.td[1]?.a || "unknown"}`);
      return acc;
    }

    const name = row.td[1]?.a || String(row.td[1]);
    if (!name) {
      console.warn(`No name found for siteId: ${siteId}`);
      return acc;
    }

    const coordinates = extractCoordinates(row.td[4]) || extractCoordinates(row.td[5]);

    if (!coordinates) {
      console.warn(`No coordinates found for: ${name} (${siteId})`);
      return acc;
    }

    const output: StationData = {
      name,
      siteId,
      lat: coordinates.lat,
      lon: coordinates.lon,
      elev_f: null,
      elev_m: null,
      country: "CA",
      state: code,
    };

    acc.push(output);

    return acc;
  }, []);

  return sites;
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
