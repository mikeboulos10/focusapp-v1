import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  "General Work": "#3B82F6",
  Gaming: "#EF4444",
  "Planning/Organization": "#06B6D4",
  "Coding/Programming": "#2563EB",
  "Meetings/Calls": "#22C55E",
  "Video Streaming": "#F59E0B",
  Other: "#6B7280",
  "Email/Chat": "#4F46E5",
  "Social Media": "#EC4899",
  "News & Current Events": "#DC2626",
  "Entertainment Content": "#F472B6",
  "Code Review": "#10B981",
};

const weeklyBreakdownData = [
  {
    weekLabel: "Week 1",
    dateRange: "Oct 27 - Nov 2",
    totalTracked: "7h 6m",
    data: [
      // example day data with time per category (hours)
      { day: "Mon", "General Work": 2, Gaming: 0, "Planning/Organization": 1, "Coding/Programming": 2, "Meetings/Calls": 1, "Video Streaming": 0 },
      { day: "Tue", "General Work": 3, Gaming: 1, "Planning/Organization": 1, "Coding/Programming": 1, "Meetings/Calls": 0, "Video Streaming": 0 },
      { day: "Wed", "General Work": 2, Gaming: 0, "Planning/Organization": 0, "Coding/Programming": 3, "Meetings/Calls": 0, "Video Streaming": 1 },
      { day: "Thu", "General Work": 4, Gaming: 0, "Planning/Organization": 1, "Coding/Programming": 2, "Meetings/Calls": 0, "Video Streaming": 0 },
      { day: "Fri", "General Work": 3, Gaming: 0, "Planning/Organization": 1, "Coding/Programming": 2, "Meetings/Calls": 2, "Video Streaming": 1 },
      { day: "Sat", "General Work": 1, Gaming: 0, "Planning/Organization": 2, "Coding/Programming": 1, "Meetings/Calls": 0, "Video Streaming": 0 },
      { day: "Sun", "General Work": 1, Gaming: 1, "Planning/Organization": 1, "Coding/Programming": 1, "Meetings/Calls": 1, "Video Streaming": 0 },
    ],
  },
  // similarly for Week 2 to Week 5 - truncated for brevity
];

const donutData = [
  { name: "General Work", value: 50 },
  { name: "Gaming", value: 10 },
  { name: "Planning/Organization", value: 15 },
  { name: "Coding/Programming", value: 20 },
  { name: "Meetings/Calls", value: 5 },
];

const COLORS = Object.values(CATEGORY_COLORS);

function renderActiveShape(props: any) {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}`} stroke={fill} fill="none" />
      <circle cx={mx} cy={my} r={3} fill={fill} stroke="none" />
      <text x={mx + (cos >= 0 ? 1 : -1) * 12} y={my} textAnchor={cos >= 0 ? "start" : "end"} fill="#333">
        {`${value}h`}
      </text>
      <text x={mx + (cos >= 0 ? 1 : -1) * 12} y={my} dy={18} textAnchor={cos >= 0 ? "start" : "end"} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState<"Day" | "Week" | "Month">("Month");
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="space-y-6 overflow-auto">
      {/* Date Range Buttons */}
      <div className="flex gap-4 items-center mb-4">
        {["Day", "Week", "Month"].map((p) => (
          <button
            key={p}
            className={`py-1 px-3 rounded-md font-semibold transition ${
              period === p ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setPeriod(p as any)}
          >
            {p}
          </button>
        ))}
        {/* Month selector (can be expanded) */}
      </div>

      {/* Monthly Overview */}
      <section className="bg-white rounded-md p-6 shadow min-h-[120px]">
        <h2 className="font-bold text-lg mb-2">Monthly Overview</h2>
        <p className="text-3xl font-extrabold">195h 31m tracked</p>
        <p className="opacity-75 mt-1">Across 5 weeks</p>
      </section>

      {/* Weekly Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {weeklyBreakdownData.map(({ weekLabel, dateRange, totalTracked, data }) => (
          <div key={weekLabel} className="bg-white rounded-md shadow p-4 min-h-[180px]">
            <h3 className="font-semibold text-md">{weekLabel}</h3>
            <p className="text-gray-500 text-sm mb-4">{dateRange}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                {Object.keys(CATEGORY_COLORS).map((cat) => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 font-semibold text-sm">{totalTracked} total</p>
          </div>
        ))}
      </section>

      {/* Activities by Category Donut Chart */}
      <section className="bg-white rounded-md p-6 shadow flex gap-8 flex-col md:flex-row">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h3 className="mb-4 font-semibold">Activities by Category</h3>
          <ResponsiveContainer width={300} height={300}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={20}
                fontWeight="bold"
              >
                {donutData.reduce((acc, e) => acc + e.value, 0)}h
              </text>
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
            {donutData.map(({ name }, i) => (
              <div className="flex items-center gap-1" key={name}>
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Disruptors */}
        <div className="w-full md:w-72 bg-gray-50 p-4 rounded shadow-sm">
          <h3 className="text-md font-semibold mb-3">Top Disruptors</h3>
          <select className="mb-4 p-1 border rounded">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>

          <ul className="space-y-3 text-sm">
            <li>
              <a className="font-semibold cursor-pointer hover:underline">YouTube - Microsoft Edge</a>
              <div className="truncate text-xs text-gray-500">https://www.youtube.com/</div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="bg-red-200 text-red-800 rounded px-1">Distraction</span>
                <span className="bg-orange-200 text-orange-800 rounded px-1">Video Streaming</span>
                <span className="text-red-400 font-bold">4x</span>
              </div>
            </li>
            <li>
              <a className="font-semibold cursor-pointer hover:underline">Facebook - Microsoft Edge</a>
              <div className="truncate text-xs text-gray-500">https://www.facebook.com/</div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="bg-red-200 text-red-800 rounded px-1">Distraction</span>
                <span className="bg-pink-200 text-pink-800 rounded px-1">Social Media</span>
                <span className="text-red-400 font-bold">2x</span>
              </div>
            </li>
            <li>
              <a className="font-semibold cursor-pointer hover:underline">Reddit - The Heart of Internet</a>
              <div className="truncate text-xs text-gray-500">https://www.reddit.com/</div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="bg-red-200 text-red-800 rounded px-1">Distraction</span>
                <span className="bg-red-400 text-red-800 rounded px-1">News & Current Events</span>
                <span className="text-red-400 font-bold">2x</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Full Day Timeline (simplified) */}
      <section className="bg-white rounded-md p-6 shadow">
        <h3 className="mb-2 font-semibold">Full Day Timeline</h3>
        <div className="flex flex-col gap-1">
          {/* A simplified static timeline bar with color blocks */}
          <div className="h-8 rounded flex">
            {/* Each block is a colored div representing activity */}
            <div className="flex-1 bg-red-400" style={{ width: "5%" }} />
            <div className="flex-1 bg-blue-600" style={{ width: "20%" }} />
            <div className="flex-1 bg-green-400" style={{ width: "30%" }} />
            <div className="flex-1 bg-pink-400" style={{ width: "15%" }} />
            <div className="flex-1 bg-gray-300" style={{ width: "30%" }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <div>00:00</div>
            <div>06:00</div>
            <div>12:00</div>
            <div>18:00</div>
            <div>24:00</div>
          </div>
        </div>
      </section>
    </div>
  );
}
