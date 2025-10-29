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
    "w-7 h-9 flex justify-center items-center rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 dark:focus:ring-offset-gray-800/50";

  // Default state - transparent background, subtle text color
  const defaultClasses =
    "bg-transparent text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10";

  // Active state - subtle semi-transparent background
  const activeClasses =
    "bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-200";

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
