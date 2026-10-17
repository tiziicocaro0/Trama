# Frontend de TRAMA

Bienvenida, registro en `/registro`, login en `/login` e Inicio privado en `/inicio`.
Registro e inicio de sesión usan el backend real configurado por `VITE_API_URL`.
Los assets originales se usan sin cambios.

## Ejecutar

Requiere Node.js 22.12 o posterior y npm.

```sh
cd frontend
npm ci
npm run dev
```

Abrir `http://localhost:5173`. Vite usa este origen y puerto estricto para coincidir
con el CORS del backend; no pasa a otro puerto si está ocupado.
En PowerShell con scripts restringidos se puede usar `npm.cmd` en lugar de `npm`.

## Verificar

```sh
npm run lint
npm test
npm run check:estilos
npm run format:check
npm run build
```

Los tests cubren navegación, validaciones, autenticación con transporte simulado,
errores, prevención de envíos duplicados, limpieza de la contraseña, cierre y
vencimiento de sesión, rutas protegidas y contraste.
Revisar además foco con Tab, activación con Enter y ausencia de desbordamiento a
320, 390, 768, 1024 y 1920 píxeles. El diseño móvil es una adaptación de la referencia
desktop, ya que no se proporcionó un mockup móvil de bienvenida.

## Sistema visual

`src/styles/tema.css` concentra colores, tipografías, radios, sombras y composición.
`superficie` es el fondo claro muestreado del mockup; `decoracion` es el tono de las
formas de fondo. `primario-hover` y `contorno-accion` son variantes de terracota.
El contorno tenue es decorativo: el texto terracota identifica el enlace secundario.
Agua se utiliza solo en la frase grande (mínimo 28 px); no en texto pequeño.
Las fuentes Handlee y Nunito Sans se cargan desde Google Fonts (requieren conexión).
Los componentes reutilizables disponibles son `Button`, `BrandLogo`, `Input`,
`PasswordInput`, `FormField` y `Stepper`. Los tokens `registro-portada`, `registro-etapa` y
`registro-form` agregan tamaños específicos del mockup de registro, sin cambiar
los selectores de bienvenida ni agregar colores.

## Probar el registro con el backend local

1. Configurar el `.env` de la raíz según su `.env.example`, con las variables
   `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` y `JWT_SECRET` para el entorno local.
   Requiere Java 21 y Docker para MySQL. Desde la raíz ejecutar:

   ```powershell
   docker compose up -d mysql
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

2. En otra terminal, desde `frontend/`, crear `.env.local` a partir de
   `.env.example`. Su configuración local es:

   ```dotenv
   VITE_API_URL=http://localhost:4002/api
   ```

   Si el backend utiliza otro puerto mediante `SERVER_PORT`, actualizar esta URL.
   Las variables `VITE_*` son públicas: las claves del backend quedan en su entorno.
   Reiniciar Vite después de cambiar `.env.local`.

3. Ejecutar `npm ci` y `npm run dev`. Abrir
   `http://localhost:5173/registro` y completar los tres pasos con datos ficticios:
   nombre `Alma`, apellido `Ejemplo`, un email de prueba nuevo y una contraseña
   como `Prueba123!`.

4. En Datos y Seguridad, probar campos vacíos, email inválido y una contraseña
   que no cumpla los requisitos. Avanzar y volver para comprobar que se conservan
   los datos. Confirmación muestra nombre, apellido y email, sin la contraseña.

5. En la pestaña Red de las herramientas del navegador, comprobar que solo al
   pulsar **Crear cuenta** sale un `POST /api/auth/registro`, con las propiedades
   `nombre`, `apellido`, `email` y `password`. El servidor puede realizar una
   comprobación CORS `OPTIONS` previa. Durante el envío se bloquean los botones.

6. Con `201`, se conserva el JWT en memoria y se elimina la contraseña del estado.
   El frontend consulta `GET /api/auth/yo` con Bearer y solo al verificar la
   identidad redirige automáticamente a `/inicio`. El nombre del saludo y la
   identificación de la cuenta provienen de esa respuesta, no del formulario
   ni de claims del token. No se realiza un POST de login después del registro.

7. Cerrar sesión y registrar nuevamente el mismo email permite comprobar el
   `409 EMAIL_EN_USO`: se regresa a Datos con el error junto al email. Los otros datos
   y la contraseña permanecen disponibles para corregir y continuar. Para probar
   un fallo de conexión, detener el backend antes de enviar; el formulario queda
   disponible con el mensaje de error, sin reintentos automáticos.

El backend devuelve errores generales para `400 DATOS_INVALIDOS`, sin detalles
por campo. Las validaciones locales muestran sus errores junto al control.
El registro es público y no envía Authorization; futuras llamadas autenticadas
desde el cliente compartido reciben el token Bearer conservado en memoria.

## Archivos del registro

- `src/api/cliente.js`, `auth.js`, `auth.test.js`: Axios, sesión en memoria y contrato.
- `src/components/ui/Input.jsx`, `FormField.jsx`, `Stepper.jsx`: controles compartidos.
- `src/features/auth/registro/RegistroPage.jsx`, `components/RegistroPresentacion.jsx`
  y `components/RegistroFormulario.jsx`: composición y formulario.
- `src/features/auth/registro/hooks/useRegistro.js` y su test: navegación y envío.
- `src/features/auth/registro/validaciones.js`, `validaciones.test.js` y
  `RegistroPage.test.jsx`: reglas y pruebas del flujo.
- `src/routes/AppRoutes.jsx` y su test: reemplazo de la ruta temporal de registro.
- `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `vite.config.js`,
  `src/styles/tema.css` y este README: configuración, dependencia y tamaños.

La tercera etapa acordada es **Confirmación**, reemplazando Perfil del mockup.

## Probar login, logout y rutas privadas

- Abrir `/inicio` sin sesión: redirige a `/login`.
- En `/login`, ingresar el email y contraseña de una cuenta registrada. Se hace
  `POST /api/auth/login` con `{ email, password }`, seguido de `GET /api/auth/yo`.
  Al verificar la identidad, se muestra Inicio con el nombre real del usuario.
- Probar una contraseña incorrecta: aparece un error sin habilitar Inicio.
  El backend bloquea temporalmente la cuenta después de cinco fallos; no usar
  cuentas de otras personas para estas pruebas.
- Navegar a `/login` o `/registro` mientras hay sesión: redirige a `/inicio`.
- Pulsar **Cerrar sesión**: elimina el JWT y la identidad en memoria y lleva a
  `/login`. Volver a `/inicio` queda bloqueado; se puede ingresar otra vez con
  la misma cuenta porque cerrar sesión no borra al usuario de MySQL.
- Recargar: se pierde la sesión, se redirige a `/login` y la cuenta sigue existiendo.
- En la pestaña Red, comprobar el origen `http://localhost:4002/api` (o el valor
  configurado), los POST públicos sin Authorization y el GET de identidad con
  Bearer. No hay mocks ni datos ficticios de usuario en el código de ejecución.

## Autenticación y límites del backend

`AuthProvider` y `useAuth` centralizan usuario, verificación, cierre y errores de
sesión. `Acceso` protege las rutas y muestra un estado de verificación o de error
de conexión, sin mostrar el formulario o el contenido privado antes de resolverlo.
La contraseña solo vive en el formulario y no se persiste. El JWT se conserva
solo en memoria, sin localStorage, sessionStorage ni cookies creadas por JavaScript.

El backend actual emite JWT con una duración de ocho horas y no ofrece refresh
tokens, cookies HttpOnly, restauración de sesión ni un endpoint de logout. Por eso
recargar requiere volver a ingresar. Restaurar sin exponer el token a almacenamiento
accesible por JavaScript requiere soporte del backend, por ejemplo una sesión o
refresh token en cookie HttpOnly/Secure con las correspondientes protecciones CSRF.
No se modificó el backend.

El cliente Axios invalida la sesión ante un 401 de una solicitud que usó el token
vigente. Un 401 de login no autentica al usuario. Un temporizador y los eventos de
foco/visibilidad comprueban `exp` para cerrar una sesión vencida; la identidad sigue
siendo validada por el backend. Logout es local: el JWT emitido sigue siendo válido
en el servidor hasta su vencimiento, ya que no existe revocación implementada.

Si el backend crea la cuenta pero falla la verificación de identidad, no se da
acceso ni se repite el registro. Ante problemas de red se ofrece reintentar la
consulta de sesión. Si el token no es válido, se ofrece ir al inicio de sesión.

Inicio muestra el nombre, apellido y email reales. Perfiles, seguimiento,
calendario y comunicaciones están identificados como **Próximamente**, sin
perfiles de niños, estadísticas o contenido inventado. Quedan pendientes esos
módulos, completar perfil y verificación de email.

## Comprobación optativa contra el backend real

Con el backend y MySQL locales ejecutándose y `.env.local` configurado:

```sh
npm run test:auth:real
```

Este script carga las funciones reales de `src/api/` mediante Vite y usa la URL
configurada, sin transporte simulado. Crea una cuenta ficticia nueva en MySQL en
cada ejecución y comprueba registro, identidad, logout local, acceso sin token,
login con la misma cuenta, contraseña incorrecta, JWT inválido y CORS. No imprime
JWT ni contraseñas. No elimina la cuenta porque no existe un endpoint de borrado.
Las redirecciones y el vencimiento se verifican en las pruebas React separadas.

## Archivos de autenticación e Inicio

- `src/features/auth/AuthProvider.jsx`, `AuthContext.js`, `sesion.js` y sus pruebas:
  estado global, identidad y vencimiento.
- `src/hooks/useAuth.js`, `src/routes/Acceso.jsx`, `AppRoutes.jsx` y `src/main.jsx`:
  consumo del contexto, rutas públicas/privadas y montaje.
- `src/api/cliente.js`, `auth.js` y sus pruebas: login, registro, identidad, Bearer y 401.
- `src/features/auth/login/LoginPage.jsx` y `src/components/ui/PasswordInput.jsx`:
  login y visibilidad de contraseña; `Input.jsx` admite el control final reutilizable.
- `src/features/inicio/InicioPage.jsx`: saludo, cuenta, módulos futuros y logout.
- `src/features/auth/registro/hooks/useRegistro.js`, `RegistroPage.jsx` y sus pruebas:
  acceso automático tras crear la cuenta, conservando el formulario por etapas.
- `src/utils/validaciones.js`: validación de email compartida por registro y login.
- `scripts/verificar-auth-real.js`, `package.json` y este README: comprobación real
  optativa e instrucciones. No se agregaron dependencias ni se modificó `tema.css`.

## Archivos creados en esta entrega

```text
frontend/
  .gitignore
  .prettierignore
  .prettierrc.json
  README.md
  eslint.config.js
  index.html
  package.json
  package-lock.json
  vite.config.js
  scripts/check-estilos.js
  src/main.jsx
  src/components/ui/BrandLogo.jsx
  src/components/ui/Button.jsx
  src/features/auth/PaginaTemporal.jsx
  src/features/bienvenida/BienvenidaPage.jsx
  src/routes/AppRoutes.jsx
  src/routes/AppRoutes.test.jsx
  src/styles/tema.css
  src/styles/contraste.test.js
  src/test/setup.js
```

Los PNG de `public/assets/branding/` ya existían y no se editaron.
`node_modules/`, `.npm-cache/` y `dist/` son salidas locales ignoradas por Git.

## Diferencias y revisión visual pendiente

- El mockup es desktop. Tablet y móvil reorganizan la composición; el ovillo se
  reduce y los botones quedan debajo de la frase.
- Las formas suaves de fondo se aproximan con CSS. El logo y el ovillo son los
  originales; su encuadre y orientación se ajustan mediante CSS.
- Los botones respetan el terracota oficial. Su tipografía es Nunito Sans según
  la guía; pueden aparecer pequeñas diferencias frente al render del mockup.
- La posición, el recorte y la escala exactos necesitan comparación en navegador:
  la herramienta de esta sesión no dispone de navegador para capturas.
