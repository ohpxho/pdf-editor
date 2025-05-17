'use client'

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Text, Transformer, Image } from 'react-konva';
import Konva from 'konva';

interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  draggable: boolean,
  isEditing: boolean;
}

interface ImageAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

interface KonvaComponentsProps {
  stageSize: { width: number; height: number };
  lines: Array<{ points: number[] }>;
  textAnnotations: TextAnnotation[];
  imageAnnotations: ImageAnnotation[];
  selectedAnnotationId: string | null;
  drawingMode: 'draw' | 'select' | 'text' | 'image';
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<MouseEvent> | null) => void;
  onMouseUp: () => void;
  onTextChange: (id: string, text: string) => void;
  onTextEditingComplete: (id: string) => void;
  onTextClick: (id: string) => void;
  onImageClick: (id: string) => void;
}

const KonvaComponents = ({
  stageSize,
  lines,
  textAnnotations,
  imageAnnotations,
  selectedAnnotationId,
  drawingMode,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDragMove,
  onTextChange,
  onTextEditingComplete,
  onTextClick,
  onImageClick
}: KonvaComponentsProps) => {
  const textRefs = useRef<{ [key: string]: Konva.Text }>({});
  const imageRefs = useRef<{ [key: string]: Konva.Image }>({});
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isRemovingTextarea = useRef<boolean>(false);
  const prevSelectedAnnotationId = useRef<string>('')
  // Local state to track textarea value to prevent focus loss on typing
  const [localTextValue, setLocalTextValue] = useState<string>('');
  const [textAreaAttr, setTextareaAttr] = useState<{
    x: number,
    y: number,
    fontSize: number,
    rotation: number,
    scaleX: number,
    scaleY: number,
    skewX: number,
    skewY: number
  } | null>(null);
  const [imageObjects, setImageObjects] = useState<{ [key: string]: HTMLImageElement }>({});
  
  // Load images when image annotations change
  useEffect(() => {
    imageAnnotations.forEach(annotation => {
      if (!imageObjects[annotation.id]) {
        const img = new window.Image();
        img.src = annotation.src;
        img.onload = () => {
          setImageObjects(prev => ({
            ...prev,
            [annotation.id]: img
          }));
        };
      }
    });
  }, [imageAnnotations, imageObjects]);
  
  // Handle selection of annotations with transformer
  useEffect(() => {
    if (selectedAnnotationId && transformerRef.current) {
      // Check if it's a text annotation
      const selectedTextNode = textRefs.current[selectedAnnotationId];
      // Check if it's an image annotation
      const selectedImageNode = imageRefs.current[selectedAnnotationId];
      
      if (selectedTextNode) {
        transformerRef.current.nodes([selectedTextNode]);
      } else if (selectedImageNode) {
        transformerRef.current.nodes([selectedImageNode]);
      } else {
        transformerRef.current.nodes([]);
      }
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      prevSelectedAnnotationId.current = ''
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedAnnotationId, textAnnotations, imageAnnotations, imageObjects]);

  // Create and position textarea when text is selected for editing
  useEffect(() => {
    const selectedAnnotation = textAnnotations.find(a => a.id === selectedAnnotationId && a.isEditing);
    
    if (selectedAnnotation && stageRef.current && selectedAnnotationId) {
      const textNode = textRefs.current[selectedAnnotationId];
      if (!textNode) return;

      // Get stage container and its bounding rect
      const stageContainer = stageRef.current.container();
      const stageRect = stageContainer.getBoundingClientRect();
      
      // Get position in page coordinates
      const textAttr = textNode.getAttrs();
      // Calculate position relative to the viewport
      const areaAttr = {
        x: stageRect.left + (textAttr.x? textAttr.x: 0),
        y: stageRect.top + (textAttr.y? textAttr.y: 0),
        fontSize: (textAttr.fontSize? textAttr.fontSize: 0),
        rotation: (textAttr.rotation? textAttr.rotation: 0),
        scaleX: (textAttr.scaleX? textAttr.scaleX: 0),
        scaleY:(textAttr.scaleY? textAttr.scaleY: 0),
        skewX: (textAttr.skewX? textAttr.skewX: 0),
        skewY: (textAttr.skewY? textAttr.skewY: 0)
      };
      
      // Set local state for text value and position
      if(selectedAnnotation?.text == "" || selectedAnnotationId == prevSelectedAnnotationId.current) {
        setLocalTextValue(selectedAnnotation.text || '');
        setTextareaAttr(areaAttr);
      }
      prevSelectedAnnotationId.current = selectedAnnotationId 
    } else {
      setTextareaAttr(null);
    }
  }, [selectedAnnotationId, textAnnotations]);
  
  // Create and manage textarea based on position state
  useEffect(() => {
    // Remove existing textarea if any
    if (textareaRef.current && document.body.contains(textareaRef.current)) {
      document.body.removeChild(textareaRef.current);
      textareaRef.current = null;
    }
    
    // If we have a position, create a new textarea
    if (textAreaAttr && selectedAnnotationId) {
      const selectedAnnotation = textAnnotations.find(a => a.id === selectedAnnotationId);
      if (!selectedAnnotation) return;
      
      const textNode = textRefs.current[selectedAnnotationId];
      if (!textNode) return;
      
      // Create textarea for editing
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textareaRef.current = textarea;
      // Position textarea to match text node
      textarea.value = textNode.text();
      textarea.style.position = 'absolute';
      textarea.style.top = textAreaAttr.y + 'px';
      textarea.style.left = textAreaAttr.x + 'px';
      textarea.style.width = textNode.width() + 'px';
      textarea.style.height = textNode.height() + 'px';
      textarea.style.fontSize = textAreaAttr.fontSize + 'px';
      textarea.style.transform =  `rotate(${textAreaAttr.rotation}deg) skewX(${textAreaAttr.skewX}deg) skewY(${textAreaAttr.skewY}deg) scaleX(${textAreaAttr.scaleX}) scaleY(${textAreaAttr.scaleY})`;
      textarea.style.border = 'none';
      textarea.style.paddingTop = textNode.padding() - 5 + 'px';
      textarea.style.paddingBottom = textNode.padding() - 5 + 'px';
      textarea.style.paddingLeft = textNode.padding()  + 'px';
      textarea.style.paddingRight = textNode.padding() + 'px';
      textarea.style.margin = '0px';
      textarea.style.overflow = 'hidden';
      textarea.style.background = 'none';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.fontFamily = textNode.fontFamily();
      textarea.style.transformOrigin = 'left top';
      textarea.style.textAlign = textNode.align();
      textarea.style.color = 'transparent';
      textarea.style.caretColor = 'black';
      // Force focus
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
      }, 10);
      
      const handleTextareaChange = (e: Event) => {
        const newValue = (e.target as HTMLTextAreaElement).value;
        setLocalTextValue(newValue);
        
        // Also update the parent component's state immediately
        onTextChange(selectedAnnotationId, newValue);
        
        // Auto-resize the textarea based on content
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(textarea.scrollHeight, 30)}px`;
      };
      
      // Safely remove the textarea
      const safelyRemoveTextarea = () => {
        if (isRemovingTextarea.current) return;
        
        isRemovingTextarea.current = true;
        try {
          // Make sure we update the parent component with the final text value
          if (localTextValue.trim() !== '') {
            console.log('Saving text:', localTextValue);
            onTextChange(selectedAnnotationId, localTextValue);
          }
          
          if (textareaRef.current && document.body.contains(textareaRef.current)) {
            document.body.removeChild(textareaRef.current);
          }
        } catch {
          console.log('Textarea already removed');
        } finally {
          textareaRef.current = null;
          isRemovingTextarea.current = false;
          setTextareaAttr(null);
        }
        
        onTextEditingComplete(selectedAnnotationId);
      };
      
      const handleTextareaBlur = () => {
        safelyRemoveTextarea(); 
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // Enter key commits the edit (unless shift is held)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          safelyRemoveTextarea();
        }
        
        // Escape cancels the edit
        if (e.key === 'Escape') {
          safelyRemoveTextarea();
        }
      };
      
      textarea.addEventListener('input', handleTextareaChange as EventListener);
      textarea.addEventListener('blur', handleTextareaBlur);
      textarea.addEventListener('keydown', handleKeyDown as EventListener);
      
      return () => {
        textarea.removeEventListener('input', handleTextareaChange as EventListener);
        textarea.removeEventListener('blur', handleTextareaBlur);
        textarea.removeEventListener('keydown', handleKeyDown as EventListener);
      };
    }
  }, [textAreaAttr, localTextValue, selectedAnnotationId, textAnnotations, onTextChange, onTextEditingComplete]);

  // Handle stage click - important for our fix!
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Get the clicked target
    const clickedOnStage = e.target === e.target.getStage();
    const clickedOnEmpty = clickedOnStage || e.target.getClassName() === 'Layer';
    
    // If in select mode, don't create new annotations when clicking on empty space
    if (drawingMode === 'select') {
      // Only pass the event if clicking on a selectable item
      if (!clickedOnEmpty) {
        onMouseDown(e);
      }
    }
    // Only create new annotations if clicked on empty area and in appropriate mode
    else if (clickedOnEmpty && (drawingMode === 'text' || drawingMode === 'image')) {
      onMouseDown(e);
    } else if (drawingMode === 'draw') {
      // Allow drawing when in draw mode
      onMouseDown(e);
    } 
  };

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const dblClickedOnStage = e.target === e.target.getStage()
      const dblClickedOnEmpty = dblClickedOnStage || e.target.getClassName() === 'Layer'
      
      if (!dblClickedOnEmpty) {
      }
  }

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      onMouseDown={handleStageMouseDown}
      onMousemove={onMouseMove}
      onMouseup={onMouseUp}
      onDblClick={handleDblClick}
    >
      <Layer>
        {/* Drawing lines */}
        {lines.map((line, i) => (
          <Line
            key={`line-${i}`}
            points={line.points}
            stroke="#df4b26"
            strokeWidth={2}
            draggable={true}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            onDragMove={(e) => {
              e.cancelBubble = true;
              onDragMove(null);
            }}
          />
        ))}
        
        {/* Image annotations */}
        {imageAnnotations.map((annotation) => (
          imageObjects[annotation.id] && (
            <Image
              key={annotation.id}
              alt="Image Annotation"
              id={annotation.id}
              x={annotation.x}
              y={annotation.y}
              width={annotation.width}
              height={annotation.height}
              image={imageObjects[annotation.id]}
              draggable={true}
              onClick={(e) => {
                e.cancelBubble = true;
                onImageClick(annotation.id);
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                onDragMove(e);
              }}
              ref={(node) => {
                if (node) {
                  imageRefs.current[annotation.id] = node;
                }
              }}
            />
          )
        ))}
        
        {/* Text annotations */}
        {textAnnotations.map((annotation) => (
          <Text
            key={annotation.id}
            id={annotation.id}
            x={annotation.x}
            y={annotation.y}
            text={annotation.text}
            fontSize={16}
            background="none"
            padding={10}
            draggable={true}
            onClick={(e) => {
              // Stop event propagation to prevent stage from receiving it
              e.cancelBubble = true;
              onTextClick(annotation.id);
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              onDragMove(e);
            }}
            width={annotation.text ? undefined : 150}
            ref={(node) => {
              if (node) {
                textRefs.current[annotation.id] = node;
              }
            }}
          />
        ))}
        
        {/* Transformer for selected text or image */}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['middle-left', 'middle-right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={true}
          keepRatio={true}
          centeredScaling={true}
          ignoreStroke={true}
          borderStroke="#4a90e2"
          borderWidth={1}
          anchorStroke="#4a90e2"
          anchorSize={8}
          anchorCornerRadius={4}
          borderDash={[3,3]}
        />
      </Layer>
    </Stage>
  );
};

export default KonvaComponents; 