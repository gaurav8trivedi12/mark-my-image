import { useImperativeHandle, useRef, useState } from "react";
import { AnnotationCanvas } from "./components/AnnotationCanvas";
import { Toolbar, type ToolbarProps } from "./components/Toolbar";
import WatermarkLogo from "./components/WatermarkLogo";
import {
  AnnotationProvider,
  useAnnotation,
  type ExportFormat,
} from "./context/AnnotationContext";
import "./styles.css";

export type ImageSource = string | Blob | File;

export interface AnnotationToolRef {
  getCanvasDataURL: (
    format?: ExportFormat,
    options?: any
  ) => string | undefined;
}

export interface AnnotationToolProps {
  imageSource: ImageSource;
  className?: string;
  style?: React.CSSProperties;
  enabledTools?: ToolbarProps["enabledTools"];
  initialToolbarPosition?: {
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
  };
  ref?: React.Ref<AnnotationToolRef>;
}

// Default initial position (e.g., bottom center)
const DEFAULT_TOOLBAR_POSITION = { bottom: 20, left: "50%" };

interface AnnotationCoreProps {
  imageSource: ImageSource;
  enabledTools?: ToolbarProps["enabledTools"];
  dragHandlers: {
    handleDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDrag: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
  };
  toolbarPosition: {
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
  };
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  parentRef?: React.Ref<AnnotationToolRef>;
}

const AnnotationCore = ({
  imageSource,
  enabledTools,
  dragHandlers,
  toolbarPosition,
  toolbarRef,
  parentRef,
}: AnnotationCoreProps) => {
  const { canvasRef } = useAnnotation();

  useImperativeHandle(
    parentRef,
    () => ({
      getCanvasDataURL: (format: ExportFormat = "png", options: any = {}) => {
        console.log(
          "getCanvasDataURL called inside imperative handle. Canvas ref:",
          canvasRef.current
        ); // Debug Log
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error("getCanvasDataURL failed: Canvas ref is null.");
          return undefined;
        }
        try {
          const dataUrl = canvas.toDataURL({
            format: format === "svg" ? "png" : format,
            quality: options.quality || 0.92,
            multiplier: options.multiplier || 1,
          });
          console.log("getCanvasDataURL successful.");
          return dataUrl;
        } catch (error) {
          console.error(`Error getting canvas data URL as ${format}:`, error);
          return undefined;
        }
      },
    }),
    [canvasRef]
  );

  return (
    <>
      <div
        ref={toolbarRef}
        style={{
          position: "absolute",
          zIndex: 10,
          top: toolbarPosition.top ?? undefined,
          left: toolbarPosition.left ?? undefined,
          bottom: toolbarPosition.bottom ?? undefined,
          right: toolbarPosition.right ?? undefined,
          transform:
            toolbarPosition.top === undefined && toolbarPosition.left === "50%"
              ? "translateX(-50%)"
              : undefined, // Apply centering based on state
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <Toolbar enabledTools={enabledTools} dragHandlers={dragHandlers} />
      </div>

      <AnnotationCanvas imageSource={imageSource} />
    </>
  );
};

export const AnnotationTool = ({
  imageSource,
  className,
  style,
  enabledTools,
  initialToolbarPosition = DEFAULT_TOOLBAR_POSITION,
  ref,
}: AnnotationToolProps) => {
  const [toolbarPosition, setToolbarPosition] = useState(
    initialToolbarPosition
  );
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (!toolbarRef.current) return;
    const rect = toolbarRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    event.dataTransfer.effectAllowed = "move";
    // Remove setDragImage to prefer default ghost image
    const dragImage = new Image(1, 1);
    dragImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    // event.dataTransfer.setDragImage(dragImage, -10, -10);
  };

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (
      !containerRef.current ||
      !toolbarRef.current ||
      (event.clientX === 0 && event.clientY === 0)
    )
      return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const toolbarWidth = toolbarRef.current.offsetWidth;
    const toolbarHeight = toolbarRef.current.offsetHeight;

    let newX = event.clientX - containerRect.left - dragOffset.current.x;
    let newY = event.clientY - containerRect.top - dragOffset.current.y;
    newX = Math.max(0, Math.min(newX, containerRect.width - toolbarWidth));
    newY = Math.max(0, Math.min(newY, containerRect.height - toolbarHeight));

    setToolbarPosition({
      top: newY,
      left: newX,
      bottom: undefined,
      right: undefined,
    });
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    // console.log("Drag ended");
  };

  return (
    <AnnotationProvider>
      <div
        ref={containerRef}
        className={`react-annotation-tool-container mmi:relative mmi:bg-white mmi:dark:bg-gray-800 mmi:overflow-scroll ${
          className || ""
        }`}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          width: "100%",
          height: "100%",
          minHeight: "500px", // ensures visibility if parent has no height
          maxHeight: "100vh", // prevents runaway scroll
          ...style,
        }}
      >
        <AnnotationCore
          imageSource={imageSource}
          enabledTools={enabledTools}
          dragHandlers={{ handleDragStart, handleDrag, handleDragEnd }}
          toolbarPosition={toolbarPosition}
          toolbarRef={toolbarRef}
          parentRef={ref}
        />
        <WatermarkLogo
          websiteUrl="https://markmyimage.com"
          tooltipText="Powered by markmyimage.com"
          show={true}
          size={48}
        />
      </div>
    </AnnotationProvider>
  );
};

const AnnotationToolOld = ({
  imageSource,
  className,
  style,
  enabledTools,
  initialToolbarPosition = DEFAULT_TOOLBAR_POSITION,
  ref,
}: AnnotationToolProps) => {
  const [toolbarPosition, setToolbarPosition] = useState(
    initialToolbarPosition
  );
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (!toolbarRef.current) return;
    const rect = toolbarRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    // console.log(
    //   `Drag Start - Offset: x=${dragOffset.current.x.toFixed(
    //     0
    //   )}, y=${dragOffset.current.y.toFixed(0)}`
    // );

    event.dataTransfer.effectAllowed = "move";
    const dragImage = new Image(1, 1);
    dragImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    // event.dataTransfer.setDragImage(dragImage, -999, -999);
  };

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Ignore the final drag event which often has clientX/Y = 0
    if (
      !containerRef.current ||
      !toolbarRef.current ||
      (event.clientX === 0 && event.clientY === 0)
    )
      return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const toolbarWidth = toolbarRef.current.offsetWidth;
    const toolbarHeight = toolbarRef.current.offsetHeight;

    // Calculate desired top-left based on viewport coordinates and container offset
    let newX = event.clientX - containerRect.left - dragOffset.current.x;
    let newY = event.clientY - containerRect.top - dragOffset.current.y;

    // Boundary Checks using offsetWidth/Height
    newX = Math.max(0, newX); // Left boundary
    newX = Math.min(newX, containerRect.width - toolbarWidth); // Right boundary
    newY = Math.max(0, newY); // Top boundary
    newY = Math.min(newY, containerRect.height - toolbarHeight); // Bottom boundary

    // console.log(`Dragging - Client:(${event.clientX},${event.clientY}), Container:(${containerRect.left},${containerRect.top}), Offset:(${dragOffset.current.x},${dragOffset.current.y}), New:(${newX.toFixed(0)},${newY.toFixed(0)}), Bounds:(${containerRect.width - toolbarWidth})`);

    // Update position using only top and left
    setToolbarPosition({
      top: newY,
      left: newX,
      bottom: undefined,
      right: undefined,
    });
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    // console.log("Drag ended");
  };

  // --- Inner Component to Access Context & Handle Ref ---
  const AnnotationCore = () => {
    const { canvasRef } = useAnnotation();

    useImperativeHandle(
      ref,
      () => ({
        getCanvasDataURL: (format: ExportFormat = "png", options: any = {}) => {
          const canvas = canvasRef.current;
          if (!canvas) {
            console.error("getCanvasDataURL failed: Canvas ref is null.");
            return undefined;
          }
          try {
            const dataUrl = canvas.toDataURL({
              format: format === "svg" ? "png" : format,
              quality: options.quality || 0.92,
              multiplier: options.multiplier || 1,
            });
            return dataUrl;
          } catch (error) {
            console.error(`Error getting canvas data URL as ${format}:`, error);
            return undefined;
          }
        },
      }),
      [canvasRef]
    );

    return (
      <>
        {/* Toolbar Wrapper */}
        <div
          ref={toolbarRef}
          style={{
            position: "absolute",
            zIndex: 10,
            top: toolbarPosition.top ?? undefined,
            left: toolbarPosition.left ?? undefined,
            bottom: toolbarPosition.bottom ?? undefined,
            right: toolbarPosition.right ?? undefined,
            transform:
              toolbarPosition.top === undefined &&
              initialToolbarPosition.left === "50%"
                ? "translateX(-50%)"
                : undefined,
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Toolbar
            enabledTools={enabledTools}
            dragHandlers={{ handleDragStart, handleDrag, handleDragEnd }}
          />
        </div>

        <AnnotationCanvas imageSource={imageSource} />
      </>
    );
  };

  return (
    <AnnotationProvider>
      <div
        ref={containerRef}
        className={`mmi:react-annotation-tool-container mmi:relative ${
          className || ""
        }`}
        style={style}
      >
        <AnnotationCore />
      </div>
    </AnnotationProvider>
  );
};
