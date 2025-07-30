import Konva from "konva";
import { Trash2 } from "lucide-react";

interface TrashProps {
	id: number;
	box: Konva.Transformer;
}

export default function Trash({ id, box }: TrashProps) {
	if (!id || !box) return;

	const boxWidth = box.width();
	const boxHeight = box.height();
	const x = box.x();
	const y = box.y();

	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				width: boxWidth,
				height: boxHeight,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				pointerEvents: "auto",
			}}
		>
			<Trash2 />
		</div>
	);
}
