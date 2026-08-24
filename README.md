# Oficina del Entrenador

App de gestión para entrenadores de fútbol: plantilla, pizarra táctica, generador de entrenamientos, partido en vivo y scouting del rival. Un único front-end estático (HTML + CSS + JS), sin backend, pensado para desplegarse en Netlify (o cualquier hosting estático) y versionarse en GitHub.

Este documento resume dónde está el proyecto ahora mismo, qué falta por hacer, y los pasos para seguir trabajando en Claude Code, subirlo a GitHub y desplegarlo en Netlify.

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

1. **Base y Navegación** ✅ — Menú lateral oscuro/verde césped con indicador de sección activa.
2. **Gestión de Plantilla** ✅ — Alta/baja de jugadores (nombre, dorsal, posición), con persistencia.
3. **Pizarra Táctica** ✅ — Campo con 22 fichas + balón, arrastrables (funciona con ratón y con dedo/tablet), dibujo de líneas/flechas en 3 colores, botón reiniciar. Con persistencia.
4. **Generador de Entrenamientos** ✅ — Fichas de ejercicios por categoría (Físico/Táctico/Técnico) con filtros y alta/baja. Calendario semanal de ejemplo (fijo, sin edición todavía). Con persistencia de ejercicios.
5. **Gestión de Minutos y Partido** ✅ — Cronómetro, alineación automática desde la plantilla real, minutos por jugador en tiempo real, cambios rápidos entre campo y banquillo. **Sin persistencia** (ver nota abajo): corre solo en memoria del dispositivo, se reinicia al recargar la página.
6. **Scouting y Rival** ✅ — Notas del rival con autoguardado, lista de seguimiento de fichajes con alta/baja.

### Cuentas de usuario

Hay una pantalla de acceso (usuario + contraseña) para que varias personas puedan probar la app cada una con sus propios datos.

**Importante — limitaciones actuales, a tener en cuenta antes de dar la app por "lista":**

- **No es autenticación segura.** Las contraseñas se guardan tal cual (sin cifrar) en el almacenamiento del navegador. Vale para un grupo cerrado de gente de confianza haciendo pruebas; no reutilizar contraseñas importantes.
- **Los datos NO viajan entre dispositivos.** Cada cuenta guarda sus datos con `localStorage`, es decir, en el navegador donde se usa. Si la misma persona abre la app desde otro móvil/ordenador, no verá sus datos — es como empezar de cero ahí. (Se intentó una versión que sí sincronizaba entre dispositivos usando una capacidad especial de Claude.ai, pero esa capacidad no existe fuera de Claude.ai, así que no sirve para una app en Netlify. Ver "Pendiente" más abajo.)
- El módulo de **Partido en Vivo** no guarda nada en absoluto todavía (ni siquiera por dispositivo): fue una decisión explícita para no complicar el cronómetro en tiempo real. Si recargas la página a mitad de partido, se reinicia.

## Pendiente / lista de mejoras

**Cuentas y datos**
- [ ] Decidir si de verdad se necesita que las cuentas sincronicen entre dispositivos. Si sí, hace falta un backend real (por ejemplo, Netlify Functions + una base de datos tipo Supabase/Firebase/Postgres), con contraseñas cifradas de verdad. Esto es un cambio de arquitectura, no un simple ajuste.
- [ ] Si no hace falta sincronizar entre dispositivos, al menos cifrar/hashear la contraseña antes de guardarla (aunque sea local).
- [x] Exportar/importar los datos de una cuenta: botones "Exportar datos" / "Importar datos" en la barra lateral. Exportan un `.json` (plantilla, pizarra, entrenamientos y scouting, sin la contraseña) y permiten restaurarlo en otro dispositivo/navegador — útil para pasarse los datos por WhatsApp o correo mientras no haya sincronización real.

**Calendario semanal (Módulo 4)**
- [ ] Sigue siendo una semana de ejemplo fija: falta poder editarlo, moverse entre semanas, y arrastrar ejercicios a un día concreto.

**Partido (Módulo 5)**
- [ ] Decidir y construir la persistencia (ver arriba).
- [ ] El botón de 1ª/2ª parte es solo una etiqueta manual, no corta el cronómetro automáticamente.
- [ ] No hay marcador de goles/tarjetas ni histórico de partidos pasados.

**Plantilla (Módulo 2)**
- [x] Edición de un jugador ya creado: el lápiz de cada tarjeta abre el mismo modal de alta, precargado, para cambiar dorsal/nombre/posición/asistencia.
- [x] Marcar asistencia desde la interfaz: el punto de color de cada tarjeta es ahora un botón que alterna presente/ausente con un clic (también editable desde el modal).

**Scouting**
- [ ] Las notas del rival no tienen histórico por jornada (se sobrescribe siempre el mismo bloque).
- [ ] La lista de seguimiento no tiene estado (observación/contactado/descartado).

**Otros**
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
