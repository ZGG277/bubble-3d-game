from pathlib import Path
import hashlib, json, zipfile, datetime, re, stat

root=Path(__file__).resolve().parent
dist=root/'candidate'
base=root/'baseline-1.0.5'
sha=lambda b:hashlib.sha256(b).hexdigest()
allowed_changes={'game.js','platform.js','index.html','style.css'}
new_files={'ranking.js','ranking-ui.js'}
for p in base.iterdir():
    if p.name not in allowed_changes|{'MANIFEST.json'}:
        assert (dist/p.name).read_bytes()==p.read_bytes(),p.name
assert (dist/'core.js').read_bytes()==(base/'core.js').read_bytes()
game=(dist/'game.js').read_text(); old=(base/'game.js').read_text()
assert game[game.index('function captureFlight()'):]==old[old.index('function captureFlight()'):]
assert "ranking.complete('round-'+rankingRound,g.height,g.age>0)" in game
js='\n'.join(p.read_text() for p in dist.glob('*.js'))
assert not re.search(r'new\s+(?:Worker|SharedWorker|OffscreenCanvas)\b|transferControlToOffscreen\s*\(|WebAssembly\.(?:compile|instantiate)|navigator\.serviceWorker',js)
assert not re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(',js)
# All runtime JS is directly owned, with no engine/dependency bootstrap. Visible
# Canvas2D and WebGL1 paths only; sharing reuses the on-screen Canvas.
(dist/'mini_tool.json').write_text('{"is_high_consumption_scene":false}\n')
html=(dist/'index.html').read_text()
refs=re.findall(r'(?:src|href)=[\"\']([^\"\']+)',html)
for ref in refs:
    assert not re.match(r'\w+:|//|/',ref),ref
    assert (dist/ref).is_file(),ref
ids=re.findall(r'id="([^"]+)"',html);assert len(ids)==len(set(ids))
files=[{'path':p.name,'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(dist.iterdir()) if p.name!='MANIFEST.json']
manifest={'version':'1.0.9','baseVersion':'1.0.5','baseZipSha256':'ff029afd90ef1d8deccae92ffecfe57b30edf90c2af519f7ddfd96d7344e7a6d','score':'Original cumulative flight distance g.height, raw number in metres; not vertical altitude.','changedRuntimeFiles':sorted(allowed_changes),'addedRuntimeFiles':sorted(new_files),'files':files}
(dist/'MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
out=root/'bubble-ranking-1.0.9.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(dist.iterdir()):
        assert p.is_file() and not p.is_symlink()
        info=zipfile.ZipInfo(p.name,(2026,11,9,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
        z.writestr(info,p.read_bytes())
with zipfile.ZipFile(out) as z:
    names=z.namelist();assert 'index.html' in names and len(names)==len(set(names)) and z.testzip() is None
    assert sum(i.file_size for i in z.infolist())<=30*1024**2
    for i in z.infolist():
        assert not Path(i.filename).is_absolute() and '..' not in Path(i.filename).parts
        assert not stat.S_ISLNK(i.external_attr>>16)
        assert z.read(i.filename)==(dist/i.filename).read_bytes()
assert out.stat().st_size<=10*1024**2
report={'zip':str(out),'bytes':out.stat().st_size,'sha256':sha(out.read_bytes()),'md5':hashlib.md5(out.read_bytes()).hexdigest(),'runtimeFiles':len(files),'changedRuntimeFiles':sorted(allowed_changes),'newRuntimeFiles':sorted(new_files),'baseVersion':'1.0.5','baseRuntimeMatchesUploadedZip':True,'shareCodeUnchanged':True,'coreUnchanged':True,'highConsumption':False,'highConsumptionBasis':'No engine, Worker, OffscreenCanvas, WASM or detached rendering. Added visible DOM backdrop Canvas2D with 160ms throttle and one-million-pixel cap; existing game WebGL is unchanged.','testCount':70,'validationScope':'Node mocks, deterministic gameplay comparison, syntax, static artifact and API contract only. No live ranking response, platform simulator, Android/iOS or device performance validation.'}
(root/'reports').mkdir(exist_ok=True)
(root/'reports/package.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
