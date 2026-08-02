/* ============================================================
   schema-pruefer.js · winziger JSON-Schema-Prüfer

   Bewusst ohne Abhängigkeiten: Das Projekt hat keinen Build-Step, und
   dabei soll es bleiben. Unterstützt die Teilmenge, die in
   schema/tasks.schema.json wirklich vorkommt:

     type · required · properties · additionalProperties · items
     enum · pattern · minimum · maximum · minLength · minItems
     allOf · if/then · $ref (nur lokal) · $defs · propertyNames-frei

   Alles andere wird stillschweigend übergangen — ein Prüfer, der mehr
   verspricht, als er hält, ist schlimmer als keiner.
   ============================================================ */
'use strict';

function typPasst(wert, typ) {
  switch (typ) {
    case 'object': return wert !== null && typeof wert === 'object' && !Array.isArray(wert);
    case 'array': return Array.isArray(wert);
    case 'string': return typeof wert === 'string';
    case 'number': return typeof wert === 'number' && Number.isFinite(wert);
    case 'integer': return Number.isInteger(wert);
    case 'boolean': return typeof wert === 'boolean';
    case 'null': return wert === null;
    default: return true;
  }
}

function aufloesen(schema, wurzel) {
  if (schema && schema.$ref) {
    const teile = String(schema.$ref).replace(/^#\//, '').split('/');
    let ziel = wurzel;
    for (const t of teile) ziel = ziel?.[t];
    return ziel || {};
  }
  return schema || {};
}

function trifftZu(wert, schema, wurzel) {
  return pruefe(wert, schema, wurzel, '').length === 0;
}

function pruefe(wert, schema, wurzel, pfad) {
  schema = aufloesen(schema, wurzel);
  const fehler = [];
  const ort = pfad || '(Wurzel)';

  if (schema.type) {
    const typen = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!typen.some(t => typPasst(wert, t))) {
      fehler.push(`${ort}: erwartet ${typen.join(' oder ')}, gefunden ${Array.isArray(wert) ? 'array' : typeof wert}`);
      return fehler;          // Folgeprüfungen wären sinnlos
    }
  }

  if (schema.enum && !schema.enum.includes(wert)) {
    fehler.push(`${ort}: „${wert}" ist nicht erlaubt (${schema.enum.join(', ')})`);
  }
  /* `const` trägt die gesamte if/then-Logik des Aufgabenschemas — ohne
     Unterstützung würde jede Bedingung zutreffen und jeder Aufgabentyp die
     Pflichtfelder aller anderen Typen verlangen. */
  if ('const' in schema && wert !== schema.const) {
    fehler.push(`${ort}: erwartet „${schema.const}", gefunden „${wert}"`);
  }
  if (schema.pattern && typeof wert === 'string' && !new RegExp(schema.pattern).test(wert)) {
    fehler.push(`${ort}: „${wert}" passt nicht zu ${schema.pattern}`);
  }
  if (schema.minLength != null && typeof wert === 'string' && wert.length < schema.minLength) {
    fehler.push(`${ort}: mindestens ${schema.minLength} Zeichen`);
  }
  if (schema.minimum != null && typeof wert === 'number' && wert < schema.minimum) {
    fehler.push(`${ort}: mindestens ${schema.minimum}`);
  }
  if (schema.maximum != null && typeof wert === 'number' && wert > schema.maximum) {
    fehler.push(`${ort}: höchstens ${schema.maximum}`);
  }
  if (schema.minItems != null && Array.isArray(wert) && wert.length < schema.minItems) {
    fehler.push(`${ort}: mindestens ${schema.minItems} Einträge`);
  }

  if (Array.isArray(wert) && schema.items) {
    wert.forEach((w, i) => fehler.push(...pruefe(w, schema.items, wurzel, `${ort}[${i}]`)));
  }

  if (typPasst(wert, 'object')) {
    (schema.required || []).forEach(k => {
      if (!(k in wert)) fehler.push(`${ort}: Pflichtfeld „${k}" fehlt`);
    });
    const bekannt = new Set(Object.keys(schema.properties || {}));
    for (const [k, v] of Object.entries(wert)) {
      if (schema.properties && schema.properties[k]) {
        fehler.push(...pruefe(v, schema.properties[k], wurzel, `${ort}.${k}`));
      } else if (schema.additionalProperties === false && bekannt.size && !bekannt.has(k)) {
        fehler.push(`${ort}: unbekanntes Feld „${k}"`);
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        fehler.push(...pruefe(v, schema.additionalProperties, wurzel, `${ort}.${k}`));
      }
    }
  }

  (schema.allOf || []).forEach(teil => {
    if (teil.if) {
      if (trifftZu(wert, teil.if, wurzel) && teil.then) {
        fehler.push(...pruefe(wert, teil.then, wurzel, ort));
      }
      return;
    }
    fehler.push(...pruefe(wert, teil, wurzel, ort));
  });

  if (schema.if && trifftZu(wert, schema.if, wurzel) && schema.then) {
    fehler.push(...pruefe(wert, schema.then, wurzel, ort));
  }

  return fehler;
}

module.exports = { pruefe: (wert, schema) => pruefe(wert, schema, schema, '') };
