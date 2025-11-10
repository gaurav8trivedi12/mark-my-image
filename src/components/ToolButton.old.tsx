import React from "react";

interface ToolButtonProps {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  "aria-label": string;
  className?: string;
}

export const ToolButtonCopy = ({
  children,
  isActive,
  onClick,
  disabled = false,
  className = "",
  ...props
}: ToolButtonProps) => {
  // Base classes - keep transparency
  const baseClasses =
    "mmi:w-7 mmi:h-9 mmi:flex mmi:justify-center mmi:items-center mmi:rounded-md mmi:transition-colors mmi:duration-150 mmi:ease-in-out mmi:disabled:opacity-50 mmi:disabled:cursor-not-allowed mmi:focus:outline-none mmi:focus:ring-2 mmi:focus:ring-blue-500/50 mmi:focus:ring-offset-1 mmi:dark:focus:ring-offset-gray-800/50";

  // Default state - transparent background, subtle text color
  const defaultClasses =
    "mmi:bg-transparent mmi:text-gray-600 mmi:hover:bg-black/5 mmi:dark:text-gray-300 mmi:dark:hover:bg-white/10";

  // Active state - subtle semi-transparent background
  const activeClasses =
    "mmi:bg-blue-500/15 mmi:text-blue-600 mmi:dark:bg-blue-400/20 mmi:dark:text-blue-200";

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
