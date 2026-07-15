const C = window.MATHE9_SUPABASE || {};
const $ = s => document.querySelector(s);
let timer;
function headers(){return{apikey:C.anonKey,Authorization:'Bearer '+C.anonKey}}
function base(){return String(C.url||'').replace(/\/$/,'')+'/rest/v1/'}
function ago(iso){const s=Math.max(0,Math.round((Date.now()-new Date(iso))/1000));if(s<60)return s+' s';if(s<3600)return Math.floor(s/60)+' min';return Math.floor(s/3600)+' h'}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function get(path){const r=await fetch(base()+path,{headers:headers(),cache:'no-store'});if(!r.ok)throw new Error(await r.text()||('HTTP '+r.status));return r.json()}
async function load(){
  if(!C.enabled||!C.url||!C.anonKey){showError('Supabase ist noch nicht konfiguriert. Trage URL und anon key in assets/js/supabase-config.js ein.');return}
  const mins=Number($('#range').value), since=new Date(Date.now()-mins*60000).toISOString(), cls=$('#classFilter').value.trim();
  const classQ=cls?'&class_code=eq.'+encodeURIComponent(cls):'';
  try{
    const [progress,events]=await Promise.all([
      get('mathe9_progress?select=*&updated_at=gte.'+encodeURIComponent(since)+classQ+'&order=updated_at.desc&limit=500'),
      get('mathe9_events?select=*&ts=gte.'+encodeURIComponent(since)+classQ+'&order=ts.desc&limit=1000')
    ]);
    render(progress,events);$('.status').classList.add('live');$('#statusText').textContent='live · '+new Date().toLocaleTimeString('de-DE');$('#error').hidden=true;
  }catch(e){showError('Dashboard konnte Daten nicht laden: '+e.message);$('.status').classList.remove('live');}
}
function render(progress,events){
  const latest=new Map();progress.forEach(p=>{const k=p.device_id+'|'+p.unit+'|'+p.path;if(!latest.has(k))latest.set(k,p)});const rows=[...latest.values()];
  const active=rows.filter(r=>Date.now()-new Date(r.updated_at)<60000).length;
  const devices=new Set(events.map(e=>e.device_id)).size;const ans=events.filter(e=>e.event_type==='answer');const ok=ans.filter(e=>e.payload?.correct).length;
  $('#activeNow').textContent=active;$('#studentsToday').textContent=devices;$('#answers').textContent=ans.length;$('#correctRate').textContent=ans.length?Math.round(ok/ans.length*100)+' %':'–';
  $('#studentsBody').innerHTML=rows.length?rows.map(r=>{const on=Date.now()-new Date(r.updated_at)<60000;return `<tr><td><span class="badge"><i class="dot ${on?'active':''}"></i>${on?'aktiv':'inaktiv'}</span></td><td>${esc(r.student)}</td><td>${esc(r.unit)}</td><td>${esc(r.path||'–')}</td><td><div class="progress"><i style="width:${Math.max(0,Math.min(100,r.progress_percent||0))}%"></i></div><small>${r.completed_tasks||0}/${r.total_tasks||0} · ${r.progress_percent||0}%</small></td><td>${esc(r.current_task||'–')}</td><td>${ago(r.updated_at)}</td></tr>`}).join(''):'<tr><td colspan="7" class="muted">Noch keine Daten im gewählten Zeitraum.</td></tr>';
  const mis={};ans.forEach(e=>{const m=e.payload?.misconception;if(m)mis[m]=(mis[m]||0)+1});const sorted=Object.entries(mis).sort((a,b)=>b[1]-a[1]).slice(0,10),max=sorted[0]?.[1]||1;
  $('#misconceptions').innerHTML=sorted.length?sorted.map(([k,n])=>`<div class="bar"><span>${esc(k)}</span><div class="barTrack"><i style="width:${n/max*100}%"></i></div><b>${n}</b></div>`).join(''):'<p class="muted">Noch keine diagnostizierten Denkfehler.</p>';
  $('#feed').innerHTML=ans.slice(0,20).map(e=>`<div class="feedItem"><b class="${e.payload?.correct?'ok':'no'}">${e.payload?.correct?'richtig':'noch falsch'}</b> · ${esc(e.student)} · ${esc(e.unit)} / ${esc(e.task)}<br><span class="muted">${ago(e.ts)} · ${e.payload?.attempts||1}. Versuch${e.payload?.misconception?' · '+esc(e.payload.misconception):''}</span></div>`).join('')||'<p class="muted">Noch keine Antworten.</p>';
}
function showError(t){$('#error').textContent=t;$('#error').hidden=false}
$('#refresh').addEventListener('click',load);$('#range').addEventListener('change',load);$('#classFilter').addEventListener('change',load);load();timer=setInterval(load,5000);
