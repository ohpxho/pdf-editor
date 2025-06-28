interface TextAnnotation {
    id: number;
    x: number;
    y: number;
    fontSize: number;
    scaleX: number;
    scaleY: number;
    skewX: number;
    width: number;
    skewY: number;
    text: string;
    draggable: boolean,
    visible: boolean,
    isEditing: boolean
}

interface ImageAnnotation {
    id: number;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
    width: number;
    height: number;
    src: string;
}

type LineAnnotation = { points: number[] }

type Mode = "text" | "draw" | "image" | null

interface PageAnnotations {
    text: TextAnnotation[];
    line: LineAnnotation[];
    image: ImageAnnotation[]
}

export type {
    TextAnnotation,
    ImageAnnotation,
    LineAnnotation,
    PageAnnotations,
    Mode
}
