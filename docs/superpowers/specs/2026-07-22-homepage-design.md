# Diseño de la portada del Portal de Convocatorias

## Objetivo

Recrear en Hugo la apariencia de `brainstorming/designs/index.html` mediante HTML semántico y CSS propio, conservando el contenido dinámico actual y sin añadir Tailwind ni JavaScript.

## Alcance

- Renombrar la portada actual como `layouts/index-old.html` para conservarla como copia de seguridad.
- Crear un nuevo `layouts/index.html`.
- Añadir estilos de portada en `static/css/main.css` sin modificar las plantillas de `layouts/grants/`.
- Mantener los filtros y el botón «Cargar más subvenciones» como controles visuales, igual que en la referencia.

## Estructura

La portada tendrá:

1. Cabecera fija con logotipo y nombre del portal.
2. Sección de filtros con botones tipo píldora.
3. Encabezado de últimas actualizaciones y fecha de la página más reciente.
4. Listado de tarjetas generado desde `.Site.RegularPages`.
5. Botón visual de carga adicional.
6. Pie con copyright y enlaces informativos.

Cada tarjeta mostrará, cuando existan, la región y el beneficiario, el número de ayudas activas y un enlace en el título hacia `.RelPermalink`.

## Estilos

Los estilos nuevos estarán aislados bajo `.home-page` y usarán la paleta, tipografía Inter, medidas, bordes y espaciados de la referencia. La portada tendrá un ancho máximo de 1280 px, márgenes de 64 px en escritorio y 16 px en móvil. Las tarjetas se adaptarán a pantallas estrechas, permitiendo que etiquetas y metadatos se distribuyan en varias líneas.

Las reglas existentes necesarias para las páginas de subvenciones se conservarán. No se introducirán dependencias externas nuevas aparte de la fuente Inter ya cargada.

## Datos y casos opcionales

Hugo recorrerá `.Site.RegularPages`. Los campos opcionales `region` y `beneficiario` solo se renderizarán cuando estén definidos. La fecha de actualización solo aparecerá cuando exista al menos una página regular. El contador utilizará `.Params.count`.

## Verificación

Se ejecutará `hugo` para comprobar que las plantillas compilan y que el sitio se genera sin errores. La validación visual final se realizará manualmente con `hugo server -D`, según indicó el usuario.
