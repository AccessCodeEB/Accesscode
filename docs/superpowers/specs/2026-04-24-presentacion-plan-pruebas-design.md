# Design: Presentación Plan de Pruebas y GitHub Actions

**Fecha:** 2026-04-24  
**Audiencia:** Equipo de desarrollo  
**Formato:** Markdown (8 slides)  
**Enfoque:** Narrativa problema → solución

---

## Estructura aprobada

| # | Slide | Contenido |
|---|-------|-----------|
| 1 | Portada | Título + subtítulo |
| 2 | El problema | Deuda técnica sin pruebas |
| 3 | Arquitectura de pruebas | 3 capas + diagrama ASCII |
| 4 | Detalle E2E | Flujo beneficiario → membresía → servicio |
| 5 | Estrategia de mocking | mockDb.js helper, por qué no BD real |
| 6 | Cobertura y umbrales | jest.config.js, 70% threshold, falla pipeline |
| 7 | GitHub Actions pipeline | Diagrama workflow CI/CD |
| 8 | Resultados y próximos pasos | Bugs encontrados, roadmap |

## Decisiones de diseño

- Alto nivel con detalle en E2E y arquitectura (slides 3-4)
- No mostrar código extenso, solo fragmentos clave donde aportan contexto
- El slide 5 explica por qué se mockea Oracle — decisión arquitectónica no obvia
- Umbrales de cobertura como ciudadanos de primera clase en el pipeline
