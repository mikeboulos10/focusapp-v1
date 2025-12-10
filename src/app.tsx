import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import UsagePattern from "./components/UsagePattern";

import TrackingStatus from "./components/TrackingStatus";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
        <Sidebar />
        <div className="flex flex-col flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Focus App</h1>
            <TrackingStatus isTracking={true} />
          </div>

          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usage" element={<UsagePattern />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
