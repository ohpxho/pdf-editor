import { useState, createContext } from 'react'
import RenderPDF from './components/RenderPDF';
import Toolbar from './components/Toolbar'
import Preview from './components/Preview'
import ToolOptions from './components/ToolOptions';
import { Mode, PageAnnotations, TextAnnotation, ImageAnnotation, LineAnnotation} from './types/types'
import { Image } from 'konva/lib/shapes/Image';
import { Line } from 'konva/lib/shapes/Line';

type AnnotationTypes = TextAnnotation | ImageAnnotation | LineAnnotation 

interface ContextTypes {
    url: string;
    mode: Mode;
    annotations: PageAnnotations[];
    selectedAnnotationId: number | null;
    fileInputRef: HTMLInputElement | null;
    currPageInView: number;
    updateCurrPageInView: (pageNo: number) => void;
    updateSelectedAnnotation: (id: number | null) => void;
    updatePageAnnotations: (pageNo: number, id: number, value: AnnotationTypes) => void;
    addPageAnnotations: (pageNo: number, value: AnnotationTypes) => void;
    initNewPageAnnotation: () => void;
    updateFileInputRef: (ref: HTMLInputElement)=> void;
    clearFileInput: () => void
}

export const PDFContext = createContext<ContextTypes | undefined>(undefined)

export default function PDFEditor() {
    const [url, setUrl] = useState<string>("./pdf/test3.pdf")
    const [mode, setMode] = useState<Mode>(null)
    const [currPageInView, setCurrPageInView] = useState<number>(0)
    const [annotations, setAnnotation] = useState<PageAnnotations[]>([])
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null)
    const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)
    
    function updateSelectedAnnotation(id: number | null) {
        setSelectedAnnotationId(id) 
    }

    function setEditingMode(mode: Mode): void {
        setMode(mode)
    }
   
    function initNewPageAnnotation(): void {
        setAnnotation(prev => [...prev, { text: [], image: [], line: []}])
    }

    function updateCurrPageInView(pageNo: number): void {
        setCurrPageInView(pageNo)
    }

    function addPageAnnotations(pageNo: number, value: AnnotationTypes): void {
    
        if(mode === 'text') {
            setAnnotation((prev) => { 
                        return prev.map((page, idx) => {
                            return idx === pageNo? { ...page, text: [...page.text, value as TextAnnotation] } : page 
                        })
                     
            })
        }

        if(mode === 'image') {
            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, image: [...page.image, value as ImageAnnotation]} : page
                })
            })
        }

        if(mode === 'draw') {
            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, line: [...page.line, value as LineAnnotation]} : page
                })
            })
        }
    }
    
    function updateFileInputRef(ref: HTMLInputElement): void {
        if(!ref) return
        setFileInputRef(ref)
    }
    
    function clearFileInput(): void {
        setFileInputRef(null)
    }

    function updatePageAnnotations(pageNo: number, id: number, value: AnnotationTypes): void {
        const pageAnnotations = annotations[pageNo]
        const textAnnotations = pageAnnotations.text
        const imageAnnotations = pageAnnotations.image
        const lineAnnotations = pageAnnotations.line

        const selectedText = textAnnotations.find((text) => text.id == id)
        const selectedImage = imageAnnotations.find((image) => image.id == id)

        if(selectedText) {
            
            const newTextVal = textAnnotations.map((text) => {
                return text.id == id? {...value}: text
            })

            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, text: [...newTextVal as TextAnnotation[]]} : page
                })
            })
        }else if(selectedImage) {
            const newImageVal = imageAnnotations.map((image) => {
                return image.id == id? {...value}: image
            })
            
            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, image: [...newImageVal as ImageAnnotation[]]} : page
                })
            })
        } else {
            if(id == -1 && mode == "draw") {
                const newLineVal = [...lineAnnotations.slice(0, -1), value as LineAnnotation]
                setAnnotation((prev) => {
                    return prev.map((page, idx) => {
                        return idx === pageNo? { ...page, line: [...newLineVal]} : page
                    })
                })
            }
        }
    }

    return (
        <div>
            <PDFContext.Provider value={
                {
                    url,
                    mode,
                    annotations,
                    selectedAnnotationId,
                    fileInputRef,
                    currPageInView,
                    updateCurrPageInView,
                    updateSelectedAnnotation,
                    updatePageAnnotations,
                    addPageAnnotations,
                    initNewPageAnnotation,
                    updateFileInputRef,
                    clearFileInput
                }
            }>
                <div className="relative h-screen w-full overflow-hidden">
                    <Toolbar onChangeMode={ setEditingMode } />
                    <div className="relative flex w-full h-full overflow-hidden">
                        <div className="relative">
                            <Preview />
                        </div>
                        <div className="relative w-full overflow-auto">
                            <RenderPDF
                                url={url}
                                annotations={annotations}
                                mode={mode}
                            />
                        </div>
                        <div className="relative">
                            <ToolOptions />
                        </div>
                    </div>
                </div>
            </PDFContext.Provider>
        </div>
    )
}