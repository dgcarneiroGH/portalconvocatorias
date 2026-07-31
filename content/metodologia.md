---
title: Metodología — Cómo recopilamos ayudas y convocatorias
description: Cómo se extraen, validan y publican los datos de ayudas y convocatorias activas en España en Ayudas y Convocatorias (Portal de Convocatorias). Fuentes, frecuencia, criterios de inclusión y proceso de revisión.
slug: metodologia
date: 2026-07-28
---

# Metodología de Ayudas y Convocatorias

En esta página explicamos **cómo se extrae, valida y publica** la información de **ayudas y convocatorias** que muestra Ayudas y Convocatorias (Portal de Convocatorias). La transparencia metodológica es nuestra principal seña de identidad.

## Fuentes oficiales

La información proviene exclusivamente de **fuentes oficiales públicas**:

- **Fuente principal**: [Base de Datos Nacional de Ayudas (BDNS)](https://www.pap.hacienda.gob.es/bdnstrans/GE/es/index), gestionada por la Intervención General del Estado (Ministerio de Hacienda). Es el registro público nacional de ayudas y subvenciones.
- **Fuentes autonómicas y locales**: portales de transparencia y portales de ayudas de cada comunidad autónoma, diputación provincial y cabildo insular.
- **Boletines oficiales**: como apoyo para detectar nuevas convocatorias de ámbito provincial o local.

El detalle completo de cada fuente está disponible en la página [Fuentes oficiales](/fuentes/).

## Proceso de extracción

El flujo de datos es **automático y se ejecuta a diario**:

1. **Recogida**: un script consulta la BDNS y los portales autonómicos enlazados. Solo se descargan registros nuevos o modificados desde la última ejecución.
2. **Normalización**: cada convocatoria se limpia y se estructura en un formato interno común (título, organismo convocante, presupuesto, fechas, beneficiario, sector, URL oficial, requisitos, descripción).
3. **Filtrado**: se eliminan las convocatorias con plazo cerrado y las que no cumplen los criterios de inclusión (ver siguiente sección).
4. **Agrupación**: las convocatorias se agrupan por combinación de **región × beneficiario × sector**, dando lugar a las 32 páginas activas del portal en este momento.

## Criterios de inclusión

Una convocatoria se publica en el portal si cumple **todos** estos criterios:

- Procede de una **fuente oficial pública** (BDNS, portal autonómico, boletín oficial).
- Su **plazo de solicitud está abierto** en el momento de la publicación.
- Está dirigida a uno de los **cuatro perfiles de beneficiario** cubiertos: asociaciones y ONG, pymes y autónomos, gran empresa, o particulares.
- Dispone de **datos básicos completos**: organismo convocante, presupuesto, fecha de fin de plazo.

Las becas de estudio y las ayudas de la Unión Europea gestionadas directamente por la Comisión Europea **no** se incluyen porque no figuran en la BDNS.

## Validación y verificación

Cada ciclo de extracción aplica las siguientes comprobaciones automáticas:

- **Consistencia de fechas**: el fin de plazo debe ser posterior al inicio.
- **Validez de la URL oficial**: la URL debe responder con código HTTP 200 y apuntar a la ficha correspondiente en la BDNS o en el portal del organismo convocante.
- **Coincidencia con la fuente**: cuando una convocatoria aparece también en un portal autonómico, los datos deben coincidir; en caso de discrepancia prevalece la información de la BDNS por ser la base oficial nacional.

Cuando el sistema detecta una inconsistencia que no puede resolver automáticamente, **marca la convocatoria para revisión manual** y la retira temporalmente del portal hasta que se verifique.

## Frecuencia de actualización

- **Diaria**: el script de extracción se ejecuta una vez al día. Las novedades aparecen reflejadas en la portada en menos de 24 horas desde su publicación oficial.
- **Manual**: si detectas un error, puedes reportarlo a través de la página de [Contacto](/contacto/). Las correcciones manuales se aplican en el siguiente ciclo de extracción.

## Trazabilidad

Cada convocatoria listada en el portal incluye siempre un **enlace directo a la ficha oficial** en la BDNS o en el portal del organismo convocante. Nunca se omite la fuente original. De este modo:

- El usuario puede **verificar la información** sin intermediarios.
- Cualquier cambio posterior (modificación de plazos, corrección de presupuesto, anulación) queda reflejado en la fuente oficial.
- Portal de Convocatorias **no sustituye** la publicación oficial en ningún caso.

## Limitaciones y avisos

- La información publicada tiene **carácter meramente informativo**. No constituye asesoramiento legal ni administrativo.
- Los datos se ofrecen "tal cual" en el momento de la extracción. Pueden existir errores u omisiones a pesar de las verificaciones automáticas.
- El portal **no tramita solicitudes**. La solicitud siempre se presenta en el portal del organismo convocante.

## Compromiso de transparencia

Si tienes cualquier duda sobre el proceso o quieres profundizar en algún aspecto, escríbenos a través de la página de [Contacto](/contacto/) o consulta la página [Fuentes oficiales](/fuentes/) para ver el listado completo de organismos y registros que utilizamos.
