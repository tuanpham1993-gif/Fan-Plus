import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api(?!\/auth|\/users|\/admin|\/feedback)/, ""),
      },
    },
  },
});
