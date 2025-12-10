import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { name: "Dashboard", to: "/dashboard" },
  { name: "Categories", to: "/categories" },
  { name: "Usage Pattern", to: "/usage" },
  { name: "Activity Log", to: "/activity" },
  { name: "Settings", to: "/settings" },
];

export default function Sidebar() {
  return (
    <nav className="w-60 bg-white border-r border-gray-200 flex flex-col p-5">
      <h2 className="mb-6 text-xl font-semibold text-blue-700 text-center">Focus App</h2>
      {links.map(({ name, to }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `py-3 px-4 mb-2 rounded-md cursor-pointer font-medium transition-colors ${
              isActive
                ? "border-l-4 border-blue-600 bg-blue-100 font-semibold text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          {name}
        </NavLink>
      ))}
    </nav>
  );
}
