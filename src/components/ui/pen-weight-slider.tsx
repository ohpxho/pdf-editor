import React, { useState } from "react";
import { Slider } from "@/components/ui/slider"; // Adjust the import path if needed
import { cn } from "@/lib/utils"; // For className merging if you use it

interface PenWeightSliderProps {
    strokeWidth: number;
    setStrokeWidth: React.Dispatch<React.SetStateAction<number>> | ((width: number) => void)
}

export default function PenWeightSlider({ strokeWidth, setStrokeWidth }: PenWeightSliderProps) {

  return (
    <div className="flex items-center gap-3 rounded w-full">
      {/* Icon (replace with your own SVG if needed) */}
      <svg width="20" height="20" viewBox="0 0 24 24" className="text-black">
        <rect x="4" y="6" width="16" height="1" rx="1" fill="currentColor" />
        <rect x="4" y="10" width="16" height="2" rx="1" fill="currentColor" />
        <rect x="4" y="14" width="16" height="3" rx="1" fill="currentColor" />
      </svg>
      {/* Slider */}
      <Slider
        min={1}
        max={20}
        step={1}
        value={[strokeWidth]}
        onValueChange={([val]) => setStrokeWidth(val)}
        className="w-30"
      />
      {/* Percentage */}
      <span className="text-right text-gray-700 text-xs">{strokeWidth * 5}%</span>
    </div>
  );
}