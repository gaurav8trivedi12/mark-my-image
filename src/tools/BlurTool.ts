import type { TEvent } from "fabric";
import { Canvas, FabricImage, filters, Rect } from "fabric";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Tool } from "../context/AnnotationContext";

interface BlurToolOptions {
  saveState: () => void;
  setTool: Dispatch<SetStateAction<Tool>>;
  backgroundImageRef: RefObject<FabricImage | null>;
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), waitFor);
  };
}

const BlurTool = (
  canvas: Canvas,
  { saveState, setTool, backgroundImageRef }: BlurToolOptions
): (() => void) => {
  console.log("%cBlurTool: Function executed.", "color: green;");

  let isDrawing = false;
  let startX: number, startY: number;
  let placeholderRect: Rect | null = null;
  let blurredImage: FabricImage | null = null;
  const blurIntensity = 0.2; // Blur filter value 0-1

  // --- Helper to update crop ---
  const updateCrop = (region: FabricImage) => {
    const bgImage = backgroundImageRef.current;
    if (!bgImage || !bgImage.getElement()) {
      console.error(
        "BlurTool UpdateCrop: Background image reference is missing for blur update"
      );
      return;
    }

    // Ensure region has dimensions and position needed for calculation
    if (
      region.left === undefined ||
      region.top === undefined ||
      !region.width ||
      !region.height ||
      region.scaleX === undefined ||
      region.scaleY === undefined
    ) {
      console.warn(
        "BlurTool UpdateCrop: Region is missing necessary properties (left, top, width, height, scaleX, scaleY). Skipping update."
      );
      return;
    }

    // Calculate crop coordinates relative to the original, unscaled background image
    const bgScaleX = bgImage.scaleX ?? 1;
    const bgScaleY = bgImage.scaleY ?? 1;

    // Crop coordinates need to be in the original image's pixel space
    // Using region's left/top directly as they are canvas coordinates
    const cropX = region.left / bgScaleX;
    const cropY = region.top / bgScaleY;
    // The width/height needed for cropping is the visual size divided by background scale
    const cropWidth = (region.width * region.scaleX) / bgScaleX;
    const cropHeight = (region.height * region.scaleY) / bgScaleY;

    // Check for valid crop dimensions (prevent negative or zero values)
    if (cropWidth <= 0 || cropHeight <= 0) {
      console.warn(
        `BlurTool UpdateCrop: Skipping update due to zero or negative crop dimensions. W: ${cropWidth}, H: ${cropHeight}`
      );
      return;
    }

    region.set({
      cropX: cropX,
      cropY: cropY,
      width: cropWidth, // Width/Height now refer to the cropped portion *before* scaling
      height: cropHeight,
      scaleX: bgScaleX, // Match the background image's scale
      scaleY: bgScaleY,
    });
    region.applyFilters(); // Re-apply filter after crop changes

    canvas.requestRenderAll();
  };

  const debouncedUpdateCrop = debounce(updateCrop, 100);

  const onMouseDown = (o: TEvent) => {
    console.log("BlurTool: onMouseDown triggered.");
    if (!o.e || !canvas || !backgroundImageRef.current) {
      console.log(
        "BlurTool: onMouseDown bailed (no event, canvas, or background image ref)."
      );
      return;
    }
    isDrawing = true;
    const pointer = canvas.getScenePoint(o.e);
    if (!pointer) return;
    startX = pointer.x;
    startY = pointer.y;
    console.log(`BlurTool: Drawing started at ${startX}, ${startY}`);

    placeholderRect = new Rect({
      left: startX,
      top: startY,
      originX: "left",
      originY: "top",
      width: 0,
      height: 0,
      fill: "rgba(100, 100, 200, 0.3)",
      stroke: "rgba(0, 0, 255, 0.5)",
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(placeholderRect);
    console.log("BlurTool: Placeholder rect added.");
  };

  const onMouseMove = (o: TEvent) => {
    if (!isDrawing || !o.e || !canvas || !placeholderRect) return;
    const pointer = canvas.getScenePoint(o.e);
    if (!pointer) return;
    const width = pointer.x - startX;
    const height = pointer.y - startY;
    placeholderRect.set({
      width: Math.abs(width),
      height: Math.abs(height),
      left: width < 0 ? pointer.x : startX,
      top: height < 0 ? pointer.y : startY,
    });
    canvas.requestRenderAll();
  };

  const onMouseUp = async () => {
    console.log("BlurTool: onMouseUp triggered.");
    if (
      !isDrawing ||
      !canvas ||
      !placeholderRect ||
      !backgroundImageRef.current
    ) {
      console.log(
        "BlurTool MouseUp: Bailed (not drawing, no canvas, no placeholder, or no background ref)"
      );
      isDrawing = false;
      if (placeholderRect && canvas) canvas.remove(placeholderRect);
      placeholderRect = null;
      return;
    }
    isDrawing = false;

    const finalWidth = placeholderRect.width ?? 0;
    const finalHeight = placeholderRect.height ?? 0;
    const finalLeft = placeholderRect.left ?? 0;
    const finalTop = placeholderRect.top ?? 0;

    // Remove placeholder BEFORE creating the image to avoid flicker/capture issues
    canvas.remove(placeholderRect);
    placeholderRect = null;
    canvas.renderAll();

    if (finalWidth < 5 || finalHeight < 5) {
      console.log(
        "BlurTool MouseUp: Rectangle too small, operation cancelled."
      );
      return; // Don't switch tool, allow user to try drawing again
    }
    console.log(
      `BlurTool MouseUp: Final Area: x=${finalLeft.toFixed(
        2
      )}, y=${finalTop.toFixed(2)}, w=${finalWidth.toFixed(
        2
      )}, h=${finalHeight.toFixed(2)}`
    );

    try {
      const bgImageElement = backgroundImageRef.current.getElement();
      if (!bgImageElement)
        throw new Error("Background image element not found");
      console.log("BlurTool MouseUp: Background image element retrieved.");

      // Create a new Image instance using the background's element
      blurredImage = new FabricImage(bgImageElement, {
        left: finalLeft,
        top: finalTop,
        // Initial crop/size will be set by updateCrop shortly
        width: 1, // Placeholder > 0
        height: 1, // Placeholder > 0
        cropX: 0,
        cropY: 0,
        scaleX: 1, // Will be set by updateCrop
        scaleY: 1, // Will be set by updateCrop
        filters: [new filters.Blur({ blur: blurIntensity })],
        selectable: true,
        evented: true,
        data: { isBlurRegion: true },
      });
      console.log(
        "BlurTool MouseUp: Initial blurred FabricImage object created."
      );

      updateCrop(blurredImage); // Call immediately to set initial crop/size/scale
      console.log("BlurTool MouseUp: Initial crop applied.");

      // Apply the filter *after* setting initial crop/scale
      blurredImage.applyFilters();
      console.log("BlurTool MouseUp: Blur filter applied.");

      canvas.add(blurredImage);
      canvas.setActiveObject(blurredImage);
      console.log(
        "BlurTool MouseUp: Blurred image added to canvas and selected."
      );

      // Attach listeners for dynamic cropping AFTER adding to canvas
      blurredImage.on("moving", (e) => {
        debouncedUpdateCrop((e as any).target as FabricImage);
      });
      blurredImage.on("scaling", (e) => {
        debouncedUpdateCrop((e as any).target as FabricImage);
      });
      blurredImage.on("modified", (e) => {
        updateCrop(e.target as FabricImage); // Ensure final precise update
        saveState();
      });
      console.log(
        "BlurTool MouseUp: Event listeners attached to blurred image."
      );

      canvas.renderAll();
      saveState(); // Save initial state
    } catch (error) {
      console.error("Error creating blurred image:", error);
    } finally {
      console.log("BlurTool MouseUp: Switching tool to select.");
      setTool("select");
    }
  };

  // --- Setup & Cleanup ---
  console.log("BlurTool: Disabling canvas selection.");
  canvas.selection = false;
  canvas.forEachObject((obj) => {
    obj.selectable = false;
    obj.evented = false;
  });

  console.log("BlurTool: Attaching mouse listeners.");
  canvas.on("mouse:down", onMouseDown);
  canvas.on("mouse:move", onMouseMove);
  canvas.on("mouse:up", onMouseUp);

  return () => {
    console.log("%cBlurTool: Cleanup function called.", "color: red;");
    if (canvas) {
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
      console.log("BlurTool: Mouse listeners detached.");
      if (placeholderRect) {
        console.log("BlurTool: Removing placeholder rect during cleanup.");
        canvas.remove(placeholderRect);
      }
      // Detach listeners from potentially created blurred image if needed
      // (This might require storing a reference differently if cleanup needs it)

      console.log("BlurTool: Re-enabling canvas selection during cleanup.");
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        // Re-enable only if it's not a blur region which was just added
        if (!(obj as any)?.data?.isBlurRegion) {
          obj.selectable = true;
          obj.evented = true;
        }
      });
      canvas.renderAll();
    } else {
      console.log("BlurTool Cleanup: Canvas was already null/disposed.");
    }
  };
};

export default BlurTool;
