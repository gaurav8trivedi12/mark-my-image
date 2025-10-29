import { Canvas, Color, PencilBrush, Shadow } from "fabric";
import type { StrokeType } from "../context/AnnotationContext";
import { getStrokeDashArray } from "../utils/strokeType";

export type PenToolType = "pen" | "highlighter";

interface PenToolOptions {
  type: PenToolType;
  color: string;
  strokeWidth: number;
  strokeType: StrokeType;
  saveState: () => void;
}

const PenTool = (
  canvas: Canvas,
  { type, color, strokeWidth, strokeType, saveState }: PenToolOptions
): (() => void) => {
  canvas.isDrawingMode = true;
  canvas.freeDrawingBrush = new PencilBrush(canvas);

  if (type === "pen") {
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = strokeWidth;
    // Ensure default brush behavior for pen
    canvas.freeDrawingBrush.shadow = null;
    canvas.freeDrawingBrush.strokeLineCap = "round";
    canvas.freeDrawingBrush.strokeDashArray = getStrokeDashArray(
      strokeType,
      strokeWidth
    );
    saveState();
  } else if (type === "highlighter") {
    console.log("Setting up highlighter brush", color);
    const brushColor = new Color(color).setAlpha(0.3).toRgba();
    console.log("Highlighter brush color with alpha:", brushColor);
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = strokeWidth * 3; // Make highlighter thicker
    // Use a blur effect to make it feel more like a highlighter
    canvas.freeDrawingBrush.shadow = new Shadow({
      blur: 10,
      offsetX: 0,
      offsetY: 0,
      affectStroke: true,
      color: brushColor,
    });
    canvas.freeDrawingBrush.strokeLineCap = "square";
    saveState();
  }

  return () => {
    canvas.isDrawingMode = false;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.shadow = null; // Reset shadow on cleanup
    }
  };
};

export default PenTool;
