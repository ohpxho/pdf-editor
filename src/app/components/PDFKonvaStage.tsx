'use client'

import Konva from 'konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { Stage, Layer, Text, Transformer } from 'react-konva'
import { Html } from 'react-konva-utils'
import { useRef, useEffect, useContext, useState, useCallback } from 'react'
import { Mode, PageAnnotations, TextAnnotation, ImageAnnotation, LineAnnotation } from '../types/types'
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
    const trRef = useRef<Konva.Transformer | null>(null)
    const stageRef = useRef<Konva.Stage | null>(null)
    const layerRef = useRef<Konva.Layer | null>(null)
    const currAnnotation = useRef<AnnotationTypes | undefined>(undefined)
    const [isEditing, setIsEditing] = useState<boolean>(false)
    
    const annotations: PageAnnotations | undefined= pdf?.annotations[pageNo]
    const textAnnotations: TextAnnotation[] | undefined = annotations?.text
    const imageAnnotations: ImageAnnotation[] | undefined = annotations?.image
    const lineAnnotations: LineAnnotation[] | undefined = annotations?.draw
    
    const selectedAnnotationId = pdf?.selectedAnnotationId as number

    const text = textAnnotations?.find((text) => text.id == selectedAnnotationId )
    const image = imageAnnotations?.find((image) => image.id == selectedAnnotationId)
    const line = lineAnnotations?.find((line) => line.id == selectedAnnotationId)

    currAnnotation.current = text || image || line

    useEffect(() => {
        if (selectedAnnotationId && trRef.current) {
            const selectedTextNode = textRefs.current[selectedAnnotationId]
            if(selectedTextNode) {
                trRef.current.nodes([selectedTextNode])
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
        }
    }, [pdf, selectedAnnotationId, pageNo, text, closeTextEditing])
    
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
        >
            <Layer
                ref={layerRef}
            >
                {
                    textAnnotations?.map((text) => {
                    return (
                        <Text
                            key={ text.id }
                            id={ `${text.id}` }
                            text={ text.text }
                            x={ text.x }
                            y={ text.y }
                            fontSize={ text.fontSize }
                            width={ text.width }
                            scaleX={ text.scaleX }
                            scaleY={ text.scaleY }
                            skewX={ text.skewX }
                            skewY={ text.skewY }
                            draggable= { text.draggable }
                            visible = {
                            isEditing && text.id == currAnnotation.current?.id?
                            false : true
                            }
                            onDblClick={() => handleTextDblClick(text.id)}
                            onClick={(e) => {
                                e.cancelBubble = true
                                if(!isEditing) onTextClick(text.id)
                            }}
                            onTransform={onTextTransform}
                            ref={(node) => {
                                if(node) {
                                    textRefs.current[text.id] = node
                                }
                            }}
                        />
                        )
                    })
                }
                {isEditing && currAnnotation.current && textRefs.current[currAnnotation.current.id] &&
                    <Html>
                        <TextEditor
                            textNode={ textRefs.current[currAnnotation.current.id]}
                            onClose={closeTextEditing}
                            onTextChange={onTextChange}
                        />
                    </Html>
                }
                
                {!isEditing && currAnnotation.current &&
                    <Transformer
                        ref={trRef}
                        boundBoxFunc={(oldBox, newBox) => ({
                            ...newBox,
                            width: Math.max(90, newBox.width)
                        })}
                        enabledAnchors={['middle-left', 'middle-right']}
                    />
                }
            </Layer>
        </Stage>
    )
}