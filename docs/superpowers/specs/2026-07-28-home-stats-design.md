# Diseño: formato visual de la lista `home-stats` en la home

**Fecha**: 2026-07-28
**Estado**: Aprobado por el usuario (2026-07-28)

## Contexto

La lista `home-stats` (líneas 28-36 de `layouts/index.html`) muestra las cifras del portal: total de ayudas activas, número de páginas de convocatorias, regiones cubiertas, perfiles de beneficiario y última actualización. La clase `home-stats` no tiene CSS asociado, así que la lista renderiza con los estilos por defecto del navegador (viñetas, fuentes del sistema) y queda desconectada de la estética de la home.

La home usa una identidad coherente: navy `#1e1b4b`, Inter + Space Grotesk, pill borders con `border-radius: 9999px`, mayúsculas con `letter-spacing: 0.08em`, cards con bordes navy y esquinas 24-32px, acentos rojos `#b90538` para "activas". El bloque actual rompe esa identidad.

El usuario quiere reformatear la lista para que se integre en la estética sin introducir contenedores ni caja, manteniendo la sobriedad.

## Decisiones de diseño

1. **Tratamiento**: inline minimalista sin contenedor. Solo jerarquía tipográfica.
2. **Disposición**: fila horizontal con divisores verticales.
3. **Fecha "Última actualización"**: se elimina de este bloque. Ya existe en `home-updates-heading` justo debajo, mostrada en formato `dateFormat "02/01/2006"`. Mantenerla aquí es redundante.
4. **Acento**: 100% navy, sin colores ni iconos.
5. **Escala tipográfica**:
   - Cifra: Inter 32px / 40px line-height / 700 / -0.02em letter-spacing / navy `#1e1b4b`.
   - Label: Inter 12px / 16px line-height / 600 / 0.08em letter-spacing / uppercase / gris `#47464f`.
6. **Divisor**: línea vertical 1px navy al 30% de opacidad, alto controlado por el padding lateral del stat. Padding 32px entre stats.
7. **Mobile (<768px)**: la fila colapsa a grid 2x2. Sin divisores, gap 24px vertical / 16px horizontal.

## Estructura HTML final

El bloque queda dentro del `<header class="home-header">`, justo después del párrafo `home-definition` y antes de `filter-section`.

```html
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

### Cambios en la lógica de la plantilla

- Se elimina la variable `$lastUpdate` (línea 11) y el bloque `{{- with $lastUpdate -}}` (líneas 33-35) que la consumía.
- Se elimina el `slice` de nombres de meses (línea 34), ya no referenciado.
- El cálculo de `$totalAyudas`, `$regions`, `$benefs`, `$uniqueRegions`, `$uniqueBenefs` y los rangos asociados se mantienen sin cambios.

## CSS a añadir en `assets/css/home.css`

El bloque se inserta como una sección nueva, agrupado lógicamente con los demás estilos `.home-*`. Ubicación propuesta: justo después de `.home-intro` (línea 179) y antes de `.filter-section` (línea 181), para mantener la cascada conceptual home-header → home-intro → home-stats → filter-section.

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

### Notas CSS

- **Margen top 32px**: separa la fila del párrafo `home-definition` sin necesidad de borde superior.
- **Padding lateral 32px + divisor navy 1px al 30% opacity**: hereda el lenguaje de los `.home-tag-list span` (navy) pero bajado a opacidad para que el divisor no compita visualmente con la cifra.
- **Cifra Inter 32/40 -0.02em 700 navy**: misma escala que `.filter-heading` (32/40), mantiene coherencia con la cabecera.
- **Label Inter 12/16 0.08em uppercase gris `#47464f`**: idéntico a `.home-updates-heading span` y a `.filter-group-label`.
- **Mobile 2x2**: encaja con el breakpoint de la página (`max-width: 767px` ya existe en este CSS). Sin divisor, con gap 24/16.

## Accesibilidad

- `aria-label="Cifras del portal"` se mantiene en el `<ul>`.
- La estructura `<ul>` + `<li>` se preserva, semántica de lista intacta.
- El cambio de HTML no afecta a la lectura por screen reader; `<span>` dentro de `<li>` sigue siendo texto.
- El color es solo decorativo; el contraste y la jerarquía se mantienen por peso y tamaño.

## Archivos a modificar

- `layouts/index.html`: reestructurar el `<ul class="home-stats">` (líneas 28-36) y limpiar variables/template logic obsoletas.
- `assets/css/home.css`: añadir las reglas `.home-stats`, `.home-stat`, `.home-stat-value`, `.home-stat-label` y el media query responsive. No editar `static/css/main.css` (no se carga en la home; ver `layouts/partials/head.html:30`).

## Verificación

- `npm run check` para validar build + schema + sectores.
- `npm run verify` (si existe) para validación de markup.
- Inspección visual en desktop y mobile: la fila horizontal con 4 stats debe caber en una línea hasta ~768px, y a partir de ahí partir a grid 2x2.
- Tab order y screen reader: la lista sigue siendo una lista, lectura esperada: "Lista con 4 elementos: 1. N ayudas activas, 2. N páginas de convocatoria, ...".
