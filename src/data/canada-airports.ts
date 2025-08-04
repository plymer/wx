import axios from "axios";
import fs from "fs";
import { XMLParser } from "fast-xml-parser";
import { xmlParser } from "../shared/lib/utils";

const provinces = {
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

interface Feature {
  type: "Feature";
  properties: {
    name: string;
    siteId: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

const parser = new XMLParser({
  ignoreAttributes: true,
  unpairedTags: ["hr", "br", "link", "meta", "img"],
  stopNodes: ["*.pre", "*.script"],
  processEntities: true,
  htmlEntities: true,
});
async function scrapeProvince(code: string, name: string): Promise<Feature[]> {
  const url = `${baseUrl}${name}&format=json`;

  const { data: json } = await axios.get(url);

  const html = parser.parse(`<html><body>${json.parse.text["*"]}</body></html>`);

  const tableBody = html.html.body.div.table[0].tbody;
  const tableRows = tableBody.tr.slice(1);

  type TableData = {
    name: string;
    siteId: string;
    lat: number;
    lon: number;
  };

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

  const tableTable: TableData[] = tableRows.reduce((acc: TableData[], row: RawTableData) => {
    const siteId = row.td[2] || row.td[3] || row.td[4];

    if (!siteId) {
      console.warn(`No siteId found for row: ${JSON.stringify(row)}`);
      return acc;
    }

    const name = row.td[1].a;
    const [lat, lon] = row.td[5].span.span.a.span[2].span.span[1].span.split(";");

    const output: TableData = {
      name,
      siteId,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    };

    acc.push(output);

    return acc;
  }, []);

  // need to fix when airport name is in italics in the table

  console.log(tableTable);

  const features: Feature[] = [];

  return features;
}

async function main() {
  const allFeatures: Feature[] = [];

  const AB = await scrapeProvince("AB", "Alberta");

  // for (const [code, name] of Object.entries(provinces)) {
  //   console.log(`Scraping ${name}...`);
  //   try {
  //     const features = await scrapeProvince(code, name);

  //     console.log(`  → Found ${features.length} airports`);
  //   } catch (err) {
  //     console.error(`Failed to scrape ${name}:`, err);
  //   }
  // }

  // const geojson = {
  //   type: "FeatureCollection",
  //   features: allFeatures,
  // };

  // fs.writeFileSync("./data/canada-airports.geojson", JSON.stringify(geojson, null, 2));
  // console.log(`✅ Done. Saved ${allFeatures.length} features to canada-airports.geojson`);
}

main();
