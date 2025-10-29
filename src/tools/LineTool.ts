import type { TEvent } from "fabric";
import { Canvas, Line } from "fabric";
import type { Dispatch, SetStateAction } from "react";
import type { StrokeType, Tool } from "../context/AnnotationContext";
import { getStrokeDashArray } from "../utils/strokeType";

interface LineToolOptions {
  color: string;
  strokeWidth: number;
  strokeType: StrokeType;
  saveState: () => void;
  setTool: Dispatch<SetStateAction<Tool>>;
}

const LineTool = (
  canvas: Canvas,
  { color, strokeWidth, strokeType, saveState, setTool }: LineToolOptions
): (() => void) => {
  let isDrawing = false;
  let line: Line | null = null;
  let startX: number, startY: number;

  const onMouseDown = (o: TEvent) => {
    if (!o.e || !canvas) return;
    isDrawing = true;
    const pointer = canvas.getScenePoint(o.e);
    if (!pointer) return;
    startX = pointer.x;
    startY = pointer.y;

    line = new Line([startX, startY, startX, startY], {
      stroke: color,
      strokeWidth: strokeWidth,
      strokeDashArray: getStrokeDashArray(strokeType, strokeWidth),
      selectable: false,
      evented: false,
    });

    canvas.add(line);
  };

  const onMouseMove = (o: TEvent) => {
    if (!isDrawing || !o.e || !canvas || !line) return;
    const pointer = canvas.getScenePoint(o.e);
    if (!pointer) return;

    line.set({ x2: pointer.x, y2: pointer.y });
    canvas.requestRenderAll();
  };

  const onMouseUp = () => {
    if (!isDrawing || !canvas || !line) {
      isDrawing = false;
      return;
    }
    isDrawing = false;

    // Prevent tiny lines
    if (
      Math.abs((line.x1 ?? 0) - (line.x2 ?? 0)) < 5 &&
      Math.abs((line.y1 ?? 0) - (line.y2 ?? 0)) < 5
    ) {
      canvas.remove(line);
      line = null;
      canvas.renderAll();
      return; // Don't switch tool
    }

    line.set({
      selectable: true,
      evented: true,
      strokeDashArray: getStrokeDashArray(strokeType, strokeWidth),
    });
    canvas.setActiveObject(line); // Select the new line
    canvas.renderAll();
    saveState();
    setTool("select");
    line = null; // Clear reference
  };

  canvas.selection = false;
  canvas.forEachObject((obj) => {
    obj.selectable = false;
    obj.evented = false;
  });

  canvas.on("mouse:down", onMouseDown);
  canvas.on("mouse:move", onMouseMove);
  canvas.on("mouse:up", onMouseUp);

  return () => {
    canvas.off("mouse:down", onMouseDown);
    canvas.off("mouse:move", onMouseMove);
    canvas.off("mouse:up", onMouseUp);
    if (line) {
      // Remove line if tool is switched mid-draw
      canvas.remove(line);
    }
    if (canvas) {
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    }
  };
};

export default LineTool;
