import * as Tooltip from "@radix-ui/react-tooltip";
import React from "react";
import logo from "../assets/markmyimage-logo-small.png";

interface WatermarkLogoProps {
  websiteUrl: string;
  tooltipText?: string;
  show?: boolean; // control visibility (for licensing)
  size?: number; // size in pixels
}

const WatermarkLogo: React.FC<WatermarkLogoProps> = ({
  websiteUrl,
  tooltipText = "Powered by markmyimage.com",
  show = true,
  size = 48,
}) => {
  if (!show) return null;

  return (
    <div className="mmi:absolute mmi:bottom-2 mmi:right-2 mmi:z-999">
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <img
              src={logo}
              alt={tooltipText}
              title={tooltipText}
              onClick={() =>
                window.open(websiteUrl, "_blank", "noopener,noreferrer")
              }
              className={`mmi:cursor-pointer mmi:opacity-70 mmi:hover:opacity-100 mmi:transition-opacity mmi:duration-200`}
              style={{ width: "2rem", height: "2rem" }}
            />
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content
              side="top"
              className="mmi:rounded mmi:bg-gray-800 mmi:px-2 mmi:py-1 mmi:text-xs mmi:text-white mmi:shadow-md"
            >
              {tooltipText}
              <Tooltip.Arrow className="mmi:fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
};

export default WatermarkLogo;
