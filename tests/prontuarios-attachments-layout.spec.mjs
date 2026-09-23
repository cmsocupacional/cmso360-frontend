import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const panelSource = fs.readFileSync(
  path.join(projectRoot, "app", "prontuarios", "components", "PainelDireita.tsx"),
  "utf8",
);
const pageSource = fs.readFileSync(
  path.join(projectRoot, "app", "prontuarios", "page.tsx"),
  "utf8",
);
const pdfViewerSource = fs.readFileSync(
  path.join(projectRoot, "app", "prontuarios", "components", "PdfView.tsx"),
  "utf8",
);

test("mantém a coluna Ver alinhada mesmo com nomes longos de anexos", () => {
  const attachmentsTable = panelSource.match(
    /<h5 className="text-xs font-semibold text-default-600 mb-2">\s*Anexos[\s\S]*?<table className="([^"]+)"/,
  );

  assert.ok(attachmentsTable, "a tabela de anexos deve existir");
  assert.match(attachmentsTable[1], /table-fixed/);
  assert.match(panelSource, /break-words|\[overflow-wrap:anywhere\]/);
});

test("selecionar exame ou anexo não desloca horizontalmente o painel direito", () => {
  assert.doesNotMatch(panelSource, /document\.getElementById\("pdf-viewer"\)\?\.scrollIntoView/);
});

test("mantém o visualizador limitado para o painel direito continuar visível", () => {
  assert.match(pageSource, /<div className="flex flex-1 min-w-0 overflow-hidden">/);
  assert.match(pdfViewerSource, /<main className="flex-1 min-w-0/);
});
