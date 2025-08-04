import puppeteer from "puppeteer";

import * as fs from "fs";

type ABAGDataResponse = {
  apiResponse: AgData[];
  metaData: MetaData[];
};

type DataTypes = "AT" | "DEW" | "WS";

type AgData = {
  stationId: number;
  stationName: string;
  timestamp: number;
  valueCd: DataTypes;
  interval: "HOURLY";
  value: number;
  unitCd: string;
  sourceCd: string;
  completeness: string | null;
  computeMsg: string | null;
  observationCd: DataTypes;
  valueAsDouble: number;
  valueAsRoundedDouble: number;
  zonedTimestamp: string;
};

type MetaData = {
  stationId: number;
  aliases: {
    AENV?: string;
    GOES?: string;
    WMO?: string;
    LOGGER?: string;
    EC?: string;
    TC?: string;
  };
  name: string;
  location: {
    locationId: number;
    refStationId: number;
    longitude: number;
    latitude: number;
    coordinateSrcCd: string;
    easting: number;
    northing: number;
    elevation: number;
    elevationSrcCd: string;
    drainageBasinCd: string | null;
    legal: string;
    municipalityId: number;
    wmu: string | null;
    regionCd: string | null;
    provinceCd: string;
    coverageArea: string | null;
    siteDescription: string;
    directions: string;
    version: number;
    createdOn: number[];
    createdBy: number;
    lastModifiedOn: number[];
    lastModifiedBy: number;
  };
  owner: string;
  operator: string;
  typeCd: string;
  networkCd: string;
  status: string;
  elements: string[];
  observations: {
    DAILY: string[];
    MONTHLY: string[];
    HOURLY: string[];
    YEARLY: string[];
  };
  supportedValues: {
    DAILY: string[];
    MONTHLY: string[];
    HOURLY: string[];
    YEARLY: string[];
  };
  notes: string | null;
  comments: string | null;
  lastUpdated: number;
};

type OutMetaData = {
  siteId: string;
  agId: number;
  lat: number;
  lon: number;
  elev_m: number;
  elev_f: number;
  name: string;
};

type OutData = {
  agId: number;
  validTime: Date;
  data: {
    [key: string]: number;
  };
};

const DATA_TYPES = [
  "AT", // Air Temperature
  "DEW", // Dew Point Temperature
  "WS", // Wind Speed
];

async function fetchWeatherData(): Promise<ABAGDataResponse | null> {
  const REFERRER = "https://acis.alberta.ca/acis/weather-conditions-map.jsp";
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  const apiResponse: AgData[] = [];
  const metaData: MetaData[] = [];

  page.on("request", (req) => {
    req.continue();
  });

  // Capture the API response when it happens naturally
  page.on("response", async (res) => {
    if (res.url().includes("https://acis.alberta.ca/acis/api/v1/weather/data/values")) {
      if (res.status() === 200) {
        try {
          apiResponse.push((await res.json()) as AgData);
          console.log("API Data captured successfully");
        } catch (error) {
          console.log("Failed to parse API response:", error);
        }
      }
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("https://acis.alberta.ca/acis/api/v1/weather/stations/*/metadata")) {
      if (res.status() === 200) {
        try {
          metaData.push((await res.json()) as MetaData);
          console.log("Metadata captured successfully");
        } catch (error) {
          console.log("Failed to parse metadata response:", error);
        }
      }
    }
  });

  // Load the main page first to get session cookies
  await page.goto(REFERRER, { waitUntil: "networkidle2" });

  // Wait for initial load
  try {
    await page.waitForNetworkIdle();
  } catch (error) {
    // Continue silently if network doesn't become idle
  }

  // Click to trigger the API call we want to capture
  await page.click("#AT");

  // Wait for the API call to complete
  try {
    await page.waitForNetworkIdle();
  } catch (error) {
    // Continue silently if network doesn't become idle
  }

  browser.newPage();

  await browser.close();

  return { apiResponse, metaData };
}

const data = await fetchWeatherData()
  .then((result) => {
    const metaData = result?.metaData.reduce<OutMetaData[]>((acc, item) => {
      if (!item.aliases.AENV) return acc;

      const output: OutMetaData = {
        siteId: item.aliases.TC || item.aliases.EC || item.aliases.AENV,
        agId: item.stationId,
        lat: item.location.latitude,
        lon: item.location.longitude,
        elev_m: item.location.elevation,
        elev_f: item.location.elevation * 3.28084,
        name: item.name,
      };

      acc.push(output);

      return acc;
    }, []);

    const apiResponse = result?.apiResponse.reduce<OutData[]>((acc, item) => {
      const output: OutData = {
        agId: item.stationId,
        validTime: new Date(item.timestamp),
        data: {
          [item.valueCd]: item.value,
        },
      };

      acc.push(output);
      return acc;
    }, []);

    return { apiResponse, metaData };
  })
  .catch((err) => {
    console.error("Failed to fetch data:", err);
    return null;
  });

if (data) {
  fs.writeFileSync("data/ab-ag-data.json", JSON.stringify(data.apiResponse, null, 2));
  fs.writeFileSync("data/ab-ag-metaData.json", JSON.stringify(data.metaData, null, 2));
  console.log("Data written to files at ../data/");
}
