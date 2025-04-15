import { PlacePicker } from "@googlemaps/extended-component-library/react";
import { useRef } from "react";

export function LocationPicker({ className, forMap, onPlaceChange }) {
  const pickerRef = useRef();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // 🔒 Prevent Enter key from selecting or submitting
    }
  };

  return (
    <PlacePicker
      ref={pickerRef}
      className={className}
      forMap={forMap}
      country={["us", "ca", "in"]}
      placeholder="Enter a location"
      onKeyDown={handleKeyDown}
      onPlaceChange={(e) => onPlaceChange(e.target.value)} // Still allow selection via click
    />
  );
}
