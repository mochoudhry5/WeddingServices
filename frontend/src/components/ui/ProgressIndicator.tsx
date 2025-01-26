// components/ui/ProgressIndicator.tsx
import { CheckCircle, XCircle, Circle } from "lucide-react";
import React from "react";

// We define the possible status types for each step
export type ProgressStatus = "waiting" | "in-progress" | "completed" | "error";

// This defines the structure of each progress step
export interface ProgressStep {
  label: string;
  status: ProgressStatus;
}

// The main props interface for our component
export interface ProgressIndicatorProps {
  // We use a Record to ensure type safety for our steps object
  steps: Record<string, ProgressStep>;
  // Optional className for additional styling flexibility
  className?: string;
}

// The main component that displays our progress steps
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  className = "",
}) => {
  // Helper function to determine the text color based on status
  const getTextColor = (status: ProgressStatus): string => {
    switch (status) {
      case "in-progress":
        return "text-black";
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  // Helper function to render the appropriate status icon
  const StatusIcon: React.FC<{ status: ProgressStatus }> = ({ status }) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "error":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "in-progress":
        return (
          <div className="w-6 h-6">
            <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        );
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  return (
    <div className={`space-y-4 w-full ${className}`}>
      {/* Map through the steps and render each one */}
      {Object.entries(steps).map(([key, step], index) => (
        <div key={key} className="flex items-center space-x-4">
          {/* Status icon container */}
          <div className="relative flex items-center justify-center">
            <StatusIcon status={step.status} />
          </div>

          {/* Step label and progress indicator */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${getTextColor(step.status)}`}
              >
                {step.label}
              </span>

              {/* Show progress bar for in-progress steps */}
              {step.status === "in-progress" && (
                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black animate-progress"
                    style={{
                      animation: "progress 1s ease-in-out infinite",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressIndicator;
