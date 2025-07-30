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
	draggable: boolean;
	visible: boolean;
	isEditing: boolean;
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
	opacity: number;
	src: string;
}

interface LineAnnotation {
	points: number[];
	stroke: string;
	strokeWidth: number;
	tension: number;
	lineCap: string;
	lineJoin: string;
}

interface LineAnnotationGroup {
	id: number;
	x: number;
	y: number;
	scaleX: number;
	opacity: number;
	scaleY: number;
	rotation: number;
	lines: LineAnnotation[];
}

type Mode = "text" | "draw" | "image" | "sign" | null;

interface Metadata {
	url: string;
	filename: string;
}
interface PageAnnotations {
	text: TextAnnotation[];
	line: LineAnnotationGroup[];
	image: ImageAnnotation[];
	sign: ImageAnnotation[];
}

interface ImageFormat {
	opacity: number;
}

interface LineFormat {
	opacity: number;
	color: string;
	width: number;
}

export type {
	TextAnnotation,
	ImageAnnotation,
	LineAnnotation,
	LineAnnotationGroup,
	PageAnnotations,
	Mode,
	Metadata,
	ImageFormat,
	LineFormat,
};
