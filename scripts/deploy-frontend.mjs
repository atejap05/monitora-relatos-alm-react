import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const zipPath = path.join(rootDir, "FRONTEND.zip");

console.log("1. Executando build...");
try {
  execSync("npm run build", { cwd: rootDir, stdio: "inherit" });
} catch {
  console.error("Build falhou.");
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  console.error("Diretório dist não encontrado após o build.");
  process.exit(1);
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
  console.log("2. Removendo FRONTEND.zip anterior.");
}

console.log("3. Criando FRONTEND.zip com conteúdo de dist...");
const output = fs.createWriteStream(zipPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

output.on("close", () => {
  console.log(`   FRONTEND.zip criado (${(archive.pointer() / 1024).toFixed(1)} KB)`);
  console.log("4. Deploy concluído. FRONTEND.zip está na raiz do projeto.");
});

archive.on("error", (err) => {
  console.error("Erro ao criar ZIP:", err);
  process.exit(1);
});

archive.pipe(output);
archive.directory(distDir, false);
archive.finalize();
