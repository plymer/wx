import type { PointForecastData } from "@shared/lib/types";

interface Props {
  forecastData: PointForecastData;
}

const lineLabel = { textAnchor: "middle" as const, fontSize: "16px", x: 50 };
const normalsLine = { x1: 0, x2: 800, strokeOpacity: 0.5 };
const BASE_HEIGHT = 150;
const TARGET_LENGTH = 600;

export const ForecastTrendChart = ({ forecastData }: Props) => {
  const { normals, dailyForecasts } = forecastData;

  const dailyTemps = dailyForecasts.map((d) => Number(d.tt));

  const maxBound = Math.max(normals.high, ...dailyTemps); // degrees Celsius
  const minBound = Math.min(normals.low, ...dailyTemps); // degrees Celsius

  const height = Math.abs(maxBound - minBound); // degrees Celsius

  const yScale = height / BASE_HEIGHT; // degrees per pixel

  // https://www.esri.com/arcgis-blog/products/arcgis-pro/mapping/a-meaningful-temperature-palette

  const COLOUR_BANDS = [
    { ttStart: 45, ttSpan: 25, color: "#ffffff" },
    { ttStart: 40, ttSpan: 5, color: "#550b25" },
    { ttStart: 35, ttSpan: 5, color: "#87203e" },
    { ttStart: 30, ttSpan: 5, color: "#9f294c" },
    { ttStart: 25, ttSpan: 5, color: "#af4d4b" },
    { ttStart: 20, ttSpan: 5, color: "#be6f4b" },
    { ttStart: 15, ttSpan: 5, color: "#c19c60" },
    { ttStart: 10, ttSpan: 5, color: "#879a84" },
    { ttStart: 5, ttSpan: 5, color: "#438190" },
    { ttStart: 0, ttSpan: 10, color: "#26436f" }, // this technically spans from -5 to +5
    { ttStart: -5, ttSpan: 5, color: "#38517f" },
    { ttStart: -10, ttSpan: 5, color: "#56719c" },
    { ttStart: -15, ttSpan: 5, color: "#607aa4" },
    { ttStart: -20, ttSpan: 5, color: "#7f9ac2" },
    { ttStart: -25, ttSpan: 5, color: "#a6bfe2" },
    { ttStart: -30, ttSpan: 5, color: "#aec6e5" },
    { ttStart: -35, ttSpan: 10, color: "#d3e2f7" },
    { ttStart: -45, ttSpan: 25, color: "#87203e" },
  ];

  // normally the SVG box starts and 0,0 in the top left corner and y increases as you go down
  // so for temperatures, positive temperatures are negative, and negaitve temperatures are positive, and we also need to add some padding to the top and bottom so the points don't get cut off

  return (
    <div>
      <svg
        viewBox={`0 ${-maxBound / yScale} ${TARGET_LENGTH + 200} ${BASE_HEIGHT}`}
        width={TARGET_LENGTH + 200}
        height={BASE_HEIGHT}
        className="w-full bg-neutral-800"
      >
        {COLOUR_BANDS.map((band, i) => (
          <ColourBand key={i} {...band} yScale={yScale} />
        ))}
        <line {...normalsLine} y1={0} y2={0} stroke="black" strokeOpacity={1} />
        <line {...normalsLine} y1={-normals.high / yScale} y2={-normals.high / yScale} stroke="pink" />
        <text {...lineLabel} y={-normals.high / yScale - 6} fill="pink">
          {normals.high}&deg;C
        </text>
        <line {...normalsLine} y1={-normals.low / yScale} y2={-normals.low / yScale} stroke="lightblue" />
        <text {...lineLabel} y={-normals.low / yScale + 16} fill="lightblue">
          {normals.low}&deg;C
        </text>
        <TemperatureTrends dailyForecasts={dailyForecasts} yScale={yScale} />
      </svg>
    </div>
  );
};

interface ColourBandProps {
  ttStart: number;
  ttSpan: number;
  color: string;
  yScale: number;
}

const ColourBand = ({ ttStart, ttSpan, color, yScale }: ColourBandProps) => {
  const yValue = ttStart < 0 ? ttStart / -yScale : (-ttStart - 5) / yScale;
  return (
    <rect
      id={`tt-start__${ttStart}`}
      x={0}
      width={800}
      y={yValue}
      height={ttSpan / yScale}
      fill={color}
      fillOpacity={1}
    />
  );
};

interface TemperatureTrendsProps {
  dailyForecasts: PointForecastData["dailyForecasts"];
  yScale: number;
}

const TemperatureTrends = ({ dailyForecasts, yScale }: TemperatureTrendsProps) => {
  const highFirst =
    dailyForecasts.findIndex((d) => d.ttType === "high") < dailyForecasts.findIndex((d) => d.ttType === "low");

  const xDelta = TARGET_LENGTH / (dailyForecasts.length - 1);
  const startX = 150;

  const lowTempPoints = dailyForecasts
    .filter((d) => d.ttType === "low")
    .map((d, i) => {
      let xOffset;

      if (highFirst) {
        xOffset = xDelta + i * xDelta * 2;
      } else {
        if (i === 0) {
          xOffset = 0;
        } else {
          xOffset = i * xDelta * 2 - xDelta / 2;
        }
      }

      const x = startX + xOffset;
      const y = -Number(d.tt) / yScale;
      return { x, y, tt: d.tt };
    });

  const highTempPoints = dailyForecasts
    .filter((d) => d.ttType === "high")
    .map((d, i) => {
      let xOffset;

      if (!highFirst) {
        xOffset = xDelta * 1.5 + i * xDelta * 2;
      } else {
        if (i === 0) {
          xOffset = 0;
        } else {
          xOffset = i * xDelta * 2 - xDelta / 2;
        }
      }

      const x = startX + xOffset;
      const y = -Number(d.tt) / yScale;
      return { x, y, tt: d.tt };
    });

  return (
    <>
      <TemperatureTrendLine maxTempPoints={highTempPoints} minTempPoints={lowTempPoints} />
      <TemperaturePoints maxTempPoints={highTempPoints} minTempPoints={lowTempPoints} />
    </>
  );
};

interface TemperatureTrendPlotProps {
  maxTempPoints: { x: number; y: number; tt: string }[];
  minTempPoints: { x: number; y: number; tt: string }[];
}

export const TemperatureTrendLine = ({ maxTempPoints, minTempPoints }: TemperatureTrendPlotProps) => {
  // build a line to connect each high to each other, and each low to each other, but don't connect the highs to the lows

  return (
    <g>
      <polyline
        fill="none"
        stroke="lightblue"
        strokeWidth={2}
        points={minTempPoints.map((d) => `${d.x},${d.y}`).join(" ")}
      />
      <polyline
        fill="none"
        stroke="pink"
        strokeWidth={2}
        points={maxTempPoints.map((d) => `${d.x},${d.y}`).join(" ")}
      />
    </g>
  );
};

export const TemperaturePoints = ({ minTempPoints, maxTempPoints }: TemperatureTrendPlotProps) => {
  return (
    <g>
      {minTempPoints.map((point) => (
        <>
          <circle cx={point.x} cy={point.y} r={5} fill={"white"} />
          <text
            x={point.x}
            y={point.y + 26}
            textAnchor="middle"
            fill="white"
            fontSize="20px"
            fontFamily="monospace"
            stroke="black"
            fontWeight="bold"
            strokeWidth={1}
          >
            {point.tt}°C
          </text>
        </>
      ))}
      {maxTempPoints.map((point) => (
        <>
          <circle cx={point.x} cy={point.y} r={5} fill={"white"} />
          <text
            x={point.x}
            y={point.y - 10}
            textAnchor="middle"
            fill="white"
            fontSize="20px"
            fontFamily="monospace"
            stroke="black"
            fontWeight="bold"
            strokeWidth={1}
          >
            {point.tt}°C
          </text>
        </>
      ))}
    </g>
  );
};
