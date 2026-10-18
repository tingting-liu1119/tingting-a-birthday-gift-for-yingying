"""维护工具：ffmpeg 转码与客观能量分析。运行时不需要 Python 或 ffmpeg。"""
import argparse, hashlib, json, pathlib, subprocess, wave
import numpy as np
p = argparse.ArgumentParser()
p.add_argument('source')
p.add_argument('--ffmpeg', default='ffmpeg')
a = p.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'assets/audio'
out.mkdir(parents=True, exist_ok=True)
for ext, codec in [('m4a', 'aac'), ('mp3', 'libmp3lame')]:
    subprocess.run([a.ffmpeg, '-v', 'error', '-y', '-i', a.source, '-vn', '-ac', '2', '-ar', '44100', '-c:a', codec, '-b:a', '192k', '-map_metadata', '-1', str(out / ('pxyz.' + ext))], check=True)
raw = subprocess.check_output([a.ffmpeg, '-v', 'error', '-i', a.source, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', 'pipe:1'])
x = np.frombuffer(raw, dtype='<f4')
rms = [float(np.sqrt(np.mean(x[i:i+16000] ** 2))) for i in range(0, len(x), 16000)]
peak = max(rms)
blocks = [{'from': i, 'to': min(i + 8, len(rms)), 'rms': round(float(np.mean(rms[i:i+8])), 5)} for i in range(0, len(rms)-7)]
strong = sorted(blocks, key=lambda b: b['rms'], reverse=True)
selected = []
for block in strong:
    if all(abs(block['from'] - other['from']) >= 15 for other in selected): selected.append(block)
    if len(selected) == 6: break
analysis = {'source': pathlib.Path(a.source).name, 'sourceSHA256': hashlib.sha256(pathlib.Path(a.source).read_bytes()).hexdigest(), 'duration': len(x)/16000, 'method': 'FFmpeg standard stereo downmix; mono 16 kHz RMS in 1-second windows. Energy only, not a claim about lyrical or musical structure.', 'strongWindows': sorted(selected, key=lambda b:b['from']), 'normalizedEnergy': [round(v/peak, 3) for v in rms]}
(root / 'docs/audio-analysis.json').write_text(json.dumps(analysis, ensure_ascii=False, indent=2))
print(json.dumps({k:v for k,v in analysis.items() if k != 'normalizedEnergy'}, ensure_ascii=False, indent=2))
