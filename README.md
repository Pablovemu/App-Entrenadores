# Oficina del Entrenador

App de gestión para entrenadores de fútbol: plantilla, pizarra táctica, generador de entrenamientos, partido en vivo y scouting del rival. Front-end estático (HTML + CSS + JS) desplegado en Netlify, con **Supabase** como backend real (cuentas de usuario y base de datos).

Este documento resume dónde está el proyecto ahora mismo, qué falta por hacer, y los pasos para seguir trabajando en Claude Code, subirlo a GitHub y desplegarlo en Netlify.

**Ya está en producción:**
- App pública: https://oficinaentrenadores.netlify.app
- Repo GitHub: https://github.com/Pablovemu/App-Entrenadores (rama `main`, cada `git push` redespliega solo)
- Backend: proyecto Supabase (URL y clave pública en `js/app.js`; credenciales de acceso al dashboard de Supabase las tiene Pablo)

## Estructura del proyecto

```
oficina-entrenador-app/
├── index.html            # Estructura de la app (pantallas, modales, formularios)
├── css/
│   ├── input.css          # Fuente para Tailwind (directivas @tailwind + estilos propios)
│   └── styles.css         # CSS final generado — el que carga index.html
├── js/
│   └── app.js              # Toda la lógica de la app (cuentas, los 6 módulos)
├── tailwind.config.js     # Paleta de colores y tipografías del tema
├── package.json           # Script para regenerar css/styles.css
├── netlify.toml           # Configuración de despliegue en Netlify
├── supabase_schema.sql                       # Tablas base + RLS (ejecutar primero, una vez)
├── supabase_migration_02_admin_and_match.sql # Partido en Vivo persistente + panel de admin (ejecutar después)
├── supabase_migration_03_stats_calendar_match.sql # Formato F7/F11, calendario real, asistencia e histórico de partidos (ejecutar el último)
└── .gitignore
```

Antes esta app vivía como un único archivo HTML publicado como "Artifact" de Claude.ai (con estilos y JS incrustados). Se ha separado en estos ficheros para que sea un proyecto normal, versionable en Git y editable cómodamente en Claude Code.

## Cómo ejecutarlo en local

No hace falta ningún servidor especial: es HTML/CSS/JS estático.

- Opción rápida: abre `index.html` directamente con el navegador (doble clic, o "Abrir con..." tu navegador).
- Opción recomendada (evita algún problema puntual de rutas relativas en algunos navegadores): sirve la carpeta con un servidor local, por ejemplo:
  ```bash
  npx serve .
  # o
  python3 -m http.server 8080
  ```
  y abre `http://localhost:8080` (o el puerto que indique).

## Cómo editar los estilos (Tailwind)

El CSS de Tailwind **no se carga desde un CDN** (por eso funcionaba mal dentro del Artifact de Claude.ai, que bloquea scripts externos) — está compilado de antemano en `css/styles.css`. Si añades clases de Tailwind nuevas en `index.html` o `js/app.js`, tienes que regenerar ese archivo:

```bash
npm install        # solo la primera vez
npm run css:build  # regenera css/styles.css a partir de css/input.css
```

Hay también `npm run css:watch` para que se regenere automáticamente mientras editas.

## Estado actual — los 6 módulos

1. **Base y Navegación** ✅ — Menú lateral oscuro/verde césped con indicador de sección activa. Incluye un selector de **formato de equipo** (Fútbol 7 / Fútbol 11) que afecta a la Pizarra y al Partido en Vivo (ver más abajo).
2. **Gestión de Plantilla** ✅ — Alta/baja de jugadores (nombre, dorsal, posición), con persistencia. Al pulsar sobre un jugador se abre su **ficha de estadísticas de temporada**: goles, minutos jugados, tarjetas y asistencia a entrenamientos, calculados a partir del histórico de partidos y de las sesiones de entrenamiento.
3. **Pizarra Táctica** ✅ — Campo con fichas + balón, arrastrables (funciona con ratón y con dedo/tablet), dibujo de líneas/flechas en 3 colores, botón reiniciar. La formación es de 11 vs 11 o 7 vs 7 según el formato de equipo elegido. Con persistencia.
4. **Generador de Entrenamientos** ✅ — Fichas de ejercicios por categoría (Físico/Táctico/Técnico) con filtros y alta/baja. **Calendario semanal real**, navegable semana a semana: se pueden crear sesiones en un día concreto (o arrastrar una tarjeta de ejercicio hasta el día), y cada sesión permite pasar lista de **asistencia a entrenamientos** jugador por jugador.
5. **Gestión de Minutos y Partido** ✅ — Datos del partido (rival y fecha), **marcador de goles** (con autor cuando es de nuestro equipo), **tarjetas amarillas/rojas** (con el jugador al que se le muestran), cronómetro con partes (2 en Fútbol 11, 4 en Fútbol 7), alineación automática desde la plantilla real, minutos por jugador en tiempo real, cambios rápidos entre campo y banquillo. El partido en curso persiste (tabla `match_state`) y sobrevive a un refresco de página (siempre queda en pausa al recargar, hay que pulsar "Reanudar"). Al pulsar **"Finalizar partido"** se guarda en el histórico (tabla `matches`), que es de donde salen las estadísticas de la ficha de cada jugador.
6. **Scouting y Rival** ✅ — Notas del rival con autoguardado, lista de seguimiento de fichajes con alta/baja.

### Cuentas de usuario y backend (Supabase)

Hay una pantalla de acceso (usuario + contraseña) respaldada por **Supabase Auth** — un backend real, no `localStorage`:

- **Contraseñas cifradas de verdad**, gestionadas por Supabase (no las ve ni las guarda esta app en texto plano).
- **Los datos viajan entre dispositivos.** Un mismo usuario ve la misma plantilla/pizarra/entrenamientos/scouting tanto desde el móvil como desde el ordenador, porque todo vive en una base de datos (Postgres) en vez de en el navegador.
- **Row Level Security**: cada usuario solo puede leer/escribir sus propias filas (reglas definidas en `supabase_schema.sql`), aunque las claves del cliente sean públicas.
- Como el login es por **usuario** (no email real), internamente se construye un email ficticio `usuario@users.oficinaentrenadores.app` solo para que Supabase Auth tenga algo con formato de email — el usuario nunca lo ve ni lo necesita.

### Panel de administrador (dentro de la app)

Item de menú **"Panel Admin"**, solo visible si la cuenta tiene `is_admin = true` en la tabla `profiles` (ver `supabase_migration_02_admin_and_match.sql`). Desde ahí se ve la lista de todas las cuentas registradas (usuario, fecha de alta, nº de jugadores) y se puede **vaciar los datos** de un equipo (plantilla, pizarra, entrenamientos, scouting, partido) con un botón.

- Técnicamente funciona con una función SQL `is_admin_user()` (SECURITY DEFINER) y políticas RLS adicionales que dejan a los admins ver/borrar filas de cualquier usuario en las tablas de datos.
- **Limitación a propósito**: el panel NO puede borrar la cuenta de acceso en sí (usuario + contraseña) — eso requiere la clave secreta `service_role` de Supabase, que nunca debe ir en el código de un sitio estático. Para eso sigue haciendo falta el dashboard de Supabase: **Authentication → Users → borrar**.
- Para marcar una cuenta como admin (solo se puede hacer desde el SQL Editor de Supabase, no desde la app):
  ```sql
  update profiles set is_admin = true where username = 'nombre_de_usuario';
  ```
- Si una cuenta se registró **antes** de ejecutar `supabase_migration_02_admin_and_match.sql`, no tendrá fila en `profiles` y ese UPDATE no hará nada (0 filas). Para esos casos, crear el perfil a mano:
  ```sql
  insert into profiles (user_id, username, is_admin)
  select id, 'nombre_de_usuario', true
  from auth.users
  where email = 'nombre_de_usuario@users.oficinaentrenadores.app'
  on conflict (user_id) do update set is_admin = true;
  ```

**Configuración de Supabase que hay que mantener** (Authentication → Sign In / Providers → Email, en el proyecto Supabase):
- **Enable email provider**: activado.
- **Confirm email**: **desactivado** (si no, las cuentas quedan a medio crear esperando un email de confirmación que nunca llega, porque el email es ficticio).

Las claves (`SUPABASE_URL` y la clave `anon`/`publishable`) están embebidas en `js/app.js` a propósito — son claves **públicas**, pensadas para ir en el navegador; la seguridad real la da Row Level Security en la base de datos, no el secretismo de esas claves. La `service_role key` de Supabase (secreta) **nunca** debe ponerse en este código.

## Pendiente / lista de mejoras

**Cuentas y datos**
- [x] Backend real con Supabase: cuentas cifradas, sincronización entre dispositivos.
- [x] Exportar/importar los datos de una cuenta: botones "Exportar datos" / "Importar datos" en la barra lateral. Ya no hace falta para el uso normal (los datos se sincronizan solos), se deja como copia de seguridad manual descargable en `.json`.
- [x] Panel de administrador dentro de la propia app (ver sección de arriba) — ver cuentas y vaciar datos de un equipo.
- [ ] Borrar la cuenta de acceso (login) también desde el panel de admin de la app, sin pasar por Supabase — requeriría una Netlify Function que guarde la clave `service_role` de forma segura en el servidor (no en el navegador). Se decidió no hacerlo todavía: con pocos usuarios, borrar a mano en Supabase es más rápido que montar esa infraestructura. Reconsiderar si el borrado de cuentas se vuelve frecuente.

**Calendario semanal (Módulo 4)**
- [x] Calendario con fechas reales, navegable semana a semana, con creación de sesiones (a mano o arrastrando un ejercicio) y asistencia a entrenamientos por sesión.
- [ ] No se pueden mover/arrastrar sesiones ya creadas de un día a otro (hay que borrarla y crearla de nuevo).

**Partido (Módulo 5)**
- [x] Persistencia añadida (tabla `match_state`, ver arriba).
- [x] El botón de parte ahora cicla 1ª/2ª (Fútbol 11) o 1ª-4ª (Fútbol 7) según el formato de equipo, aunque sigue siendo una etiqueta manual (no corta el cronómetro solo).
- [x] Marcador de goles (con autor) y tarjetas (con jugador), más histórico de partidos pasados (tabla `matches`, botón "Finalizar partido").
- [ ] No hay edición de un partido ya finalizado (para corregir un dato después de guardarlo en el histórico habría que hacerlo directamente en Supabase).

**Formato de equipo**
- [x] Selector Fútbol 7 / Fútbol 11 en la barra lateral: decide las partes del partido (2 o 4) y la formación de la Pizarra (7 vs 7 u 11 vs 11).

**Plantilla (Módulo 2)**
- [x] Edición de un jugador ya creado: el lápiz de cada tarjeta abre el mismo modal de alta, precargado, para cambiar dorsal/nombre/posición/asistencia.
- [x] Marcar asistencia desde la interfaz: el punto de color de cada tarjeta es ahora un botón que alterna presente/ausente con un clic (también editable desde el modal).
- [x] Ficha de jugador con estadísticas de temporada (goles, minutos, tarjetas, asistencia a entrenamientos) al pulsar sobre su tarjeta.

**Scouting**
- [ ] Las notas del rival no tienen histórico por jornada (se sobrescribe siempre el mismo bloque).
- [ ] La lista de seguimiento no tiene estado (observación/contactado/descartado).

**Otros**
- [x] Bug de contraste corregido: el color personalizado `base` de `tailwind.config.js` colisionaba con la utilidad de tamaño de fuente `text-base` de Tailwind (misma clase `.text-base`, la regla de color ganaba el cascade), y por eso nombres de jugador, fichajes de scouting y usuarios del panel admin se veían en negro sobre fondo oscuro. Se renombró ese color a `night`.
- [ ] Accesibilidad: revisar foco de teclado y atributos ARIA.
- [ ] Revisar el truncado de nombres largos en las tarjetas de jugador (algunos nombres se cortan más de lo necesario).
- [ ] Tests básicos / comprobación automática antes de cada despliegue (aunque sea un script simple que abra la app con Playwright y compruebe que no hay errores en consola).

## Cómo continuar en Claude Code

1. **Instala Claude Code** si no lo tienes: sigue la guía en https://docs.claude.com (busca "Claude Code" / "Get started"). Necesitas Node.js instalado en tu ordenador.
2. **Copia esta carpeta** (`oficina-entrenador-app/`) a donde quieras tener el proyecto en tu ordenador, por ejemplo `~/proyectos/oficina-entrenador-app`.
3. Abre una terminal en esa carpeta y ejecuta:
   ```bash
   claude
   ```
   Esto abre Claude Code en ese directorio. A partir de aquí puedes pedirle que continúe con cualquier punto de la lista de pendientes, que revise el código, etc. — ya tiene todo el contexto del proyecto porque este mismo README describe dónde está todo.
4. Instala las dependencias una vez, para poder regenerar el CSS cuando haga falta:
   ```bash
   npm install
   ```

## Cómo subirlo a GitHub

*(Ya hecho — el repo vive en https://github.com/Pablovemu/App-Entrenadores. Esta sección queda como referencia por si hay que repetirlo alguna vez.)*

1. Crea un repositorio nuevo y vacío en GitHub (botón "New repository"), sin inicializarlo con README ni licencia (para no chocar con lo que ya tienes).
2. En la terminal, dentro de la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Primera versión: Oficina del Entrenador"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/NOMBRE-DEL-REPO.git
   git push -u origin main
   ```
   (Sustituye la URL por la de tu repositorio.)
3. A partir de ahí, cada vez que quieras guardar avances:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push
   ```

## Cómo desplegarlo en Netlify

*(Ya hecho — el sitio vive en https://oficinaentrenadores.netlify.app, conectado a GitHub, con visibilidad "Public" en Project visibility. Esta sección queda como referencia.)*

Hay dos formas, de más sencilla a más potente:

**A) Arrastrar y soltar (para probar rápido, sin GitHub)**
1. Entra en https://app.netlify.com y crea una cuenta si no tienes.
2. En el panel, busca la opción de desplegar arrastrando una carpeta ("Deploys" → arrastra la carpeta del proyecto a la zona indicada).
3. Netlify te da una URL pública al momento (algo como `nombre-al-azar.netlify.app`).

**B) Conectado a GitHub (recomendado — cada `git push` despliega solo)**
1. Sube primero el proyecto a GitHub (paso anterior).
2. En Netlify: "Add new site" → "Import an existing project" → conecta tu cuenta de GitHub → elige el repositorio.
3. Configuración de build: como es un sitio estático sin build real, deja:
   - Build command: (vacío, o `true`)
   - Publish directory: `.` (la raíz del proyecto)
   
   El archivo `netlify.toml` ya incluido en el proyecto deja esto configurado, así que Netlify debería detectarlo solo.
4. Pulsa "Deploy site". A partir de ahí, cada vez que hagas `git push` a `main`, Netlify despliega la nueva versión automáticamente.
5. Puedes poner un dominio propio o cambiar el subdominio `.netlify.app` desde "Site settings" → "Domain management".

## Notas de diseño (para no perder el hilo)

- Paleta: fondo casi negro (`base` `#0A100D`), paneles verde muy oscuro (`panel`/`card`), acento verde césped (`turf` `#3FA34D`) y dorado (`gold` `#C9A227`) para detalles.
- Tipografías: Rajdhani (display, títulos y etiquetas en mayúscula) + Inter (texto de cuerpo), cargadas desde Google Fonts.
- Todo el layout usa Tailwind CSS (utility classes) — ver `tailwind.config.js` para los tokens de color y fuente.
