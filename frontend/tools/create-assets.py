from pathlib import Path
import random,math,wave,struct
root=Path(__file__).resolve().parents[1]/'public'
colors={'anime':('#151433','#7866cb','#f3aa91'),'gaming':('#102c2b','#489e83','#c6edb0'),'movies':('#301928','#b26273','#efad7a'),'tv':('#101f39','#4870a9','#aaccef'),'kpop':('#291a38','#b15cba','#faa1c3'),'comics':('#252939','#5f8590','#efd287'),'manga':('#1a2c31','#74998b','#daead1'),'cosplay':('#291b3d','#7965b8','#dca9df'),'community':('#21272c','#9c705f','#f3b895')}
for name,(bg,mid,light) in colors.items():
 random.seed(name)
 stars=''.join(f'<circle cx="{random.randrange(30,1250)}" cy="{random.randrange(20,680)}" r="{random.choice([1,1,2])}" fill="{light}" opacity="{random.uniform(.18,.8):.2f}"/>' for _ in range(90))
 buildings=''
 for layer,opacity,y in [(0,.38,700),(1,.68,810)]:
  for x in range(-30,1300,55):
   h=random.randrange(35,150);w=random.randrange(30,55)
   buildings+=f'<rect x="{x}" y="{y-h}" width="{w}" height="{h}" fill="{mid}" opacity="{opacity}"/>'
   for yy in range(y-h+13,y,22):
    if random.random()>.25:buildings+=f'<rect x="{x+9}" y="{yy}" width="5" height="7" fill="{light}" opacity=".55"/>'
 stairs=''.join(f'<path d="M{410-i*27} {650+i*23}h{420+i*54}l25 15H{385-i*27}z" fill="{light}" opacity="{.30-i*.012:.2f}" stroke="{mid}"/>' for i in range(9))
 if name in ['anime','cosplay','tv','community']:
  subject=f'<path d="M445 665V370a175 175 0 0 1 350 0v295" fill="url(#door)" stroke="{light}" stroke-width="3"/><path d="M415 665V370a205 205 0 0 1 410 0v295" fill="none" stroke="{mid}" stroke-width="14"/><path d="M385 665V370a235 235 0 0 1 470 0v295" fill="none" stroke="{light}" stroke-width="1" opacity=".5"/><circle cx="620" cy="410" r="93" fill="{light}" opacity=".9"/><path d="M490 562l105-85 65 66 92-108 43 140v90H445z" fill="{bg}"/>{stairs}'
 elif name in ['gaming','movies']:
  subject=f'<circle cx="725" cy="305" r="152" fill="url(#planet)"/><ellipse cx="725" cy="305" rx="240" ry="38" transform="rotate(-24 725 305)" fill="none" stroke="{light}" stroke-width="10" opacity=".75"/><path d="M295 580l270-115 285 107-145 105-155 50z" fill="{mid}"/><path d="M295 580l255 147 155-50-134 172z" fill="{bg}" stroke="{light}" stroke-width="2"/><path d="M530 480V344h50v133" fill="{light}" opacity=".75"/><path d="M510 345l47-47 45 47" fill="{light}"/>'
 elif name=='kpop':
  subject=''.join(f'<path d="M{600+i*65} 740L{200+i*145} 70l110 0-180 670z" fill="{light}" opacity=".12"/>' for i in range(-2,3))+f'<ellipse cx="640" cy="680" rx="330" ry="52" fill="{mid}"/><circle cx="640" cy="370" r="178" fill="none" stroke="{light}" stroke-width="4"/><ellipse cx="640" cy="370" rx="245" ry="62" transform="rotate(-34 640 370)" fill="none" stroke="{light}" stroke-width="17"/>'+''.join(f'<path d="M{470+i*82} 650v-110a19 19 0 0 1 38 0v110z" fill="{bg}"/><circle cx="{489+i*82}" cy="510" r="17" fill="{bg}"/>' for i in range(4))
 else:
  subject=f'<rect x="380" y="155" width="500" height="535" rx="6" transform="rotate(-9 640 420)" fill="{light}" opacity=".95"/><rect x="420" y="200" width="420" height="355" transform="rotate(-9 640 420)" fill="{mid}"/><circle cx="650" cy="350" r="102" fill="{bg}" opacity=".9"/><path d="M460 510l100-160 70 110 90-95 60 145z" fill="{bg}"/><path d="M440 596l350-55M443 621l280-45" stroke="{bg}" stroke-width="12"/><path d="M315 294l-40-100m26 202-99-32m754 231 104 51" stroke="{light}" stroke-width="4"/>'
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="900" viewBox="0 0 1280 900"><defs><radialGradient id="sky"><stop stop-color="{mid}"/><stop offset="1" stop-color="{bg}"/></radialGradient><linearGradient id="door" x2="0" y2="1"><stop stop-color="{mid}"/><stop offset="1" stop-color="{bg}"/></linearGradient><linearGradient id="planet" x2=".8" y2="1"><stop stop-color="{light}"/><stop offset="1" stop-color="{mid}"/></linearGradient></defs><rect width="1280" height="900" fill="{bg}"/><ellipse cx="670" cy="400" rx="640" ry="580" fill="url(#sky)" opacity=".85"/>{stars}<circle cx="1060" cy="180" r="58" fill="{light}" opacity=".25"/><path d="M30 748q620-125 1220 0" fill="none" stroke="{light}" opacity=".17"/>{buildings}{subject}<rect x="595" y="652" width="14" height="55" rx="7" fill="#111726"/><circle cx="602" cy="644" r="9" fill="#111726"/><path d="M602 708l-5 23m10-23 5 23" stroke="#111726" stroke-width="5"/></svg>'''
 (root/'art'/f'{name}.svg').write_text(svg)
(root/'art/favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#ff976e"/><path d="M19 16h31L36 29h11L19 51l7-21H15z" fill="#17151b"/></svg>')
# Original synthesized eight-second tone study. Deliberate playback only; no autoplay.
sample_rate=22050
with wave.open(str(root/'media/orbit.wav'),'w') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(sample_rate)
 frames=[]
 for i in range(sample_rate*8):
  t=i/sample_rate;freq=[261.63,329.63,392,523.25][int(t)//2];env=min(t*2,1,(8-t)*2)*(.6+.4*math.sin(math.pi*(t%2)/2))
  v=int(4500*env*(math.sin(2*math.pi*freq*t)+.25*math.sin(2*math.pi*freq*2*t)))
  frames.append(struct.pack('<h',v))
 w.writeframes(b''.join(frames))
print('Created original SVG assets and audio.')
