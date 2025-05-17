'use client'
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import * as PDFJS from 'pdfjs-dist'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { RenderTask } from 'pdfjs-dist/types/src/display/api';
import dynamic from 'next/dynamic'
import { KonvaEventObject } from 'konva/lib/Node';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { XIcon } from "lucide-react"

// Dynamically import Konva components with SSR disabled
const KonvaComponents = dynamic(
  () => import('../components/KonvaComponents'),
  { ssr: false }
);

// Use local worker file instead of CDN
const workerSrc = '/pdf.worker.mjs';

// Define TextAnnotation type
interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  draggable: boolean,
  isEditing: boolean;
}

// Define ImageAnnotation type
interface ImageAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

// Define PageAnnotations type to store annotations per page
interface PageAnnotations {
  lines: Array<{ points: number[] }>;
  textAnnotations: TextAnnotation[];
  imageAnnotations: ImageAnnotation[];
}

interface Position {
  x: number,
  y: number
}

// Add TypeScript interface for DOMMatrix
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DOMMatrix: typeof DOMMatrix;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WebKitCSSMatrix: typeof WebKitCSSMatrix;
  }
}

export default function PDFViewer({ url }: {url: string}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentSelectedAnnotationPosition = useRef<Position>({x: 0, y: 0})
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [pageAnnotations, setPageAnnotations] = useState<Record<number, PageAnnotations>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'draw' | 'select' | 'text' | 'image'>('select');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<string | null>(null)
  const [isFileUploading, setIsFileUploading] = useState<boolean>(false)

  // Helper function to get or initialize current page annotations
  const getCurrentPageAnnotations = (): PageAnnotations => {
    return pageAnnotations[currentPage] || { 
      lines: [], 
      textAnnotations: [], 
      imageAnnotations: [] 
    };
  };

  // Helper function to update annotations for the current page
  const updateCurrentPageAnnotations = (newAnnotations: PageAnnotations) => {
    setPageAnnotations({
      ...pageAnnotations,
      [currentPage]: newAnnotations
    });
  };

  // Current page annotations
  const currentLines = getCurrentPageAnnotations().lines;
  const currentTextAnnotations = getCurrentPageAnnotations().textAnnotations;
  const currentImageAnnotations = getCurrentPageAnnotations().imageAnnotations;

  // Set up DOMMatrix polyfill and worker
  useEffect(() => {
    // Polyfill for DOMMatrix
    if (typeof window !== 'undefined' && typeof DOMMatrix === 'undefined') {
      window.DOMMatrix = window.WebKitCSSMatrix ||
        class DOMMatrix {
          // Minimal implementation
          constructor() {
            return this;
          }
        };
    }

    // Set up PDF.js worker
    PDFJS.GlobalWorkerOptions.workerSrc = workerSrc;
  }, []);

  // Load PDF
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const loadingTask = PDFJS.getDocument(url);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    if (url) {
      loadPDF();
    }
  }, [url]);

  // Save PDF with annotations
  const savePDF = async () => {
    if (!pdfDoc) return;
    
    try {
      setIsSaving(true);
      
      // Fetch the original PDF file
      const response = await fetch(url);
      const pdfBytes = await response.arrayBuffer();
      
      // Load the PDF with pdf-lib
      const pdfLibDoc = await PDFDocument.load(pdfBytes);
      
      // Get all pages
      const pages = pdfLibDoc.getPages();
      
      // Apply annotations to all pages that have them
      Object.entries(pageAnnotations).forEach(async ([pageNumberStr, annotations]) => {
        const pageIndex = parseInt(pageNumberStr, 10) - 1;
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { width, height } = page.getSize();
          
          // Scale factor between PDF coordinates and canvas coordinates
          const scaleX = width / stageSize.width;
          const scaleY = height / stageSize.height;
          
          // Add text annotations
          for (const textAnnotation of annotations.textAnnotations) {
            // Skip empty text
            if (!textAnnotation.text.trim()) continue;
            
            const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = 12;
            
            // Convert position from canvas to PDF coordinates (PDF coordinates start from bottom-left)
            const x = textAnnotation.x * scaleX;
            // Invert Y-coordinate as PDF coordinates start from bottom
            const y = height - (textAnnotation.y * scaleY) - fontSize;
            
            page.drawText(textAnnotation.text, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(0, 0, 0)
            });
          }
          
          // Add image annotations
          for (const imageAnnotation of annotations.imageAnnotations) {
            try {
              // Extract the base64 data from the data URL
              const base64Data = imageAnnotation.src.split(',')[1];
              if (!base64Data) continue;
              
              // Convert base64 to Uint8Array
              const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              
              // Embed the image (support different formats)
              let embeddedImage;
              if (imageAnnotation.src.includes('image/png')) {
                embeddedImage = await pdfLibDoc.embedPng(imageBytes);
              } else if (imageAnnotation.src.includes('image/jpeg') || imageAnnotation.src.includes('image/jpg')) {
                embeddedImage = await pdfLibDoc.embedJpg(imageBytes);
              } else {
                // Try to load as PNG as fallback
                embeddedImage = await pdfLibDoc.embedPng(imageBytes);
              }
              
              // Convert position and dimensions from canvas to PDF coordinates
              const x = imageAnnotation.x * scaleX;
              // Invert Y-coordinate as PDF coordinates start from bottom
              const y = height - ((imageAnnotation.y + imageAnnotation.height) * scaleY);
              const imageWidth = imageAnnotation.width * scaleX;
              const imageHeight = imageAnnotation.height * scaleY;
              
              page.drawImage(embeddedImage, {
                x,
                y,
                width: imageWidth,
                height: imageHeight
              });
            } catch (error) {
              console.error('Error embedding image:', error);
            }
          }
          
          // Add drawing lines
          for (const line of annotations.lines) {
            if (line.points.length < 4) continue; // Minimum 2 points needed for a line
            
            for (let i = 0; i < line.points.length - 2; i += 2) {
              const startX = line.points[i] * scaleX;
              // Invert Y-coordinate as PDF coordinates start from bottom
              const startY = height - (line.points[i + 1] * scaleY);
              const endX = line.points[i + 2] * scaleX;
              const endY = height - (line.points[i + 3] * scaleY);
              
              page.drawLine({
                start: { x: startX, y: startY },
                end: { x: endX, y: endY },
                thickness: 2,
                color: rgb(0.87, 0.29, 0.15), // #df4b26 converted to RGB
                opacity: 1
              });
            }
          }
        }
      });
      
      // Save the PDF
      const modifiedPdfBytes = await pdfLibDoc.save();
      
      // Create a download link
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'edited-document.pdf';
      downloadLink.click();
      
      // Clean up the URL object
      URL.revokeObjectURL(downloadUrl);
      
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving PDF:', error);
      setIsSaving(false);
    }
  };

  // Render Page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) return;

        // Set canvas dimensions
       // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Update stage size to match canvas
        setStageSize({
          width: viewport.width,
          height: viewport.height
        });

        // Clear the canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Store the render task so we can cancel it if needed
        const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
        });

        renderTaskRef.current = renderTask;

        // Wait for rendering to complete
        await renderTask.promise;
        
        // Clear the ref once rendering is complete
        renderTaskRef.current = null;
      } catch (error) {
        // Only log errors that aren't cancellation errors
        if (error && (error as Error).name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', error);
        }
      }
    };

    renderPage();

    // Clean up function to cancel rendering if component unmounts
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage]);
  
  useEffect(() => {
    if(!selectedAnnotationId) return
    
    const annotations = getCurrentPageAnnotations();
    Object.entries(annotations).forEach(([key, value]) => {
       value.forEach((item: TextAnnotation | ImageAnnotation) => {
        if(item.id == selectedAnnotationId) {
          currentSelectedAnnotationPosition.current = {x: Math.floor(item.x), y: Math.floor(item.y)}
        }
      });
    })
  }, [selectedAnnotationId, getCurrentPageAnnotations])

  // Page navigation
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pdfDoc && currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Drawing handlers
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
      // If we click on an annotation, the click handler in KonvaComponents will handle it
      // If we click on empty space, we want to deselect any selected annotation
      const clickedTarget = e.target;
      const clickedOnStage = clickedTarget === clickedTarget.getStage();
      const clickedOnEmpty = clickedOnStage || clickedTarget.getClassName() === 'Layer';
      
      if (clickedOnEmpty && selectedAnnotationId) {
        // Deselect the current annotation
        setSelectedAnnotationId(null);
        
        // If a text annotation is being edited, finish editing
        const currAnnotations = getCurrentPageAnnotations();
        const editingText = currAnnotations.textAnnotations.find(
          annotation => annotation.id === selectedAnnotationId && annotation.isEditing
        );
        
        if (editingText) {
          updateCurrentPageAnnotations({
            ...currAnnotations,
            textAnnotations: currAnnotations.textAnnotations.map(annotation => 
              annotation.id === selectedAnnotationId 
                ? { ...annotation, isEditing: false } 
                : annotation
            )
          });
        }
      }
      if (drawingMode === 'draw') {
        setIsDrawing(true);
        const pos = e.target.getStage()!.getPointerPosition();
        if (pos) {
          const currAnnotations = getCurrentPageAnnotations();
          updateCurrentPageAnnotations({
            ...currAnnotations,
            lines: [...currAnnotations.lines, { points: [pos.x, pos.y] }]
          });
        }
      } else if (drawingMode === 'text') {
        const stage = e.target.getStage()!;
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          // Create a new text annotation
          const newTextAnnotation: TextAnnotation = {
            id: Date.now().toString(),
            x: pointerPos.x,
            y: pointerPos.y,
            text: '',
            draggable: true,
            isEditing: true
          };
          const currAnnotations = getCurrentPageAnnotations();
          updateCurrentPageAnnotations({
            ...currAnnotations,
            textAnnotations: [...currAnnotations.textAnnotations, newTextAnnotation]
          });
          setSelectedAnnotationId(newTextAnnotation.id);
        }
      } 
    };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || drawingMode !== 'draw') return;
    
    const stage = e.target.getStage()!;
    const point = stage.getPointerPosition();
    
    if (point) {
      const currAnnotations = getCurrentPageAnnotations();
      const lastLine = currAnnotations.lines[currAnnotations.lines.length - 1];
      
      if (lastLine) {
        // Add point to the last line
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        
        // Replace the last line
        const newLines = [...currAnnotations.lines.slice(0, -1), lastLine];
        updateCurrentPageAnnotations({
          ...currAnnotations,
          lines: newLines
        });
      }
    }
  };
  
  const handleMouseDrag = (e: KonvaEventObject<MouseEvent> | null) => {
    if (e) {
      const node = e.target;
      const id = node.id();
      const pos = node.position();
      const newPosition = { x: Math.floor(pos.x), y: Math.floor(pos.y) };

      const currAnnotations = getCurrentPageAnnotations();
      const textAnnotation = currAnnotations.textAnnotations.find(item => item.id === id);
      const imageAnnotation = currAnnotations.imageAnnotations.find(item => item.id === id);
      if (textAnnotation) {
        updateCurrentPageAnnotations({
          ...currAnnotations,
          textAnnotations: currAnnotations.textAnnotations.map(annotation => 
            annotation.id === id 
              ? { ...annotation, x: newPosition.x, y: newPosition.y }
              : annotation
          )
        });
      }

      if (imageAnnotation) {
        updateCurrentPageAnnotations({
          ...currAnnotations,
          imageAnnotations: currAnnotations.imageAnnotations.map(annotation => 
            annotation.id === id 
              ? { ...annotation, x: newPosition.x, y: newPosition.y }
              : annotation
          )
        });
      }
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Text annotation handlers
  const handleTextChange = (id: string, newText: string) => {
    console.log('Text changed:', id, newText);
    
    const currAnnotations = getCurrentPageAnnotations();
    updateCurrentPageAnnotations({
      ...currAnnotations,
      textAnnotations: currAnnotations.textAnnotations.map(annotation => 
        annotation.id === id 
          ? { ...annotation, text: newText } 
          : annotation
      )
    });
  };

  const handleTextEditingComplete = (id: string) => {
    console.log('Text editing complete:', id);
    
    const currAnnotations = getCurrentPageAnnotations();
    updateCurrentPageAnnotations({
      ...currAnnotations,
      textAnnotations: currAnnotations.textAnnotations.map(annotation => 
        annotation.id === id 
          ? { ...annotation, isEditing: false } 
          : annotation
      )
    });
    setSelectedAnnotationId(null);
  };

  const handleTextClick = (id: string) => {
    console.log("Text clicked:", id);
    setSelectedAnnotationId(id);
    const currAnnotations = getCurrentPageAnnotations();
    updateCurrentPageAnnotations({
      ...currAnnotations,
      textAnnotations: currAnnotations.textAnnotations.map(annotation => 
        annotation.id === id 
          ? { ...annotation, isEditing: true } 
          : { ...annotation, isEditing: false }
      )
    });
  };

  // Image annotation handlers
  const handleImageClick = (id: string) => {
    console.log("Image clicked:", id);
    setSelectedAnnotationId(id);
  };

  const handleImageUpload = () => {
    const files = fileInputRef?.current?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (result) {
        const stage = document.querySelector('.konvajs-content canvas');
        if (!stage) return;

        // Create a temporary image to get dimensions
        const img = new window.Image();
        img.src = result as string;
        
        img.onload = () => {
          // Calculate a reasonable size while maintaining aspect ratio
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            const ratio = MAX_WIDTH / width;
            width = MAX_WIDTH;
            height = height * ratio;
          }
          
          if (height > MAX_HEIGHT) {
            const ratio = MAX_HEIGHT / height;
            height = MAX_HEIGHT;
            width = width * ratio;
          }
          
          // Get the center position of the stage
          const stageWidth = stageSize.width;
          const stageHeight = stageSize.height;
          
          const newImageAnnotation: ImageAnnotation = {
            id: Date.now().toString(),
            x: stageWidth / 2 - width / 2,
            y: stageHeight / 2 - height / 2,
            width,
            height,
            src: result as string
          };
          
          const currAnnotations = getCurrentPageAnnotations();
          updateCurrentPageAnnotations({
            ...currAnnotations,
            imageAnnotations: [...currAnnotations.imageAnnotations, newImageAnnotation]
          });
          setSelectedAnnotationId(newImageAnnotation.id);
        };
      }
    };

    reader.readAsDataURL(file);
    
    // Clear the input and image file state
    if (fileInputRef.current) fileInputRef.current.value = '';
    setImageFile('');
  };

  const deleteSelectedAnnotation = () =>{
    if (selectedAnnotationId) {
      const currAnnotations = getCurrentPageAnnotations();
      
      // Check if it's a text annotation
      if (currAnnotations.textAnnotations.some(a => a.id === selectedAnnotationId)) {
        updateCurrentPageAnnotations({
          ...currAnnotations,
          textAnnotations: currAnnotations.textAnnotations.filter(
            annotation => annotation.id !== selectedAnnotationId
          )
        });
      }
      // Check if it's an image annotation
      else if (currAnnotations.imageAnnotations.some(a => a.id === selectedAnnotationId)) {
        updateCurrentPageAnnotations({
          ...currAnnotations,
          imageAnnotations: currAnnotations.imageAnnotations.filter(
            annotation => annotation.id !== selectedAnnotationId
          )
        });
      }
      
      setSelectedAnnotationId(null);
    }
  };

  const clearCurrentPageAnnotations = () => {
    updateCurrentPageAnnotations({
      lines: [],
      textAnnotations: [],
      imageAnnotations: []
    });
  };

  const onChangeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const img = e.target.files && e.target.files[0];

    if (!img) return
    setIsFileUploading(true)

    const reader = new FileReader();
    reader.onload = () => {
      console.log('check')
      setImageFile(reader.result as string);
      setIsFileUploading(false)
    };

    reader.onerror = () => {
      console.error('Preview generation failed');
      setIsFileUploading(false)
    };
    
    reader.readAsDataURL(img)
  }
  
  return (
    <div className="pdf-editor flex flex-col h-full">
      {/* Top Toolbar - Styled like the image */}
      <div className="toolbar bg-gray-100 border-b border-gray-300 flex items-center p-2">
        <div className="document-info flex items-center mr-4">
          <Button className="icon-button bg-gray-200 rounded p-2 flex items-center justify-center mr-2 w-8 h-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h4v4H7V7zm0 6h10v2H7v-2zm0 4h10v2H7v-2zm6-9h4v2h-4V8z"/></svg>
          </Button>
          <div className="page-info text-sm flex items-center">
            <span className="font-semibold">Pages</span>
            <span className="mx-2">{currentPage}/{numPages}</span>
          </div>
        </div>
        
        <div className="vertical-divider h-8 w-px bg-gray-300 mx-2"></div>
        
        <div className="editing-options flex flex-1 items-center space-x-1 ml-2">
          
          <Button
            variant="ghost"
            className={`tool-button p-2 rounded flex items-center justify-center w-8 h-8 ${drawingMode === 'text' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
            onClick={() => setDrawingMode('text')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M13 6v15h-2V6H5V4h14v2z"/></svg>
          </Button>
          
          <Button
            variant="ghost" 
            className={`tool-button p-2 rounded flex items-center justify-center w-8 h-8 ${drawingMode === 'draw' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
            onClick={() => setDrawingMode('draw')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M15.243 4.515l-6.738 6.737-.707 2.121 2.121-.707 6.738-6.738-1.414-1.414zm.828-3.535l5.657 5.657-9.9 9.9-5.658-5.657 9.9-9.9zm-11.314 11.314l-4.242 4.242-1.414 4.242 4.242-1.414 4.242-4.242-2.828-2.828z"/></svg>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost"
                className={`tool-button p-2 rounded flex items-center justify-center w-8 h-8 ${drawingMode === 'image' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
                onClick={() => setImageFile('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 7.5l2.5-3 3.5 4.5H8z"/>
                </svg>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Insert an Image</DialogTitle>
                <DialogDescription>
                  Upload your picture here
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-4 items-center justify-center w-full">
                  {!imageFile?
                    <label
                      htmlFor={isFileUploading? "": "image-upload"}
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isFileUploading?
                          <div className="animate-spin">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          </div> :
                          <>
                            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                          </>
                        }
                      </div>
                    </label> :
                    <div className="relative">
                      <Button className="group cursor-pointer absolute right-0 p-0 -translate-y-4 translate-x-3 bg-transparent hover:bg-transparent" onClick={() => setImageFile('')}>
                        <div className="px-1 py-1 bg-white m-0 hover group-hover:outline-gray-500 rounded-full outline-1 outline-solid outline-gray-400">
                          <XIcon className="text-gray-400 group-hover:text-gray-500"/>
                        </div>
                      </Button>
                      <Image alt="Uploaded image annotation" width={200} height={200} className="" src={imageFile}/>
                    </div>
                  }
                  <Input 
                    id="image-upload"
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }} 
                    accept="image/*"
                    onChange={onChangeImageUpload}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="submit" className="disabled:pointer-events-auto w-full p-5 disabled:cursor-not-allowed disabled:hover:cursor-not-allowed" disabled={(fileInputRef.current?.files && fileInputRef.current.files[0])? false: true} onClick={() => handleImageUpload()}>Insert Image</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
                
          <Button
            variant="ghost"
            className="tool-button hover:bg-gray-200 p-2 rounded flex items-center justify-center w-8 h-8"
            onClick={clearCurrentPageAnnotations}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M6.535 3H21a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6.535a1 1 0 0 1-.832-.445l-5.333-8a1 1 0 0 1 0-1.11l5.333-8A1 1 0 0 1 6.535 3zm.535 2l-4.667 7 4.667 7H20V5H7.07z"/></svg>
          </Button>
        </div>
        
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            className={`px-3 py-1 ${isSaving ? 'bg-blue-400' : 'bg-blue-500'} text-white rounded-md flex items-center mr-2 text-sm font-medium`}
            onClick={savePDF}
            disabled={isSaving}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      
      {/* Hidden file input for image upload */}
      
      {/* PDF Content */}
      <div className="pdf-content flex-1 relative bg-gray-200 overflow-auto flex justify-center items-center">
        <div className="relative pdf-page bg-white shadow-md my-4 flex flex-col items-center justify-center" ref={containerRef}>
          {/* Page number indicator */}
          <div className="page-number absolute top-2 left-1/2 transform -translate-x-1/2 text-gray-500 font-semibold text-sm">
            #{currentPage}
          </div>
          
          {/* PDF Canvas */}
          <div className="relative"> 
            <canvas ref={canvasRef}></canvas>
            
            {/* Konva Drawing Layer */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%',
              height: '100%',
              pointerEvents: 'auto'
            }}>
              {typeof window !== 'undefined' && (
                <KonvaComponents 
                  stageSize={stageSize}
                  lines={currentLines}
                  textAnnotations={currentTextAnnotations}
                  imageAnnotations={currentImageAnnotations}
                  selectedAnnotationId={selectedAnnotationId}
                  drawingMode={drawingMode}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTextChange={handleTextChange}
                  onDragMove={handleMouseDrag}
                  onTextEditingComplete={handleTextEditingComplete}
                  onTextClick={handleTextClick}
                  onImageClick={handleImageClick}
                />
              )}
            </div>
          </div>
          {
        selectedAnnotationId?
          <div className="absolute" style={{ top: currentSelectedAnnotationPosition.current.y + "px", left: currentSelectedAnnotationPosition.current.x + "px"}}>
            <Button onClick={deleteSelectedAnnotation}>
            <svg
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24px"
              height="24px"
            >
              <path
                fill="none"
                stroke="#000000"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
              />
            </svg>
            </Button>
          </div>:
        ""
      }
        </div>
      </div>
      
      {/* Bottom pagination controls */}
      <div className="pagination-controls py-2 flex justify-center items-center border-t border-gray-300 bg-white">
        <button 
          onClick={goToPrevPage} 
          disabled={currentPage <= 1}
          className="p-1 mx-1 rounded-full hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z"/><path d="M10.828 12l4.95 4.95-1.414 1.414L8 12l6.364-6.364 1.414 1.414z"/></svg>
        </button>
        <span className="text-sm mx-2">Page {currentPage} of {numPages}</span>
        <button 
          onClick={goToNextPage} 
          disabled={!pdfDoc || currentPage >= numPages}
          className="p-1 mx-1 rounded-full hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z"/><path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"/></svg>
        </button>
      </div>

      
    </div>
  );
};
