
import React, { useState } from "react";
import { Droplet } from "lucide-react"
import { Slider } from "@/components/ui/slider"; // Adjust the import path if needed
import { cn } from "@/lib/utils"; // For className merging if you use it

interface OpacitySliderProps {
    opacity: number;
    setOpacity: (opacity: number) => void
    className: string
}

export default function OpacitySlider({ opacity, setOpacity, className }: OpacitySliderProps) {

  return (
    <div className={cn("flex gap-3 items-center w-full rounded", className)}>
        <Droplet className="w-4"/> 
        <Slider
            min={0}
            max={1}
            step={0.1}
            value={[opacity]}
            onValueChange={([val]) => setOpacity(val)}
            className="w-30"
        />
        <span className="text-right text-xs">{opacity * 100}%</span>
    </div>
  );
}