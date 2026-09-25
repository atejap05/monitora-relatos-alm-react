/// <reference types="vitest/config" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base './': a SPA roda de um diretório temporário extraído do blob FRONTEND (file://).
// dedupe: nfse-ds entra por file:../NFSe/nfse-ds e traz o próprio node_modules com React;
// sem dedupe haveria duas cópias de React e os hooks quebrariam.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
      // CSS dos componentes do nfse-ds: está em dist/ mas não em "exports" do pacote.
      {
        find: /^nfse-ds\/componentes\.css$/,
        replacement: path.resolve(import.meta.dirname, "node_modules/nfse-ds/dist/index.css"),
      },
    ],
  },
  // Portas fixas e próprias: o script abre exatamente estas URLs (producao=false). 5173/4173 ficam
  // para o Painel NFSe, que roda na mesma estação. Ocupadas, o Vite falha em vez de trocar de porta.
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
  build: {
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // forks estoura o timeout de inicializacao nesta estacao (antivirus); threads sobe rapido.
    pool: "threads",
  },
});
