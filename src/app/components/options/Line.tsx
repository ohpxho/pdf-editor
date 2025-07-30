import { useState, useContext } from "react";
import { PDFContext } from "@/app/PDFEditor";
import ColorPicker from "@/components/ui/color-picker";
import OpacitySlider from "@/components/ui/opacity-slider";
import PenWeightSlider from "@/components/ui/pen-weight-slider";

export default function Line() {
	const pdf = useContext(PDFContext);
	const [color, setColor] = useState<string>("#000000");
	const [width, setWidth] = useState<number>(1);
	const [opacity, setOpacity] = useState<number>(1);
	const pageNo = pdf?.currPageInView || 1;
	const annotations = pdf?.annotations[pageNo || 0];
	const selectedAnnotationId = pdf?.selectedAnnotationId;
	const lineGroupAnnotations = annotations?.line;

	const lineGroup = lineGroupAnnotations?.find(
		(lines) => lines.id === selectedAnnotationId
	);

	const onColorChange = (color: string): void => {
		if (!pdf) return;

		if (selectedAnnotationId && lineGroup) {
			const newLineGroup = { ...lineGroup };
			newLineGroup.lines.map((line) => {
				return (line.stroke = color);
			});

			pdf.updatePageAnnotations(pageNo, selectedAnnotationId, newLineGroup);
		}

		const newLineFormat = { ...pdf.lineFormat };
		newLineFormat.color = color;
		pdf.updateLineFormat(newLineFormat);
		setColor(color);
	};

	const onOpacityChange = (opacity: number): void => {
		if (!pdf) return;

		if (selectedAnnotationId && lineGroup) {
			const newLineGroup = { ...lineGroup };
			newLineGroup.opacity = opacity;
			pdf.updatePageAnnotations(pageNo, selectedAnnotationId, newLineGroup);
		}

		const newLineFormat = { ...pdf.lineFormat };
		newLineFormat.opacity = opacity;
		pdf.updateLineFormat(newLineFormat);
		setOpacity(opacity);
	};

	const onWidthChange = (width: number): void => {
		if (!pdf) return;

		if (selectedAnnotationId && lineGroup) {
			const newLineGroup = { ...lineGroup };
			newLineGroup.lines.map((line) => {
				return (line.strokeWidth = width);
			});
			pdf.updatePageAnnotations(pageNo, selectedAnnotationId, newLineGroup);
		}

		const newLineFormat = { ...pdf.lineFormat };
		newLineFormat.width = width;
		pdf.updateLineFormat(newLineFormat);
		setWidth(width);
	};

	return (
		<div className="flex flex-col gap-8">
			<div>
				<div className="flex items-center justify-between cursor-pointer select-none">
					<span className="font-medium">Format</span>
				</div>
				<div className="mt-3 flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<ColorPicker color={color} setColor={onColorChange} />
					</div>
					<div className="flex items-center gap-2">
						<PenWeightSlider
							strokeWidth={width}
							setStrokeWidth={onWidthChange}
						/>
					</div>
				</div>
			</div>
			<div>
				<div className="flex items-center justify-between cursor-pointer select-none">
					<span className="font-medium">Opacity</span>
				</div>
				<div className="mt-3 flex items-center gap-2">
					<OpacitySlider
						opacity={opacity}
						setOpacity={onOpacityChange}
						className="w-full"
					/>
				</div>
			</div>
		</div>
	);
}
