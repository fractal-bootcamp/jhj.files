import { ConfigEnv, defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("API_URL:", env.API_URL);
  console.log("VITE_API_URL:", env.VITE_API_URL);
  return defineConfig({
    define: {
      "process.env.API_URL": JSON.stringify(env.VITE_API_URL || env.API_URL),
    },
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_URL || env.API_URL || "http://localhost:3009",
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  });
};