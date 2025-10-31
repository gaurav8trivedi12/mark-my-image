// annotation-lib/src/context/AnnotationContext.tsx

import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Canvas, Color, FabricImage, FabricObject, Path, Shadow } from "fabric";
import { tailwindColors } from "../utils/tailwindColorsv3";

export type Tool =
  | "select"
  | "pen"
  | "highlighter"
  | "line"
  | "shape"
  | "text"
  | "blur";

export type ShapeType = "rect" | "circle";
export type StrokeType = "solid" | "dashed" | "dotted";
export type LineType = "line" | "arrow";
export type ExportFormat = "png" | "jpeg" | "svg";

interface AnnotationContextType {
  canvasRef: RefObject<Canvas | null>;
  isCanvasReady: boolean;
  setCanvas: (canvas: Canvas | null) => void;
  tool: Tool;
  setTool: Dispatch<SetStateAction<Tool>>;
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
  strokeWidth: number;
  setStrokeWidth: Dispatch<SetStateAction<number>>;
  strokeType: StrokeType;
  setStrokeType: Dispatch<SetStateAction<StrokeType>>;
  shapeType: ShapeType;
  setShapeType: Dispatch<SetStateAction<ShapeType>>;
  activeObject: FabricObject | null;
  setActiveObject: Dispatch<SetStateAction<FabricObject | null>>;
  saveState: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  deleteSelected: () => void;
  // cloneSelected: () => void;
  canUndo: boolean;
  canRedo: boolean;
  blurIntensity: number;
  setBlurIntensity: Dispatch<SetStateAction<number>>;
  backgroundImageRef: RefObject<FabricImage | null>;
  shapeFill: boolean;
  setShapeFill: Dispatch<SetStateAction<boolean>>;
  lineType: LineType;
  setLineType: Dispatch<SetStateAction<LineType>>;
  exportCanvas: (format: ExportFormat, options?: any) => void;
}

const AnnotationContext = createContext<AnnotationContextType | null>(null);

interface AnnotationProviderProps {
  children: ReactNode;
}

export const AnnotationProvider = ({ children }: AnnotationProviderProps) => {
  const canvasRef = useRef<Canvas | null>(null);
  const [isCanvasReady, setCanvasReady] = useState(false);
  const [tool, setTool] = useState<Tool>("select");
  const [lineType, setLineType] = useState<LineType>("line");
  const [color, setColor] = useState(tailwindColors.red[600]);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [strokeType, setStrokeType] = useState<StrokeType>("solid");
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [shapeFill, setShapeFill] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [activeObject, setActiveObject] = useState<FabricObject | null>(null);
  const [blurIntensity, setBlurIntensity] = useState<number>(0.2);

  const backgroundImageRef = useRef<FabricImage | null>(null);

  const setCanvas = useCallback((canvas: Canvas | null) => {
    canvasRef.current = canvas;
    setCanvasReady(!!canvas);
  }, []);

  const saveState = useCallback(() => {
    if (canvasRef.current) {
      const json = canvasRef.current.toObject(["backgroundImage"]);
      setUndoStack((prev) => [...prev, json]);
      setRedoStack([]);
    }
  }, [canvasRef]);

  const restoreState = useCallback(
    async (stateToRestore: any) => {
      const canvas = canvasRef.current;
      if (!canvas || !stateToRestore) return;

      const stateCopy = JSON.parse(JSON.stringify(stateToRestore));
      const bgImageJson = stateCopy.backgroundImage;
      delete stateCopy.backgroundImage;

      canvas.clear();
      // v6: loadFromJSON is promise-based
      await canvas.loadFromJSON(stateCopy);

      if (bgImageJson && bgImageJson.src) {
        // v6: Image.fromURL is promise-based
        const img = await FabricImage.fromURL(bgImageJson.src, {
          crossOrigin: "anonymous",
        });
        canvas.backgroundImage = img;
        img.set({
          scaleX: bgImageJson.scaleX,
          scaleY: bgImageJson.scaleY,
        });
      } else {
        canvas.backgroundImage = undefined;
      }
      canvas.renderAll();
    },
    [canvasRef]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length > 1) {
      const newUndoStack = undoStack.slice(0, -1);
      const stateToRestore = newUndoStack[newUndoStack.length - 1];
      const lastState = undoStack[undoStack.length - 1];
      setUndoStack(newUndoStack);
      setRedoStack((prev) => [lastState, ...prev]);
      restoreState(stateToRestore);
    }
  }, [undoStack, restoreState]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const stateToRestore = redoStack[0];
      const newRedoStack = redoStack.slice(1);
      setRedoStack(newRedoStack);
      setUndoStack((prev) => [...prev, stateToRestore]);
      restoreState(stateToRestore);
    }
  }, [redoStack, restoreState]);

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getActiveObject()) return;
    canvas
      .getActiveObjects()
      .forEach((obj: FabricObject) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    saveState();
  }, [canvasRef, saveState]);

  /**
   * clone selected object on canvas
   * improve this function later
   */
  //   const _cloneSelected = useCallback(() => {
  //     const canvas = canvasRef.current;
  //     const currentActiveObject = activeObject; // Use state for active object
  //     if (!canvas || !currentActiveObject) return;
  //     console.log("Cloning object:", currentActiveObject);

  //     // Clone the active object (works for single or ActiveSelection group)
  //     currentActiveObject.clone().then((clonedObj: FabricObject | null) => {
  //         if (!clonedObj) return;
  //         console.log("Cloned object created:", clonedObj);

  //         canvas.discardActiveObject(); // Deselect original

  //     const controlsForClone = createControls(deleteSelected, cloneSelected);

  //         // Offset the clone slightly
  //         clonedObj.set({
  //             left: (clonedObj.left ?? 0) + 10,
  //             top: (clonedObj.top ?? 0) + 10,
  //             evented: true, // Ensure clone is interactive
  //             selectable: true,
  //             // IMPORTANT: Re-apply custom controls to the clone
  //             controls: controlsForClone,
  //         });

  //         // Handle cloning ActiveSelection (multi-select group)
  //         if (clonedObj.type === 'activeSelection' && clonedObj instanceof ActiveSelection) {
  //           console.log("Cloned object is an ActiveSelection, adding individual objects to canvas.");
  //             clonedObj.canvas = canvas;
  //             clonedObj.forEachObject((obj) => {
  //                 // Re-apply controls to individual objects within the cloned group if needed
  //                 obj.controls = controlsForClone;
  //                 canvas.add(obj);
  //             });
  //             // Mark object for decomposition on deselect
  //              clonedObj.setCoords();
  //         } else {
  //             // Single object clone
  //             canvas.add(clonedObj);
  //         }

  //         setActiveObject(clonedObj); // Select the clone(s)
  //         canvas.requestRenderAll();
  //         saveState(); // Save state after cloning
  // console.log("Clone added to canvas and state saved.");
  //     }).catch((err: any) => {
  //         console.error("Error cloning object:", err);
  //     });
  //   }, [activeObject, saveState]);

  const exportCanvas = useCallback(
    (format: ExportFormat, options: any = {}) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Export failed: Canvas not available.");
        return;
      }

      let dataUrlOrSvg: string;
      let filename = `annotation.${format}`;
      const originalHighlighterProps: {
        obj: FabricObject;
        props: { stroke?: string; shadow?: Shadow | null };
      }[] = [];
      try {
        if (format === "svg") {
          // --- SVG Highlighter Preprocessing ---
          canvas.getObjects().forEach((obj) => {
            // Identify highlighter paths (assuming they are Paths created by PencilBrush)
            // Need a more robust way to identify them if other Path types exist
            // (e.g., checking for specific data property if added during creation)
            if (
              obj instanceof Path &&
              obj.stroke &&
              typeof obj.stroke === "string" &&
              obj.stroke.startsWith("rgba") &&
              obj.shadow
            ) {
              // Store original properties
              originalHighlighterProps.push({
                obj: obj,
                props: { stroke: obj.stroke, shadow: obj.shadow },
              });

              // Modify for SVG export
              const color = new Color(obj.stroke);
              obj.set({
                // Use stroke-opacity instead of rgba color
                stroke: color.toRgb(), // Convert rgba to rgb
                opacity: color.getAlpha(), // Use opacity for transparency
                shadow: null, // Remove shadow as SVG doesn't support it well
              });
            }
          });
          canvas.renderAll(); // Apply temporary changes for export
          // --- End SVG Highlighter Preprocessing ---

          dataUrlOrSvg = canvas.toSVG();
          // --- SVG HREF Cleanup ---
          // Replace '&' with '&amp;' specifically within xlink:href="..." attributes
          dataUrlOrSvg = dataUrlOrSvg.replace(
            /xlink:href="([^"]*)"/g,
            (match, hrefContent) => {
              const escapedHref = hrefContent.replace(/&/g, "&amp;");
              return `xlink:href="${escapedHref}"`;
            }
          );

          const blob = new Blob([dataUrlOrSvg], {
            type: "image/svg+xml;charset=utf-8",
          });
          dataUrlOrSvg = URL.createObjectURL(blob);
        } else {
          // 'png' or 'jpeg'
          dataUrlOrSvg = canvas.toDataURL({
            format: format,
            quality: options.quality || 0.92, // Default quality for JPEG
            multiplier: options.multiplier || 1, // Optional scaling factor
            // Add left, top, width, height for clipping if needed
          });
        }

        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.href = dataUrlOrSvg;
        link.download = filename;
        document.body.appendChild(link); // Append link to body
        link.click();
        document.body.removeChild(link); // Clean up link

        // Revoke Blob URL if it was created for SVG
        if (format === "svg") {
          URL.revokeObjectURL(dataUrlOrSvg);
        }
      } catch (error) {
        console.error(`Error exporting canvas as ${format}:`, error);
      }
    },
    [canvasRef]
  );

  const value: AnnotationContextType = {
    canvasRef,
    isCanvasReady,
    setCanvas,
    tool,
    setTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    shapeType,
    setShapeType,
    activeObject,
    setActiveObject,
    saveState,
    handleUndo,
    handleRedo,
    deleteSelected,
    canUndo: undoStack.length > 1,
    canRedo: redoStack.length > 0,
    strokeType,
    setStrokeType,
    blurIntensity,
    setBlurIntensity,
    backgroundImageRef,
    shapeFill,
    setShapeFill,
    lineType,
    setLineType,
    exportCanvas,
  };

  return (
    <AnnotationContext.Provider value={value}>
      {children}
    </AnnotationContext.Provider>
  );
};

export const useAnnotation = (): AnnotationContextType => {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error("useAnnotation must be used within an AnnotationProvider");
  }
  return context;
};
