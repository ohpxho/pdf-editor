import { useState, useEffect, useContext } from "react";
import { PDFContext } from "@/app/PDFEditor";
import OpacitySlider from "@/components/ui/opacity-slider";
import { ImageAnnotation } from "@/app/types/types";

export default function Image() {
	const pdf = useContext(PDFContext);
	const [opacity, setOpacity] = useState<number>(1);
	const pageNo = pdf?.currPageInView || 1;
	const annotations = pdf?.annotations[pageNo || 0];
	const selectedAnnotationId = pdf?.selectedAnnotationId;
	const imageAnnotations = annotations?.image;

	const image = imageAnnotations?.find(
		(image) => image.id === selectedAnnotationId
	);

	const onChange = (opacity: number): void => {
		if (!pdf) return;

		const newImageFormat = pdf.imageFormat;
		newImageFormat.opacity = opacity;
		pdf.updateImageFormat({ ...newImageFormat });
		setOpacity(opacity);

		if (selectedAnnotationId && image) {
			const newImageAnnotation = image;
			newImageAnnotation.opacity = opacity;
			pdf.updatePageAnnotations(
				pageNo,
				selectedAnnotationId,
				newImageAnnotation
			);
		}
	};

	return (
		<div className="flex flex-col gap-4 p-2 w-full">
			<div>
				<div className="flex items-center justify-between cursor-pointer select-none">
					<span className="font-medium">Opacity</span>
				</div>
				<div className="mt-3 flex flex-col items-center gap-2">
					<OpacitySlider
						opacity={opacity}
						setOpacity={onChange}
						className="w-full text-gray-600"
					/>
				</div>
			</div>
		</div>
	);
}
