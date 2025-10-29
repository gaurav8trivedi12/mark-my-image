import type { TEvent } from "fabric";
import { Canvas, Textbox } from "fabric";
import type { Dispatch, SetStateAction } from "react";
import type { Tool } from "../context/AnnotationContext";

interface TextToolOptions {
  color: string;
  saveState: () => void;
  setTool: Dispatch<SetStateAction<Tool>>;
}

const TextTool = (
  canvas: Canvas,
  { color, saveState, setTool }: TextToolOptions
): (() => void) => {
  canvas.selection = false;
  canvas.forEachObject((obj) => {
    obj.selectable = false;
    obj.evented = false;
  });

  const onMouseDown = (o: TEvent) => {
    if (!o.e) return;
    const pointer = canvas.getScenePoint(o.e);

    const text = new Textbox("bug", {
      left: pointer.x,
      top: pointer.y,
      originX: "center",
      originY: "center",
      fill: color,
      fontSize: 20,
      fontFamily: "Arial",
      width: 200,
      textAlign: "left",
    });

    canvas.add(text);
    text.enterEditing();
    canvas.setActiveObject(text);

    text.on("editing:exited", () => {
      if (text.text?.trim() === "") {
        canvas.remove(text);
      }
      saveState();
    });

    setTool("select");
  };

  canvas.on("mouse:down", onMouseDown);

  return () => {
    canvas.off("mouse:down", onMouseDown);
  };
};

export default TextTool;
