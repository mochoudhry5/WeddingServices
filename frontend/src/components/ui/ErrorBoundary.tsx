import React from "react";

// Alert Components
const Alert: React.FC<{
  children: React.ReactNode;
  variant?: "default" | "destructive";
}> = ({ children, variant = "default" }) => (
  <div
    role="alert"
    className={`rounded-lg p-4 text-sm ${
      variant === "destructive"
        ? "bg-red-50 text-red-700"
        : "bg-stone-50 text-stone-700"
    }`}
  >
    {children}
  </div>
);

const AlertDescription: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <div className="text-sm">{children}</div>;

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Alert variant="destructive">
            <AlertDescription>
              Something went wrong. Please refresh the page or try again later.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
