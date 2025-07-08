import { useEffect } from 'react'
import { cn } from "@/lib/utils";

import React, { useState } from "react";
import { HexColorPicker } from "react-colorful";

interface ColoPickerProps {
    className?: string | '';
    color: string;
    setColor: React.Dispatch<React.SetStateAction<string>>
}

export default function ColorPicker({className="", color, setColor}: ColoPickerProps) {
    const [showPicker, setShowPicker] = useState(false);
        
    const onColorPickerClick = (): void => {
       setShowPicker(!showPicker) 
    }
    
    const handleClickOutside = (e: MouseEvent) => {
        if((e.target as HTMLElement).closest('.color-picker')) return
        setShowPicker(false)
    }
    
    useEffect(() => {
        if(showPicker) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [showPicker])

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
    };

  return (
    <div className={cn("relative inline-block color-picker", className)}>
      <div onClick={onColorPickerClick} className="flex cursor-pointer gap-2 items-center bg-white p-2 border border-gray-300 rounded-sm">
          <button
            className="w-4 h-4 rounded-sm border-2 border-white shadow cursor-pointer"
            style={{ background: color }}
            aria-label="Pick color"
          />
          <span className="text-xs text-gray-500">{color}</span>
      </div>
      {showPicker && (
        <div className="absolute z-50 top-12 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-4" style={{ minWidth: 220 }}>
          <HexColorPicker color={color} onChange={handleColorChange} />
          <div className="flex items-center mt-3">
            <span>HEX </span>
            <input
              className="ml-2 w-full border rounded px-2 py-1 text-sm"
              type="text"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              maxLength={7}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}