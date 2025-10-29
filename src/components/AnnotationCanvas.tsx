import { Canvas, FabricImage, InteractiveFabricObject } from "fabric";
import { useEffect, useRef, useState } from "react";
import { useAnnotation } from "../context/AnnotationContext";
import { useAnnotationTools } from "../hooks/useAnnotationTools";
import type { ImageSource } from "../index";
import { tailwindColors } from "../utils/tailwindColorsv3";

interface AnnotationCanvasProps {
  imageSource: ImageSource;
}

function getImageUrl(source: ImageSource): {
  url: string;
  needsRevoke: boolean;
} {
  console.log("getImageUrl received:", source); // Log input type
  if (typeof source === "string") {
    if (source.startsWith("data:image/") || source.startsWith("http")) {
      console.log("Source is URL or Base64");
      return { url: source, needsRevoke: false };
    }
  } else if (
    typeof source === "object" &&
    source !== null &&
    ("size" in source || "arrayBuffer" in source)
  ) {
    const blob = source as Blob | File;
    const objectUrl = URL.createObjectURL(blob);
    console.log("Source is Blob/File, created object URL:", objectUrl);
    return { url: objectUrl, needsRevoke: true };
  }
  console.error("Unsupported image source type:", typeof source);
  return { url: "", needsRevoke: false };
}

export const AnnotationCanvas = ({ imageSource }: AnnotationCanvasProps) => {
  const {
    setCanvas,
    saveState,
    setActiveObject,
    deleteSelected,
    backgroundImageRef,
  } = useAnnotation();
  useAnnotationTools();

  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const canvasInstanceRef = useRef<Canvas | null>(null);
  const [objectUrlToRevoke, setObjectUrlToRevoke] = useState<string | null>(
    null
  );

  // --- Ref to track initialization status ---
  const isInitializedRef = useRef(false);

  useEffect(() => {
    console.log(
      "AnnotationCanvas useEffect triggered. Image source:",
      imageSource
    );

    // --- Prevent re-running core logic if already initialized in this mount cycle ---
    if (isInitializedRef.current) {
      console.log(
        "AnnotationCanvas effect: Already initialized, skipping core logic."
      );
      return;
    }

    if (!canvasEl.current) {
      console.log("Canvas element ref is null, exiting.");
      return;
    }
    const canvasElement = canvasEl.current;
    let currentObjectUrl: string | null = null;
    let localCanvasInstance: Canvas | null = null; // Local variable for instance

    const initCanvas = async () => {
      console.log("initCanvas started.");
      // Clean up previous instance first
      if (canvasInstanceRef.current) {
        console.log("Disposing previous canvas instance.");
        canvasInstanceRef.current.dispose();
        canvasInstanceRef.current = null;
        setCanvas(null);
        backgroundImageRef.current = null;
      }
      if (objectUrlToRevoke) {
        console.log("Revoking previous object URL:", objectUrlToRevoke);
        URL.revokeObjectURL(objectUrlToRevoke);
        setObjectUrlToRevoke(null);
      }

      const container = canvasElement.parentElement;
      if (!container) {
        console.error("Canvas container parent element not found.");
        return;
      }
      console.log("Canvas container found:", container);

      const { url: imageUrl, needsRevoke } = getImageUrl(imageSource);
      if (!imageUrl) {
        console.error("Failed to get a valid image URL from source.");
        return;
      }
      console.log(
        `Image URL determined: ${imageUrl.substring(
          0,
          100
        )}... Needs revoke: ${needsRevoke}`
      );

      if (needsRevoke) {
        currentObjectUrl = imageUrl;
        setObjectUrlToRevoke(imageUrl);
      } else {
        // Ensure previous object URL is cleared
        if (objectUrlToRevoke) {
          console.log(
            "Clearing previous object URL (not needed for new source):",
            objectUrlToRevoke
          );
          URL.revokeObjectURL(objectUrlToRevoke);
          setObjectUrlToRevoke(null);
        }
      }

      try {
        console.log("Calling Image.fromURL...");
        const img = await FabricImage.fromURL(imageUrl, {
          crossOrigin: "anonymous",
        });
        console.log("Image.fromURL loaded successfully:", img);

        if (!img || !img.width || !img.height) {
          throw new Error(
            `Loaded image object is invalid or has no dimensions. Width: ${img?.width}, Height: ${img?.height}`
          );
        }
        console.log(`Image dimensions: ${img.width}x${img.height}`);

        backgroundImageRef.current = img;

        const scale = Math.min(
          container.offsetWidth / img.width,
          container.offsetHeight / img.height,
          1
        );
        console.log("Calculated scale:", scale);

        console.log("Creating Fabric Canvas instance...");
        localCanvasInstance = new Canvas(canvasElement, {
          width: img.width * scale,
          height: img.height * scale,
          backgroundImage: img,
          backgroundVpt: false,
        });
        console.log("Fabric Canvas instance created.");
        // --- Set initialized flag immediately after successful creation ---
        isInitializedRef.current = true;

        // Detect dark mode from Tailwind’s `dark` class
        const isDarkMode = document.documentElement.classList.contains("dark");

        // Pick colors based on theme
        const accent = isDarkMode
          ? tailwindColors.green[200]
          : tailwindColors.green[800];
        const border = isDarkMode
          ? tailwindColors.blue[200]
          : tailwindColors.blue[800];
        const text = isDarkMode
          ? tailwindColors.gray[100]
          : tailwindColors.gray[800];
        const fill = isDarkMode
          ? tailwindColors.emerald[200]
          : tailwindColors.emerald[100];
        const bg = isDarkMode
          ? tailwindColors.gray[800]
          : tailwindColors.gray[100];

        // --- START: Apply Global Control Styles ---
        InteractiveFabricObject.ownDefaults = {
          ...InteractiveFabricObject.ownDefaults,
          transparentCorners: false, // Make corners opaque
          cornerColor: "#FFFFFF", // White fill for corners
          cornerStrokeColor: accent, // Blue border for corners (Tailwind blue-500)
          cornerStyle: "circle", // Circular corners
          cornerSize: 8, // Size of the corner control
          borderColor: border, // Blue border for the object bounds
          borderScaleFactor: 1.5, // Slightly thicker border
          padding: 6, // Add padding around object for controls
          borderOpacityWhenMoving: 1, // Keep border visible while moving
          borderDashArray: [5, 5], // Dashed border
        };

        console.log("Applied global Fabric.js control styles.");
        // --- END: Apply Global Control Styles ---

        img.set({ scaleX: scale, scaleY: scale });
        console.log("Background image scale set.");

        localCanvasInstance.renderAll();
        console.log("Initial canvas renderAll complete.");

        // Setup event listeners
        localCanvasInstance.on("selection:created", (e) =>
          setActiveObject(e.selected?.[0] || null)
        );
        localCanvasInstance.on("selection:updated", (e) =>
          setActiveObject(e.selected?.[0] || null)
        );
        localCanvasInstance.on("selection:cleared", () =>
          setActiveObject(null)
        );
        localCanvasInstance.on("object:modified", saveState);
        console.log("Event listeners attached.");

        setCanvas(localCanvasInstance);
        canvasInstanceRef.current = localCanvasInstance;
        saveState();
        console.log("Canvas set in context and initial state saved.");
        console.log("canvasInstanceRef.current:", canvasInstanceRef.current);

        // Optional: auto-refresh if user toggles dark mode
        const observer = new MutationObserver(() => {
          const darkMode = document.documentElement.classList.contains("dark");
          if (darkMode !== isDarkMode) window.location.reload();
        });

        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
      } catch (error) {
        console.error("Error during initCanvas image loading/setup:", error);
        isInitializedRef.current = false; // Reset flag on error to allow retry if applicable
        if (currentObjectUrl) {
          console.log("Revoking object URL due to error:", currentObjectUrl);
          URL.revokeObjectURL(currentObjectUrl);
          setObjectUrlToRevoke(null);
        }
        backgroundImageRef.current = null; // Clear ref on error
      }
    };

    initCanvas();

    // Consolidated Cleanup
    return () => {
      console.log("Running useEffect cleanup...");
      if (canvasInstanceRef.current) {
        console.log("Disposing canvas instance in cleanup.");
        canvasInstanceRef.current.dispose();
        canvasInstanceRef.current = null;
      } else if (localCanvasInstance) {
        // Fallback: If ref wasn't set due to error, try disposing local var
        console.warn(
          "Disposing canvas instance using local var (ref might not have been set)."
        );
        localCanvasInstance.dispose();
        localCanvasInstance = null;
      }

      if (objectUrlToRevoke) {
        console.log("Revoking object URL in cleanup:", objectUrlToRevoke);
        URL.revokeObjectURL(objectUrlToRevoke);
        setObjectUrlToRevoke(null);
      }
      backgroundImageRef.current = null; // Clear ref on unmount
      setCanvas(null);
      isInitializedRef.current = false;
      console.log("Cleanup complete.");
    };
  }, [imageSource, setCanvas, saveState, setActiveObject, backgroundImageRef]);

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
    <div className="canvas-wrapper w-full h-full flex justify-center items-center">
      <canvas ref={canvasEl} />
    </div>
  );
};

export default AnnotationCanvas;
