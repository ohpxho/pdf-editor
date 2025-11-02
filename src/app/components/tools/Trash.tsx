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
        zIndex: 99,
        left: x,
        top: y + boxHeight,
        width: boxWidth,
        height: boxHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      <div className="p-1 cursor-pointer hover:text-white rounded-sm hover:bg-red-500 transition-colors text-gray-500">
        <Trash2 className="h-5 w-5" strokeWidth={1.5} />
      </div>
    </div>
  );
}
