import { useEffect } from "react";
import { useAnnotation } from "../context/AnnotationContext";
import ArrowTool from "../tools/ArrowTool";
import BlurTool from "../tools/BlurTool";
import LineTool from "../tools/LineTool";
import PenTool from "../tools/PenTool";
import ShapeTool from "../tools/ShapeTool";
import TextTool from "../tools/TextTool";

export const useAnnotationTools = () => {
  const {
    canvasRef,
    isCanvasReady,
    tool,
    lineType,
    color,
    strokeWidth,
    shapeType,
    shapeFill,
    saveState,
    setTool,
    strokeType,
    backgroundImageRef,
    setActiveObject,
    deleteSelected,
    // cloneSelected,
  } = useAnnotation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isCanvasReady || !canvas) {
      return;
    }

    // This will hold the cleanup function returned by each tool
    let cleanup: (() => void) | undefined;

    // Always reset canvas state before activating a new tool
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.forEachObject((obj: any) => {
      obj.selectable = false;
      obj.evented = false;
    });

    switch (tool) {
      case "pen":
        cleanup = PenTool(canvas, {
          type: "pen",
          color,
          strokeWidth,
          strokeType,
          saveState,
        });
        break;
      case "highlighter":
        // Highlighters are solid, so we don't need strokeType here, but pass anyway for consistency
        cleanup = PenTool(canvas, {
          type: "highlighter",
          color,
          strokeWidth,
          strokeType: "solid",
          saveState,
        });
        break;
      case "blur":
        cleanup = BlurTool(canvas, { saveState, setTool, backgroundImageRef });
        break;
      case "shape":
        cleanup = ShapeTool(canvas, {
          color,
          strokeWidth,
          strokeType,
          shapeType,
          shapeFill,
          saveState,
          setTool,
          setActiveObject,
          deleteSelected,
        });
        break;
      case "text":
        cleanup = TextTool(canvas, { color, saveState, setTool });
        break;
      case "line":
        if (lineType === "arrow") {
          console.log(
            "useAnnotationTools: Activating Arrow Tool (via line tool group)..."
          );
          cleanup = ArrowTool(canvas, {
            color,
            strokeWidth,
            strokeType,
            saveState,
          });
        } else {
          // lineType === 'line'
          console.log(
            "useAnnotationTools: Activating Line Tool (via line tool group)..."
          );
          cleanup = LineTool(canvas, {
            color,
            strokeWidth,
            strokeType,
            saveState,
            setTool,
          });
        }
        break;
      case "select":
        canvas.selection = true;
        canvas.forEachObject((obj: any) => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;
      default:
        break;
    }

    // Return the cleanup function to be called when the tool changes
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [
    isCanvasReady,
    tool,
    lineType,
    color,
    strokeWidth,
    strokeType,
    shapeType,
    shapeFill,
    saveState,
    setTool,
    canvasRef,
  ]);
};
