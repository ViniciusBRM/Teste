"""Monta o Atlas da Vida 2 num arquivo só: src/00-head.html + os módulos de src/ na ordem abaixo -> ../atlas-da-vida-2.html"""
import pathlib, shutil, subprocess, sys, tempfile
d = pathlib.Path(__file__).parent
ORDEM = ["01-core.js", "02-example.js", "03-calc.js", "04-charts.js", "05-ui.js", "06-reports.js", "07-diary.js", "08-mentors.js", "09-pages.js", "10-data.js", "12-setor.js", "13-privacy.js", "14-capture.js", "15-experiments.js", "16-radar.js", "17-weekly.js", "18-chapters.js", "19-semantic.js", "20-dupla.js", "21-integ2.js", "22-bussola.js", "11-main.js"]   # 11-main por último: liga os eventos e inicia o app
head = (d / "src" / "00-head.html").read_text()
js = "\n".join((d / "src" / f).read_text() for f in ORDEM)
out = head + "\n<script>\n" + js + "\n</script>\n"
dest = d.parent / "atlas-da-vida-2.html"
dest.write_text(out)
if shutil.which("node"):   # confere a sintaxe do JavaScript montado
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f: f.write(js)
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True); pathlib.Path(f.name).unlink()
    if r.returncode: print(r.stderr); sys.exit(1)
print(f"{dest.name}: {len(out.encode())} bytes")
