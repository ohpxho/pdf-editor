'use client'

import Konva from 'konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { Stage, Layer, Text, Line, Image, Transformer } from 'react-konva'
import { Html } from 'react-konva-utils'
import { useRef, useEffect, useContext, useState, useCallback } from 'react'
import { PageAnnotations, TextAnnotation, ImageAnnotation, LineAnnotation } from '../types/types'
import { PDFContext } from '../PDFEditor'
import { generateNumericId } from '@/lib/main'
import TextEditor from './TextEditor'

type AnnotationTypes = TextAnnotation | ImageAnnotation | LineAnnotation

interface PDFKonvaStageProps {
    size: {x: number, y: number};
    pageNo: number
}

export default function PDFKonvaStage({size, pageNo}: PDFKonvaStageProps) {
    const pdf = useContext(PDFContext)
    const textRefs = useRef<{ [key: string]: Konva.Text }>({})
    const imgRefs = useRef<{ [key: string]: Konva.Image }>({})
    const trRef = useRef<Konva.Transformer | null>(null)
    const stageRef = useRef<Konva.Stage | null>(null)
    const layerRef = useRef<Konva.Layer | null>(null)
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [isDrawing, setIsDrawing] = useState<boolean>(false)
    const [imageObjects, setIsImageObjects] = useState<{ [key: string]: HTMLImageElement }>({})
    const annotations: PageAnnotations | undefined= pdf?.annotations[pageNo]
    const textAnnotations: TextAnnotation[] | undefined = annotations?.text
    const imageAnnotations: ImageAnnotation[] | undefined = annotations?.image
    
    const selectedAnnotationId = pdf?.selectedAnnotationId as number

    const text = textAnnotations?.find((text) => text.id == selectedAnnotationId )
    const image = imageAnnotations?.find((image) => image.id == selectedAnnotationId)
    const lines: LineAnnotation[] | undefined = annotations?.line

    const onImageUpload = useCallback((input: HTMLInputElement): void => {
        const files = input?.files;
        if(!files || files.length === 0) return;
        const file = files[0]
        const reader = new FileReader();

        reader.onload = (event) => { 
            const result = event.target?.result;
            if(result) {
                const img = new window.Image();
                img.src = result as string;
                img.onload = () => {
                    const MAX_WIDTH  = 300
                    const MAX_HEIGHT = 300

                    let width = img.width;
                    let height = img.height;
                    
                    if(width > MAX_WIDTH) {
                        const ratio = MAX_WIDTH / width;
                        width = MAX_WIDTH;
                        height = height * ratio
                    }

                    if(height > MAX_HEIGHT) {
                        const ratio = MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                        width = width * ratio
                    }
                   
                    const stageWidth = stageRef.current?.width() || 0;
                    const stageHeight  = stageRef.current?.height() || 0;

                    const newImageAnnotation: ImageAnnotation = {
                        id: generateNumericId(), 
                        x: stageWidth / 2 - width /2,
                        y: stageHeight / 2 - height / 2,
                        scaleX: 1,
                        scaleY: 1,
                        skewX: 0,
                        skewY: 0,
                        width,
                        height,
                        src: result as string
                    }
                    
                    pageNo = pdf? pdf.currPageInView: pageNo;
                    pdf?.addPageAnnotations(pageNo + 1, newImageAnnotation)
                    pdf?.updateSelectedAnnotation(newImageAnnotation.id)
                }
            }
        }
        reader.readAsDataURL(file);
        input.value = ''
    }, [pageNo, pdf])
    
    useEffect(() => {
        if(!imageAnnotations) return 
        console.log(imageAnnotations)
        imageAnnotations.forEach(image => {
            if(imageObjects && !imageObjects[image.id]) {
                const img = new window.Image();
                img.src = image.src;
                img.onload = () => {
                    setIsImageObjects(prev => ({
                        ...prev,
                        [image.id]: img
                    }))
                }
            }
        })
    }, [imageAnnotations, imageObjects])

    useEffect(() => {
        console.log(imageAnnotations)
        if (selectedAnnotationId && trRef.current) {
            const selectedTextNode = textRefs.current[selectedAnnotationId]
            const selectedImgNode = imgRefs.current[selectedAnnotationId]
            if(selectedTextNode) {
                trRef.current.nodes([selectedTextNode])
            } else if(selectedImgNode) {
                trRef.current.nodes([selectedImgNode])
            } else {
                trRef.current.nodes([])
            }
        } else if(trRef.current) {
            trRef.current.nodes([]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selectedAnnotationId, isEditing, annotations])
    
    useEffect(() => {
        if(selectedAnnotationId && text && text.isEditing) {
            setIsEditing(true)
        } else {
            setIsEditing(false)
        }
    }, [selectedAnnotationId, text])
    
    useEffect(() => {
        if(!pdf || !pdf.fileInputRef) return;

        const file = pdf.fileInputRef;
        onImageUpload(file);
        
    }, [pdf, onImageUpload])

    const closeTextEditing = useCallback((): void => {
        if(!annotations) return
        const newTextAnnotation: TextAnnotation | undefined = annotations.text.find((text) => text.id == selectedAnnotationId);
        if(!newTextAnnotation) return
        newTextAnnotation.isEditing = false

        pdf?.updatePageAnnotations(pageNo, selectedAnnotationId, newTextAnnotation)
        setIsEditing(false)
    }, [annotations, pageNo, pdf, selectedAnnotationId])

    const onMouseDown = useCallback((e: KonvaEventObject<MouseEvent>): void => {
        if(!pdf) return
        const mode = pdf.mode;

        // const clickedTarget = stageRef?.current;
        // const clickedOnStage = clickedTarget === clickedTarget?.getStage();
        // const clickedOnEmpty = clickedOnStage || clickedTarget.getClassName() === 'Layer';
        const clickedOnStage = e.target === e.target.getStage();
        const clickedOnEmpty = clickedOnStage || e.target.getClassName() === 'Layer';

        if(clickedOnEmpty && selectedAnnotationId) {
            pdf.updateSelectedAnnotation(null)
            if(text && text.isEditing) closeTextEditing()
            return
        }

        const stage =  e.target.getStage()
        const pos = stage?.getPointerPosition()

        if(clickedOnEmpty && mode == "text") {
            const newTextAnnotation: TextAnnotation = {
                id: generateNumericId(),
                text: "",
                x: pos?.x || 0,
                y: pos?.y || 0,
                fontSize: 16,
                scaleX: 1,
                scaleY: 1,
                skewX: 0,
                skewY: 0,
                width: 100,
                draggable: true,
                visible: true,
                isEditing: true
            }
            pdf.addPageAnnotations(pageNo, newTextAnnotation)
            pdf.updateSelectedAnnotation(newTextAnnotation.id)

        } else if(clickedOnEmpty && mode == "draw") {
            setIsDrawing(true)
            const pos = e.target.getStage()!.getPointerPosition()
            if(pos) {
                pdf.addPageAnnotations(pageNo, { points: [pos.x, pos.y, pos.x, pos.y] })
            }
        }
    }, [pdf, selectedAnnotationId, pageNo, text, closeTextEditing])
    
    const onMouseMove = useCallback((e: KonvaEventObject<MouseEvent>): void => {
        if(!isDrawing || !pdf) return
        
            
        e.evt.preventDefault()

        const stage = e.target.getStage()
        const pos = stage?.getPointerPosition()
        if(pos) {
            const lastLine = lines && lines[lines.length - 1]
            if(lastLine) {
                const newLastLine = [...lastLine.points.concat([pos.x, pos.y])]
                pdf.updatePageAnnotations(pageNo, -1, { points: newLastLine })
            }
        }
    }, [pdf, pageNo, isDrawing, lines])
    
    const onMouseUp = (): void => {
        setIsDrawing(false)
    }
    
    const onTextChange = useCallback((text: string): void => {
        if(!annotations) return
        const newTextAnnotation: TextAnnotation | undefined = annotations.text.find((text) => text.id == selectedAnnotationId);
        if(!newTextAnnotation) return
        newTextAnnotation.text = text
        

        pdf?.updatePageAnnotations(pageNo, selectedAnnotationId, newTextAnnotation)
        setIsEditing(false)
    }, [annotations, pageNo, pdf, selectedAnnotationId])
    

    const handleTextDblClick = (id: number): void => {
        pdf?.updateSelectedAnnotation(id)
        setIsEditing(true)
    }
    
    const onTextClick = (id: number) => {
        if(!pdf) return
        pdf.updateSelectedAnnotation(id);
    };
    
    const onTextTransform = (): void => {
        if(!textRefs.current || !annotations) return

        const node = textRefs.current[selectedAnnotationId]
        const scaleX = node.scaleX()
        const newWidth = node.width() * scaleX

        const newTextAnnotation: TextAnnotation | undefined = annotations.text.find((text) => text.id == selectedAnnotationId);
        if(!newTextAnnotation) return
        newTextAnnotation.width = newWidth

        pdf?.updatePageAnnotations(pageNo, selectedAnnotationId, newTextAnnotation)
        
        node.setAttrs({
            width: newWidth,
            scaleX: 1
        })
    }
    
    return (
        <Stage
            ref={stageRef}
            className="absolute top-0 left-0 z-10"
            width={size.x}
            height={size.y}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
        >
            <Layer
                ref={layerRef}
            >

                {lines?.map((line, i) => {
                    return (
                      <Line
                        key={`line-${i}`}
                        points={line.points}
                        stroke="#df4b26"
                        strokeWidth={5}
                        draggable={true}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                      />
                )})}

                {
                    textAnnotations?.map((txt) => {
                    return (
                        <Text
                            key={ txt.id }
                            id={ `${txt.id}` }
                            text={ txt.text }
                            x={ txt.x }
                            y={ txt.y }
                            fontSize={ txt.fontSize }
                            width={ txt.width }
                            scaleX={ txt.scaleX }
                            scaleY={ txt.scaleY }
                            skewX={ txt.skewX }
                            skewY={ txt.skewY }
                            draggable= { txt.draggable }
                            visible = {
                            isEditing && text && txt.id == text.id?
                            false : true
                            }
                            onDblClick={() => handleTextDblClick(txt.id)}
                            onClick={(e) => {
                                e.cancelBubble = true
                                if(!isEditing) onTextClick(txt.id)
                            }}
                            onTransform={onTextTransform}
                            ref={(node) => {
                                if(node) {
                                    textRefs.current[txt.id] = node
                                }
                            }}
                        />
                        )
                    })
                }
                {
                    imageAnnotations?.map((img) => (
                        imageObjects && imageObjects[img.id] &&
                            (
                            <Image
                                key={ img.id }
                                id={ `${img.id}` }
                                alt="Image Annotations"
                                x={ img.x }
                                y={ img.y }
                                scaleX={ img.scaleX }
                                scaleY={ img.scaleY }
                                skewX={ img.skewX }
                                skewY={ img.skewY }
                                draggable={ true }
                                width={ img.width }
                                height={ img.height }
                                image={imageObjects[img.id]}
                                ref={(node) => {
                                    if(node) {
                                        imgRefs.current[img.id] = node
                                    }
                                }}
                            />
                        )
                    ))
                }
                {isEditing && text && textRefs.current[text.id] &&
                    <Html>
                        <TextEditor
                            textNode={ textRefs.current[text.id]}
                            onClose={closeTextEditing}
                            onTextChange={onTextChange}
                        />
                    </Html>
                }
                
                {!isEditing && selectedAnnotationId &&
                    <Transformer
                        ref={trRef}
                        boundBoxFunc={(oldBox, newBox) => ({
                            ...newBox,
                            width: Math.max(90, newBox.width)
                        })}
                        anchorSize={7}
                        anchorStroke="#1b86d6"
                        anchorFill="#1b86d6"
                        borderStroke="#1b86d6"
                        enabledAnchors={['middle-left', 'middle-right']}
                    />
                }
            </Layer>
        </Stage>
    )
}