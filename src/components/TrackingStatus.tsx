interface TrackingStatusProps {
  isTracking: boolean;
}

export default function TrackingStatus({ isTracking }: TrackingStatusProps) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <span
        className={`inline-block w-3 h-3 rounded-full ${
          isTracking ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      <span className={isTracking ? "text-green-700" : "text-gray-600"}>
        {isTracking ? "Tracking: On" : "Tracking: Off"}
      </span>
    </div>
  );
}
