import React, { useState, useRef, ChangeEvent, FocusEvent } from "react";
import { Input } from "@/components/ui/input";
import { DollarSign, Clock } from "lucide-react";

interface FocusMaintainingInputProps {
  type?: "text" | "number";
  value: string | number;
  onChange: (value: string) => void;
  icon?: "dollar" | "clock";
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  allowDecimals?: boolean;
}

const FocusMaintainingInput: React.FC<FocusMaintainingInputProps> = ({
  type = "text",
  value,
  onChange,
  icon,
  min,
  max,
  step,
  className = "",
  placeholder = "",
  onBlur,
  allowDecimals = false,
}) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (type === "number") {
      // Handle number input validation
      if (!allowDecimals) {
        newValue = newValue.replace(/[^\d]/g, "");
      } else if (/^\d*\.?\d{0,1}$/.test(newValue)) {
        // Allow one decimal place
        newValue = newValue;
      } else {
        return; // Invalid input, don't update
      }
    }

    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className="relative">
      {icon === "dollar" && (
        <DollarSign
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
      )}
      {icon === "clock" && (
        <Clock
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
      )}
      <Input
        ref={inputRef}
        type={type}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        className={`${icon ? "pl-8" : ""} ${className}`}
        placeholder={placeholder}
      />
    </div>
  );
};

export default FocusMaintainingInput;
