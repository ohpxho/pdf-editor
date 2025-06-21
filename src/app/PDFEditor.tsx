import { useState, createContext } from 'react'
import RenderPDF from './components/RenderPDF';
import Toolbar from './components/Toolbar'
import Menu from './components/Menu'
import { Mode, PageAnnotations, TextAnnotation, ImageAnnotation, LineAnnotation} from './types/types'
import { Image } from 'konva/lib/shapes/Image';

type AnnotationTypes = TextAnnotation | ImageAnnotation | LineAnnotation 

interface ContextTypes {
    url: string;
    mode: Mode;
    annotations: PageAnnotations[];
    selectedAnnotationId: number | null;
    updateSelectedAnnotation: (id: number | null) => void;
    updatePageAnnotations: (pageNo: number, id: number, value: AnnotationTypes) => void;
    addPageAnnotations: (pageNo: number, value: AnnotationTypes) => void;
    initNewPageAnnotation: () => void
}

export const PDFContext = createContext<ContextTypes | undefined>(undefined)

export default function PDFEditor() {
    const [url, setUrl] = useState<string>("./pdf/test2.pdf")
    const [mode, setMode] = useState<Mode>(null)
    const [annotations, setAnnotation] = useState<PageAnnotations[]>([])
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null)
    
    function updateSelectedAnnotation(id: number | null) {
        setSelectedAnnotationId(id) 
    }

    function setEditingMode(mode: Mode): void {
        setMode(mode)
    }
   
    function initNewPageAnnotation(): void {
        setAnnotation(prev => [...prev, { text: [], image: [], draw: []}])
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
                    return idx === pageNo? { ...page, draw: [...page.draw, value as LineAnnotation]} : page
                })
            })
        }
    }

    function updatePageAnnotations(pageNo: number, id: number, value: AnnotationTypes): void {
        const pageAnnotations = annotations[pageNo]
        const textAnnotations = pageAnnotations.text
        const imageAnnotations = pageAnnotations.image
        const lineAnnotations = pageAnnotations.draw
        
        const selectedText = textAnnotations.find((text) => text.id == id)
        const selectedImage = imageAnnotations.find((image) => image.id == id)
        const selectedLine = lineAnnotations.find((line) => line.id == id)
        
        if(selectedText) {
            const newTextVal = textAnnotations.map((text) => {
                return text.id == id? {...value}: text
            })

            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, text: [...newTextVal as TextAnnotation[]]} : page
                })
            })
        }

        if(selectedImage) {
            const newImageVal = imageAnnotations.map((image) => {
                return image.id == id? {...value}: image
            })

            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, image: [...newImageVal as ImageAnnotation[]]} : page
                })
            })
        }

        if(selectedLine) {
            const newLineVal = lineAnnotations.map((line) => {
                return line.id == id? {...value}: line
            })
            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, draw: [...newLineVal as LineAnnotation[]]} : page
                })
            })
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
                    updateSelectedAnnotation,
                    updatePageAnnotations,
                    addPageAnnotations,
                    initNewPageAnnotation
                }
            }>
                <div className="relative h-full w-full">
                    <Menu />
                    <div className="relative flex w-full h-full">
                        <div className="z-30 absolute w-fit h-full shadow-lg">
                            <Toolbar onChangeMode={ setEditingMode } />
                        </div>
                        <div className="relative w-full">
                            <RenderPDF
                                url={url}
                                annotations={annotations}
                                mode={mode}
                            />
                        </div>
                    </div>
                </div>
            </PDFContext.Provider>
        </div>
    )
}