import type { PointForecastData } from "@shared/lib/types";

interface Props {
  forecastData: PointForecastData;
}

const BASE_HEIGHT = 200;
const TARGET_LENGTH = 600;
const LABEL_X_START = 25;

export const ForecastTrendChart = ({ forecastData }: Props) => {
  const { normals, dailyForecasts } = forecastData;

  const dailyTemps = dailyForecasts.map((d) => Number(d.tt));

  const maxBound = Math.max(normals.high, ...dailyTemps) + 10; // degrees Celsius
  const minBound = Math.min(normals.low, ...dailyTemps) - 8; // degrees Celsius

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
    <svg
      viewBox={`0 ${-maxBound / yScale} ${TARGET_LENGTH + 200} ${BASE_HEIGHT}`}
      width={TARGET_LENGTH + 200}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto bg-neutral-800"
    >
      {COLOUR_BANDS.map((band, i) => (
        <ColourBand key={i} {...band} yScale={yScale} />
      ))}

      <ZeroLine />
      <NormalsLines normals={normals} yScale={yScale} />

      <TemperatureTrendGraph dailyForecasts={dailyForecasts} yScale={yScale} maxBound={maxBound} minBound={minBound} />
    </svg>
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
      <text x={LABEL_X_START} y={yValue + 5} textAnchor="end" fill={"white"} fontSize="12px" fontWeight="bold">
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
    const { tt, label: period, ttType: type } = d;
    const xOffset = i * xDelta;

    const x = startX + xOffset;
    const y = -Number(tt) / yScale;
    return { x, y, tt, period, type };
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
      <circle
        cx={p.x}
        cy={p.y}
        r={5}
        fill={p.type === "high" ? "#991717" : "#174099"}
        stroke="white"
        strokeWidth={1.5}
      />
      <text x={p.x} y={p.type === "high" ? p.y - 9 : p.y + 21} textAnchor="middle" fill="white" fontSize="16px">
        {p.tt}°C
      </text>
    </g>
  ));
};

const DayLabels = ({ points, maxBound, minBound, yScale }: DayLabelsProps) => {
  return points.map((p, i) => {
    let yPos: number;

    if (i % 2 === 0) {
      yPos = -maxBound / yScale + 16;
    } else {
      yPos = -minBound / yScale - 8;
    }

    const charCalc = p.period.length * 8 + 4;
    const maxLabelWidth = 80;
    const labelWidth = charCalc < maxLabelWidth ? charCalc : maxLabelWidth;
    const labelXStart = p.x - labelWidth / 2;

    return (
      <g>
        <line
          x1={p.x}
          x2={p.x}
          y1={-BASE_HEIGHT * 4}
          y2={BASE_HEIGHT * 4}
          stroke="white"
          strokeWidth={1}
          strokeDasharray={"2 2"}
          strokeOpacity={0.5}
        />
        <rect
          x={labelXStart}
          y={yPos - 14}
          width={labelWidth}
          height={20}
          fill="black"
          fillOpacity={0.75}
          rx={8}
          ry={8}
        />
        <text x={p.x} y={yPos} textAnchor="middle" fill="white" fontSize="12px">
          {p.period}
        </text>
      </g>
    );
  });
};

const NormalsLines = ({ normals, yScale }: { normals: PointForecastData["normals"]; yScale: number }) => {
  const xBase = 50;
  const textBoxWidth = 50;
  const textPosX = textBoxWidth / 2 + xBase;

  const normalsLineXStart = xBase + textBoxWidth - 2;

  const yHigh = -normals.high / yScale;
  const yLow = -normals.low / yScale;

  const lowColour = "#174099";
  const highColour = "#991717";

  return (
    <g>
      <line
        x1={xBase + 1}
        x2={TARGET_LENGTH + 200}
        y1={yHigh + 0.5}
        y2={yHigh + 0.5}
        stroke="black"
        strokeOpacity={0.75}
        strokeWidth={7}
      />
      <rect
        x={xBase}
        y={yHigh - 12}
        width={textBoxWidth}
        height={24}
        fill={highColour}
        stroke="black"
        strokeWidth={2}
        rx={12}
        ry={12}
      />
      <line x1={normalsLineXStart} x2={TARGET_LENGTH + 200} y1={yHigh} y2={yHigh} stroke={highColour} strokeWidth={3} />
      <text textAnchor="middle" fontSize="14px" fontWeight="bold" x={textPosX} y={yHigh + 6} fill="white">
        {normals.high}&deg;C
      </text>

      <line
        x1={normalsLineXStart}
        x2={TARGET_LENGTH + 200}
        y1={yLow - 0.5}
        y2={yLow - 0.5}
        stroke="black"
        strokeOpacity={0.75}
        strokeWidth={7}
      />
      <rect
        x={xBase}
        y={yLow - 12}
        width={textBoxWidth}
        height={24}
        fill={lowColour}
        stroke="black"
        strokeWidth={2}
        rx={12}
        ry={12}
      />
      <line x1={normalsLineXStart} x2={TARGET_LENGTH + 200} y1={yLow} y2={yLow} stroke={lowColour} strokeWidth={3} />
      <text textAnchor="middle" fontSize="14px" fontWeight="bold" x={textPosX} y={yLow + 4} fill="white">
        {normals.low}&deg;C
      </text>
    </g>
  );
};

const ZeroLine = () => {
  return (
    <>
      <line x1={0} x2={TARGET_LENGTH + 200} y1={0} y2={0} stroke="black" strokeWidth={3} strokeOpacity={1} />
      <text x={LABEL_X_START} y={5} textAnchor="end" fill="white" fontWeight="bold">
        0&deg;
      </text>
    </>
  );
};
