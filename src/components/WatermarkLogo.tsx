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
    <div className="absolute bottom-2 right-2 z-50">
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
              className={`cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-200`}
              style={{ width: "2rem", height: "2rem" }}
            />
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content
              side="top"
              className="rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-md"
            >
              {tooltipText}
              <Tooltip.Arrow className="fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
};

export default WatermarkLogo;
