'use client'

import { useContext, useEffect, useRef, useLayoutEffect } from 'react'
import Konva from 'konva'
import { Html } from 'react-konva-utils'
import { PDFContext } from '../PDFEditor'
import { TextAnnotation } from '../types/types'

interface TextEditorProps {
  textNode: Konva.Text,
  onClose: () => void
  onTextChange: (text: string) => void
}

export default function TextEditor({ textNode, onClose, onTextChange }: TextEditorProps) {
    const pdf = useContext(PDFContext)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    useLayoutEffect(() => {
        if (!textareaRef.current || !textNode) return;
        const textarea = textareaRef.current;
        const stage = textNode?.getStage();
        
        const textPosition = textNode?.position();
        const stageBox = stage?.container().getBoundingClientRect();
        const areaPosition = {
          x: textPosition?.x,
          y: textPosition?.y,
        };
  
        // Match styles with the text node
        textarea.value = textNode.text();
        textarea.style.position = 'absolute';
        textarea.style.top = `${areaPosition.y}px`;
        textarea.style.left = `${areaPosition.x}px`;
        textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
        textarea.style.height = `${textNode.height() - textNode.padding() * 2 + 5}px`;
        textarea.style.fontSize = `${textNode.fontSize()}px`;
        textarea.style.border = 'none';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = `${textNode.lineHeight()}`;
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align();
        textarea.style.color = textNode.fill() as string;
    
        const rotation = textNode.rotation();
        let transform = '';
        if (rotation) {
          transform += `rotateZ(${rotation}deg)`;
        }
        textarea.style.transform = transform;
    
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight + 3}px`;
    
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);


        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onTextChange(textareaRef.current?.value as string);
            onClose();
          }
          if (e.key === "Escape") {
            onClose();
          }
        };

        const handleInput = () => {
        const scale = textNode.getAbsoluteScale().x;
        textarea.style.width = `${textNode.width() * scale}px`;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
        };
    
        textarea.addEventListener('input', handleInput);
        textarea.addEventListener('keydown', handleKeyDown);

        return () => {
          textarea.removeEventListener('input', handleInput);
          textarea.removeEventListener('keydown', handleKeyDown);
        };
      }, [textNode, onClose, onTextChange]);

    return (
      <textarea 
        ref={textareaRef}
        style={{ 
            minHeight: '1em',
            position: 'absolute'
        }}
      />
    )


}