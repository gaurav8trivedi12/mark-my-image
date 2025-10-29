import { Canvas, Rect } from 'fabric';
import type { TEvent } from 'fabric';
import type { Dispatch, SetStateAction } from 'react';
import type { Tool } from '../context/AnnotationContext';

interface BlurToolOptions {
  saveState: () => void;
  setTool: Dispatch<SetStateAction<Tool>>;
}

const BlurTool = (
  canvas: Canvas,
  { saveState, setTool }: BlurToolOptions
): (() => void) => {
  let isDrawing = false;
  let startX: number, startY: number;
  let obscuringRect: Rect | null = null; // Renamed for clarity

  const onMouseDown = (o: TEvent) => {
    if (!o.e || !canvas) return;
    isDrawing = true;
    const pointer = canvas.getScenePoint(o.e);
    if (!pointer) return;
    startX = pointer.x;
    startY = pointer.y;

    // Create the obscuring rectangle
    obscuringRect = new Rect({
      left: startX,
      top: startY,
      originX: 'left',
      originY: 'top',
      width: 0,
      height: 0,
      // Style it to look like a blur/obscuration
      fill: 'rgba(200, 200, 200, 0.75)', // Light gray, semi-transparent
      // Optional: Add a subtle stroke or rounded corners
      // stroke: 'rgba(150, 150, 150, 0.5)',
      // strokeWidth: 1,
      // rx: 3, // Rounded corners X
      // ry: 3, // Rounded corners Y
      selectable: false,
      evented: false,
    });

    canvas.add(obscuringRect);
  };

  const onMouseMove = (o: TEvent) => {
    if (!isDrawing || !o.e || !canvas || !obscuringRect) return;
    const pointer = canvas.getScenePoint(o.e);
    if (!pointer) return;
    const width = pointer.x - startX;
    const height = pointer.y - startY;

    obscuringRect.set({
      width: Math.abs(width),
      height: Math.abs(height),
      left: width < 0 ? pointer.x : startX,
      top: height < 0 ? pointer.y : startY,
    });

    canvas.requestRenderAll();
  };

  const onMouseUp = () => {
    if (!isDrawing || !canvas || !obscuringRect) {
        isDrawing = false; // Ensure flag is reset
        return;
    }
     isDrawing = false;

    // Prevent tiny accidental clicks from creating shapes
    if ((obscuringRect.width ?? 0) < 5 || (obscuringRect.height ?? 0) < 5) {
        canvas.remove(obscuringRect);
        obscuringRect = null;
        canvas.renderAll();
        return; // Don't switch tool
    }

    // Make the final rectangle selectable
    obscuringRect.set({
        selectable: true,
        evented: true,
    });

    canvas.setActiveObject(obscuringRect); // Select the new shape
    canvas.renderAll();
    saveState();
    setTool('select'); // Switch back to select tool
    obscuringRect = null; // Clear the reference
  };

  // Setup: Disable selection on other objects
  canvas.selection = false;
  canvas.forEachObject(obj => { obj.selectable = false; obj.evented = false; });

  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:up', onMouseUp);

  // Cleanup
  return () => {
    canvas.off('mouse:down', onMouseDown);
    canvas.off('mouse:move', onMouseMove);
    canvas.off('mouse:up', onMouseUp);
    // Remove rect if tool is switched mid-draw
    if (obscuringRect) {
        canvas.remove(obscuringRect);
    }
    // Ensure selection is re-enabled
    if (canvas) {
        canvas.selection = true;
        canvas.forEachObject(obj => { obj.selectable = true; obj.evented = true; });
    }
  };
};

export default BlurTool;