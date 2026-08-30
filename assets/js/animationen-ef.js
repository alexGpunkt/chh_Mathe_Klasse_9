/* ============================================================
   animationen-ef.js · Ebene Figuren
   Acht kurze Animationen zu Einheiten, Koordinaten, Umfang,
   Flächenformeln, dem Haus der Vierecke und Zerlegungen.
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern;
  const { Loop, steuerleiste, abzeichen, register, FARBE, h, el, stufeVon, REDUCED } = I;

  function grundbild(host, o, zeichnen, texte) {
    const st = stufeVon(o); abzeichen(host, st);
    const W = o.breite || 340, H = 190;
    const svg = el('svg',{viewBox:`0 0 ${W} ${H}`,class:'anim-svg',role:'img','aria-label':texte.alt});
    const gruppe = el('g'); svg.appendChild(gruppe); zeichnen(gruppe,W,H,st);
    const info = h('div','anim-ables');
    const phasen = texte[st] || texte.B;
    const zeig = i => { info.innerHTML = phasen.slice(0,i+1).join(' &nbsp;→&nbsp; '); gruppe.style.opacity = String(0.45 + 0.55*(i+1)/phasen.length); };
    zeig(REDUCED ? phasen.length-1 : 0);
    const loop = Loop(t=>zeig(Math.floor(t/1.5)%phasen.length));
    const bar = steuerleiste(loop);
    host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
    if(!REDUCED){loop.play();bar._sync();} return loop;
  }
  const line=(g,x1,y1,x2,y2,c=FARBE.ink,w=2)=>g.appendChild(el('line',{x1,y1,x2,y2,stroke:c,'stroke-width':w}));
  const label=(g,x,y,t,c=FARBE.ink)=>g.appendChild(el('text',{x,y,fill:c,'font-size':12,'font-family':'monospace','text-anchor':'middle','font-weight':700},t));
  const rect=(g,x,y,w,h,c=FARBE.b,fill='none')=>g.appendChild(el('rect',{x,y,width:w,height:h,stroke:c,'stroke-width':2,fill,rx:3}));
  const texte=(alt,A,B,C)=>({alt,A,B,C});

  register({id:'einheiten-flaeche',titel:'Länge oder Fläche umrechnen',bezug:'EF-01',kurz:'Längen springen mit 10, Flächen mit 100.',text:{A:['1 m = 100 cm'],B:['1 m² = 10 000 cm²'],C:['Zwei Richtungen ergeben 10 · 10 = 100.']},bauen(host,o){return grundbild(host,o,(g,W)=>{rect(g,35,40,95,95,FARBE.a,'rgba(31,104,73,.12)');for(let i=1;i<10;i++){line(g,35+i*9.5,40,35+i*9.5,135,FARBE.gitter,1);line(g,35,40+i*9.5,130,40+i*9.5,FARBE.gitter,1);}line(g,175,88,300,88,FARBE.b,5);label(g,82,155,'1 m²');label(g,237,75,'1 m = 100 cm');},texte('Quadratgitter und Längenstrecke',['1 m','100 cm'],['1 m²','100 · 100 cm²','10 000 cm²'],['je Richtung ·10','Fläche ·100']));}});

  register({id:'koordinaten-flaeche',titel:'Figur im Koordinatensystem',bezug:'EF-02',kurz:'Punkte setzen, Seitenlängen ablesen, Fläche bestimmen.',text:{A:['erst x, dann y'],B:['Differenzen liefern Seitenlängen'],C:['Zerlegen hilft bei schrägen Figuren']},bauen(host,o){return grundbild(host,o,(g,W,H)=>{line(g,30,H-25,W-20,H-25);line(g,45,H-10,45,15);for(let i=0;i<9;i++){line(g,45+i*30,H-29,45+i*30,H-21,FARBE.faint,1);line(g,41,H-25-i*25,49,H-25-i*25,FARBE.faint,1);}g.appendChild(el('polygon',{points:`75,140 255,140 255,40 75,40`,fill:'rgba(32,91,156,.15)',stroke:FARBE.b,'stroke-width':3}));[['A',75,155],['B',255,155],['C',255,33],['D',75,33]].forEach(p=>label(g,p[1],p[2],p[0]));},texte('Rechteck im Koordinatensystem',['A(1|1)','B(7|1)'],['Breite: 7-1=6','Höhe: 5-1=4','A=24 FE'],['Koordinatendifferenzen','U=20 LE','A=24 FE']));}});

  register({id:'umfang-flaeche',titel:'Umfang und Fläche unterscheiden',bezug:'EF-03/04',kurz:'Randlänge und bedeckte Fläche werden sichtbar getrennt.',text:{A:['Rand = Umfang'],B:['Innenraum = Fläche'],C:['Verdoppeln wirkt unterschiedlich']},bauen(host,o){return grundbild(host,o,(g)=>{rect(g,55,38,225,110,FARBE.a,'rgba(32,91,156,.15)');label(g,167,30,'a = 8 cm');label(g,35,96,'b = 4 cm');label(g,167,94,'A = a · b',FARBE.b);},texte('Rechteck mit markiertem Rand und Innenraum',['Rand addieren','U=2a+2b'],['Innenraum auslegen','A=a·b'],['Seiten ·2','Umfang ·2','Fläche ·4']));}});

  register({id:'dreieck-flaeche',titel:'Warum die Dreiecksfläche halbiert wird',bezug:'EF-05',kurz:'Zwei gleiche Dreiecke bilden ein Parallelogramm.',text:{A:['Grundseite mal Höhe, dann halbieren'],B:['Zwei Dreiecke ergeben g·h'],C:['h steht senkrecht auf g']},bauen(host,o){return grundbild(host,o,(g)=>{g.appendChild(el('polygon',{points:'45,145 165,145 165,45',fill:'rgba(31,104,73,.2)',stroke:FARBE.a,'stroke-width':3}));g.appendChild(el('polygon',{points:'165,45 285,45 165,145',fill:'rgba(32,91,156,.16)',stroke:FARBE.b,'stroke-width':3}));line(g,165,45,165,145,FARBE.c,2);label(g,105,162,'g');label(g,180,98,'h');},texte('Zwei gleiche Dreiecke als Parallelogramm',['g · h','durch 2'],['Parallelogramm: g·h','ein Dreieck: g·h:2'],['Höhe senkrecht','A=g·h/2']));}});

  register({id:'viereck-haus',titel:'Haus der Vierecke',bezug:'EF-06',kurz:'Eigenschaften werden von oben nach unten weitergegeben.',text:{A:['Figuren an Eigenschaften erkennen'],B:['Mehrfachzugehörigkeit verstehen'],C:['Aussagen begründen']},bauen(host,o){return grundbild(host,o,(g)=>{[['Viereck',145,20,95],['Trapez',145,55,95],['Parallelogramm',105,90,130],['Rechteck',55,128,92],['Raute',195,128,75],['Quadrat',125,163,90]].forEach(([t,x,y,w])=>{rect(g,x,y-18,w,26,FARBE.b,'rgba(32,91,156,.08)');label(g,x+w/2,y,t);});line(g,192,28,192,37,FARBE.faint);line(g,192,63,170,72,FARBE.faint);line(g,170,98,101,110,FARBE.faint);line(g,210,98,232,110,FARBE.faint);line(g,101,136,170,145,FARBE.faint);line(g,232,136,195,145,FARBE.faint);},texte('Hierarchie der Vierecke',['Quadrat: 4 gleiche Seiten','4 rechte Winkel'],['Quadrat ist Rechteck und Raute','damit auch Parallelogramm'],['Eigenschaften gelten nach unten weiter']));}});

  register({id:'viereck-flaeche',titel:'Flächen von Parallelogramm, Raute und Drachen',bezug:'EF-07',kurz:'Umlegen oder Diagonalen halbieren.',text:{A:['A=g·h'],B:['A=e·f:2'],C:['Formel aus den gegebenen Größen wählen']},bauen(host,o){return grundbild(host,o,(g)=>{g.appendChild(el('polygon',{points:'35,140 135,140 175,55 75,55',fill:'rgba(31,104,73,.16)',stroke:FARBE.a,'stroke-width':3}));line(g,75,55,75,140,FARBE.c,2);label(g,90,157,'g');label(g,62,100,'h');g.appendChild(el('polygon',{points:'250,35 315,95 250,155 185,95',fill:'rgba(107,63,160,.12)',stroke:FARBE.c,'stroke-width':3}));line(g,185,95,315,95,FARBE.b,2);line(g,250,35,250,155,FARBE.b,2);},texte('Parallelogramm und Raute',['g · h'],['Diagonalen e und f','A=e·f:2'],['senkrechte Höhe ≠ schräge Seite']));}});

  register({id:'trapez-flaeche',titel:'Trapezfläche als mittlere Breite',bezug:'EF-08',kurz:'Parallele Seiten mitteln und mit der Höhe multiplizieren.',text:{A:['a und c sind parallel'],B:['m=(a+c):2'],C:['A=m·h']},bauen(host,o){return grundbild(host,o,(g)=>{g.appendChild(el('polygon',{points:'45,145 285,145 230,55 95,55',fill:'rgba(201,138,18,.15)',stroke:FARBE.gelb,'stroke-width':3}));line(g,95,55,95,145,FARBE.c,2);label(g,165,163,'a');label(g,162,48,'c');label(g,80,102,'h');line(g,68,100,258,100,FARBE.b,3);label(g,270,104,'m');},texte('Trapez mit Mittellinie',['parallele Seiten a,c'],['m=(a+c):2'],['A=m·h','A=(a+c)·h:2']));}});

  register({id:'zusammengesetzte-flaeche',titel:'Zusammengesetzte Fläche zerlegen',bezug:'EF-09/10',kurz:'Addieren oder ein großes Rechteck um eine Aussparung verkleinern.',text:{A:['Teilflächen markieren'],B:['Addieren oder subtrahieren'],C:['Zerlegungen vergleichen und prüfen']},bauen(host,o){return grundbild(host,o,(g)=>{g.appendChild(el('path',{d:'M45 35 H285 V150 H145 V100 H45 Z',fill:'rgba(32,91,156,.14)',stroke:FARBE.b,'stroke-width':3}));line(g,145,35,145,150,FARBE.a,2);line(g,45,100,145,100,FARBE.a,2);label(g,95,72,'A₁');label(g,215,90,'A₂');},texte('L-Form in Teilrechtecke zerlegt',['zwei Rechtecke'],['A=A₁+A₂'],['Probe: großes Rechteck minus Aussparung']));}});
})();
