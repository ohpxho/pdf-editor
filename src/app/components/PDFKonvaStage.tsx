"use client";

import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import {
  Stage,
  Layer,
  Text,
  Line,
  Image,
  Transformer,
  Group,
  Rect,
} from "react-konva";
import { Html } from "react-konva-utils";
import { useRef, useEffect, useContext, useState, useCallback } from "react";
import {
  PageAnnotations,
  TextAnnotation,
  ImageAnnotation,
  LineAnnotation,
  LineAnnotationGroup,
} from "../types/types";
import { PDFContext } from "../PDFEditor";
import { generateNumericId } from "@/lib/main";
import TextEditor from "./TextEditor";
import Trash from "./tools/Trash";

type AnnotationTypes = TextAnnotation | ImageAnnotation | LineAnnotationGroup;

interface PDFKonvaStageProps {
  size: { x: number; y: number };
  pageNo: number;
}

export default function PDFKonvaStage({ size, pageNo }: PDFKonvaStageProps) {
  const pdf = useContext(PDFContext);
  const textRefs = useRef<{ [key: string]: Konva.Text }>({});
  const imgRefs = useRef<{ [key: string]: Konva.Image }>({});
  const signRefs = useRef<{ [key: string]: Konva.Image }>({});
  const lineGroupRefs = useRef<{ [key: string]: Konva.Group }>({});
  const [lineGroup, setLineGroup] = useState<LineAnnotation[]>([]);
  const trRef = useRef<Konva.Transformer | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [imageObjects, setIsImageObjects] = useState<{
    [key: string]: HTMLImageElement;
  }>({});
  const [signObjects, setSignObjects] = useState<{
    [key: string]: HTMLImageElement;
  }>({});
  const annotations: PageAnnotations | undefined = pdf?.annotations[pageNo];
  const textAnnotations: TextAnnotation[] | undefined = annotations?.text;
  const imageAnnotations: ImageAnnotation[] | undefined = annotations?.image;
  const signAnnotations: ImageAnnotation[] | undefined = annotations?.sign;
  const lineAnnotations: LineAnnotationGroup[] | undefined = annotations?.line;

  const selectedAnnotationId = pdf?.selectedAnnotationId as number;
  const isMouseDown = useRef(false);

  const text = textAnnotations?.find((text) => text.id == selectedAnnotationId);
  const image = imageAnnotations?.find(
    (image) => image.id == selectedAnnotationId,
  );
  const sign = signAnnotations?.find((sign) => sign.id == selectedAnnotationId);
  const lines = lineAnnotations?.find(
    (lines) => lines.id == selectedAnnotationId,
  );

  useEffect(() => {
    if (!pdf) return;
    if (pdf.mode == "draw") return;

    if (lineGroup.length > 0) {
      if (!lineAnnotations) return;
      const opacity = pdf.lineFormat.opacity;
      const newLineGroup = {
        id: generateNumericId(),
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        opacity,
        type: "lines",
        rotation: 0,
        lines: [...lineGroup],
      };
      const type = "lines";
      pdf.addPageAnnotations(pageNo, newLineGroup, type);
      pdf.updateSelectedAnnotation(newLineGroup.id);
      setLineGroup([]);
    }
  }, [lineGroup, pdf, lineAnnotations, pageNo]);

  useEffect(() => {}, [lineAnnotations]);

  const onImageUpload = useCallback(
    (input: HTMLInputElement): void => {
      const files = input?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (result) {
          const img = new window.Image();
          img.src = result as string;
          img.onload = () => {
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
            if (!pdf) return;
            const stageWidth = pdf.stageRef?.width() || 0;
            const stageHeight = pdf.stageRef?.height() || 0;
            const opacity = pdf.imageFormat.opacity;
            const newImageAnnotation: ImageAnnotation = {
              id: generateNumericId(),
              x: stageWidth / 2 - width / 2,
              y: stageHeight / 2 - height / 2,
              scaleX: 1,
              scaleY: 1,
              skewX: 0,
              type: "image",
              skewY: 0,
              opacity: opacity,
              width,
              height,
              src: result as string,
            };

            const pageno = pdf ? pdf.currPageInView : pageNo;
            const type = "image";
            pdf?.addPageAnnotations(pageno + 1, newImageAnnotation, type);
            pdf?.updateSelectedAnnotation(newImageAnnotation.id);
          };
        }
      };
      reader.readAsDataURL(file);
      input.value = "";
      pdf?.clearFileInput();
    },
    [pageNo, pdf],
  );

  useEffect(() => {
    if (!pdf || !pdf.fileInputRef) return;

    const file = pdf.fileInputRef;
    onImageUpload(file);
  }, [pdf, onImageUpload]);

  useEffect(() => {
    if (!imageAnnotations) return;
    imageAnnotations.forEach((image) => {
      if (imageObjects && !imageObjects[image.id]) {
        const img = new window.Image();
        img.src = image.src;
        img.onload = () => {
          setIsImageObjects((prev) => ({
            ...prev,
            [image.id]: img,
          }));
        };
      }
    });
  }, [imageAnnotations, imageObjects, lineAnnotations]);

  useEffect(() => {
    if (!signAnnotations) return;
    signAnnotations.forEach((sign) => {
      if (signObjects && !signObjects[sign.id]) {
        const img = new window.Image();
        img.src = sign.src;
        img.onload = () => {
          setSignObjects((prev) => ({
            ...prev,
            [sign.id]: img,
          }));
        };
      }
    });
  }, [signAnnotations, signObjects]);

  useEffect(() => {
    if (selectedAnnotationId && trRef.current) {
      const selectedTextNode = textRefs.current[selectedAnnotationId];
      const selectedImgNode = imgRefs.current[selectedAnnotationId];
      const selectedSignNode = signRefs.current[selectedAnnotationId];
      const selectedLineGroupNode = lineGroupRefs.current[selectedAnnotationId];
      if (selectedTextNode) {
        trRef.current.nodes([selectedTextNode]);
      } else if (selectedImgNode) {
        trRef.current.nodes([selectedImgNode]);
      } else if (selectedSignNode) {
        trRef.current.nodes([selectedSignNode]);
      } else if (selectedLineGroupNode) {
        trRef.current.nodes([selectedLineGroupNode]);
      } else {
        trRef.current.nodes([]);
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [
    pdf,
    selectedAnnotationId,
    isEditing,
    annotations,
    imageObjects,
    signObjects,
  ]);

  useEffect(() => {
    if (selectedAnnotationId && text && text.isEditing) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [selectedAnnotationId, text]);

  const closeTextEditing = useCallback((): void => {
    if (!annotations) return;
    const newTextAnnotation: TextAnnotation | undefined = annotations.text.find(
      (text) => text.id == selectedAnnotationId,
    );
    if (!newTextAnnotation) return;
    newTextAnnotation.isEditing = false;

    pdf?.updatePageAnnotations(pageNo, selectedAnnotationId, newTextAnnotation);
    setIsEditing(false);
  }, [annotations, pageNo, pdf, selectedAnnotationId]);

  const onMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>): void => {
      if (!pdf) return;
      const mode = pdf.mode;
      setIsEditing(false);
      isMouseDown.current = true;

      // const clickedTarget = stageRef?.current;
      // const clickedOnStage = clickedTarget === clickedTarget?.getStage();
      // const clickedOnEmpty = clickedOnStage || clickedTarget.getClassName() === 'Layer';
      const clickedOnStage = e.target === e.target.getStage();
      const clickedOnEmpty =
        clickedOnStage || e.target.getClassName() === "Layer";

      if (clickedOnEmpty && selectedAnnotationId) {
        pdf.updateSelectedAnnotation(null);
        if (text && text.isEditing) closeTextEditing();
        return;
      }

      if (!clickedOnEmpty) {
        if (!e.target.id()) return;
        console.log(e.target.id());
        pdf.updateSelectedAnnotation(Number(e.target.id()));
        return;
      }

      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();

      if (clickedOnEmpty && mode == "text") {
        const newTextAnnotation: TextAnnotation = {
          id: generateNumericId(),
          text: "",
          x: pos?.x || 0,
          y: pos?.y || 0,
          fontSize: 16,
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          type: "text",
          skewY: 0,
          width: 100,
          draggable: true,
          visible: true,
          isEditing: true,
        };
        const type = "text";
        pdf.addPageAnnotations(pageNo, newTextAnnotation, type);
        pdf.updateSelectedAnnotation(newTextAnnotation.id);
      } else if (clickedOnEmpty && mode == "draw") {
        setIsDrawing(true);
        const pos = e.target.getStage()!.getPointerPosition();
        if (pos) {
          const color = pdf.lineFormat.color;
          const width = pdf.lineFormat.width;
          const newLineAnnotation: LineAnnotation = {
            points: [pos.x, pos.y],
            stroke: color,
            strokeWidth: width,
            tension: 0.5,
            lineCap: "round",
            lineJoin: "round",
          };
          lineGroup.push(newLineAnnotation);
        }
      }
    },
    [pdf, selectedAnnotationId, lineGroup, pageNo, text, closeTextEditing],
  );

  const onMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>): void => {
      if (!pdf) return;
      e.evt.preventDefault();

      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();

      if (pos && isDrawing) {
        const lastLine = lineGroup && lineGroup[lineGroup.length - 1];
        if (lastLine) {
          const newLastLine = [...lastLine.points.concat([pos.x, pos.y])];
          const newLineGroup = [
            ...lineGroup.slice(0, -1),
            { ...lastLine, points: newLastLine },
          ];
          setLineGroup([...newLineGroup]);
        }
      }

      if (pos && isMouseDown.current && !isDrawing) {
        if (selectedAnnotationId) {
          console.log(text);
        }
      }
    },
    [pdf, lineGroup, isDrawing],
  );

  const onMouseUp = (): void => {
    setIsDrawing(false);
    isMouseDown.current = false;
  };

  const onTextChange = useCallback(
    (text: string): void => {
      if (!annotations) return;
      const newTextAnnotation: TextAnnotation | undefined =
        annotations.text.find((text) => text.id == selectedAnnotationId);
      if (!newTextAnnotation) return;
      newTextAnnotation.text = text;

      pdf?.updatePageAnnotations(
        pageNo,
        selectedAnnotationId,
        newTextAnnotation,
      );
      setIsEditing(false);
    },
    [annotations, pageNo, pdf, selectedAnnotationId],
  );

  const handleTextDblClick = (id: number): void => {
    pdf?.updateSelectedAnnotation(id);
    setIsEditing(true);
  };

  const onAnnotationClick = (id: number, type: string): void => {
    if (!pdf) return;
    pdf.updateSelectedAnnotation(id);
  };

  const onTextTransform = (): void => {
    if (!textRefs.current || !annotations) return;

    const node = textRefs.current[selectedAnnotationId];
    const scaleX = node.scaleX();
    const newWidth = node.width() * scaleX;
    const newSkewX = node.skewX();
    const newSkewY = node.skewY();

    const newTextAnnotation: TextAnnotation | undefined = annotations.text.find(
      (text) => text.id == selectedAnnotationId,
    );
    if (!newTextAnnotation) return;
    newTextAnnotation.width = newWidth;
    newTextAnnotation.skewX = newSkewX;
    newTextAnnotation.skewY = newSkewY;

    pdf?.updatePageAnnotations(pageNo, selectedAnnotationId, newTextAnnotation);

    node.setAttrs({
      width: newWidth,
      scaleX: 1,
      skewX: newSkewX,
      skewY: newSkewY,
    });
  };

  const onImageTransform = (): void => {
    if (!imgRefs.current || !annotations) return;

    const node = imgRefs.current[selectedAnnotationId];
    const newScaleX = node.scaleX();
    const newScaleY = node.scaleY();
    const newSkewX = node.skewX();
    const newSkewY = node.skewY();

    const newImageAnnotation = image;
    if (!newImageAnnotation) return;
    newImageAnnotation.scaleX = newScaleX;
    newImageAnnotation.scaleY = newScaleY;
    newImageAnnotation.skewX = newSkewX;
    newImageAnnotation.skewY = newSkewY;

    pdf?.updatePageAnnotations(
      pageNo,
      selectedAnnotationId,
      newImageAnnotation,
    );
    node.setAttrs({
      scaleX: newScaleX,
      scaleY: newScaleY,
      skewX: newSkewX,
      skewY: newSkewY,
    });
  };

  const onSignTransform = (): void => {
    if (!signRefs.current || !annotations) return;

    const node = signRefs.current[selectedAnnotationId];
    const newScaleX = node.scaleX();
    const newScaleY = node.scaleY();
    const newSkewX = node.skewX();
    const newSkewY = node.skewY();

    const newSignAnnotation = sign;
    if (!newSignAnnotation) return;
    newSignAnnotation.scaleX = newScaleX;
    newSignAnnotation.scaleY = newScaleY;
    newSignAnnotation.skewX = newSkewX;
    newSignAnnotation.skewY = newSkewY;

    pdf?.updatePageAnnotations(pageNo, selectedAnnotationId, newSignAnnotation);
    node.setAttrs({
      scaleX: newScaleX,
      scaleY: newScaleY,
      skewX: newSkewX,
      skewY: newSkewY,
    });
  };

  const onLineGroupTransform = (): void => {
    if (!lineGroupRefs.current || !annotations) return;

    const node = lineGroupRefs.current[selectedAnnotationId];
    const newScaleX = node.scaleX();
    const newScaleY = node.scaleY();
    const newRotation = node.rotation();

    const newLineGroupAnnotation = lines;
    if (!newLineGroupAnnotation) return;

    newLineGroupAnnotation.scaleX = newScaleX;
    newLineGroupAnnotation.scaleY = newScaleY;
    newLineGroupAnnotation.rotation = newRotation;

    pdf?.updatePageAnnotations(
      pageNo,
      selectedAnnotationId,
      newLineGroupAnnotation,
    );
    node.setAttrs({
      scaleX: newScaleX,
      scaleY: newScaleY,
      rotation: newRotation,
    });
  };

  return (
    <div>
      {selectedAnnotationId && trRef.current && (
        <Trash box={trRef.current} id={selectedAnnotationId} />
      )}

      <Stage
        ref={(node) => {
          if (node) {
            if (!pdf) return;
            pdf.stageRef = node;
          }
        }}
        className="absolute top-0 left-0 z-10"
        width={size.x}
        height={size.y}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <Layer ref={layerRef}>
          {lineGroup &&
            lineGroup.map((line, i) => {
              return (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  opacity={pdf?.lineFormat.opacity}
                  tension={line.tension}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            })}

          {lineAnnotations?.map((lines) => {
            return (
              <Group
                key={lines.id}
                id={`${lines.id}`}
                x={lines.x}
                y={lines.y}
                scaleX={lines.scaleX}
                scaleY={lines.scaleY}
                rotation={lines.rotation}
                opacity={lines.opacity}
                draggable={true}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onAnnotationClick(lines.id, "lines");
                }}
                onTransform={onLineGroupTransform}
                ref={(node) => {
                  if (!node) return;
                  lineGroupRefs.current[lines.id] = node;
                }}
              >
                {(() => {
                  let minX = Infinity,
                    minY = Infinity,
                    maxX = -Infinity,
                    maxY = -Infinity;
                  lines.lines.forEach((line) => {
                    for (let i = 0; i < line.points.length; i += 2) {
                      const x = line.points[i];
                      const y = line.points[i + 1];
                      if (x < minX) minX = x;
                      if (y < minY) minY = y;
                      if (x > maxX) maxX = x;
                      if (y > maxY) maxY = y;
                    }
                  });
                  if (
                    !isFinite(minX) ||
                    !isFinite(minY) ||
                    !isFinite(maxX) ||
                    !isFinite(maxY)
                  ) {
                    minX = 0;
                    minY = 0;
                    maxX = 1;
                    maxY = 1;
                  }
                  const width = maxX - minX;
                  const height = maxY - minY;
                  return (
                    <Rect
                      x={minX}
                      y={minY}
                      id={`${lines.id}`}
                      width={width}
                      height={height}
                      fill="transparent"
                      listening={true}
                      hitStrokeWidth={10}
                    />
                  );
                })()}

                {lines.lines.map((line, i) => {
                  return (
                    <Line
                      key={i}
                      id={`${lines.id}`}
                      points={line.points}
                      stroke={line.stroke}
                      strokeWidth={line.strokeWidth}
                      tension={line.tension}
                      lineCap={line.lineCap as "round"}
                      lineJoin={line?.lineJoin as "round"}
                    />
                  );
                })}
              </Group>
            );
          })}

          {textAnnotations?.map((txt) => {
            return (
              <Text
                key={txt.id}
                id={`${txt.id}`}
                text={txt.text}
                x={txt.x}
                y={txt.y}
                fontSize={txt.fontSize}
                width={txt.width}
                scaleX={txt.scaleX}
                scaleY={txt.scaleY}
                skewX={txt.skewX}
                skewY={txt.skewY}
                draggable={txt.draggable}
                visible={isEditing && text && txt.id == text.id ? false : true}
                onDblClick={() => handleTextDblClick(txt.id)}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (!isEditing) onAnnotationClick(txt.id, "text");
                }}
                onTransform={onTextTransform}
                ref={(node) => {
                  if (node) {
                    textRefs.current[txt.id] = node;
                  }
                }}
              />
            );
          })}
          {imageAnnotations?.map(
            (img) =>
              imageObjects &&
              imageObjects[img.id] && (
                <Image
                  key={img.id}
                  id={`${img.id}`}
                  alt="Image Annotations"
                  x={img.x}
                  y={img.y}
                  scaleX={img.scaleX}
                  scaleY={img.scaleY}
                  skewX={img.skewX}
                  skewY={img.skewY}
                  draggable={true}
                  width={img.width}
                  height={img.height}
                  image={imageObjects[img.id]}
                  opacity={img.opacity}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    if (!isEditing) onAnnotationClick(img.id, "image");
                  }}
                  onTransform={onImageTransform}
                  ref={(node) => {
                    if (node) {
                      imgRefs.current[img.id] = node;
                    }
                  }}
                />
              ),
          )}
          {signAnnotations?.map(
            (sign) =>
              signObjects &&
              signObjects[sign.id] && (
                <Image
                  key={sign.id}
                  id={`${sign.id}`}
                  alt="Sign Annotations"
                  x={sign.x}
                  y={sign.y}
                  scaleX={sign.scaleX}
                  scaleY={sign.scaleY}
                  skewX={sign.skewX}
                  skewY={sign.skewY}
                  draggable={true}
                  width={sign.width}
                  height={sign.height}
                  image={signObjects[sign.id]}
                  opacity={sign.opacity}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    if (!isEditing) onAnnotationClick(sign.id, "sign");
                  }}
                  onTransform={onSignTransform}
                  ref={(node) => {
                    if (node) {
                      signRefs.current[sign.id] = node;
                    }
                  }}
                />
              ),
          )}
          {isEditing && text && textRefs.current[text.id] && (
            <Html>
              <TextEditor
                textNode={textRefs.current[text.id]}
                onClose={closeTextEditing}
                onTextChange={onTextChange}
              />
            </Html>
          )}

          {!isEditing && selectedAnnotationId && text && (
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => ({
                ...newBox,
                width: newBox.width,
              })}
              anchorSize={7}
              anchorStroke="#1b86d6"
              anchorFill="#1b86d6"
              borderStroke="#1b86d6"
              enabledAnchors={["middle-left", "middle-right"]}
            />
          )}

          {selectedAnnotationId && (image || sign || lines) && (
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => ({
                ...newBox,
                width: newBox.width,
              })}
              anchorSize={7}
              anchorStroke="#1b86d6"
              anchorFill="#1b86d6"
              borderStroke="#1b86d6"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
