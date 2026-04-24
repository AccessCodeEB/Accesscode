# Plan de Pruebas y CI/CD
## Sistema de Gestión — Asociación Espina Bífida

*Cómo automatizamos la calidad del backend*

---

## El problema

Antes de las pruebas automatizadas, cada cambio al código era un riesgo manual:

- ¿Sigue funcionando la validación de membresía activa?
- ¿El stock se descuenta correctamente al registrar un servicio?
- ¿Un token inválido realmente devuelve 401?

**Sin pruebas = bugs silenciosos en reglas de negocio críticas.**

Cualquier cambio podía romper el flujo principal sin que nadie se diera cuenta hasta producción.

---

## Arquitectura de pruebas

Tres capas, cada una con un propósito diferente:

```
┌─────────────────────────────────────────────────────────┐
│  CAPA 3 — E2E (flujo completo)                          │
│  flujo-beneficiario-membresia-servicio.test.js          │
│  Prueba: auth + validación + regla de negocio + HTTP    │
├─────────────────────────────────────────────────────────┤
│  CAPA 2 — Integración API (Supertest)                   │
│  inventario.test.js, articulos.test.js,                 │
│  servicios.controller.test.js                           │
│  Prueba: endpoints HTTP con mock de Oracle              │
├─────────────────────────────────────────────────────────┤
│  CAPA 1 — Unitarias (service layer)                     │
│  membresias.service.test.js,                            │
│  beneficiarios.service.test.js                          │
│  Prueba: lógica de negocio pura, sin HTTP               │
└─────────────────────────────────────────────────────────┘
```

**Herramientas:** Jest + Supertest + ESM dinámico (`jest.unstable_mockModule`)

---

## Detalle: pruebas E2E

El archivo `flujo-beneficiario-membresia-servicio.test.js` cubre el flujo completo en secuencia:

```
POST /beneficiarios  →  POST /membresias  →  POST /servicios
     ↓                        ↓                    ↓
  Crea CURP            Registra credencial    Valida membresía
  Valida formato       Verifica traslapes     activa antes de
  Verifica unicidad    de períodos            insertar servicio
```

**Por qué es E2E y no solo integración:**  
Cada request depende del estado dejado por el anterior. El test ejerce autenticación JWT, validación de entrada, la regla de membresía activa (consulta atómica sin TOCTOU), y la respuesta HTTP — todo en un flujo real de usuario.

**Escenarios cubiertos:**
- Flujo feliz completo (201 en cada paso)
- Sin token → 401
- Rol insuficiente → 403
- Datos inválidos → 400 (CURP, email, teléfono, fecha futura)
- CURP duplicada → 409
- Membresía traslapada → 409
- Beneficiario inactivo/baja → servicio rechazado

---

## Estrategia de mocking Oracle

Oracle no está disponible en CI. Solución: `src/tests/helpers/mockDb.js`

```
jest.unstable_mockModule("../config/db.js", () => dbModuleMock)
         ↓
mockExecute.mockResolvedValueOnce({ rows: [...] })
         ↓
Cada llamada a la BD retorna datos controlados
```

**Por qué este enfoque:**

| Sin mock | Con mock |
|----------|----------|
| Requiere Oracle en CI | Corre en cualquier entorno |
| Tests lentos (I/O real) | Tests rápidos (~segundos) |
| Datos variables | Datos deterministas |
| Difícil simular errores | `mockRejectedValue` trivial |

El helper centraliza `mockExecute`, `mockCommit` y `mockRollback` — un solo lugar para resetear entre tests con `beforeEach(() => resetMocks())`.

---

## Cobertura y umbrales

`jest.config.js` define umbrales obligatorios:

```js
coverageThreshold: {
  global: {
    lines:    70,   // mínimo 70% de líneas cubiertas
    branches: 70,   // mínimo 70% de ramas (if/else) cubiertas
  }
}
```

**Resultados actuales (2026-04-24):**

| Métrica | Resultado | Umbral | Estado |
|---------|-----------|--------|--------|
| Statements | 74.38% (1054/1417) | — | ✅ |
| Branches | 68.85% (703/1021) | 70% | ⚠️ por debajo |
| Functions | 74.43% (166/223) | — | ✅ |
| Lines | 75.99% (1013/1333) | 70% | ✅ |

**Por módulo:**

| Módulo | Statements | Branches | Notas |
|--------|-----------|----------|-------|
| src/services | 76.8% | 72.18% | Capa más crítica — bien cubierta |
| src/middleware | 85.71% | 75.64% | Auth y validación sólidos |
| src/utils | 83.09% | 77.41% | Buena cobertura |
| src/models | 72.25% | 72.6% | En el límite |
| src/controllers | 63.98% | 46.42% | ⚠️ Área de mejora prioritaria |
| src/migrations | 0% | 0% | Excluido intencionalmente |

**Observación:** `src/controllers` es el módulo con menor cobertura de ramas (46.42%) — es el siguiente foco de mejora para elevar el global de branches por encima del umbral.

Reportes generados: `text` (consola), `lcov`, `html` → subidos como artefacto en cada run de CI.

---

## GitHub Actions Pipeline

El archivo `.github/workflows/test.yml` define qué hace GitHub automáticamente en cada push o PR:

**¿Cuándo se activa?**
```
push a main          →  corre tests automáticamente
pull_request a main  →  bloquea el merge si los tests fallan
```

**¿Qué hace cada paso?**

| Paso | Acción | Por qué |
|------|--------|---------|
| `actions/checkout@v4` | Descarga el código del repo | El runner de GitHub no tiene el código por defecto |
| `actions/setup-node@v4` (Node 20) | Instala Node con cache de npm | Misma versión siempre; cache acelera builds |
| `npm ci` | Instala dependencias desde lockfile | Reproducible — no instala versiones distintas a las del equipo |
| `npm run test:coverage` | Corre Jest + mide cobertura | Si los tests fallan **o** la cobertura baja de 70%, el paso falla y bloquea el merge |
| `upload-artifact@v4` | Sube la carpeta `coverage/` | El reporte HTML queda disponible 7 días para revisión manual |

**Variables de entorno en CI:**
```yaml
JWT_SECRET: "ci-test-secret"    # secreto de prueba, no el de producción
CORS_ORIGIN: "http://localhost:3000"
```
No hay credenciales reales — la BD Oracle siempre se mockea en los tests.

**Resultado visible en GitHub:**

```
✅ test (ubuntu-latest)   — todos los tests pasan, cobertura ≥ 70%
❌ test (ubuntu-latest)   — falla → no se puede hacer merge
```

---

## Resultados y próximos pasos

**Bugs encontrados gracias a las pruebas:**

| Bug | Detectado por |
|-----|---------------|
| Race condition en generación de IDs | Prueba de concurrencia en servicios |
| Vulnerabilidad TOCTOU en validación de membresía | Test E2E de flujo completo |
| Auth middleware no rechazaba tokens malformados | Test 401 con token inválido |
| Inventario no hacía rollback en stock insuficiente | Test 422 con `mockRollback` |

**Próximos pasos:**

- Elevar umbrales de cobertura de 70% → 80%
- Agregar suite de pruebas para módulo `CITAS`
- Pruebas de carga básica en endpoints de inventario
- Integrar reporte de cobertura como comentario automático en PRs

---

*Generado: 2026-04-24 — Sistema Espina Bífida*
