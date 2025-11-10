import React from "react";

interface ToolButtonProps {
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
  disabled?: boolean;
  "aria-label": string;
  className?: string;
  style?: React.CSSProperties;
}

export const baseClasses =
  "mmi:w-7 mmi:h-7 mmi:flex mmi:justify-center mmi:items-center mmi:rounded-md mmi:transition-colors mmi:duration-150 mmi:ease-in-out mmi:disabled:opacity-50 mmi:disabled:cursor-not-allowed mmi:focus:outline-none mmi:focus:ring-2 mmi:focus:ring-blue-500/50 mmi:focus:ring-offset-1 mmi:dark:focus:ring-offset-gray-800/50 mmi:relative mmi:!p-0"; // Added relative for positioning active indicator potentially

export const defaultClasses =
  "mmi:!bg-transparent mmi:text-gray-700 mmi:hover:!bg-black/10 mmi:dark:text-gray-300 mmi:dark:hover:!bg-white/15";

export const activeClasses =
  "mmi:!bg-blue-500 mmi:text-white mmi:dark:!bg-blue-600 mmi:dark:text-white";

export const ToolButton = ({
  children,
  isActive,
  onClick,
  disabled = false,
  className = "",
  ...props
}: ToolButtonProps) => {
  return (
    <button
      type="button"
      className={`${baseClasses} ${
        isActive ? activeClasses : defaultClasses
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
