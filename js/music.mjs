export function setupMusic({button,slider,output,audio,initialVolume=.35,onVolume=()=>{},onError=()=>{}}){
 let context=null,gain=null,timer=null,busy=false,level=.35;
 function sync(){const playing=!!context||!audio.paused;button.textContent=playing?'♫ 關閉音樂':'♫ 開啟音樂';button.setAttribute('aria-pressed',String(playing));}
 function volume(value){level=Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):.35));audio.volume=level;if(gain)gain.gain.value=level*.18;slider.value=String(Math.round(level*100));output.textContent=slider.value+'%';slider.setAttribute('aria-valuetext',slider.value+'%');return level;}
 volume(initialVolume);slider.addEventListener('input',()=>onVolume(volume(Number(slider.value)/100)));audio.addEventListener('play',sync);audio.addEventListener('pause',sync);audio.addEventListener('error',()=>{audio.pause();sync();onError('音樂載入失敗，請檢查音訊檔案與網路。');});

 // 可愛輕快的 Bossa-Nova 彈撥風原創長旋律（128 步 A-B-C-D 樂段，約 27 秒循環）
 const N={C4:261.63,D4:293.66,E4:329.63,F4:349.23,Fs4:369.99,G4:392.00,Gs4:415.30,A4:440.00,Bb4:466.16,B4:493.88,C5:523.25,Cs5:554.37,D5:587.33,Ds5:622.25,E5:659.25,F5:698.46,Fs5:739.99,G5:783.99,A5:880.00};
 const pattern=[
  // A 段：輕快跳躍開場
  [N.E5,N.C4],[0,0],[N.G5,0],[N.E5,N.G4],[0,0],[N.C5,0],[N.D5,N.D4],[0,0],
  [N.E5,N.G4],[0,0],[N.C5,0],[N.A4,N.F4],[0,0],[N.G4,0],[N.E4,N.C4],[0,0],
  [N.F4,N.D4],[N.A4,0],[N.C5,0],[N.E5,N.G4],[0,0],[N.D5,0],[N.B4,N.G4],[0,0],
  [N.C5,N.C4],[0,0],[N.G4,0],[N.E4,N.G4],[0,0],[N.G4,0],[N.C5,0],[0,0],
  // B 段：上揚俏皮答句
  [N.A4,N.F4],[0,0],[N.C5,0],[N.F5,N.C4],[0,0],[N.E5,0],[N.D5,N.G4],[0,0],
  [N.G4,N.E4],[0,0],[N.B4,0],[N.E5,N.B4],[0,0],[N.D5,0],[N.C5,N.A4],[0,0],
  [N.D5,N.D4],[N.E5,0],[N.F5,0],[N.D5,N.A4],[0,0],[N.C5,0],[N.B4,N.G4],[0,0],
  [N.G4,N.G4],[N.A4,0],[N.B4,0],[N.D5,N.D4],[0,0],[N.G5,0],[N.E5,0],[0,0],
  // C 段：溫暖圓點圓舞感
  [N.G5,N.C4],[0,0],[N.E5,0],[N.C5,N.G4],[0,0],[N.A4,0],[N.G4,N.E4],[0,0],
  [N.F5,N.F4],[0,0],[N.D5,0],[N.B4,N.G4],[0,0],[N.G4,0],[N.E5,N.C4],[0,0],
  [N.E5,N.A4],[N.Ds5,0],[N.E5,0],[N.C5,N.E4],[0,0],[N.A4,0],[N.D5,N.D4],[0,0],
  [N.C5,N.G4],[0,0],[N.B4,0],[N.A4,N.G4],[0,0],[N.G4,0],[0,0],[0,0],
  // D 段：可愛結尾過門回主調
  [N.E4,N.C4],[N.G4,0],[N.C5,0],[N.E5,N.G4],[0,0],[N.G5,0],[N.A5,N.F4],[0,0],
  [N.G5,N.C4],[0,0],[N.E5,0],[N.D5,N.G4],[0,0],[N.C5,0],[N.A4,N.A4],[0,0],
  [N.F4,N.D4],[N.A4,0],[N.D5,0],[N.F5,N.G4],[0,0],[N.E5,0],[N.D5,N.G4],[0,0],
  [N.C5,N.C4],[0,0],[N.E5,0],[N.G5,N.G4],[0,0],[N.C5,0],[0,0],[0,0]
 ];

 function pluck(freq,dur,type,vol){
  if(!context||!gain||!freq)return;
  const osc=context.createOscillator(),env=context.createGain(),t=context.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(freq,t);
  env.gain.setValueAtTime(.001,t);
  env.gain.linearRampToValueAtTime(vol,t+.015);
  env.gain.exponentialRampToValueAtTime(.001,t+dur);
  osc.connect(env).connect(gain);
  osc.start(t);osc.stop(t+dur+.02);
 }

 return {async toggle(){if(busy)return;busy=true;button.disabled=true;try{if(context){clearInterval(timer);await context.close();context=null;gain=null;}else if(!audio.paused)audio.pause();else if(audio.getAttribute('src'))await audio.play();else {context=new (window.AudioContext||window.webkitAudioContext)();await context.resume();gain=context.createGain();gain.gain.value=level*.18;gain.connect(context.destination);let step=0;const play=()=>{const [lead,bass]=pattern[step++%pattern.length];if(lead)pluck(lead,.28,'triangle',.55);if(bass)pluck(bass,.36,'sine',.35);};play();timer=setInterval(play,210);}}catch{clearInterval(timer);if(context)await context.close().catch(()=>{});context=null;audio.pause();onError('此瀏覽器暫時無法播放音樂，請再按一次或檢查音訊權限。');}finally{busy=false;button.disabled=false;sync();}}};
}
