'use client'

import { useContext } from 'react'
import { PDFContext } from '../PDFEditor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Mode } from '../types/types'

type ToolbarTypes = {
  onChangeMode: (mode: Mode) => void
}

export default function Toolbar({ onChangeMode }: ToolbarTypes) {
    const pdf  = useContext(PDFContext)
    
    return (
      <div className="w-16 h-full text-gray-700 shadow-large flex flex-col items-center py-4 mt-20">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button className={`p-2 bg-transparent ${pdf && pdf.mode == 'text'? 'bg-gray-200': 'hover:bg-gray-200'} rounded mb-4 cursor-pointer`} onClick={() => onChangeMode("text")}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M13 6v15h-2V6H5V4h14v2z"/></svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Insert/Edit Text</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button className={`p-2 bg-transparent ${pdf && pdf.mode == 'draw'? 'bg-gray-200': 'hover:bg-gray-200'} rounded mb-4 cursor-pointer`} onClick={() => onChangeMode("draw")}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M15.243 4.515l-6.738 6.737-.707 2.121 2.121-.707 6.738-6.738-1.414-1.414zm.828-3.535l5.657 5.657-9.9 9.9-5.658-5.657 9.9-9.9zm-11.314 11.314l-4.242 4.242-1.414 4.242 4.242-1.414 4.242-4.242-2.828-2.828z"/></svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Draw</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button className={`p-2 bg-transparent ${pdf && pdf.mode == 'image'? 'bg-gray-200': 'hover:bg-gray-200'} rounded mb-4 cursor-pointer`} onClick={() => onChangeMode("image")}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 7.5l2.5-3 3.5 4.5H8z"/>
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Insert Image</p>
            </TooltipContent>
          </Tooltip>
      </div>
    )
}