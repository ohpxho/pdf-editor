import { useContext } from "react";
import Sign from "./Sign";
import Line from "./Line";
import Text from "./Text";
import Image from "./Image";
import { PDFContext } from "@/app/PDFEditor";

export default function ToolOptions() {
	const pdf = useContext(PDFContext);
	if (!pdf) return;
	const mode = pdf.mode;

	return (
		<div className="w-62 h-full bg-white border-r border-gray-200 shadow-sm">
			<div className="w-full px-4 py-8">
				{mode == "sign" ? <Sign /> : <></>}
				{mode == "draw" ? <Line /> : <></>}
				{mode == "text" ? <Text /> : <></>}
				{mode == "image" ? <Image /> : <></>}
			</div>
		</div>
	);
}
