#!/usr/bin/env -S npx tsx
//
// generar-legales.ts — genera privacidad/index.html, terminos/index.html
// y soporte/index.html a partir del origen de verdad en la app Aluzia.
//
// Uso: npx tsx scripts/generar-legales.ts
//
// Si mueves el proyecto de la app, actualiza la ruta de los imports de abajo.

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  AVISO_PRIVACIDAD as _PRIVACIDAD,
  TERMINOS_USO     as _TERMINOS,
  FAQ_AYUDA        as _FAQ,
  type TextoLegal,
  type PreguntaFAQ,
} from '../../Proyectos/aluzia-test/lib/textos-legales';

// ── Correo de soporte — única variable a cambiar aquí ─────────────────────────
const SOPORTE_EMAIL = 'soporte@aluzia.app';

// Sustituye el placeholder '[CORREO DE SOPORTE]' del archivo fuente
const fix = (s: string): string => s.replaceAll('[CORREO DE SOPORTE]', SOPORTE_EMAIL);
function fixAll(o: unknown): unknown {
  if (typeof o === 'string') return fix(o);
  if (Array.isArray(o))     return o.map(fixAll);
  if (o && typeof o === 'object')
    return Object.fromEntries(Object.entries(o as object).map(([k, v]) => [k, fixAll(v)]));
  return o;
}

const PRIVACIDAD = fixAll(_PRIVACIDAD) as TextoLegal;
const TERMINOS   = fixAll(_TERMINOS)   as TextoLegal;
const FAQ        = fixAll(_FAQ)        as PreguntaFAQ[];

// ── Plantillas ─────────────────────────────────────────────────────────────────

const FONTS = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Raleway:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">`;

function header(current: 'privacidad' | 'terminos' | 'soporte'): string {
  const link = (href: string, label: string) =>
    `<a href="/${href}"${href === current ? ' class="current"' : ''}>${label}</a>`;
  return `  <header class="site-header">
    <a href="/" class="site-logo" aria-label="Aluzia — inicio">
      <img src="/assets/logo-aluzia.png" alt="Aluzia" height="40">
    </a>
    <nav class="site-nav" aria-label="Navegación principal">
      ${link('privacidad', 'Privacidad')}
      ${link('terminos', 'Términos')}
      ${link('soporte', 'Soporte')}
    </nav>
  </header>`;
}

const FOOTER = `  <footer class="site-footer">
    <nav class="footer-links" aria-label="Navegación legal">
      <a href="/privacidad">Política de privacidad</a>
      <a href="/terminos">Términos de uso</a>
      <a href="/soporte">Soporte</a>
    </nav>
    <p class="footer-copy">&copy; 2026 César Ricardo Elizalde Hernández · Todos los derechos reservados</p>
  </footer>`;

function page(
  title: string,
  current: 'privacidad' | 'terminos' | 'soporte',
  description: string,
  body: string,
): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Aluzia</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="icon" type="image/png" href="/assets/favicon.png">
${FONTS}
  <link rel="stylesheet" href="/assets/aluzia.css">
</head>
<body>

${header(current)}

  <main>
    <div class="legal-wrap">
${body}
    </div>
  </main>

${FOOTER}

</body>
</html>`;
}

// ── Renderizadores ─────────────────────────────────────────────────────────────

function renderTextoLegal(doc: TextoLegal): string {
  const secciones = doc.secciones.map(sec => {
    const titulo = sec.titulo ? `      <h2>${esc(sec.titulo)}</h2>\n` : '';
    const partes: string[] = [];
    let ulOpen = false;
    for (const el of sec.elementos) {
      if (el.tipo === 'vineta') {
        if (!ulOpen) { partes.push('        <ul>'); ulOpen = true; }
        partes.push(`          <li>${escEmail(el.texto)}</li>`);
      } else {
        if (ulOpen) { partes.push('        </ul>'); ulOpen = false; }
        partes.push(`        <p>${escEmail(el.texto)}</p>`);
      }
    }
    if (ulOpen) partes.push('        </ul>');
    return `      <div class="legal-section">\n${titulo}${partes.join('\n')}\n      </div>`;
  });
  return `      <h1>${esc(doc.titulo)}</h1>
      <p class="legal-updated">Última actualización: ${esc(doc.fechaActualizacion)}</p>\n${secciones.join('\n')}`;
}

function renderFAQ(faq: PreguntaFAQ[]): string {
  const items = faq.map(q => `        <details>
          <summary>${esc(q.pregunta)}</summary>
          <p>${escEmail(q.respuesta)}</p>
        </details>`).join('\n');
  return `      <h1>Soporte</h1>
      <p class="legal-updated">¿En qué podemos ayudarte?</p>

      <div class="faq-list">
${items}
      </div>

      <div class="block block-contact">
        <h2>Escríbenos</h2>
        <p>¿No encontraste lo que buscabas? Mándanos un correo y te respondemos lo antes posible.</p>
        <p><a href="mailto:${SOPORTE_EMAIL}">${esc(SOPORTE_EMAIL)}</a></p>
      </div>

      <div class="block block-crisis">
        <h2>Si necesitas hablar con alguien</h2>
        <p class="note">Aluzia te acompaña cada mañana, pero no sustituye el apoyo de un profesional. Si estás pasando por un momento difícil, estas líneas son reales, gratuitas, y siempre hay alguien del otro lado.</p>
        <div class="crisis-line">
          <div><span class="crisis-name">SAPTEL</span><span class="crisis-desc">apoyo emocional por teléfono · 24 horas</span></div>
          <a href="tel:5552598121" class="crisis-tel">55 5259 8121</a>
        </div>
        <div class="crisis-line">
          <div><span class="crisis-name">Línea de la Vida</span><span class="crisis-desc">apoyo en momentos de crisis · 24 horas</span></div>
          <a href="tel:8002900024" class="crisis-tel">800 290 0024</a>
        </div>
        <div class="crisis-line">
          <div><span class="crisis-name">Locatel</span><span class="crisis-desc">Ciudad de México</span></div>
          <a href="tel:*0311" class="crisis-tel">*0311</a>
        </div>
      </div>`;
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escEmail(s: string): string {
  return esc(s).replace(
    new RegExp(esc(SOPORTE_EMAIL), 'g'),
    `<a href="mailto:${SOPORTE_EMAIL}">${esc(SOPORTE_EMAIL)}</a>`,
  );
}

// ── Escritura ──────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = resolve(__dir, '..');

mkdirSync(resolve(OUT, 'privacidad'), { recursive: true });
mkdirSync(resolve(OUT, 'terminos'),   { recursive: true });
mkdirSync(resolve(OUT, 'soporte'),    { recursive: true });

writeFileSync(resolve(OUT, 'privacidad/index.html'), page(
  PRIVACIDAD.titulo, 'privacidad',
  'Política de privacidad de Aluzia: qué datos recabamos, cómo los usamos y tus derechos.',
  renderTextoLegal(PRIVACIDAD),
));
writeFileSync(resolve(OUT, 'terminos/index.html'), page(
  TERMINOS.titulo, 'terminos',
  'Términos de uso de Aluzia: condiciones del servicio, suscripción y contenido.',
  renderTextoLegal(TERMINOS),
));
writeFileSync(resolve(OUT, 'soporte/index.html'), page(
  'Soporte', 'soporte',
  'Centro de ayuda de Aluzia: preguntas frecuentes, contacto y líneas de apoyo.',
  renderFAQ(FAQ),
));

console.log('✓ privacidad/index.html');
console.log('✓ terminos/index.html');
console.log('✓ soporte/index.html');
console.log('  email →', SOPORTE_EMAIL);
