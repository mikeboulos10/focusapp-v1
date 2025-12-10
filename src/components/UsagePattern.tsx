import React, { useState } from "react";

const categories = [
  { name: "Email/Chat", color: "bg-blue-600" },
  { name: "Meetings/Calls", color: "bg-green-400" },
  { name: "Planning/Organization", color: "bg-cyan-400" },
  { name: "Coding/Programming", color: "bg-blue-700" },
  { name: "Code Review", color: "bg-green-700" },
  { name: "Social Media", color: "bg-pink-400" },
  { name: "Video Streaming", color: "bg-orange-400" },
  { name: "News & Current Events", color: "bg-red-400" },
  { name: "Gaming", color: "bg-red-600" },
];

const days = ["Today", "Yesterday", "Sat", "Fri", "Thu", "Wed", "Tue"];

function generateRandomIntensity() {
  const values = [0, 0.2, 0.4, 0.6, 0.8, 1];
  return values[Math.floor(Math.random() * values.length)];
}

export default function UsagePattern() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="overflow-auto">
      <h1 className="text-xl font-semibold mb-6">Usage Pattern</h1>

      <p className="mb-3 font-semibold">Categories (hover to filter)</p>

      <div className="flex gap-4 flex-wrap mb-6">
        <button
          className={`px-3 py-1 rounded cursor-pointer transition ${
            selectedCategory === null ? "bg-blue-200" : "bg-gray-100"
          }`}
          onMouseEnter={() => setSelectedCategory(null)}
        >
          All Categories
        </button>
        {categories.map(({ name, color }) => (
          <button
            key={name}
            className={`px-3 py-1 rounded cursor-pointer transition ${
              selectedCategory === name ? `${color} text-white` : "bg-gray-100"
            }`}
            onMouseEnter={() => setSelectedCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-md p-6 shadow">
        <h2 className="mb-4 font-semibold">Last 7 Days - Hourly Duration</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 table-fixed">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 w-16"></th>
                {[...Array(24).keys()].map((hour) => (
                  <th
                    key={hour}
                    className="border border-gray-300 p-2 text-xs text-center select-none"
                  >
                    {hour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <td className="border border-gray-300 p-1 font-semibold text-xs">{day}</td>
                  {[...Array(24).keys()].map((hour) => {
                    const intensity = selectedCategory
                      ? generateRandomIntensity()
                      : generateRandomIntensity();
                    const colorClass =
                      intensity > 0.6
                        ? "bg-green-600"
                        : intensity > 0.3
                        ? "bg-green-400"
                        : intensity > 0
                        ? "bg-green-200"
                        : "bg-gray-100";
                    return (
                      <td
                        key={hour}
                        className={`${colorClass} border border-gray-300 cursor-pointer`}
                        title={`${day} ${hour}:00 - Intensity: ${intensity.toFixed(2)}`}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm opacity-70">
          Legend: Less{" "}
          <span className="inline-block w-4 h-4 bg-green-200 rounded-full ml-2 mr-1"></span>
          More{" "}
          <span className="inline-block w-4 h-4 bg-green-600 rounded-full ml-1"></span>
        </p>
      </div>
    </div>
  );
}
