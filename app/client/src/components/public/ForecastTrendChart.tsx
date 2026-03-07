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
        <line {...normalsLine} y1={0} y2={0} stroke="black" strokeWidth={3} strokeOpacity={1} />
        <text x={20} y={0} textAnchor="end" fill="white">
          0&deg;
        </text>
        <line {...normalsLine} y1={-normals.high / yScale} y2={-normals.high / yScale} stroke="pink" />
        <text {...lineLabel} y={-normals.high / yScale - 6} fill="pink">
          {normals.high}&deg;C
        </text>
        <line {...normalsLine} y1={-normals.low / yScale} y2={-normals.low / yScale} stroke="lightblue" />
        <text {...lineLabel} y={-normals.low / yScale + 16} fill="lightblue">
          {normals.low}&deg;C
        </text>

        <TemperatureTrendGraph
          dailyForecasts={dailyForecasts}
          yScale={yScale}
          maxBound={maxBound}
          minBound={minBound}
        />
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
    <g>
      <rect
        id={`tt-start__${ttStart}`}
        x={0}
        width={800}
        y={yValue}
        height={ttSpan / yScale}
        fill={color}
        fillOpacity={1}
      />
      <text x={20} y={yValue} textAnchor="end" fill={"white"} fontSize="12px">
        {ttStart < 0 ? ttStart : ttStart + 5}&deg;
      </text>
    </g>
  );
};

interface TemperatureTrendsProps {
  dailyForecasts: PointForecastData["dailyForecasts"];
  yScale: number;
  maxBound: number;
  minBound: number;
}

const TemperatureTrendGraph = ({ dailyForecasts, yScale, maxBound, minBound }: TemperatureTrendsProps) => {
  const xDelta = TARGET_LENGTH / (dailyForecasts.length - 1);
  const startX = 150;

  const temperaturePoints = dailyForecasts.map((d, i) => {
    const xOffset = i * xDelta;

    const x = startX + xOffset;
    const y = -Number(d.tt) / yScale;
    return { x, y, tt: d.tt, period: d.label, type: d.ttType };
  });

  return (
    <>
      <TemperatureTrendLine points={temperaturePoints} />
      <TemperaturePoints points={temperaturePoints} />
      <DayLabels points={temperaturePoints} maxBound={maxBound} yScale={yScale} minBound={minBound} />
    </>
  );
};

interface TemperaturePlotProps {
  points: { x: number; y: number; tt: string; period: string; type: "high" | "low" }[];
}

interface DayLabelsProps extends TemperaturePlotProps {
  maxBound: number;
  minBound: number;
  yScale: number;
}

const TemperatureTrendLine = ({ points }: TemperaturePlotProps) => {
  return (
    <polyline
      fill="none"
      stroke="white"
      strokeWidth={2}
      strokeOpacity={0.65}
      points={points.map((p) => `${p.x},${p.y}`).join(" ")}
    />
  );
};

const TemperaturePoints = ({ points }: TemperaturePlotProps) => {
  return points.map((p) => (
    <g>
      <circle cx={p.x} cy={p.y} r={5} fill={"white"} />
      <text
        x={p.x}
        y={p.type === "high" ? p.y + 24 : p.y - 12}
        textAnchor="middle"
        fill={"white"}
        fontSize="20px"
        fontFamily="monospace"
        stroke="black"
        fontWeight="600"
        strokeWidth={1}
        strokeOpacity={1}
      >
        {p.tt}°C
      </text>
    </g>
  ));
};

const DayLabels = ({ points, maxBound, minBound, yScale }: DayLabelsProps) => {
  return points.map((p, i) => {
    let yPos: number;

    if (i % 2 === 0) {
      yPos = -maxBound / yScale - 12;
    } else {
      yPos = -minBound / yScale + 24;
    }

    return (
      <g>
        <text x={p.x} y={yPos} textAnchor="middle" fill="white" fontSize="14px">
          {p.period}
        </text>
        <line
          x1={p.x}
          x2={p.x}
          y1={-BASE_HEIGHT}
          y2={BASE_HEIGHT}
          stroke="white"
          strokeWidth={1}
          strokeDasharray={"2 2"}
          strokeOpacity={0.5}
        />
      </g>
    );
  });
};
