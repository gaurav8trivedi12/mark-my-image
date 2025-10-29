import type { TEvent } from "fabric";
import { Canvas, Group, Line, Triangle } from "fabric";
import type { StrokeType } from "../context/AnnotationContext";
import { getStrokeDashArray } from "../utils/strokeType";

interface ArrowToolOptions {
  color: string;
  strokeWidth: number;
  strokeType: StrokeType;
  saveState: () => void;
}

const ArrowTool = (
  canvas: Canvas,
  { color, strokeWidth, strokeType, saveState }: ArrowToolOptions
): (() => void) => {
  let isDrawing = false;
  let line: Line, arrowhead: Triangle;
  let startX: number, startY: number;

  const onMouseDown = (o: TEvent) => {
    if (!o.e) return;
    isDrawing = true;
    const pointer = canvas.getScenePoint(o.e);
    startX = pointer.x;
    startY = pointer.y;

    // v6: Use new class names
    line = new Line([startX, startY, startX, startY], {
      stroke: color,
      strokeWidth: strokeWidth,
      strokeDashArray: getStrokeDashArray(strokeType, strokeWidth),
    });

    arrowhead = new Triangle({
      left: startX,
      top: startY,
      originX: "center",
      originY: "center",
      fill: color,
      width: strokeWidth * 3,
      height: strokeWidth * 3,
      angle: 90,
    });

    canvas.add(line, arrowhead);
  };

  const onMouseMove = (o: TEvent) => {
    if (!isDrawing || !o.e) return;
    const pointer = canvas.getScenePoint(o.e);

    // v6: Deprecated method chaining, call .set() separately
    line.set({ x2: pointer.x, y2: pointer.y });

    const angle =
      Math.atan2(pointer.y - startY, pointer.x - startX) * (180 / Math.PI);

    arrowhead.set({
      left: pointer.x,
      top: pointer.y,
      angle: angle + 90,
    });

    canvas.renderAll();
  };

  const onMouseUp = () => {
    isDrawing = false;
    // v6: Use new Group class
    const arrow = new Group([line, arrowhead]);
    canvas.remove(line, arrowhead);
    canvas.add(arrow);
    saveState();
  };

  canvas.on("mouse:down", onMouseDown);
  canvas.on("mouse:move", onMouseMove);
  canvas.on("mouse:up", onMouseUp);

  return () => {
    canvas.off("mouse:down", onMouseDown);
    canvas.off("mouse:move", onMouseMove);
    canvas.off("mouse:up", onMouseUp);
  };
};

export default ArrowTool;
