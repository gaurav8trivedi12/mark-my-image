import * as HoverCard from "@radix-ui/react-hover-card";
import * as Tooltip from "@radix-ui/react-tooltip";
import { FabricImage } from "fabric";
import {
  ArrowUpRight,
  Circle,
  Download,
  GripVertical,
  Highlighter,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Pen,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import type { ExportFormat, StrokeType } from "../context/AnnotationContext";
import { useAnnotation } from "../context/AnnotationContext";
import {
  colorNames,
  colorShades,
  EXTRA_COLORS,
  TAILWIND_PALETTE,
} from "../utils/colorPalette";
import { ToolButton } from "./ToolButton";

export type EnabledTool =
  | "select"
  | "pen"
  | "highlighter"
  | "line"
  | "shape"
  // | 'blur'
  | "text"
  | "color"
  | "stroke"
  | "image"
  | "undo"
  | "redo"
  | "delete"
  | "export";

export interface ToolbarProps {
  enabledTools?: EnabledTool[];
  dragHandlers?: {
    handleDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDrag: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
  };
}

const DEFAULT_TOOLS: EnabledTool[] = [
  "select",
  "pen",
  "highlighter",
  "line",
  "shape",
  // 'blur', // not working well currently
  "text",
  "image",
  "color",
  "stroke",
  "undo",
  "redo",
  "delete",
  "export",
];

const Separator = () => (
  <div className="mmi:w-px mmi:h-4 mmi:bg-gray-500 mmi:dark:bg-gray-600 mmi:mx-1" />
);

const STROKE_WIDTHS = [2, 5, 10]; // Thin, Medium, Thick (adjust values as needed)

// Shared classes for small popover/menu buttons to reduce duplication
const menuActiveClass = "mmi:bg-blue-100 mmi:dark:bg-blue-900";
const menuButtonBase =
  "mmi:flex mmi:items-center mmi:justify-center mmi:rounded mmi:text-gray-700 mmi:dark:text-gray-200 mmi:hover:bg-gray-100 mmi:dark:hover:bg-gray-600";
const menuButton8 = `${menuButtonBase} mmi:h-8 mmi:w-8`;
const menuButton6 = `${menuButtonBase} mmi:h-6 mmi:px-2`;

interface TooltipWrapperProps {
  label: string;
  children: React.ReactNode;
}
const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ label, children }) => (
  <Tooltip.Provider delayDuration={300}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="mmi:z-[99999] mmi:rounded mmi:bg-gray-800 mmi:px-2.5 mmi:py-1.5 mmi:text-xs mmi:font-semibold mmi:text-white mmi:shadow-md mmi:dark:bg-gray-900"
          sideOffset={5}
        >
          {label}
          <Tooltip.Arrow className="mmi:fill-gray-800 mmi:dark:fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

export const Toolbar = ({
  enabledTools = DEFAULT_TOOLS,
  dragHandlers,
}: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref for the hidden file input

  const {
    tool,
    setTool,
    canvasRef,
    saveState,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    shapeType,
    setShapeType,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    activeObject,
    deleteSelected,
    strokeType,
    setStrokeType,
    shapeFill,
    setShapeFill,
    lineType,
    setLineType,
    exportCanvas,
  } = useAnnotation();

  const isEnabled = (t: EnabledTool) => enabledTools.includes(t);

  // Icon for the main Line/Arrow trigger
  const ActiveLineIcon = lineType === "arrow" ? ArrowUpRight : Minus;

  const renderStrokePreview = (width: number, currentType: StrokeType) => {
    let borderStyle = "solid";
    if (currentType === "dashed") borderStyle = "dashed";
    if (currentType === "dotted") borderStyle = "dotted";
    return (
      <div
        className="mmi:w-full mmi:h-px mmi:border-current"
        style={{ borderTopWidth: `${width}px`, borderStyle: borderStyle }}
      />
    );
  };

  const ActiveShapeIcon = () => {
    if (shapeType === "rect") {
      return shapeFill ? (
        <Square fill="black" size={16} />
      ) : (
        <Square size={16} />
      );
    } else {
      return shapeFill ? (
        <Circle fill="black" size={16} />
      ) : (
        <Circle size={16} />
      );
    }
  };

  // --- Handle Image Upload ---
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    // Make function async
    const file = event.target.files?.[0];
    const canvas = canvasRef.current;
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = async (f) => {
      const dataUrl = f.target?.result as string;
      if (!dataUrl) return;

      try {
        const img = await FabricImage.fromURL(dataUrl, {
          crossOrigin: "anonymous",
        });

        if (!img || !canvas) return; // Check canvas again

        // Scale image (optional)
        const maxDim = 150;
        const scale = Math.min(
          maxDim / (img.width ?? maxDim),
          maxDim / (img.height ?? maxDim),
          1
        );
        img.scale(scale);

        // Center the image
        const center = canvas.getVpCenter();
        img.set({
          left: center.x,
          top: center.y,
          originX: "center",
          originY: "center",
          selectable: true,
          evented: true,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        saveState();
        setTool("select");
      } catch (error) {
        console.error("Error loading image from data URL:", error);
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (event.target) {
      event.target.value = "";
    }
  };

  return (
    <div className="mmi:flex mmi:flex-wrap mmi:justify-center mmi:items-center mmi:gap-1 mmi:bg-white/70 mmi:backdrop-blur-sm mmi:p-2 mmi:rounded-lg mmi:shadow-md mmi:w-fit mmi:max-w-full mmi:mx-auto mmi:dark:bg-gray-800/70 mmi:dark:backdrop-blur-sm mmi:relative mmi:group">
      {/* --- DRAG HANDLE --- */}
      {/* Positioned absolutely or flexed at start/end */}
      {dragHandlers && (
        <div
          draggable="true"
          onDragStart={dragHandlers.handleDragStart}
          onDrag={dragHandlers.handleDrag}
          onDragEnd={dragHandlers.handleDragEnd}
          className="mmi:p-1 mmi:cursor-grab mmi:text-gray-600 mmi:hover:text-gray-600 mmi:dark:text-gray-300 mmi:dark:hover:text-gray-300"
          aria-label="Drag toolbar"
        >
          <GripVertical size={16} />
        </div>
      )}
      {/* --- END DRAG HANDLE --- */}

      {isEnabled("select") && (
        <TooltipWrapper label="Select">
          <ToolButton
            isActive={tool === "select"}
            onClick={() => setTool("select")}
            aria-label="Select tool"
          >
            <MousePointer2 size={16} />
          </ToolButton>
        </TooltipWrapper>
      )}
      {/* --- PEN TOOL --- */}
      {isEnabled("pen") && (
        <TooltipWrapper label="Pen">
          <ToolButton
            isActive={tool === "pen"}
            onClick={() => setTool("pen")}
            aria-label="Pen tool"
          >
            <Pen size={16} />
          </ToolButton>
        </TooltipWrapper>
      )}
      {/* --- END PEN TOOL --- */}
      {isEnabled("highlighter") && (
        <TooltipWrapper label="Highlighter">
          <ToolButton
            isActive={tool === "highlighter"}
            onClick={() => setTool("highlighter")}
            aria-label="Highlighter tool"
          >
            <Highlighter size={16} />
          </ToolButton>
        </TooltipWrapper>
      )}

      {/* --- NEW LINE/ARROW  GROUP --- */}
      {isEnabled("line") && (
        <HoverCard.Root openDelay={100} closeDelay={100}>
          <HoverCard.Trigger asChild>
            <div>
              <TooltipWrapper
                label={lineType === "arrow" ? "Arrow Tool" : "Line Tool"}
              >
                <ToolButton
                  isActive={tool === "line"}
                  aria-label="Select line tool"
                >
                  <ActiveLineIcon size={16} />
                </ToolButton>
              </TooltipWrapper>
            </div>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              className="mmi:z-10 mmi:bg-white mmi:dark:bg-gray-700 mmi:rounded-md mmi:shadow-lg mmi:p-2 mmi:grid mmi:grid-cols-2 mmi:gap-1 mmi:w-fit"
              sideOffset={5}
              align="start"
            >
              {/* Line Button */}
              <button
                onClick={() => {
                  setLineType("line");
                  setTool("line");
                }}
                className={`${menuButton8} ${
                  tool === "line" && lineType === "line" ? menuActiveClass : ""
                }`}
                aria-label="Draw line"
              >
                <Minus size={16} />
              </button>
              {/* Arrow Button */}
              <button
                onClick={() => {
                  setLineType("arrow");
                  setTool("line");
                }}
                className={`${menuButton8} ${
                  tool === "line" && lineType === "arrow" ? menuActiveClass : ""
                }`}
                aria-label="Draw arrow"
              >
                <ArrowUpRight size={16} />
              </button>
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      )}
      {/* --- END LINE/ARROW GROUP --- */}

      {/* --- UPDATED SHAPE  --- */}
      {isEnabled("shape") && (
        <HoverCard.Root openDelay={100} closeDelay={100}>
          <HoverCard.Trigger asChild>
            <div>
              <TooltipWrapper
                label={
                  shapeFill ? `Filled ${shapeType}` : `Outline ${shapeType}`
                }
              >
                <ToolButton
                  isActive={tool === "shape"}
                  aria-label="Select shape tool"
                >
                  <ActiveShapeIcon />
                </ToolButton>
              </TooltipWrapper>
            </div>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              className="mmi:z-10 mmi:bg-white mmi:dark:bg-gray-700 mmi:rounded-md mmi:shadow-lg mmi:p-2 mmi:grid mmi:grid-cols-2 mmi:gap-1 mmi:w-fit"
              sideOffset={5}
              align="start"
            >
              {/* Outline Rect */}
              <button
                onClick={() => {
                  setShapeType("rect");
                  setShapeFill(false);
                  setTool("shape");
                }}
                className={`${menuButton8} ${
                  tool === "shape" && shapeType === "rect" && !shapeFill
                    ? menuActiveClass
                    : ""
                }`}
                aria-label="Draw rectangle outline"
              >
                <Square size={16} />
              </button>
              {/* Filled Rect */}
              <button
                onClick={() => {
                  setShapeType("rect");
                  setShapeFill(true);
                  setTool("shape");
                }}
                className={`${menuButton8} ${
                  tool === "shape" && shapeType === "rect" && shapeFill
                    ? menuActiveClass
                    : ""
                }`}
                aria-label="Draw filled rectangle"
              >
                <Square fill="black" size={16} />
              </button>
              {/* Outline Circle */}
              <button
                onClick={() => {
                  setShapeType("circle");
                  setShapeFill(false);
                  setTool("shape");
                }}
                className={`${menuButton8} ${
                  tool === "shape" && shapeType === "circle" && !shapeFill
                    ? menuActiveClass
                    : ""
                }`}
                aria-label="Draw circle outline"
              >
                <Circle size={16} />
              </button>
              {/* Filled Circle */}
              <button
                onClick={() => {
                  setShapeType("circle");
                  setShapeFill(true);
                  setTool("shape");
                }}
                className={`${menuButton8} ${
                  tool === "shape" && shapeType === "circle" && shapeFill
                    ? menuActiveClass
                    : ""
                }`}
                aria-label="Draw filled circle"
              >
                <Circle fill="black" size={16} />
              </button>
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      )}
      {/* --- END SHAPE  --- */}

      {/* --- TODO: ADD BLUR BUTTON --- */}
      {/* {isEnabled('blur') && (
        <ToolButton
          isActive={tool === 'blur'}
          onClick={() => setTool('blur')}
          aria-label="Blur tool"
        >
          <Eraser size={16} />
        </ToolButton>
      )} */}
      {/* --- END BLUR BUTTON --- */}

      {isEnabled("text") && (
        <TooltipWrapper label="Text">
          <ToolButton
            isActive={tool === "text"}
            onClick={() => setTool("text")}
            aria-label="Text tool"
          >
            <Type size={16} />
          </ToolButton>
        </TooltipWrapper>
      )}

      {/* --- ADD IMAGE UPLOAD BUTTON --- */}
      {isEnabled("image") && (
        <>
          <TooltipWrapper label="Image">
            <ToolButton
              isActive={false}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add image"
            >
              <ImageIcon size={16} />
            </ToolButton>
          </TooltipWrapper>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/png, image/jpeg, image/webp, image/svg+xml" // Specify acceptable image types
            onChange={handleImageUpload}
          />
        </>
      )}

      {/* Separator before style controls */}
      {(isEnabled("image") ||
        isEnabled("text") ||
        isEnabled("shape") ||
        isEnabled("line") ||
        isEnabled("highlighter") ||
        isEnabled("pen")) &&
        (isEnabled("color") || isEnabled("stroke")) && <Separator />}

      {/* --- NEW STROKE  --- */}
      {isEnabled("stroke") && (
        <HoverCard.Root openDelay={100} closeDelay={100}>
          <HoverCard.Trigger asChild>
            <div>
              <TooltipWrapper label="Stroke Style">
                <ToolButton
                  isActive={false}
                  aria-label="Select stroke style"
                  className="mmi:px-2 mmi:flex-col mmi:justify-center"
                  style={{ color: color }}
                >
                  {renderStrokePreview(strokeWidth, strokeType)}
                </ToolButton>
              </TooltipWrapper>
            </div>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              className="mmi:z-10 mmi:bg-white mmi:dark:bg-gray-700 mmi:rounded-md mmi:shadow-lg mmi:p-3 mmi:flex mmi:flex-col mmi:gap-3 mmi:w-32" // Adjust width
              sideOffset={5}
              align="start"
            >
              {/* Stroke Width Selection */}
              <div className="mmi:text-sm mmi:font-medium mmi:text-gray-700 mmi:dark:text-gray-200 mmi:mb-1">
                Width
              </div>
              <div className="mmi:flex mmi:flex-col mmi:gap-2">
                {STROKE_WIDTHS.map((width) => (
                  <button
                    key={`width-${width}`}
                    onClick={() => setStrokeWidth(width)}
                    className={`${menuButton6} ${
                      strokeWidth === width ? menuActiveClass : ""
                    }`}
                    style={{ color: color }} // Use current color for preview
                    aria-label={`Set stroke width ${width}`}
                  >
                    {renderStrokePreview(width, strokeType)}
                  </button>
                ))}
              </div>

              {/* Stroke Type Selection */}
              <div className="mmi:text-sm mmi:font-medium mmi:text-gray-700 mmi:dark:text-gray-200 mmi:mt-2 mmi:mb-1">
                Style
              </div>
              <div className="mmi:flex mmi:flex-col mmi:gap-2">
                {(["solid", "dashed", "dotted"] as StrokeType[]).map((type) => (
                  <button
                    key={`type-${type}`}
                    onClick={() => setStrokeType(type)}
                    className={`${menuButton6} ${
                      strokeType === type ? menuActiveClass : ""
                    }`}
                    style={{ color: color }} // Use current color for preview
                    aria-label={`Set stroke style ${type}`}
                  >
                    {renderStrokePreview(strokeWidth, type)}{" "}
                  </button>
                ))}
              </div>
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      )}
      {/* --- END STROKE  --- */}

      {/* --- REVISED COLOR  --- */}
      {isEnabled("color") && (
        <HoverCard.Root openDelay={100} closeDelay={100}>
          <HoverCard.Trigger asChild>
            <div>
              <TooltipWrapper label="Color">
                <ToolButton isActive={false} aria-label="Select color">
                  <div
                    className="mmi:w-5 mmi:h-5 mmi:p-0 mmi:m-0 mmi:rounded-sm"
                    style={{ background: color }}
                  ></div>
                </ToolButton>
              </TooltipWrapper>
            </div>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              className="mmi:z-10 mmi:bg-white mmi:dark:bg-gray-700 mmi:rounded-md mmi:shadow-lg mmi:p-2 mmi:flex mmi:flex-col mmi:gap-2"
              sideOffset={5}
              align="start"
            >
              {/* Iterate through color names */}
              {colorNames.map((name) => (
                <div key={name} className="mmi:flex mmi:gap-1">
                  {" "}
                  {colorShades.map((shade) => {
                    const hexColor = TAILWIND_PALETTE[name][shade];
                    return (
                      <button
                        key={`${name}-${shade}`}
                        className={`mmi:w-5 mmi:h-5 mmi:rounded-sm mmi:border mmi:border-transparent mmi:focus:outline-none mmi:focus:ring-2 mmi:focus:ring-blue-500 mmi:focus:ring-offset-1 mmi:dark:focus:ring-offset-gray-700 ${
                          color === hexColor
                            ? "mmi:ring-2 mmi:ring-blue-500 mmi:ring-offset-1 mmi:dark:ring-offset-gray-700"
                            : ""
                        }`}
                        style={{ backgroundColor: hexColor }}
                        onClick={() => setColor(hexColor)}
                        aria-label={`Select color ${name} ${shade}`}
                      />
                    );
                  })}
                </div>
              ))}
              {/* Add black and white row */}
              <div className="mmi:flex mmi:gap-1 mmi:border-t mmi:border-gray-200 mmi:dark:border-gray-600 mmi:pt-2 mmi:mt-1">
                {EXTRA_COLORS.map((hexColor) => (
                  <button
                    key={hexColor}
                    className={`mmi:w-5 mmi: h-5 mmi:rounded-sm mmi:border ${
                      hexColor == "#ffffff"
                        ? "mmi:border-gray-400 mmi:dark:border-gray-500"
                        : "mmi:border-transparent" // Border for white
                    } mmi:focus:outline-none mmi:focus:ring-2 mmi:focus:ring-blue-500 mmi:focus:ring-offset-1 mmi:dark:focus:ring-offset-gray-700 ${
                      color === hexColor
                        ? "mmi:ring-2 mmi:ring-blue-500 mmi:ring-offset-1 mmi:dark:focus:ring-offset-gray-700"
                        : "" // Highlight selected
                    }`}
                    style={{ backgroundColor: hexColor }}
                    onClick={() => setColor(hexColor)}
                    aria-label={`Select color ${
                      hexColor === "#ffffff" ? "White" : "Black"
                    }`}
                  />
                ))}
                <div className="mmi:w-5 mmi:h-5"></div>
                <div className="mmi:w-5 mmi:h-5"></div>
                <div className="mmi:w-5 mmi:h-5"></div>
                <div className="mmi:w-5 mmi:h-5"></div>
              </div>
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      )}

      {isEnabled("color") &&
        (isEnabled("undo") || isEnabled("redo") || isEnabled("delete")) && (
          <Separator />
        )}

      {isEnabled("undo") && (
        <TooltipWrapper label="Undo">
          <ToolButton
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo"
            isActive={false}
          >
            <Undo2 size={16} />
          </ToolButton>
        </TooltipWrapper>
      )}
      {isEnabled("redo") && (
        <TooltipWrapper label="Redo">
          <ToolButton
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo"
            isActive={false}
          >
            <Redo2 size={16} />
          </ToolButton>
        </TooltipWrapper>
      )}
      {isEnabled("delete") && (
        <TooltipWrapper label="Delete">
          <ToolButton
            onClick={deleteSelected}
            disabled={!activeObject}
            aria-label="Delete selected object"
            isActive={false}
          >
            <Trash2 size={16} />
          </ToolButton>
        </TooltipWrapper>
      )}

      {/* --- ADD EXPORT BUTTON --- */}
      {(isEnabled("undo") || isEnabled("redo") || isEnabled("delete")) &&
        isEnabled("export") && <Separator />}

      {isEnabled("export") && (
        <HoverCard.Root openDelay={100} closeDelay={100}>
          <HoverCard.Trigger asChild>
            <div>
              <TooltipWrapper label="Export">
                <ToolButton isActive={false} aria-label="Export canvas">
                  <Download size={16} />
                </ToolButton>
              </TooltipWrapper>
            </div>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              className="mmi:z-10 mmi:bg-white mmi:dark:bg-gray-700 mmi:rounded-md mmi:shadow-lg mmi:p-2 mmi:flex mmi:flex-col mmi:gap-1 mmi:min-w-16"
              sideOffset={5}
              align="end"
            >
              {(["png", "jpeg", "svg"] as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => exportCanvas(format)} // Call export function with format
                  className="mmi:p-2 mmi:text-center mmi:text-sm mmi:rounded-md mmi:hover:bg-gray-100 mmi:dark:text-gray-100 mmi:dark:hover:bg-gray-600 mmi:focus:outline-none mmi:focus:ring-1 mmi:focus:ring-blue-500"
                >
                  .{format.toLowerCase()}
                </button>
              ))}
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      )}
      {/* --- END EXPORT BUTTON --- */}
    </div>
  );
};
