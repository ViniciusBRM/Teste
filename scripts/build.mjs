// Gera index.html (versão independente) a partir de src/cartellino.html.
// O arquivo-fonte é escrito no formato de página de Artifact (sem <html>/<head>/<body>);
// aqui ele recebe o esqueleto completo para abrir direto no navegador.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src', 'cartellino.html'), 'utf8');
const marker = '<!-- /head -->';
const at = src.indexOf(marker);
if (at < 0) throw new Error(`Marcador ${marker} não encontrado em src/cartellino.html`);

const head = src.slice(0, at).trim();
const body = src.slice(at + marker.length).trim();
const out = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Ponto eletrônico pessoal com painel de horas, banco de horas, férias, atestados e trasferte.">
<!-- Gerado por scripts/build.mjs a partir de src/cartellino.html. Não edite à mão. -->
${head}
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), out);
console.log(`index.html gerado (${(out.length / 1024).toFixed(1)} KB)`);
