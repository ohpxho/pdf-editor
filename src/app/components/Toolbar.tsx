'use client'

import { useContext, useRef } from 'react'
import { PDFContext } from '../PDFEditor'
import { Input } from '@/components/ui/input'
import { Mode } from '../types/types'
import { Undo2, Redo2} from 'lucide-react'

type ToolbarTypes = {
  onChangeMode: (mode: Mode) => void
}

export default function Toolbar({ onChangeMode }: ToolbarTypes) {
    const pdf  = useContext(PDFContext)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const onChange = (): void => {
      if(!fileInputRef.current || !pdf) return
      pdf.updateFileInputRef(fileInputRef.current)
    }
    
    return (
       <div className="sticky top-0 left-0 right-0 z-50 h-fit p-2 border-b flex items-center px-4 bg-white">
          <div className="flex justify-start gap-4">
            <button className="text-black rounded-lg transition-colors duration-200 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={true}>
              <Undo2 />
            </button>
            <button className="text-black rounded-lg transition-colors duration-200 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={true}>
              <Redo2 />
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200 mx-4"></div>
          <div className="flex gap-0.5 justify-center flex-1">
            <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg cursor-pointer transition-colors duration-200 h-12 ${
              pdf && pdf.mode == 'text' 
                ? 'bg-blue-100 text-blue-600' 
                : 'hover:bg-blue-50 hover:text-blue-500 text-gray-600'
            }`} onClick={() => onChangeMode("text")}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="fill-current">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M13 6v15h-2V6H5V4h14v2z"/>
              </svg>
              <span className="text-xs">Add Text</span>
            </div>

            <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg cursor-pointer transition-colors duration-200 w-14 h-12 ${
              pdf && pdf.mode == 'draw' 
                ? 'bg-blue-100 text-blue-600' 
                : 'hover:bg-blue-50 hover:text-blue-500 text-gray-600'
            }`} onClick={() => onChangeMode("draw")}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="fill-current">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M15.243 4.515l-6.738 6.737-.707 2.121 2.121-.707 6.738-6.738-1.414-1.414zm.828-3.535l5.657 5.657-9.9 9.9-5.658-5.657 9.9-9.9zm-11.314 11.314l-4.242 4.242-1.414 4.242 4.242-1.414 4.242-4.242-2.828-2.828z"/>
              </svg>
              <span className="text-xs">Draw</span>
            </div>

            <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg cursor-pointer transition-colors duration-200 w-14 h-12 ${
              pdf && pdf.mode == 'image' 
                ? 'bg-blue-100 text-blue-600' 
                : 'hover:bg-blue-50 hover:text-blue-500 text-gray-600'
            }`} onClick={() => onChangeMode("image")}>
              <label htmlFor="image-input" className="cursor-pointer flex flex-col items-center gap-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="fill-current">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M3 4h16v16H4V4zm2 2v12h12V6H6zm2 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 7.5l2.5-3 3.5 4.5H8z"/>
                </svg>
                <span className="text-xs">Image</span>
              </label>
            </div>
            
            <Input
              id="image-input"
              className="hidden"
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={onChange}
            />
          </div>
          <div className="flex justify-end gap-4">
            <button className="flex items-center justify-center rounded-lg bg-white cursor-pointer transition-colors duration-200 border border-transparent disabled:cursor-not-allowed disabled:text-gray-400" disabled={true}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send-horizontal-icon lucide-send-horizontal"><path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"/><path d="M6 12h16"/></svg>
            </button>
            <button className="flex items-center justify-center cursor-pointer rounded-lg duration-200" aria-label="Download">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download-icon lucide-download"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>
            </button>
          </div>
        </div>
    )
}