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
