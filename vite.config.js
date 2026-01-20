import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import jsconfigpaths from "vite-jsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsconfigpaths()],
  server: {
    host: "0.0.0.0", // binds to all IPs
    port: 5173, // or any open port
    allowedHosts: [
      "wallpaper-launch-reward-pmc.trycloudflare.com",
      "kernn-automations.kernn.xyz",
      "web.kernn.xyz",
      "fb-web.kernn.xyz",
      "fb-frontend-kaushik.kernn.xyz",
      "mdms-frontend-hari.kernn.xyz",
      "fb-frontend.kernn.xyz",
    ],
    proxy: {
      "/api": {
        target: "https://fb-backend-chandra.kernn.xyz",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
            );
          });
        },
      },
    },
  },
});
