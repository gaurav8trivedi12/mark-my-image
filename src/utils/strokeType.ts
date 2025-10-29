import type { StrokeType } from "../context/AnnotationContext";

export const getStrokeDashArray = (
  type: StrokeType,
  width: number
): number[] | null => {
  if (type === "dashed") {
    return [width * 2, width * 2]; // Adjust dash/gap length based on width
  }
  if (type === "dotted") {
    return [width / 2, width * 1.5]; // Smaller dash, larger gap for dots
  }
  return null; // Solid line
};
