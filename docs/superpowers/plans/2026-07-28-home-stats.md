# Home Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reformat the `home-stats` list in `layouts/index.html` to match the home page aesthetic: inline minimalista con divisor vertical, eliminada la fecha duplicada, y estilos añadidos en `assets/css/home.css`.

**Architecture:** Cambio puramente presentacional. Dos archivos: `layouts/index.html` (reestructura del `<ul>` + limpieza de template logic obsoleta) y `assets/css/home.css` (nuevo bloque de estilos entre `.home-intro` y `.filter-section`). No se modifica comportamiento JS, no afecta schema, no cambia el contenido publicado.

**Tech Stack:** Hugo templates (Go template syntax), CSS con custom properties y media queries. Verificación vía `npm run check` (build + verify-seo + validate-schema + validate-sectores).

---

## Archivos a modificar

- `layouts/index.html` — líneas 11-13 (variables `$lastUpdate` y el slice de meses) y líneas 28-36 (bloque `<ul class="home-stats">`).
- `assets/css/home.css` — inserción de un nuevo bloque de reglas entre `.home-intro` (línea 179) y `.filter-section` (línea 181).

## Verificación

Al terminar: `npm run check` debe pasar con exit 0. No se commitea (AGENTS.md: "No hacer commit salvo que el usuario lo pida explícitamente").

---

### Task 1: Limpiar template logic obsoleta en `layouts/index.html`

**Files:**
- Modify: `layouts/index.html:11` (eliminar `$lastUpdate`)
- Modify: `layouts/index.html:13` (eliminar el `slice` de meses)

- [ ] **Step 1: Eliminar la variable `$lastUpdate`**

En `layouts/index.html`, línea 11, localizar:

```
            {{- $lastUpdate := "" -}}
```

Reemplazar por la línea en blanco (eliminar la asignación, pero mantener la línea vacía que ocupaba para no romper la separación visual del bloque siguiente).

Estado esperado antes:
```
            {{- $totalAyudas := 0 -}}
            {{- $lastUpdate := "" -}}
            {{- $regions := slice -}}
```

Estado esperado después:
```
            {{- $totalAyudas := 0 -}}
            {{- $regions := slice -}}
```

- [ ] **Step 2: Eliminar el `slice` de meses**

En `layouts/index.html`, línea 34, localizar el `<li>` que contiene la fecha formateada:

```
                <li><strong>Última actualización:</strong> <time datetime="{{ .Format "2006-01-02" }}">{{ .Format "2" }} de {{ index (slice "enero" "febrero" "marzo" "abril" "mayo" "junio" "julio" "agosto" "septiembre" "octubre" "noviembre" "diciembre") (sub .Month 1) }} de {{ .Format "2006" }}</time></li>
```

Reemplazar por la línea en blanco (eliminar el `<li>` completo, mantener la línea vacía para no romper la separación interna del `<ul>`).

Resultado esperado: el `<ul class="home-stats">` queda con 4 `<li>` (uno por stat) y ningún `<li>` con la fecha.

- [ ] **Step 3: Verificar que el `slice` ya no se referencia**

Ejecutar:

```bash
grep -n "slice \"" layouts/index.html
```

Expected: no output (la búsqueda no encuentra el slice eliminado).

- [ ] **Step 4: Construir y validar**

Ejecutar:

```bash
npm run check
```

Expected: exit 0. Si falla, leer el output y corregir antes de continuar (la plantilla debe seguir compilando tras quitar `$lastUpdate` y el `slice`).

---

### Task 2: Reestructurar el `<ul class="home-stats">` en `layouts/index.html`

**Files:**
- Modify: `layouts/index.html:28-36` (sustituir el bloque completo)

- [ ] **Step 1: Sustituir el bloque `<ul class="home-stats">`**

En `layouts/index.html`, localizar el bloque entero (líneas 28-36):

```
            <ul class="home-stats" aria-label="Cifras del portal">
                <li><strong>{{ $totalAyudas }}</strong> ayudas activas</li>
                <li><strong>{{ len $grants }}</strong> páginas de convocatorias</li>
                <li><strong>{{ len $uniqueRegions }}</strong> regiones cubiertas</li>
                <li><strong>{{ len $uniqueBenefs }}</strong> perfiles de beneficiario</li>
                {{- with $lastUpdate -}}
                <li><strong>Última actualización:</strong> <time datetime="{{ .Format "2006-01-02" }}">{{ .Format "2" }} de {{ index (slice "enero" "febrero" "marzo" "abril" "mayo" "junio" "julio" "agosto" "septiembre" "octubre" "noviembre" "diciembre") (sub .Month 1) }} de {{ .Format "2006" }}</time></li>
                {{- end -}}
            </ul>
```

Reemplazar por:

```
            <ul class="home-stats" aria-label="Cifras del portal">
                <li class="home-stat">
                    <span class="home-stat-value">{{ $totalAyudas }}</span>
                    <span class="home-stat-label">ayudas activas</span>
                </li>
                <li class="home-stat">
                    <span class="home-stat-value">{{ len $grants }}</span>
                    <span class="home-stat-label">páginas de convocatorias</span>
                </li>
                <li class="home-stat">
                    <span class="home-stat-value">{{ len $uniqueRegions }}</span>
                    <span class="home-stat-label">regiones cubiertas</span>
                </li>
                <li class="home-stat">
                    <span class="home-stat-value">{{ len $uniqueBenefs }}</span>
                    <span class="home-stat-label">perfiles de beneficiario</span>
                </li>
            </ul>
```

Notas:
- Se eliminó el `<li>` con la fecha (Task 1 ya preparó el terreno).
- Cada `<li>` ahora tiene clase `home-stat` con dos `<span>` hijos: `home-stat-value` (cifra) y `home-stat-label` (texto).
- La indentación es de 12 espacios (alineada con el contenido del `<header>`).

- [ ] **Step 2: Construir y validar**

Ejecutar:

```bash
npm run check
```

Expected: exit 0. El HTML debe renderizar con la nueva estructura. La página debe seguir mostrando 4 stats en el `<ul>`.

- [ ] **Step 3: Inspeccionar el HTML renderizado**

Ejecutar:

```bash
hugo --minify --baseURL https://portalconvocatorias.es/ --destination public-check
```

Expected: el sitio se construye sin errores. (Si `hugo` no está en PATH, usar `npx hugo ...` o saltar este paso y confiar en `npm run check` del Task 1.)

Verificar manualmente en `public/index.html` que aparecen exactamente 4 `<li class="home-stat">` con sus `<span>` correspondientes.

Limpieza opcional:

```bash
rm -rf public-check
```

---

### Task 3: Añadir los estilos `.home-stats` en `assets/css/home.css`

**Files:**
- Modify: `assets/css/home.css` (insertar bloque entre `.home-intro` y `.filter-section`)

- [ ] **Step 1: Localizar el punto de inserción**

En `assets/css/home.css`,`.home-intro` (línea 171-179) cierra con `}` y `.filter-section` (línea 181) abre con `.filter-section {`. Insertar el nuevo bloque entre ambos, con una línea en blanco de separación a cada lado.

Punto de inserción exacto (entre línea 179 y línea 181):

```
}

.filter-section {
```

- [ ] **Step 2: Insertar el bloque de estilos**

Insertar el siguiente bloque en el punto identificado:

```css
.home-stats {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0;
    margin: 32px 0 0;
    padding: 0;
    list-style: none;
}

.home-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 32px;
    border-right: 1px solid rgba(30, 27, 75, 0.3);
}

.home-stat:first-child {
    padding-left: 0;
}

.home-stat:last-child {
    border-right: none;
    padding-right: 0;
}

.home-stat-value {
    font-family: 'Inter', sans-serif;
    font-size: 32px;
    line-height: 40px;
    letter-spacing: -0.02em;
    font-weight: 700;
    color: #1e1b4b;
}

.home-stat-label {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.08em;
    font-weight: 600;
    text-transform: uppercase;
    color: #47464f;
}

@media (max-width: 767px) {
    .home-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px 16px;
    }

    .home-stat {
        padding: 0;
        border-right: none;
    }
}
```

Resultado esperado: el archivo `assets/css/home.css` ahora tiene el bloque `.home-stats` entre `.home-intro` y `.filter-section`, manteniendo el resto intacto.

- [ ] **Step 3: Construir y validar**

Ejecutar:

```bash
npm run check
```

Expected: exit 0. El CSS se procesa por Hugo pipe (minify + fingerprint), no debe dar errores. El HTML renderizado en `public/index.html` debe incluir fingerprint del CSS actualizado.

- [ ] **Step 4: Verificación visual desktop**

Iniciar el servidor local de Hugo:

```bash
npx hugo server -D
```

Visitar `http://localhost:1313/` (puerto por defecto de Hugo). Verificar:

- Las 4 cifras aparecen en fila horizontal con divisores verticales finos entre ellas.
- Tipografía: cifras grandes en navy, labels en gris claro mayúsculas.
- Sin caja ni borde exterior; la fila se asienta directamente bajo el párrafo `home-definition` con margen superior.
- En `http://localhost:1313/`, no aparece la fecha "Última actualización" en este bloque (debe seguir apareciendo solo en la cabecera `home-updates-heading` inferior).

- [ ] **Step 5: Verificación visual mobile**

En el inspector del navegador, simular viewport ≤ 767px (o usar la barra de dispositivos). Verificar:

- La fila colapsa a grid 2x2.
- Los divisores verticales desaparecen.
- `gap` vertical cómodo entre filas, horizontal entre columnas.

- [ ] **Step 6: Apagar el servidor**

Detener el proceso `hugo server` (Ctrl+C en la terminal).

---

## Self-Review (revisión contra el spec)

- Spec § Decisión 1 (tratamiento inline): cubierto en Task 2 (HTML reestructurado) + Task 3 (CSS sin contenedor).
- Spec § Decisión 2 (fila horizontal con divisores): cubierto en Task 3 (`.home-stats` flex + `.home-stat` border-right).
- Spec § Decisión 3 (eliminar fecha): cubierto en Task 1 (lógica template) + Task 2 (HTML).
- Spec § Decisión 4 (100% navy sin acentos): cubierto en Task 3 (sin reglas de color de acento).
- Spec § Decisión 5 (escala Inter 32/12): cubierto en Task 3 (`.home-stat-value` y `.home-stat-label`).
- Spec § Decisión 6 (divisor navy 1px 30% opacity): cubierto en Task 3 (`.home-stat border-right: 1px solid rgba(30, 27, 75, 0.3)`).
- Spec § Decisión 7 (mobile grid 2x2): cubierto en Task 3 (media query en `@media (max-width: 767px)`).
- Spec § Accesibilidad: cubierto en Task 2 (`aria-label` se mantiene, estructura `<ul>`/`<li>` intacta).
- Spec § Verificación (`npm run check`): cubierto en Task 1, Task 2 y Task 3.

Sin placeholders, sin "TBD", sin referencias a funciones no definidas. Type consistency: las clases añadidas (`home-stats`, `home-stat`, `home-stat-value`, `home-stat-label`) coinciden en HTML y CSS en todos los tasks.
