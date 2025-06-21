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
   
    useEffect(() => {
        console.log(pdf)
        const selectedAnnotationId = pdf?.selectedAnnotationId
        if (selectedAnnotationId  && trRef.current) {
            
            const selectedTextNode = textRefs.current[selectedAnnotationId]
            
            if(selectedTextNode) {
                trRef.current.nodes([selectedTextNode])
            }
            
        } else if(trRef.current) {
            trRef.current.nodes([]);
            trRef.current.getLayer()?.batchDraw();
        }

        
    }, [pdf])

    //set the currAnnotation ref value when there is a selected annotation
    useEffect(() => {
        if(!pdf) return
        const selectedAnnotationId = pdf.selectedAnnotationId

        if(!selectedAnnotationId) return;

        const text = textAnnotations?.find((text) => text.id == selectedAnnotationId )
        const image = imageAnnotations?.find((image) => image.id == selectedAnnotationId)
        const line = lineAnnotations?.find((line) => line.id == selectedAnnotationId)

        currAnnotation.current = text || image || line
        console.log(pageNo)
        console.log(annotations)
        console.log(text)
        console.log(image)
        console.log(line)
        console.log(currAnnotation)
    }, [pdf, currAnnotation, textAnnotations, imageAnnotations, lineAnnotations])

    const onMouseDown = useCallback((e: KonvaEventObject<MouseEvent>): void => {
        if(!pdf) return
        const mode = pdf.mode;

        const clickedTarget = stageRef?.current;
        const clickedOnStage = clickedTarget === clickedTarget?.getStage();
        const clickedOnEmpty = clickedOnStage || clickedTarget?.getClassName() === 'Layer';

        if(clickedOnEmpty) {
            pdf.updateSelectedAnnotation(null)
        }

        const stage =  e.target.getStage()
        const layer = stage?.getLayer()
        const pos = stage?.getPointerPosition()

        if(mode == "text") {
            const newTextAnnotation: TextAnnotation = {
                id: generateNumericId(),
                text: "test",
                x: pos?.x || 0,
                y: pos?.y || 0,
                fontSize: 16,
                scaleX: 0,
                scaleY: 0,
                skewX: 0,
                skewY: 0,
                width: 100,
                draggable: true,
                visible: true
            }
            
            pdf.addPageAnnotations(pageNo, newTextAnnotation)
            pdf.updateSelectedAnnotation(newTextAnnotation.id)
            // setIsEditing(true)

        }
    }, [pdf, pageNo])
    
       const handleTextDblClick = (id: number): void => {
        pdf?.updateSelectedAnnotation(id)
        setIsEditing(true)
    }
    
    const closeTextEditing = useCallback((): void => {
        pdf?.updateSelectedAnnotation(null)
        setIsEditing(false)
    }, [pdf])
    

    return (
        <Stage
            ref={stageRef}
            className="absolute top-0 left-0 z-10 bg-gray-400"
            width={size.x}
            height={size.y}
            onMouseDown={onMouseDown}
        >
            <Layer
                ref={layerRef}
            >
                {
                    textAnnotations?.map((text) => {
                        console.log(text.width, " width")
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
                            visible = { text.visible }
                            onDblClick={() => handleTextDblClick(text.id)}
                            ref={(node) => {
                                if(node) {
                                    textRefs.current[text.id] = node
                                }
                            }}
                        />
                        )
                    })
                }

                {isEditing && currAnnotation.current &&
                    <TextEditor
                        textNode={ textRefs.current[currAnnotation.current.id]}
                    />
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