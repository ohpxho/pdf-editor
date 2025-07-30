"use client";

import { useEffect, useState, useContext } from "react";
import { PDFContext } from "../PDFEditor";
import { pdfjs, Document, Page } from "react-pdf";
import { Plus } from "lucide-react";

const options = {
	cMapUrl: "/cmaps/",
	standardFontDataUrl: "/standard_fonts/",
};

export default function Preview() {
	const pdf = useContext(PDFContext);
	const [numPages, setNumPages] = useState<number>(0);
	const [pageHeights, setPageHeights] = useState<number[]>([]);
	const pageWidth = 120;

	const onDocumentLoadSuccess = ({
		numPages: numPages,
	}: {
		numPages: number;
	}): void => {
		setNumPages(numPages);
	};

	const onClickPreview = (index: number) => {
		document.getElementById(`page_${index + 1}`)?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
	};

	function onPageLoadSuccess({
		pageNumber,
		width,
		height,
	}: {
		pageNumber: number;
		width: number;
		height: number;
	}): void {
		const scale = pageWidth / width;
		const scaledHeight = height * scale;

		setPageHeights((prev) => {
			const newHeights = [...prev];
			newHeights[pageNumber - 1] = scaledHeight;
			return newHeights;
		});

		if (!pdf) return;
		pdf.initNewPageAnnotation();
	}

	return (
		<div className="w-48 relative h-full bg-white border-r border-gray-200 shadow-sm overflow-y-scroll pb-4">
			<div className="p-4 border-b w-full border-gray-200 flex items-center justify-between">
				<div className="text-sm font-bold text-gray-700">
					<span>
						{pdf ? pdf.currPageInView + 1 : 0} of {numPages}{" "}
						<span className="font-normal">
							{numPages === 1 ? "page" : "pages"}
						</span>
					</span>
				</div>
				<button
					className="text-black rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:text-gray-400 disabled:cursor-not-allowed p-1"
					disabled={true}
				>
					<Plus />
				</button>
			</div>
			<div className="relative p-4 ">
				<div className="relative">
					<Document
						className="relative flex flex-col gap-4 bg-transparent w-full"
						file={pdf?.metadata.url}
						onLoadSuccess={onDocumentLoadSuccess}
						options={options}
					>
						{Array.from(new Array(numPages), (_el, index) => {
							return (
								<div
									key={`preview_${index + 1}`}
									id={`preview_${index + 1}`}
									className={`relative p-2 w-fit ${
										pdf && pdf.currPageInView == index && "bg-blue-100"
									} rounded-sm cursor-pointer`}
									onClick={() => onClickPreview(index)}
								>
									<Page
										className={`relative w-fit border-2 ${
											pdf && pdf.currPageInView == index
												? "border-blue-600"
												: "border-gray-300 hover:border-blue-600"
										} transition-colors`}
										pageNumber={index + 1}
										width={pageWidth}
										onLoadSuccess={onPageLoadSuccess}
									/>
									<div
										className={`relative text-xs ${
											pdf && pdf.currPageInView == index
												? "text-blue-600"
												: "text-gray-500"
										} font-medium mt-1`}
									>
										Page {index + 1}
									</div>
								</div>
							);
						})}
					</Document>
				</div>
			</div>
		</div>
	);
}
