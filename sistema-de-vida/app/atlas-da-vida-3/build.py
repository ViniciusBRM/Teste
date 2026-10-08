"""Monta o Atlas da Vida 3 num arquivo só: src/00-head.html + os módulos de src/ na ordem abaixo -> ../atlas-da-vida-3.html"""
import pathlib, shutil, subprocess, sys, tempfile
d = pathlib.Path(__file__).parent
ORDEM = ["01-core.js", "02-example.js", "03-calc.js", "04-charts.js", "05-ui.js", "06-reports.js", "07-diary.js", "08-mentors.js", "09-pages.js", "10-data.js", "12-setor.js", "13-privacy.js", "14-capture.js", "15-experiments.js", "16-radar.js", "17-weekly.js", "18-chapters.js", "19-semantic.js", "20-dupla.js", "21-integ2.js", "22-bussola.js", "23-projetos.js", "24-jornada.js", "25-carreira.js", "26-lazer.js", "27-painel.js", "28-capas.js", "29-hoje2.js", "30-casa.js", "31-futuro.js", "32-idiomas.js", "33-carreira2.js", "34-exemplo.js", "35-painel2.js", "36-gcal.js", "37-rotina.js", "38-jardim.js", "39-roteiro.js", "40-secretario.js", "41-conselho.js", "42-filosofia.js", "43-psique.js", "44-cockpit-config.js", "45-cockpit.js", "46-cockpit-ui.js", "47-cockpit-reg.js", "48-cockpit-rel.js", "11-main.js"]   # 11-main por último: liga os eventos e inicia o app
head = (d / "src" / "00-head.html").read_text()
js = "\n".join((d / "src" / f).read_text() for f in ORDEM)
out = head + "\n<script>\n" + js + "\n</script>\n"
dest = d.parent / "atlas-da-vida-3.html"
dest.write_text(out)
if shutil.which("node"):   # confere a sintaxe do JavaScript montado
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f: f.write(js)
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True); pathlib.Path(f.name).unlink()
    if r.returncode: print(r.stderr); sys.exit(1)
print(f"{dest.name}: {len(out.encode())} bytes")
