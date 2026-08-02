/* Lehrerdashboard: Auth, Freigabeliste, Aktivität und Fortschritt */
'use strict';
const C = window.MATHE9_SUPABASE || {};
const $ = s => document.querySelector(s);
const AUTH_KEY = 'mathe9.teacher.session';
const ACTIVE_MS = 60000;
let session = readSession();
let timer = null;
let loading = false;

function base(){return String(C.url||'').trim().replace(/\/+$/,'')}
function rest(){return base()+'/rest/v1/'}
function auth(){return base()+'/auth/v1/'}
function readSession(){try{return JSON.parse(sessionStorage.getItem(AUTH_KEY)||'null')}catch{return null}}
function saveSession(value){session=value;if(value)sessionStorage.setItem(AUTH_KEY,JSON.stringify(value));else sessionStorage.removeItem(AUTH_KEY)}
function headers(json=true){const h={apikey:String(C.anonKey||'')};if(json)h['Content-Type']='application/json';if(session?.access_token)h.Authorization='Bearer '+session.access_token;else if(C.anonKey&&!String(C.anonKey).startsWith('sb_publishable_'))h.Authorization='Bearer '+C.anonKey;return h}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function ago(iso){if(!iso)return'–';const s=Math.max(0,Math.round((Date.now()-new Date(iso))/1000));if(s<60)return s+' s';if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';return Math.floor(s/86400)+' Tg.'}
function dauer(ms){if(!Number.isFinite(ms)||ms<0)return'–';const s=Math.round(ms/1000);if(s<60)return s+' s';const m=Math.floor(s/60);return m+':'+String(s%60).padStart(2,'0')+' min'}
function median(werte){if(!werte.length)return null;const a=[...werte].sort((x,y)=>x-y),m=a.length>>1;return a.length%2?a[m]:Math.round((a[m-1]+a[m])/2)}
function payload(v){if(v&&typeof v==='object')return v;try{return JSON.parse(v||'{}')}catch{return{}}}
function normalizeLogin(v){return String(v||'').trim().toLocaleLowerCase('de-DE').replace(/\s+/g,'')}
function validLogin(v){return /^[a-zäöüßà-ž0-9'-]+\.[a-zäöüßà-ž0-9'-]+$/iu.test(v)}

async function request(url,options={}){let r=await fetch(url,{...options,headers:{...headers(options.body!==undefined),...(options.headers||{})},cache:'no-store'});if(r.status===401&&session?.refresh_token){const ok=await refreshSession();if(ok)r=await fetch(url,{...options,headers:{...headers(options.body!==undefined),...(options.headers||{})},cache:'no-store'})}if(!r.ok)throw new Error((await r.text()).trim()||`HTTP ${r.status}`);if(r.status===204)return null;const text=await r.text();return text?JSON.parse(text):null}
async function refreshSession(){try{const r=await fetch(auth()+'token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json',apikey:C.anonKey},body:JSON.stringify({refresh_token:session.refresh_token})});if(!r.ok)return false;saveSession(await r.json());return true}catch{return false}}
async function signIn(email,password){const r=await fetch(auth()+'token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json',apikey:C.anonKey},body:JSON.stringify({email,password})});if(!r.ok)throw new Error((await r.text()).trim()||'Anmeldung fehlgeschlagen.');saveSession(await r.json())}
async function istFreigeschalteteLehrkraft(){
  const wert=await request(rest()+'rpc/mathe9_ist_lehrkraft',{method:'POST',body:'{}'});
  return wert===true;
}
async function appOeffnen(){
  try{
    if(!await istFreigeschalteteLehrkraft()){
      saveSession(null);showLogin();
      const err=$('#loginError');
      err.textContent='Dieses Supabase-Konto ist nicht als Lehrkraft freigeschaltet.';err.hidden=false;
      return false;
    }
    showApp();return true;
  }catch(e){
    saveSession(null);showLogin();
    const err=$('#loginError');err.textContent='Lehrkraft-Freigabe konnte nicht geprüft werden: '+e.message;err.hidden=false;
    return false;
  }
}
async function signOut(){try{if(session?.access_token)await fetch(auth()+'logout',{method:'POST',headers:headers(false)})}finally{saveSession(null);stop();showLogin()}}

function showLogin(){$('#loginPanel').hidden=false;$('#dashboardApp').hidden=true;$('#logout').hidden=true;$('.status').classList.remove('live');$('#statusText').textContent='nicht angemeldet'}
function showApp(){ $('#loginPanel').hidden=true;$('#dashboardApp').hidden=false;$('#logout').hidden=false;$('#classFilter').value=C.classCode||$('#classFilter').value||'9';start();
  /* Der Katalog muss vor dem ersten Rendern da sein, sonst bleibt die
     bereichsübergreifende Tafel bis zur nächsten Aktualisierung leer. */
  ladeKategorien().then(loadAll);
  loadOps() }
function showError(text){$('#error').textContent=text;$('#error').hidden=false}
function rosterMessage(text,error=false){const e=$('#rosterMessage');e.textContent=text;e.className='message '+(error?'bad':'good');e.hidden=false;setTimeout(()=>e.hidden=true,4000)}

async function loadAll(){if(loading||!session)return;loading=true;$('#refresh').disabled=true;try{await Promise.all([loadRoster(),loadDashboard()]);$('.status').classList.add('live');$('#statusText').textContent='live · '+new Date().toLocaleTimeString('de-DE');$('#error').hidden=true}catch(e){showError('Daten konnten nicht geladen werden: '+e.message);$('.status').classList.remove('live')}finally{loading=false;$('#refresh').disabled=false}}

/* ---------- Betrieb und Datenpflege ----------
   Zwei Fragen, die im Unterrichtsalltag untergehen und dann im falschen
   Moment auffallen: Welche Fassung läuft auf den Geräten? Und löscht der
   Aufräumjob wirklich, oder steht das nur in DATENSCHUTZ.md?

   Bewusst getrennt vom Minutentakt der Lernanzeige: Diese Werte ändern
   sich selten, und ein Fehler hier darf das Dashboard nicht blockieren. */
async function loadOps(){
  const kacheln=[];

  try{
    const r=await fetch('../version.json',{cache:'no-store'});
    if(r.ok){
      const m=await r.json();
      kacheln.push(['Fassung',`${m.version||'?'} · ${String(m.source_commit||'?').slice(0,7)}`,
        m.source_dirty?'warn':'']);
      kacheln.push(['gebaut am',(m.gebaut_am||'').slice(0,16).replace('T',' ')||'–','']);
      kacheln.push(['Cache-Version',m.cache_version||'–','']);
      kacheln.push(['Tracking',m.tracking_aktiv?'aktiv':'deaktiviert',m.tracking_aktiv?'':'good']);
    }else{
      kacheln.push(['Fassung','version.json nicht lesbar','warn']);
    }
  }catch(e){
    kacheln.push(['Fassung','version.json nicht erreichbar','warn']);
  }

  let hinweis='';
  try{
    const zeilen=await request(rest()+'rpc/mathe9_wartung_status',{method:'POST',body:'{}'});
    const w=Array.isArray(zeilen)?zeilen[0]:zeilen;
    if(!w||!w.letzter_lauf){
      kacheln.push(['Aufräumjob','noch nie gelaufen','warn']);
      hinweis='mathe9_aufraeumen() wurde bisher nicht ausgeführt. Ohne Aufruf löscht nichts — siehe DATENSCHUTZ.md.';
    }else{
      kacheln.push(['letzter Aufräumlauf',
        `vor ${w.tage_seit_erfolg!=null?w.tage_seit_erfolg+' Tg.':'—'}`,
        w.ueberfaellig?'warn':'good']);
      kacheln.push(['zuletzt gelöscht',
        `${w.ereignisse||0} Ereignisse · ${w.fortschritt||0} Fortschritt · ${w.tokens||0} Tokens`,'']);
      kacheln.push(['Läufe (30 Tage)',String(w.laeufe_30_tage||0),
        Number(w.laeufe_30_tage)>0?'good':'warn']);
      if(w.fehler)kacheln.push(['Fehler im letzten Lauf',w.fehler,'warn']);
      if(w.ueberfaellig)hinweis='Der letzte erfolgreiche Lauf liegt mehr als zehn Tage zurück. Geplant ist ein wöchentlicher Lauf — bitte pg_cron im Supabase-Projekt prüfen.';
    }
  }catch(e){
    kacheln.push(['Aufräumjob','Status nicht abrufbar','warn']);
    hinweis='mathe9_wartung_status() fehlt in der Datenbank oder das Konto ist nicht freigeschaltet. supabase/setup.sql erneut ausführen.';
  }

  $('#opsBox').innerHTML=kacheln.map(([name,wert,klasse])=>
    `<dl class="opsItem ${klasse}"><dt>${esc(name)}</dt><dd>${esc(wert)}</dd></dl>`).join('')
    +(hinweis?`<p class="opsNote">${esc(hinweis)}</p>`:'');
}

/* ---------- Denkfehler über die Lernbereiche hinweg ----------
   Einzelne IDs sind für den Unterricht zu klein: „mal_statt_geteilt" in
   KP-07 sagt wenig. Erst die Zusammenfassung zeigt das Muster, das eine
   ganze Klasse betrifft — und ob es an einem Lernbereich hängt oder eben
   nicht. Der Katalog liegt in schema/fehlvorstellungen-kategorien.json
   und wird von werkzeuge/fehlvorstellungen-sichten.js fachlich gepflegt. */
let kategorien=null;
async function ladeKategorien(){
  if(kategorien)return kategorien;
  try{
    const r=await fetch('../schema/fehlvorstellungen-kategorien.json',{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const daten=await r.json();
    kategorien=(daten.kategorien||[]).map(k=>({...k,regeln:k.muster.map(m=>new RegExp(m))}));
  }catch(e){
    console.warn('[Dashboard] Kategorienkatalog nicht ladbar:',e.message);
    kategorien=[];
  }
  return kategorien;
}
function kategorieFuer(id){
  for(const k of kategorien||[])if(k.regeln.some(r=>r.test(id)))return k;
  return null;
}
function renderKategorien(antworten){
  const koerper=$('#categoryBody');
  if(!koerper)return;
  if(!kategorien||!kategorien.length){
    koerper.innerHTML='<tr><td colspan="4" class="muted">Kategorienkatalog nicht geladen.</td></tr>';
    return;
  }
  const proKat=new Map();
  antworten.forEach(e=>{
    const id=payload(e.payload).misconception;
    if(!id)return;
    const k=kategorieFuer(id);
    const schluessel=k?k.id:'(ohne Kategorie)';
    const titel=k?k.titel:'ohne Kategorie';
    if(!proKat.has(schluessel))proKat.set(schluessel,{titel,n:0,bereiche:new Set(),ids:new Map()});
    const a=proKat.get(schluessel);
    a.n++;
    const bereich=String(e.unit||'').split('-')[0].toUpperCase();
    if(bereich)a.bereiche.add(bereich);
    a.ids.set(id,(a.ids.get(id)||0)+1);
  });
  const zeilen=[...proKat.values()].sort((a,b)=>b.n-a.n);
  koerper.innerHTML=zeilen.length?zeilen.map(a=>{
    const top=[...a.ids.entries()].sort((x,y)=>y[1]-x[1]).slice(0,3)
      .map(([id,n])=>`${id} (${n})`).join(', ');
    /* Mehrere Bereiche heißen: Das ist kein Themenproblem, sondern ein
       Denkfehler, der die Rechnung selbst betrifft. */
    const mehrere=a.bereiche.size>1;
    return `<tr><td>${esc(a.titel)}</td><td>${a.n}</td><td>${mehrere?'<b>':''}${esc([...a.bereiche].sort().join(', ')||'–')}${mehrere?'</b>':''}</td><td class="muted">${esc(top)}</td></tr>`;
  }).join(''):'<tr><td colspan="4" class="muted">Noch keine diagnostizierten Denkfehler.</td></tr>';
}

async function loadRoster(){const cls=$('#classFilter').value.trim();const q='mathe9_students?select=id,login_name,display_name,class_code,active,created_at'+(cls?'&class_code=eq.'+encodeURIComponent(cls):'')+'&order=class_code,login_name';const rows=await request(rest()+q);renderRoster(rows||[])}
function renderRoster(rows){$('#rosterBody').innerHTML=rows.length?rows.map(r=>`<tr><td><code>${esc(r.login_name)}</code></td><td>${esc(r.display_name)}</td><td>${esc(r.class_code)}</td><td><span class="badge"><i class="dot ${r.active?'active':''}"></i>${r.active?'aktiv':'gesperrt'}</span></td><td class="actions"><button data-toggle="${r.id}" data-active="${r.active}">${r.active?'Sperren':'Freigeben'}</button><button class="danger" data-delete="${r.id}">Löschen</button></td></tr>`).join(''):'<tr><td colspan="5" class="muted">Noch keine Einträge.</td></tr>'}
async function addStudent(event){event.preventDefault();const login=normalizeLogin($('#studentLogin').value),display=$('#studentDisplay').value.trim(),cls=$('#studentClass').value.trim();if(!validLogin(login)){rosterMessage('Benutzername muss nachname.vorname entsprechen.',true);return}try{await request(rest()+'mathe9_students',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({login_name:login,display_name:display,class_code:cls,active:true})});event.target.reset();$('#studentClass').value=$('#classFilter').value.trim();rosterMessage('Schüler wurde freigeschaltet.');await loadRoster()}catch(e){rosterMessage('Hinzufügen fehlgeschlagen: '+e.message,true)}}
async function rosterClick(event){const toggle=event.target.closest('[data-toggle]'),del=event.target.closest('[data-delete]');try{if(toggle){const active=toggle.dataset.active==='true';await request(rest()+'mathe9_students?id=eq.'+encodeURIComponent(toggle.dataset.toggle),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({active:!active})});rosterMessage(active?'Zugang wurde gesperrt.':'Zugang wurde freigegeben.')}else if(del){if(!confirm('Diesen Eintrag wirklich löschen?'))return;await request(rest()+'mathe9_students?id=eq.'+encodeURIComponent(del.dataset.delete),{method:'DELETE',headers:{Prefer:'return=minimal'}});rosterMessage('Eintrag wurde gelöscht.')}else return;await loadRoster()}catch(e){rosterMessage('Änderung fehlgeschlagen: '+e.message,true)}}

async function loadDashboard(){const mins=Number($('#range').value),since=new Date(Date.now()-mins*60000).toISOString(),cls=$('#classFilter').value.trim(),cq=cls?'&class_code=eq.'+encodeURIComponent(cls):'';const [progress,events]=await Promise.all([request(rest()+'mathe9_progress?select=*&updated_at=gte.'+encodeURIComponent(since)+cq+'&order=updated_at.desc&limit=500'),request(rest()+'mathe9_events?select=*&ts=gte.'+encodeURIComponent(since)+cq+'&order=ts.desc&limit=2000')]);render(progress||[],events||[])}
function zeitwert(e){const t=new Date(e?.ts||e?.updated_at||0).getTime();return Number.isFinite(t)?t:0}
function sichereDauer(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.min(n,12*60*60*1000):null}

/* Aus einzelnen Ereignissen echte Aufgaben-Sitzungen bilden. duration_ms ist
   bei jedem Antwortversuch kumulativ seit task_view. Deshalb darf nicht jeder
   Versuch als eigene Aufgabenzeit gezählt werden. */
/* Eine Aufgaben-Sitzung = eine Bearbeitung EINER Aufgabe durch EIN Kind.
   Primärschlüssel ist die task_session_id, die die Anwendung seit V26 an
   jedes Ereignis hängt. Sie ist auch dann eindeutig, wenn Ereignisse
   verspätet eintreffen, zwei Tabs offen sind oder dieselbe Aufgabe ein
   zweites Mal bearbeitet wird. Die frühere Zeitheuristik bleibt nur für
   Altdaten ohne diese ID. */
function taskSitzungen(events){
  const sortiert=[...events].sort((a,b)=>zeitwert(a)-zeitwert(b));
  const schluessel=e=>e.student_id||e.device_id||null;
  const sitzungId=e=>payload(e.payload).task_session_id||null;

  const sitzungen=[],aktiv=new Map();
  const nachId=new Map();
  const ohneId=[];

  sortiert.forEach(e=>{
    const k=schluessel(e);if(!k)return;
    if(!['task_view','answer','heartbeat'].includes(e.event_type))return;
    const id=sitzungId(e);
    if(!id){ohneId.push(e);return;}

    const sitzungsKey=k+'|'+id;
    let sitzung=nachId.get(sitzungsKey);
    if(!sitzung){
      sitzung={
        id,key:k,name:e.student||'–',unit:e.unit||'–',path:e.path||null,task:e.task||'–',
        start:zeitwert(e),ende:zeitwert(e),duration:null,answers:[],correct:false,completed:false,
        beendetDurchWechsel:false
      };
      nachId.set(sitzungsKey,sitzung);sitzungen.push(sitzung);
    }
    sitzung.name=e.student||sitzung.name;
    sitzung.ende=Math.max(sitzung.ende,zeitwert(e));
    if(e.event_type==='answer'){
      const p=payload(e.payload),d=sichereDauer(p.duration_ms);
      sitzung.answers.push(e);
      if(d)sitzung.duration=Math.max(sitzung.duration||0,d);
      if(p.correct===true){sitzung.correct=true;sitzung.completed=true;}
    }
  });

  /* Noch offene Sitzungen: gesehen, aber nicht richtig beantwortet. */
  nachId.forEach(sitzung=>{
    if(!sitzung.completed){
      const vorhanden=aktiv.get(sitzung.key);
      if(!vorhanden||sitzung.start>vorhanden.start)aktiv.set(sitzung.key,sitzung);
    }
  });

  /* ---- Rückfall für Ereignisse ohne task_session_id (vor V26) ---- */
  const altAktiv=new Map();
  ohneId.forEach(e=>{
    const k=schluessel(e);
    if(e.event_type==='task_view'){
      const alt=altAktiv.get(k);
      if(alt&&!alt.completed){alt.beendetDurchWechsel=true;alt.ende=zeitwert(e)}
      const sitzung={
        id:null,key:k,name:e.student||'–',unit:e.unit||'–',path:e.path||null,task:e.task||'–',
        start:zeitwert(e),ende:null,duration:null,answers:[],correct:false,completed:false,
        beendetDurchWechsel:false,heuristisch:true
      };
      sitzungen.push(sitzung);altAktiv.set(k,sitzung);return;
    }
    const p=payload(e.payload),d=sichereDauer(p.duration_ms);
    let sitzung=altAktiv.get(k);
    const passt=sitzung&&(!e.task||!sitzung.task||e.task===sitzung.task)
      &&(!e.unit||!sitzung.unit||e.unit===sitzung.unit);
    if(!passt){
      const ende=zeitwert(e);
      sitzung={
        id:null,key:k,name:e.student||'–',unit:e.unit||'–',path:e.path||null,task:e.task||'–',
        start:d?ende-d:ende,ende,duration:d,answers:[],correct:false,completed:false,
        beendetDurchWechsel:false,inferred:true,heuristisch:true
      };
      sitzungen.push(sitzung);altAktiv.set(k,sitzung);
    }
    sitzung.answers.push(e);sitzung.name=e.student||sitzung.name;sitzung.ende=zeitwert(e);
    if(d)sitzung.duration=Math.max(sitzung.duration||0,d);
    if(p.correct===true){sitzung.correct=true;sitzung.completed=true;altAktiv.delete(k)}
  });
  altAktiv.forEach((sitzung,k)=>{if(!aktiv.has(k))aktiv.set(k,sitzung)});

  return {sitzungen,aktiv};
}

function render(progress,events){
  const latestEvent=new Map();
  events.forEach(e=>{const k=e.student_id||e.device_id;if(!k||!e.ts)return;const old=latestEvent.get(k);if(!old||zeitwert(e)>zeitwert(old))latestEvent.set(k,e)});
  const latestProgress=new Map();
  progress.forEach(p=>{const k=(p.student_id||p.device_id)+'|'+p.unit+'|'+p.path;const old=latestProgress.get(k);if(!old||zeitwert(p)>zeitwert(old))latestProgress.set(k,p)});
  const rows=[...latestProgress.values()];
  const activeKeys=new Set([...latestEvent].filter(([,e])=>Date.now()-zeitwert(e)<ACTIVE_MS).map(([k])=>k));
  const students=new Set(events.map(e=>e.student_id||e.device_id).filter(Boolean));
  const ans=events.filter(e=>e.event_type==='answer');
  const ok=ans.filter(e=>payload(e.payload).correct===true).length;
  const sitz=taskSitzungen(events);
  const abgeschlossene=sitz.sitzungen.filter(x=>x.completed&&sichereDauer(x.duration));
  const dauern=abgeschlossene.map(x=>x.duration);
  const medGesamt=median(dauern);

  $('#activeNow').textContent=activeKeys.size;
  $('#studentsToday').textContent=students.size;
  $('#answers').textContent=ans.length;
  $('#correctRate').textContent=ans.length?Math.round(ok/ans.length*100)+' %':'–';
  $('#medianTime').textContent=medGesamt?dauer(medGesamt):'–';

  const proKind=new Map();
  abgeschlossene.forEach(x=>{if(!proKind.has(x.key))proKind.set(x.key,[]);proKind.get(x.key).push(x.duration)});
  rows.sort((a,b)=>{
    const ka=a.student_id||a.device_id,kb=b.student_id||b.device_id,aa=activeKeys.has(ka),ab=activeKeys.has(kb);
    if(aa!==ab)return aa?-1:1;
    return zeitwert(latestEvent.get(kb)||b)-zeitwert(latestEvent.get(ka)||a);
  });
  $('#studentsBody').innerHTML=rows.length?rows.map(r=>{
    const k=r.student_id||r.device_id,on=activeKeys.has(k),last=latestEvent.get(k)?.ts||r.updated_at,p=Math.max(0,Math.min(100,Number(r.progress_percent)||0));
    const m=median(proKind.get(k)||[]);
    return `<tr><td><span class="badge"><i class="dot ${on?'active':''}"></i>${on?'aktiv':'inaktiv'}</span></td><td>${esc(r.student)}</td><td>${esc(r.unit)}</td><td>${esc(r.path||'–')}</td><td><div class="progress"><i style="width:${p}%"></i></div><small>${r.completed_tasks||0}/${r.total_tasks||0} · ${p}%</small></td><td>${esc(r.current_task||'–')}</td><td>${m?dauer(m):'–'}</td><td>${ago(last)}</td></tr>`
  }).join(''):'<tr><td colspan="8" class="muted">Noch keine Fortschrittsdaten.</td></tr>';

  /* Festhänger werden pro Aufgaben-Sitzung genau einmal gezählt. */
  const LANG=180000,jetzt=Date.now(),grenze=medGesamt?Math.max(LANG,medGesamt*3):LANG,haenger=[];
  const AKTIV_FENSTER=5*60*1000;
  sitz.aktiv.forEach(x=>{
    const letzteAktivitaet=x.ende||x.start;
    if(jetzt-letzteAktivitaet>AKTIV_FENSTER)return;
    const seit=Math.max(0,jetzt-x.start);
    if(seit>LANG)haenger.push({name:x.name,unit:x.unit,task:x.task,ms:seit,lage:x.answers.length?'noch falsch':'noch offen'});
  });
  abgeschlossene.forEach(x=>{
    if(x.duration>grenze)haenger.push({name:x.name,unit:x.unit,task:x.task,ms:x.duration,lage:'gelöst, aber lang'});
  });
  haenger.sort((a,b)=>b.ms-a.ms);
  $('#stuckBody').innerHTML=haenger.length?haenger.slice(0,12).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.unit)}</td><td>${esc(x.task||'–')}</td><td>${dauer(x.ms)}</td><td>${esc(x.lage)}</td></tr>`).join(''):'<tr><td colspan="5" class="muted">Gerade hängt niemand auffällig lange fest.</td></tr>';

  /* Vorhersagen zu den Animationen. Die Trefferquote allein sagt wenig —
   interessant ist, ob eine falsche Vorstellung NACH der Animation korrigiert
   ist. Dafür wird zu jeder falschen Vorhersage die nächste Antwort desselben
   Kindes gesucht. */
/* Pfadempfehlungen: Wurde die Empfehlung angenommen, und lief es danach
   besser? Das ist die Datengrundlage, um die Schwellen irgendwann durch
   gemessene statt plausible Werte zu ersetzen. */
const empf=events.filter(e=>e.event_type==='pfadempfehlung'&&payload(e.payload).empfohlen);
const pfadWahlen=events.filter(e=>e.event_type==='path_selected');
const proEmpf=new Map();
empf.forEach(e=>{const p=payload(e.payload);const k=p.von+' → '+p.empfohlen;
if(!proEmpf.has(k))proEmpf.set(k,{n:0,quoten:[],sicher:0,gefolgt:0,danach:[]});
const a=proEmpf.get(k);a.n++;if(typeof p.quote==='number')a.quoten.push(p.quote);
if(p.sicher)a.sicher++;
const kind=e.student_id||e.device_id,ab=zeitwert(e),wahlBis=ab+30*60*1000;
/* Angenommen heißt: Das Kind wählt innerhalb von 30 Minuten in derselben
   Einheit ausdrücklich den empfohlenen Pfad. Für ältere Daten ohne
   path_selected gilt die erste passende Aufgaben-Sitzung als Rückfall. */
const wahl=pfadWahlen.find(x=>(x.student_id||x.device_id)===kind&&zeitwert(x)>ab&&zeitwert(x)<=wahlBis
  &&x.unit===e.unit&&(payload(x.payload).path||x.path)===p.empfohlen);
const passendeSitzungen=sitz.sitzungen.filter(x=>x.key===kind&&x.unit===e.unit&&x.path===p.empfohlen
  &&x.start>ab&&x.start<=ab+60*60*1000&&x.answers.length).sort((x,y)=>x.start-y.start);
if(wahl||(!pfadWahlen.some(x=>(x.student_id||x.device_id)===kind&&x.unit===e.unit&&zeitwert(x)>ab)&&passendeSitzungen.length)){
  a.gefolgt++;
  const ersteFuenf=passendeSitzungen.slice(0,5);
  if(ersteFuenf.length){
    const treffer=ersteFuenf.filter(x=>{const q=payload(x.answers[0]?.payload);return q.correct===true&&(q.attempts||1)===1}).length;
    a.danach.push(treffer/ersteFuenf.length);
  }
}});
const recoZeilen=[...proEmpf.entries()].sort((a,b)=>b[1].n-a[1].n);
$('#recoBody').innerHTML=recoZeilen.length?recoZeilen.map(([k,a])=>{
const mq=median(a.quoten.map(x=>Math.round(x*100)));
const md=median(a.danach.map(x=>Math.round(x*100)));
return `<tr><td>${esc(k)}</td><td>${a.n}</td><td>${mq!=null?mq+' %':'–'}</td>
<td>${Math.round(a.sicher/a.n*100)} %</td><td>${Math.round(a.gefolgt/a.n*100)} %</td>
<td>${md!=null?md+' %':'–'}</td></tr>`}).join('')
:'<tr><td colspan="6" class="muted">Noch keine Empfehlungen erfasst.</td></tr>';
const vor=events.filter(e=>e.event_type==='animation_prediction');
/* Nur die erste Antwort desselben Kindes aus derselben Einheit und demselben
   Pfad innerhalb von 15 Minuten gilt als Wirkung nach der Animation. */
const nachAntwort=vorhersage=>{
  const k=vorhersage.student_id||vorhersage.device_id,ab=zeitwert(vorhersage),bis=ab+15*60*1000;
  return ans.filter(e=>(e.student_id||e.device_id)===k&&zeitwert(e)>ab&&zeitwert(e)<=bis
    &&(!vorhersage.unit||e.unit===vorhersage.unit)
    &&(!vorhersage.path||e.path===vorhersage.path))
    .sort((a,b)=>zeitwert(a)-zeitwert(b))[0];
};
const proAnim=new Map();let vorRichtig=0,erholt=0,erholtBasis=0;
vor.forEach(e=>{const p=payload(e.payload);const name=p.animation||'—';
if(!proAnim.has(name))proAnim.set(name,{n:0,ok:0,danach:0,danachBasis:0,proKind:new Map()});
const a=proAnim.get(name);a.n++;const k=e.student_id||e.device_id;
if(p.correct===true){a.ok++;vorRichtig++;}
else{a.proKind.set(k,(a.proKind.get(k)||0)+1);const folge=nachAntwort(e);
if(folge){a.danachBasis++;erholtBasis++;const fp=payload(folge.payload);
if(fp.correct===true&&(fp.attempts||1)===1){a.danach++;erholt++;}}}});
$('#predCount').textContent=vor.length;
$('#predRate').textContent=vor.length?Math.round(vorRichtig/vor.length*100)+' %':'–';
$('#predRecover').textContent=erholtBasis?Math.round(erholt/erholtBasis*100)+' %':'–';
const predZeilen=[...proAnim.entries()].sort((a,b)=>b[1].n-a[1].n);
$('#predBody').innerHTML=predZeilen.length?predZeilen.map(([name,a])=>{
const mehrfach=[...a.proKind.values()].filter(v=>v>=2).length;
return `<tr><td>${esc(name)}</td><td>${a.n}</td><td>${a.n?Math.round(a.ok/a.n*100)+' %':'–'}</td><td>${a.danachBasis?Math.round(a.danach/a.danachBasis*100)+' %':'–'}</td><td>${mehrfach||'–'}</td></tr>`
}).join(''):'<tr><td colspan="5" class="muted">Noch keine Vorhersagen erfasst.</td></tr>';
const mis={};
  ans.forEach(e=>{const m=payload(e.payload).misconception;if(m)mis[m]=(mis[m]||0)+1});
  const sorted=Object.entries(mis).sort((a,b)=>b[1]-a[1]).slice(0,10),max=sorted[0]?.[1]||1;
  $('#misconceptions').innerHTML=sorted.length?sorted.map(([k,n])=>`<div class="bar"><span>${esc(k)}</span><div class="barTrack"><i style="width:${n/max*100}%"></i></div><b>${n}</b></div>`).join(''):'<p class="muted">Noch keine diagnostizierten Denkfehler.</p>';
  renderKategorien(ans);
  $('#feed').innerHTML=ans.slice(0,20).map(e=>{const p=payload(e.payload);return `<div class="feedItem"><b class="${p.correct?'ok':'no'}">${p.correct?'richtig':'noch falsch'}</b> · ${esc(e.student)} · ${esc(e.unit)} / ${esc(e.task)}<br><span class="muted">${ago(e.ts)} · ${p.attempts||1}. Versuch${p.misconception?' · '+esc(p.misconception):''}</span></div>`}).join('')||'<p class="muted">Noch keine Antworten.</p>';
}
function start(){stop();timer=setInterval(()=>{if(document.visibilityState==='visible')loadAll()},5000)}function stop(){if(timer){clearInterval(timer);timer=null}}

$('#teacherLogin').addEventListener('submit',async e=>{e.preventDefault();const err=$('#loginError');err.hidden=true;try{await signIn($('#teacherEmail').value.trim(),$('#teacherPassword').value);await appOeffnen()}catch(x){err.textContent='Anmeldung fehlgeschlagen: '+x.message;err.hidden=false}});
$('#logout').addEventListener('click',signOut);$('#refresh').addEventListener('click',()=>{loadAll();loadOps()});$('#range').addEventListener('change',loadAll);$('#classFilter').addEventListener('change',()=>{ $('#studentClass').value=$('#classFilter').value.trim();loadAll()});$('#studentForm').addEventListener('submit',addStudent);$('#rosterBody').addEventListener('click',rosterClick);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&session)loadAll()});
if(!C.enabled||!C.url||!C.anonKey){$('#loginError').textContent='Supabase ist in assets/js/supabase-config.js noch nicht vollständig konfiguriert.';$('#loginError').hidden=false;showLogin()}else if(session?.access_token){appOeffnen()}else showLogin();
