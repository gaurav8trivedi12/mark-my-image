import { tailwindColors } from "./tailwindColorsv3";
export const colorNames = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "gray",
] as const;
export const colorShades = ["300", "400", "500", "600", "700", "800"] as const;

type ColorName = (typeof colorNames)[number];
type ColorShade = (typeof colorShades)[number];

const importedColors: { [N in ColorName]: { [S in ColorShade]: string } } = {
  red: tailwindColors.red,
  blue: tailwindColors.blue,
  green: tailwindColors.green,
  yellow: tailwindColors.yellow,
  purple: tailwindColors.purple,
  gray: tailwindColors.gray,
};

export const TAILWIND_PALETTE: {
  [N in ColorName]: { [S in ColorShade]: string };
} = colorNames.reduce((acc, name) => {
  acc[name] = colorShades.reduce((shadesAcc, shade) => {
    shadesAcc[shade] = importedColors[name]?.[shade] || "#000000";
    return shadesAcc;
  }, {} as { [S in ColorShade]: string });
  return acc;
}, {} as { [N in ColorName]: { [S in ColorShade]: string } });

export const EXTRA_COLORS: string[] = ["#ffffff", "#000000"];
