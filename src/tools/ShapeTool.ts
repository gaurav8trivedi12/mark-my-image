import type { FabricObject, TEvent } from "fabric";
import { Canvas, Circle, Rect } from "fabric";
import type { TOriginX, TOriginY } from "fabric";
import type { Dispatch, SetStateAction } from "react";
import type { ShapeType, StrokeType, Tool } from "../context/AnnotationContext";
import { getStrokeDashArray } from "../utils/strokeType";

interface ShapeToolOptions {
  color: string;
  strokeWidth: number;
  strokeType: StrokeType;
  shapeType: ShapeType;
  shapeFill: boolean;
  saveState: () => void;
  setTool: Dispatch<SetStateAction<Tool>>;
  setActiveObject: (obj: FabricObject | null) => void;
  deleteSelected: () => void;
  // cloneSelected: () => void;
}

const ShapeTool = (
  canvas: Canvas,
  {
    color,
    strokeWidth,
    strokeType,
    shapeType,
    shapeFill,
    saveState,
    setTool,
    setActiveObject,
    deleteSelected,
  }: ShapeToolOptions
): (() => void) => {
  let isDrawing = false;
  let startX: number, startY: number;
  let shape: Rect | Circle;

  const onMouseDown = (o: TEvent) => {
    if (!o.e) return;
    isDrawing = true;
    const pointer = canvas.getScenePoint(o.e);
    startX = pointer.x;
    startY = pointer.y;

    const commonOptions = {
      left: startX,
      top: startY,
      originX: "left" as TOriginX,
      originY: "top" as TOriginY,
      fill: shapeFill ? color : "transparent",
      stroke: color,
      strokeWidth: strokeWidth,
      strokeDashArray: shapeFill
        ? undefined
        : getStrokeDashArray(strokeType, strokeWidth),
    };

    if (shapeType === "rect") {
      shape = new Rect({ ...commonOptions, width: 0, height: 0 });
    } else {
      shape = new Circle({ ...commonOptions, radius: 0 });
    }

    canvas.add(shape);
  };

  const onMouseMove = (o: TEvent) => {
    if (!isDrawing || !o.e || !canvas) return;
    const pointer = canvas.getScenePoint(o.e);
    if (!pointer) return;
    const width = pointer.x - startX;
    const height = pointer.y - startY;

    if (shape instanceof Rect) {
      shape.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : startX,
        top: height < 0 ? pointer.y : startY,
      });
    } else if (shape instanceof Circle) {
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2; // Make circle scale uniformly
      const centerX = startX + width / 2;
      const centerY = startY + height / 2;
      shape.set({
        radius: radius,
        left: centerX, // Position based on center
        top: centerY,
        originX: "center" as TOriginX, // Set origin to center for easier radius scaling
        originY: "center" as TOriginY,
      });
    }

    canvas.requestRenderAll();
  };

  const onMouseUp = () => {
    if (!isDrawing || !canvas || !shape) {
      isDrawing = false;
      return;
    }
    isDrawing = false;

    // Prevent tiny shapes
    if ((shape.width ?? 0) < 5 || (shape.height ?? 0) < 5) {
      canvas.remove(shape);
      canvas.renderAll();
      return; // Don't switch tool
    }

    shape.set({ selectable: true, evented: true });

    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveState();
    setTool("select");
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
  };
};

export default ShapeTool;
