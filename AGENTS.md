# Reglas para asistentes de IA en TRAMA

Este archivo es para cualquier IA que escriba código en este repositorio (Claude, ChatGPT, Copilot, Cursor, Gemini, etc.).
Leé primero `CONTEXTO.md`: ahí están el stack, la estructura y las reglas de negocio. Estas reglas lo complementan.

Si una instrucción del usuario contradice estas reglas, avisale antes de hacerlo.

## Cómo trabajar

1. **Antes de escribir código, mirá lo que ya existe.** Buscá en el módulo, en `common/` y en `frontend/src/components/ui/`. Si ya hay algo que resuelve el problema, usalo o extendelo.
2. **Seguí el patrón del módulo más parecido.** Si vas a crear un módulo nuevo, copiá la estructura de `aporte/` (entidad, repository, service, controller, dto).
3. **Cambiá solo lo que pide la tarea.** No refactorices, renombres ni "mejores" código de otros módulos aunque te parezca mejorable. Si ves un problema, mencionalo al final.
4. **Cambios chicos.** Si la tarea toca más de ~10 archivos o más de un módulo que no es el suyo, pará y explicá el plan antes de seguir.
5. **Si falta información, preguntá.** No inventes endpoints, campos ni reglas de negocio. Si algo no está en `CONTEXTO.md`, en el código o en la tarea, preguntá.
6. **Al terminar, explicá en 3 a 5 líneas** qué archivos cambiaste y por qué, y cómo probarlo.

## SIEMPRE

- Verificar permisos con `PermisoService` en el service, antes de leer o escribir datos de un proyecto.
- Filtrar los aportes por visibilidad en la consulta a la base.
- Usar DTOs (`record`) para entrar y salir de los controladores.
- Validar la entrada con Bean Validation (`@Valid`, `@NotBlank`, `@Size`...).
- Lanzar `ApiException` para errores de negocio y dejar que `GlobalExceptionHandler` arme la respuesta.
- Escribir tests para la lógica nueva: caso bueno, caso de error y acceso denegado (`403`) si hay permisos.
- Cambiar el esquema de la base **solo** con una migración Flyway nueva, con el formato de nombre de `CONTEXTO.md`.
- Usar los componentes de `components/ui/` y solo las clases del tema definido en `src/styles/tema.css` (`bg-primario`, `text-texto`, etc.).
- Construir las pantallas iguales al mockup de Sofía. Si el usuario te pasa una captura del mockup, respetá la distribución, los textos y los componentes.
- Llamar a la API solo desde `frontend/src/api/`.
- Escribir los textos visibles en español, en lenguaje claro y no clínico.
- Usar datos ficticios en ejemplos, seeds y tests.

## NUNCA

### Seguridad y datos
- Nunca escribas contraseñas, claves, tokens ni URLs de producción en el código. Van en variables de entorno.
- Nunca devuelvas una entidad JPA desde un controlador ni expongas la contraseña o datos de otro usuario.
- Nunca saltees `PermisoService` ni copies su lógica en un controlador.
- Nunca uses datos de personas reales.
- Nunca permitas que alguien que no es el autor edite o archive un aporte.
- Nunca borres un aporte de la base: se archiva.
- Nunca uses ids numéricos autoincrementales: todas las entidades usan UUID.
- Nunca guardes texto libre sobre el niño sin el convertidor `CifradoConverter`.
- Nunca filtres ni busques con SQL sobre columnas cifradas: filtrá en el service.
- Nunca escribas en los logs contenido de aportes, notas o datos del niño.
- Nunca crees un endpoint de proyecto sin llamar a `PermisoService`: el test de acceso (0.21) lo va a detectar.

### Base de datos
- Nunca modifiques una migración que ya está en `develop`.
- Nunca cambies `ddl-auto` a `update` o `create`.
- Nunca crees una tabla nueva para un tipo de sección del perfil: es un `TipoAporte` más.

### Calidad
- Nunca desactives, borres ni marques como `@Disabled`/`skip` un test para que pase el build.
- Nunca sugieras `git commit --no-verify` ni `git push --no-verify`.
- Nunca dejes `console.log`, `System.out.println`, código comentado ni `TODO` sin tarjeta de Trello.
- Nunca atrapes una excepción para ignorarla (`catch (Exception e) {}`).
- Nunca agregues una dependencia nueva (Maven o npm) sin que el usuario lo confirme.
- Nunca dupliques un componente o una función que ya existe con otro nombre.
- Nunca hagas archivos gigantes: si un archivo pasa las ~300 líneas, dividilo.

### Estilos
- Nunca escribas colores en hex, `rgb()` ni valores arbitrarios de Tailwind (`text-[#...]`, `p-[13px]`) en un componente.
- Nunca uses `style={{ ... }}`.
- Nunca crees otro archivo CSS ni modifiques `tema.css` sin que el usuario lo confirme.
- Nunca agregues una librería de componentes (Material UI, Bootstrap, etc.).

### Producto
- Nunca agregues recomendaciones automáticas, algoritmos que sugieran contenido ni IA dentro de la app. Todo lo escribe una persona.
- Nunca uses lenguaje clínico o de déficit en la interfaz.
- Nunca guardes ni muestres algo como "historia clínica".

## Checklist antes de dar la tarea por terminada

- [ ] `./mvnw test` y/o `npm test` pasan.
- [ ] `npm run lint` y `npm run check:estilos` no dan errores (si tocaste el front).
- [ ] Se respetan los permisos y hay test de acceso denegado.
- [ ] No hay secretos, datos reales ni código de debug.
- [ ] Reutiliza lo que ya existía.
