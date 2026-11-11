from pathlib import Path
import tempfile,shutil,subprocess,json

here=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='bubble-video-probe-') as tmp:
    base=Path(tmp);p=base/'bubble-video-probe';p.mkdir()
    shutil.copytree(here/'dist',p/'dist')
    (p/'reports').mkdir()
    for name in ['test-flow.cjs','test-mux.cjs']:shutil.copy2(here/name,p/name)
    def run(args):subprocess.run(args,cwd=base,check=True)
    for name in ['app.js','mux.js']:run(['node','--check',str(p/'dist'/name)])
    run(['node',str(p/'test-flow.cjs')])
    raw=p/'reports/test-input.h264';video=p/'reports/mux-roundtrip.mp4'
    run(['ffmpeg','-v','error','-f','lavfi','-i','testsrc2=size=360x640:rate=24','-frames:v','240','-an','-c:v','libx264','-profile:v','baseline','-pix_fmt','yuv420p','-bf','0','-x264-params','aud=1:keyint=24:scenecut=0','-f','h264',str(raw)])
    run(['node',str(p/'test-mux.cjs')])
    data=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration','-of','json',str(video)],text=True))
    s=data['streams'][0]
    assert(s['codec_name'],s['width'],s['height'],s['r_frame_rate'],s['nb_frames'])==('h264',360,640,'24/1','240'),s
    assert abs(float(data['format']['duration'])-10)<0.001,data
    run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'])
    print(json.dumps({'offlineChecks':'passed','video':data,'nativePlatformVerified':False},indent=2))
