import { useState, createContext, useEffect, useRef} from 'react'
import Konva from 'konva'
import RenderPDF from './components/RenderPDF';
import Toolbar from './components/Toolbar'
import Preview from './components/Preview'
import FileMenu from './components/FileMenu'
import ToolOptions from './components/tool-options/ToolOptions';
import { Mode, PageAnnotations, TextAnnotation, ImageAnnotation, LineAnnotation, Metadata, LineAnnotationGroup} from './types/types'
import { Image } from 'konva/lib/shapes/Image';
import { Line } from 'konva/lib/shapes/Line';

type AnnotationTypes = TextAnnotation | ImageAnnotation | LineAnnotationGroup

interface ContextTypes {
    signatures: string[]
    metadata: Metadata;
    mode: Mode;
    annotations: PageAnnotations[];
    selectedAnnotationId: number | null;
    fileInputRef: HTMLInputElement | null;
    currPageInView: number;
    stageRef: Konva.Stage | null;
    setStageRef: (ref: Konva.Stage) => void;
    addSignature: (signature: string) => void;
    removeSignature: (index: number) => void;
    updateCurrPageInView: (pageNo: number) => void;
    updateSelectedAnnotation: (id: number | null) => void;
    updatePageAnnotations: (pageNo: number, id: number, value: AnnotationTypes) => void;
    addPageAnnotations: (pageNo: number, value: AnnotationTypes, type: string) => void;
    initNewPageAnnotation: () => void;
    updateFileInputRef: (ref: HTMLInputElement)=> void;
    clearFileInput: () => void
    clearAllAnnotations: () => void
    clearPageAnnotations: (pageNo: number) => void
}

export const PDFContext = createContext<ContextTypes | undefined>(undefined)

export default function PDFEditor() {
    const [signatures, setSignatures] = useState<string[]>([])
    const stageRef = useRef<Konva.Stage | null>(null)
    const [metadata, setMetadata] = useState<Metadata>({
        url: '',
        filename: ''
    })
    const [mode, setMode] = useState<Mode>(null)
    const [currPageInView, setCurrPageInView] = useState<number>(0)
    const [annotations, setAnnotation] = useState<PageAnnotations[]>([])
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null)
    const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)

    useEffect(() => {
    setMetadata({
        url: './pdf/test2.pdf',
        filename: 'test2.pdf'
    })}, [])
    
    function setStageRef(ref: Konva.Stage):void {
        if(!ref) return
        stageRef.current = ref
    }

    function updateSelectedAnnotation(id: number | null) {
        setSelectedAnnotationId(id)
    }
    

    function setEditingMode(mode: Mode): void {
        setMode(mode)
    }
   
    function initNewPageAnnotation(): void {
        setAnnotation(prev => [...prev, { text: [], image: [], line: [], sign: []}])
    }
    
    function clearAllAnnotations(): void {
        const size = annotations.length
        const newAnnotations = []
        for(let i = 0; i < size; i++) {
            newAnnotations.push({text: [], image: [], line: [], sign: []})
        }
        setAnnotation(newAnnotations) 
    }
    
    function clearPageAnnotations(pageNo: number): void {
        setAnnotation(prev => {
            const newAnnotations = prev.map((page, index) => {
                return index == pageNo? {text: [], image: [], line: [], sign: []} : page
            })
            return [...newAnnotations]
        })
    }

    function updateCurrPageInView(pageNo: number): void {
        setCurrPageInView(pageNo)
    }
    
    function addSignature(signature: string): void {
        setSignatures((prev) => [...prev, signature]);
    }
    
    function removeSignature(index: number):void {
        setSignatures((prev) => {
            const newSignature = [...prev]
            newSignature.splice(index, 1)
            return [...newSignature] 
        })
    }

    function addPageAnnotations(pageNo: number, value: AnnotationTypes, type: string): void {
    
        if(type === 'text') {
            setAnnotation((prev) => {
                        return prev.map((page, idx) => {
                            return idx === pageNo? { ...page, text: [...page.text, value as TextAnnotation] } : page
                        })
            })
        }

        if(type === 'image') {
            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, image: [...page.image, value as ImageAnnotation]} : page
                })
            })
        }

        if(type === 'lines') {
            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, line: [...page.line, value as LineAnnotationGroup]} : page
                })
            })
        }
 

        if(type === 'signature') {
            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx === pageNo? { ...page, sign: [...page.sign, value as ImageAnnotation]} : page
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
        const signAnnotations = pageAnnotations.sign

        const selectedText = textAnnotations.find((text) => text.id == id)
        const selectedImage = imageAnnotations.find((image) => image.id == id)
        const selectedSign = signAnnotations.find((sign) => sign.id == id)

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
        } else if(selectedSign) {
            const newSignVal = signAnnotations.map((sign) => {
                return sign.id == id? {...value}: sign
            })
            
            setAnnotation((prev) => {
                return prev.map((page, idx) => {
                    return idx ==pageNo? {...page, sign: [...newSignVal as ImageAnnotation[]]}: page
                })
            })

        } else {
            if(id == -1 && mode == "draw") {
                const newLineVal = [...lineAnnotations.slice(0, -1), value as LineAnnotationGroup]
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
                    signatures,
                    metadata,
                    mode,
                    annotations,
                    selectedAnnotationId,
                    fileInputRef,
                    currPageInView,
                    stageRef: stageRef.current,
                    setStageRef,
                    addSignature,
                    removeSignature,
                    updateCurrPageInView,
                    updateSelectedAnnotation,
                    updatePageAnnotations,
                    addPageAnnotations,
                    initNewPageAnnotation,
                    updateFileInputRef,
                    clearFileInput,
                    clearAllAnnotations,
                    clearPageAnnotations
                }
            }>
                <div className="relative h-screen w-full ">
                    <FileMenu />
                    <Toolbar onChangeMode={ setEditingMode } />
                    <div className="relative flex w-full h-full overflow-hidden">
                        <div className="relative">
                            <Preview />
                        </div>
                        <div className="relative w-full overflow-auto ">
                            <RenderPDF
                                url={metadata.url}
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