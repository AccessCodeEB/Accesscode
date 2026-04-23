# EspinaBifida - Backend

**Equipo:** a01541324 · a00839182 · a01286259 · a01383804 · a00840653 · a00839729

---

## Requisitos

- Node.js 18+
- Oracle Instant Client instalado en `~/oracle/instantclient`
- Wallet de Oracle descomprimido en `wallet/`

## Configuración

1. Copia `.env.example` y renómbralo a `.env`:

```
PORT=3000
DB_USER=ADMIN
DB_PASSWORD=tu_password
DB_CONNECTION_STRING=NOMBRE_SERVICIO_HIGH
ORACLE_CLIENT_PATH=/Users/tu_usuario/oracle/instantclient
```

2. Ajusta `wallet/sqlnet.ora` para que `DIRECTORY` apunte a la ruta absoluta de tu carpeta `wallet/`:

```
WALLET_LOCATION = (SOURCE = (METHOD = file) (METHOD_DATA = (DIRECTORY="/ruta/absoluta/al/proyecto/wallet")))
SSL_SERVER_DN_MATCH=yes
```

3. Instala dependencias:

```bash
npm install
```

4. Levanta el servidor:

```bash
npm run dev
```

### Frontend (Next.js) y variables públicas

- **Express (API)** suele ir en el puerto **3000**; **Next** en **3001**. Las peticiones del navegador deben apuntar al API, no al propio Next (si no, la respuesta es HTML y falla el JSON).
- En el repo va **`frontend/.env.example`**: plantilla **sin secretos**, para que el equipo sepa qué variable existe. **Sí se versiona.**
- **`frontend/.env.local`** (u overrides locales) **no** se versiona: créalo solo si necesitas otro host/puerto; está en `.gitignore`.

### Fotos de perfil (`/uploads/profiles/`)

Las imágenes viven en **`uploads/`** (no va en git). La BD guarda rutas como `/uploads/profiles/ben-CURP-….jpg`.

**Para que solo con `npm run dev` todo el equipo vea las fotos** (sin scripts manuales):

1. Un responsable del equipo define en **`.env.defaults`** (versionado, sin secretos) la variable:

   `PROFILE_PHOTOS_REMOTE_BASE=https://tu-api-publica.com`

   Debe ser la URL base de un Express que **ya tenga** esos archivos en disco (staging, servidor de clase, etc.), **sin** barra final.

2. Cada persona copia **`.env.example` → `.env`** con Oracle/JWT como siempre, y **`frontend/.env.local`** con `NEXT_PUBLIC_API_URL=http://localhost:3000`.

3. Al pedir una foto que no existe en su `uploads/profiles/`, el backend la **descarga de `PROFILE_PHOTOS_REMOTE_BASE`**, la guarda en local y la sirve; las siguientes van desde disco.

Opcional: **`npm run sync:profile-photos`** sigue sirviendo para bajar todas las fotos de golpe (ver comentarios en `scripts/sync-profile-photos.js`).

---

## Estructura del proyecto

```
src/
├── config/
│   └── db.js                    # Conexión a Oracle (no modificar)
│
├── middleware/
│   └── errorHandler.js          # Manejo global de errores (no modificar)
│
├── modules/                     # Cada tabla de la BD es un módulo
│   └── [modulo]/
│       ├── [modulo].model.js       # Queries SQL directos a Oracle
│       ├── [modulo].service.js     # Lógica de negocio
│       ├── [modulo].controller.js  # Manejo de req/res HTTP
│       └── [modulo].routes.js      # Definición de endpoints
│
├── app.js                       # Registro de rutas y middlewares
└── server.js                    # Punto de entrada
```

---

## Cómo agregar un nuevo módulo

Supón que vas a trabajar la tabla `CONSULTAS`:

1. Crea la carpeta `src/modules/consultas/`
2. Crea los 4 archivos siguiendo la convención:
   - `consultas.model.js` — solo SQL
   - `consultas.service.js` — lógica
   - `consultas.controller.js` — req/res
   - `consultas.routes.js` — rutas
3. Registra el módulo en `src/app.js`:

```js
import consultasRoutes from "./modules/consultas/consultas.routes.js";
app.use("/consultas", consultasRoutes);
```

---

## Módulos actuales

| Módulo        | Ruta base        | Responsable |
| ------------- | ---------------- | ----------- |
| beneficiarios | `/beneficiarios` | a01541324   |

---

## Endpoints por módulo

### /beneficiarios

| Método | URL                  | Descripción                                   |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/beneficiarios`     | Listar todos los beneficiarios                |
| GET    | `/beneficiarios/:id` | Obtener un beneficiario por NUMERO_CREDENCIAL |
| POST   | `/beneficiarios`     | Crear nuevo beneficiario                      |
| PUT    | `/beneficiarios/:id` | Actualizar beneficiario                       |
| DELETE | `/beneficiarios/:id` | Desactivar beneficiario (ACTIVO = 0)          |

---

## Convenciones

- Los campos del body en `POST` y `PUT` usan **camelCase** (ej. `apellidoPaterno`)
- Las columnas en Oracle usan **UPPER_SNAKE_CASE** (ej. `APELLIDO_PATERNO`)
- El borrado es **lógico** (nunca se eliminan registros, se desactivan con `ACTIVO = 0`)
- Siempre cerrar la conexión en el bloque `finally` del model
- Los errores se propagan con `next(err)` al `errorHandler` global
