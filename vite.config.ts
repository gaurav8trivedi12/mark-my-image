import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true }),
    tailwindcss(),
    cssInjectedByJs(),
  ],
  build: {
    lib: {
      // Use import.meta.url to get the current file's URL
      entry: resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "src/index.tsx"
      ),
      name: "MarkMyImage",
      formats: ["es", "umd"],
      fileName: (format) => `mark-my-image.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
