import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Em dev, o proxy evita CORS (localhost → supabase.co). Reinicie o `npm run dev` após mudar .env. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: supabaseUrl
        ? {
            "/functions/v1": {
              target: supabaseUrl,
              changeOrigin: true,
              secure: true,
            },
          }
        : {},
    },
  };
});
