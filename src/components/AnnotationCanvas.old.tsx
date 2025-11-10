import { useEffect, useRef } from "react";
import { Canvas, FabricImage } from "fabric";
import { useAnnotation } from "../context/AnnotationContext";
import { useAnnotationTools } from "../hooks/useAnnotationTools";

interface AnnotationCanvasProps {
  imageUrl: string;
}

export const AnnotationCanvas = ({ imageUrl }: AnnotationCanvasProps) => {
  const { setCanvas, saveState, setActiveObject, deleteSelected } =
    useAnnotation();
  useAnnotationTools();

  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const canvasInstanceRef = useRef<Canvas | null>(null);

  useEffect(() => {
    // FIX: Add a guard to ensure canvasEl.current is not null before proceeding.
    if (!canvasEl.current) {
      return;
    }
    const canvasElement = canvasEl.current;

    const initCanvas = async () => {
      try {
        const container = canvasElement.parentElement;
        if (!container) return;

        const img = await FabricImage.fromURL(imageUrl, {
          crossOrigin: "anonymous",
        });
        if (!img.width || !img.height) return;

        const scale = Math.min(
          container.offsetWidth / img.width,
          container.offsetHeight / img.height,
          1
        );

        // FIX: Pass the non-null canvasElement to the constructor.
        const canvasInstance = new Canvas(canvasElement, {
          width: img.width * scale,
          height: img.height * scale,
          backgroundVpt: false,
        });

        img.set({ scaleX: scale, scaleY: scale });

        // v6 FIX: Set the 'backgroundImage' property directly instead of calling a method.
        canvasInstance.backgroundImage = img;
        canvasInstance.renderAll();

        canvasInstance.on("selection:created", (e) =>
          setActiveObject(e.selected?.[0] || null)
        );
        canvasInstance.on("selection:updated", (e) =>
          setActiveObject(e.selected?.[0] || null)
        );
        canvasInstance.on("selection:cleared", () => setActiveObject(null));
        canvasInstance.on("object:modified", saveState);

        setCanvas(canvasInstance);
        canvasInstanceRef.current = canvasInstance;
        saveState();
      } catch (error) {
        console.error("Error loading image into canvas:", error);
      }
    };

    initCanvas();

    return () => {
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.dispose();
        canvasInstanceRef.current = null;
      }
      setCanvas(null);
    };
  }, [imageUrl, setCanvas, saveState, setActiveObject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelected]);

  return (
    <div className="mmi:canvas-wrapper mmi:w-full mmi:h-full mmi:flex mmi:justify-center mmi:items-center">
      <canvas ref={canvasEl} />
    </div>
  );
};

export default AnnotationCanvas;
