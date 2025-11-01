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
  "w-7 h-7 flex justify-center items-center rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 dark:focus:ring-offset-gray-800/50 relative !p-0"; // Added relative for positioning active indicator potentially

export const defaultClasses =
  "!bg-transparent text-gray-700 hover:!bg-black/10 dark:text-gray-300 dark:hover:!bg-white/15";

export const activeClasses =
  "!bg-blue-500 text-white dark:!bg-blue-600 dark:text-white";

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
