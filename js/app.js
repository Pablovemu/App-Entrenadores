
  // ---------- Cuentas y estado compartido ----------
  // currentUser: usuario con el que se ha iniciado sesión en este dispositivo.
  // appState: registro de todas las cuentas y sus datos.
  //
  // NOTA IMPORTANTE (ver README.md): en la versión publicada como Artifact de
  // Claude.ai, este mismo módulo usaba la capacidad "artifact" de Claude para
  // que los datos de una cuenta viajaran entre dispositivos, publicando de
  // nuevo toda la página en cada guardado. Esa capacidad NO existe fuera de
  // Claude.ai (no funciona en Netlify ni en ningún otro hosting), así que en
  // esta versión el estado se guarda en localStorage: fiable y sin recargas,
  // pero cada dispositivo/navegador tiene sus propios datos por cuenta (no
  // viajan solos entre dispositivos). Si más adelante se quiere que las
  // cuentas se sincronicen de verdad entre dispositivos, hace falta un
  // backend propio (por ejemplo, Netlify Functions + una base de datos).
  const APP_STATE_KEY = 'oficina-entrenador-cuentas';

  let appState = { users: {} };
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.users && typeof parsed.users === 'object') {
        appState = parsed;
      }
    }
  } catch (error) {
    console.error('No se pudo leer el estado guardado de la app:', error);
  }

  let currentUser = null;

  function persistState() {
    try {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
    } catch (error) {
      console.error('No se pudo guardar el cambio:', error);
    }
  }

  // Se mantiene el nombre "schedulePublish" en las llamadas existentes del
  // resto del código para no tener que tocar cada punto de guardado; aquí
  // simplemente agrupa escrituras seguidas en una sola (por si se añaden
  // varios cambios muy rápido) y guarda en localStorage sin recargar nada.
  let publishTimer = null;
  function schedulePublish(delay = 300) {
    clearTimeout(publishTimer);
    publishTimer = setTimeout(persistState, delay);
  }

  function getUserData() {
    return appState.users[currentUser];
  }

  // ---------- Datos de la plantilla ----------
  const defaultPlayers = [
    { id: 1,  number: 1,  name: 'Marc Vidal',      position: 'POR', present: true  },
    { id: 2,  number: 4,  name: 'Àlex Puig',       position: 'DEF', present: true  },
    { id: 3,  number: 5,  name: 'Jordi Camps',     position: 'DEF', present: false },
    { id: 4,  number: 3,  name: 'Nil Serra',       position: 'DEF', present: true  },
    { id: 5,  number: 8,  name: 'Pau Ferrer',      position: 'MED', present: true  },
    { id: 6,  number: 6,  name: 'Bruno Soto',      position: 'MED', present: true  },
    { id: 7,  number: 10, name: 'Guillem Riera',   position: 'MED', present: false },
    { id: 8,  number: 7,  name: 'Aleix Roca',      position: 'DEL', present: true  },
    { id: 9,  number: 9,  name: 'Marc Aguilar',    position: 'DEL', present: true  },
    { id: 10, number: 11, name: 'Dani Prats',      position: 'DEL', present: true  },
  ];

  let players = [];

  function loadPlayers() {
    players = getUserData().players;
    renderPlayers();
  }

  function savePlayers() {
    getUserData().players = players;
    schedulePublish();
  }

  const positionStyles = {
    POR: { label: 'Portero',         border: 'border-gold/50',    text: 'text-gold',    dot: 'bg-gold'    },
    DEF: { label: 'Defensa',         border: 'border-turfdark/60', text: 'text-turfline', dot: 'bg-turfdark' },
    MED: { label: 'Centrocampista',  border: 'border-turf/50',    text: 'text-turf',    dot: 'bg-turf'    },
    DEL: { label: 'Delantero',       border: 'border-turf/80',    text: 'text-turf',    dot: 'bg-turf'    },
  };

  const grid = document.getElementById('players-grid');
  const countEl = document.getElementById('plantilla-count');

  grid.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete-player');
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.deleteId);
      players = players.filter(p => p.id !== id);
      renderPlayers();
      savePlayers();
      return;
    }
    const editBtn = e.target.closest('.btn-edit-player');
    if (editBtn) {
      const id = Number(editBtn.dataset.editId);
      const player = players.find(p => p.id === id);
      if (player) openModal(player);
      return;
    }
    const presentBtn = e.target.closest('.btn-toggle-present');
    if (presentBtn) {
      const id = Number(presentBtn.dataset.presentId);
      const player = players.find(p => p.id === id);
      if (player) {
        player.present = !player.present;
        renderPlayers();
        savePlayers();
      }
      return;
    }
  });

  function renderPlayers() {
    grid.innerHTML = '';
    players
      .slice()
      .sort((a, b) => a.number - b.number)
      .forEach(p => {
        const s = positionStyles[p.position];
        const card = document.createElement('div');
        card.className = `bg-card border border-border hover:border-turf/40 rounded-xl p-4 flex items-center gap-4 transition-colors`;
        card.innerHTML = `
          <div class="w-14 h-14 shrink-0 rounded-full bg-base border-2 ${s.border} flex items-center justify-center">
            <span class="font-display font-700 text-xl">${p.number}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-display font-600 text-base truncate">${p.name}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>
              <span class="text-xs uppercase tracking-wide ${s.text}">${s.label}</span>
            </div>
          </div>
          <div class="shrink-0 flex flex-col items-end gap-2">
            <button data-present-id="${p.id}" class="btn-toggle-present w-5 h-5 rounded-full border ${p.present ? 'bg-turf border-turf' : 'bg-transparent border-muted/40'} transition-colors" title="${p.present ? 'Disponible (clic para marcar ausente)' : 'No disponible (clic para marcar presente)'}"></button>
            <div class="flex items-center gap-1">
              <button data-edit-id="${p.id}" class="btn-edit-player text-muted hover:text-turf transition-colors p-1" title="Editar jugador">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
              <button data-delete-id="${p.id}" class="btn-delete-player text-muted hover:text-red-400 transition-colors p-1" title="Eliminar jugador">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    countEl.textContent = players.length;
    document.getElementById('stat-total-players').textContent = players.length;
    document.getElementById('stat-present-players').textContent = players.filter(p => p.present).length;
  }

  // ---------- Navegación entre pantallas ----------
  const navButtons = document.querySelectorAll('.nav-btn');
  const screens = document.querySelectorAll('.screen');
  const ballMarker = document.getElementById('ball-marker');
  const eyebrow = document.getElementById('screen-eyebrow');
  const titleEl = document.getElementById('screen-title');

  const screenMeta = {
    inicio:          { eyebrow: 'Resumen',            title: 'Inicio' },
    plantilla:       { eyebrow: 'Módulo · Plantilla', title: 'Gestión de Plantilla' },
    pizarra:         { eyebrow: 'Módulo · Táctica',   title: 'Pizarra Táctica' },
    entrenamientos:  { eyebrow: 'Módulo · Sesiones',  title: 'Entrenamientos' },
    partido:         { eyebrow: 'Módulo · Partido',   title: 'Partido en Vivo' },
    scouting:        { eyebrow: 'Módulo · Scouting',  title: 'Scouting y Rival' },
  };

  function positionBallMarker(btn) {
    const navRect = btn.parentElement.parentElement.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const offset = (btnRect.top - navRect.top) + (btnRect.height / 2) - 5.5;
    ballMarker.style.top = `${offset}px`;
  }

  function switchScreen(key, btn) {
    screens.forEach(s => s.classList.toggle('active', s.id === `screen-${key}`));
    navButtons.forEach(b => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.classList.toggle('text-ink', active);
      b.classList.toggle('bg-card', active);
      b.classList.toggle('text-muted', !active);
    });
    eyebrow.textContent = screenMeta[key].eyebrow;
    titleEl.textContent = screenMeta[key].title;
    positionBallMarker(btn);
    closeSidebarOnMobile();
    if (key === 'pizarra') {
      resizeCanvas();
    }
    if (key === 'partido' && !matchInitialized) {
      initMatchSquad();
      renderMatchLists();
    }
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen, btn));
  });

  // ---------- Sidebar móvil ----------
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
  }
  function closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
  }
  document.getElementById('menu-toggle').addEventListener('click', openSidebar);
  document.getElementById('menu-close').addEventListener('click', closeSidebarOnMobile);
  backdrop.addEventListener('click', closeSidebarOnMobile);

  // ---------- Modal nuevo/editar jugador ----------
  const modalBackdrop = document.getElementById('modal-backdrop');
  const form = document.getElementById('form-add-player');
  const playerModalTitle = document.getElementById('player-modal-title');
  const playerModalSubmit = document.getElementById('modal-submit-player');
  const inputPresent = document.getElementById('input-present');

  let editingPlayerId = null;

  function openModal(player) {
    editingPlayerId = player ? player.id : null;
    if (player) {
      playerModalTitle.textContent = 'Editar jugador';
      playerModalSubmit.textContent = 'Guardar cambios';
      document.getElementById('input-number').value = player.number;
      document.getElementById('input-name').value = player.name;
      document.getElementById('input-position').value = player.position;
      inputPresent.checked = !!player.present;
    } else {
      playerModalTitle.textContent = 'Nuevo jugador';
      playerModalSubmit.textContent = 'Guardar';
      form.reset();
      inputPresent.checked = true;
    }
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
  }
  function closeModal() {
    modalBackdrop.classList.add('hidden');
    modalBackdrop.classList.remove('flex');
    form.reset();
    editingPlayerId = null;
  }

  document.getElementById('btn-add-player').addEventListener('click', () => openModal());
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const number = parseInt(document.getElementById('input-number').value, 10);
    const name = document.getElementById('input-name').value.trim();
    const position = document.getElementById('input-position').value;
    const present = inputPresent.checked;
    if (!name || !number) return;
    if (editingPlayerId !== null) {
      const player = players.find(p => p.id === editingPlayerId);
      if (player) {
        player.number = number;
        player.name = name;
        player.position = position;
        player.present = present;
      }
    } else {
      const nextId = players.length ? Math.max(...players.map(p => p.id)) + 1 : 1;
      players.push({ id: nextId, number, name, position, present });
    }
    renderPlayers();
    savePlayers();
    closeModal();
  });

  // ---------- Pizarra Táctica (Módulo 3) ----------
  // Formación por defecto 1-4-3-3. Eje Y: 0 = portería rival (arriba), 100 = nuestra portería (abajo).
  const blueFormation = [
    { id: 'b1',  num: 1,  x: 50, y: 96 },
    { id: 'b2',  num: 2,  x: 14, y: 80 },
    { id: 'b3',  num: 3,  x: 38, y: 82 },
    { id: 'b4',  num: 4,  x: 62, y: 82 },
    { id: 'b5',  num: 5,  x: 86, y: 80 },
    { id: 'b6',  num: 6,  x: 28, y: 64 },
    { id: 'b8',  num: 8,  x: 50, y: 62 },
    { id: 'b10', num: 10, x: 72, y: 64 },
    { id: 'b7',  num: 7,  x: 30, y: 52 },
    { id: 'b9',  num: 9,  x: 50, y: 50 },
    { id: 'b11', num: 11, x: 70, y: 52 },
  ];
  const redFormation = blueFormation.map(p => ({ id: 'r' + p.id, num: p.num, x: p.x, y: 100 - p.y }));
  const defaultBallPos = { x: 50, y: 50 };

  const pitch = document.getElementById('pitch');
  const drawCanvas = document.getElementById('draw-canvas');
  const drawCtx = drawCanvas.getContext('2d');
  let drawnStrokes = [];   // [{ color, points: [{x,y}, ...] }] — puntos en % del campo
  let drawMode = false;
  let currentStroke = null;
  let currentDrawColor = '#E9EDE9';

  // ---- Fichas y balón: arrastre con Pointer Events (funciona con ratón, dedo y lápiz) ----
  function makeTokenDraggable(token) {
    token.addEventListener('pointerdown', (e) => {
      if (drawMode) return;
      e.preventDefault();
      token.setPointerCapture(e.pointerId);
      token.classList.add('cursor-grabbing');
      const onMove = (ev) => {
        const rect = pitch.getBoundingClientRect();
        let x = ((ev.clientX - rect.left) / rect.width) * 100;
        let y = ((ev.clientY - rect.top) / rect.height) * 100;
        x = Math.min(100, Math.max(0, x));
        y = Math.min(100, Math.max(0, y));
        token.style.left = `${x}%`;
        token.style.top = `${y}%`;
      };
      const onUp = () => {
        token.releasePointerCapture(e.pointerId);
        token.classList.remove('cursor-grabbing');
        token.removeEventListener('pointermove', onMove);
        token.removeEventListener('pointerup', onUp);
        savePizarraData();
      };
      token.addEventListener('pointermove', onMove);
      token.addEventListener('pointerup', onUp);
    });
  }

  function createChip(player, team, savedPos) {
    const chip = document.createElement('div');
    chip.id = player.id;
    chip.dataset.defaultX = player.x;
    chip.dataset.defaultY = player.y;
    const pos = savedPos && savedPos[player.id] ? savedPos[player.id] : { x: player.x, y: player.y };
    const colors = team === 'blue'
      ? 'bg-blue-500 border-blue-300'
      : 'bg-red-500 border-red-300';
    chip.className = `token absolute z-10 w-7 h-7 sm:w-9 sm:h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${colors} flex items-center justify-center text-[10px] sm:text-xs font-display font-700 text-white cursor-grab touch-none shadow-md`;
    chip.style.left = `${pos.x}%`;
    chip.style.top = `${pos.y}%`;
    chip.textContent = player.num;
    makeTokenDraggable(chip);
    return chip;
  }

  function createBall(savedBallPos) {
    const ball = document.createElement('div');
    ball.id = 'ball';
    ball.dataset.defaultX = defaultBallPos.x;
    ball.dataset.defaultY = defaultBallPos.y;
    const pos = savedBallPos || defaultBallPos;
    ball.className = 'token absolute z-10 w-6 h-6 sm:w-7 sm:h-7 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-base sm:text-lg cursor-grab touch-none leading-none drop-shadow';
    ball.style.left = `${pos.x}%`;
    ball.style.top = `${pos.y}%`;
    ball.textContent = '⚽';
    makeTokenDraggable(ball);
    return ball;
  }

  function savePizarraData() {
    const positions = {};
    pitch.querySelectorAll('.token').forEach(token => {
      positions[token.id] = { x: parseFloat(token.style.left), y: parseFloat(token.style.top) };
    });
    getUserData().pizarra = { positions, strokes: drawnStrokes };
    schedulePublish();
  }

  function renderPitch() {
    pitch.querySelectorAll('.token').forEach(token => token.remove());
    const saved = getUserData().pizarra;
    const savedPos = saved ? saved.positions : null;
    drawnStrokes = saved && saved.strokes ? saved.strokes : [];
    blueFormation.forEach(p => pitch.appendChild(createChip(p, 'blue', savedPos)));
    redFormation.forEach(p => pitch.appendChild(createChip(p, 'red', savedPos)));
    pitch.appendChild(createBall(savedPos && savedPos.ball ? savedPos.ball : null));
    resizeCanvas();
    redrawCanvas();
  }

  document.getElementById('btn-reset-pizarra').addEventListener('click', () => {
    [...blueFormation, ...redFormation].forEach(p => {
      const chip = document.getElementById(p.id);
      if (chip) {
        chip.style.left = `${chip.dataset.defaultX}%`;
        chip.style.top = `${chip.dataset.defaultY}%`;
      }
    });
    const ball = document.getElementById('ball');
    if (ball) {
      ball.style.left = `${defaultBallPos.x}%`;
      ball.style.top = `${defaultBallPos.y}%`;
    }
    drawnStrokes = [];
    redrawCanvas();
    savePizarraData();
  });

  // ---- Herramienta de dibujo: líneas y flechas de movimiento ----
  function resizeCanvas() {
    drawCanvas.width = pitch.clientWidth;
    drawCanvas.height = pitch.clientHeight;
    redrawCanvas();
  }
  window.addEventListener('resize', resizeCanvas);

  function pctToPx(pt) {
    return { x: (pt.x / 100) * drawCanvas.width, y: (pt.y / 100) * drawCanvas.height };
  }

  function drawStroke(stroke) {
    if (!stroke.points.length) return;
    drawCtx.strokeStyle = stroke.color;
    drawCtx.lineWidth = 3;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.beginPath();
    const pts = stroke.points.map(pctToPx);
    drawCtx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => drawCtx.lineTo(p.x, p.y));
    drawCtx.stroke();
    // Punta de flecha al final del trazo
    if (pts.length >= 2) {
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const headLen = 10;
      drawCtx.beginPath();
      drawCtx.moveTo(b.x, b.y);
      drawCtx.lineTo(b.x - headLen * Math.cos(angle - Math.PI / 6), b.y - headLen * Math.sin(angle - Math.PI / 6));
      drawCtx.moveTo(b.x, b.y);
      drawCtx.lineTo(b.x - headLen * Math.cos(angle + Math.PI / 6), b.y - headLen * Math.sin(angle + Math.PI / 6));
      drawCtx.stroke();
    }
  }

  function redrawCanvas() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawnStrokes.forEach(drawStroke);
    if (currentStroke) drawStroke(currentStroke);
  }

  drawCanvas.addEventListener('pointerdown', (e) => {
    if (!drawMode) return;
    e.preventDefault();
    drawCanvas.setPointerCapture(e.pointerId);
    const rect = pitch.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    currentStroke = { color: currentDrawColor, points: [{ x, y }] };
  });

  drawCanvas.addEventListener('pointermove', (e) => {
    if (!drawMode || !currentStroke) return;
    const rect = pitch.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    currentStroke.points.push({ x, y });
    redrawCanvas();
  });

  function finishStroke() {
    if (!currentStroke) return;
    if (currentStroke.points.length > 1) drawnStrokes.push(currentStroke);
    currentStroke = null;
    redrawCanvas();
    savePizarraData();
  }
  drawCanvas.addEventListener('pointerup', finishStroke);
  drawCanvas.addEventListener('pointercancel', finishStroke);

  const btnToggleDraw = document.getElementById('btn-toggle-draw');
  const drawColorGroup = document.getElementById('draw-color-group');
  const btnClearLines = document.getElementById('btn-clear-lines');
  const pizarraHint = document.getElementById('pizarra-hint');

  btnToggleDraw.addEventListener('click', () => {
    drawMode = !drawMode;
    btnToggleDraw.classList.toggle('bg-turf', drawMode);
    btnToggleDraw.classList.toggle('border-turf', drawMode);
    drawCanvas.classList.toggle('pointer-events-none', !drawMode);
    drawCanvas.classList.toggle('pointer-events-auto', drawMode);
    drawCanvas.style.zIndex = drawMode ? 20 : 5;
    drawColorGroup.classList.toggle('hidden', !drawMode);
    drawColorGroup.classList.toggle('flex', drawMode);
    btnClearLines.classList.toggle('hidden', !drawMode);
    pizarraHint.textContent = drawMode
      ? 'Dibuja sobre el campo para trazar movimientos. Pulsa "Dibujar movimientos" para volver a mover fichas.'
      : 'Arrastra las fichas o el balón para moverlos sobre el campo.';
  });

  document.querySelectorAll('.draw-color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      currentDrawColor = dot.dataset.color;
      document.querySelectorAll('.draw-color-dot').forEach(d => d.classList.remove('active', 'ring-2', 'ring-offset-2', 'ring-offset-panel', 'ring-ink'));
      dot.classList.add('active', 'ring-2', 'ring-offset-2', 'ring-offset-panel', 'ring-ink');
    });
  });

  btnClearLines.addEventListener('click', () => {
    drawnStrokes = [];
    redrawCanvas();
    savePizarraData();
  });

  // ---------- Generador de Entrenamientos (Módulo 4) ----------
  const exerciseCategoryStyles = {
    'Físico':  { text: 'text-gold',     dot: 'bg-gold',     ring: 'border-gold/40'     },
    'Táctico': { text: 'text-turf',     dot: 'bg-turf',     ring: 'border-turf/40'     },
    'Técnico': { text: 'text-turfline', dot: 'bg-turfdark', ring: 'border-turfdark/40' },
  };

  const defaultExercises = [
    { id: 1, name: 'Rondo 4v2',            category: 'Técnico', duration: '15 min', desc: 'Posesión en espacio reducido para mejorar el primer toque.' },
    { id: 2, name: 'Series de sprints',    category: 'Físico',  duration: '20 min', desc: '6x40m con recuperación activa entre repeticiones.' },
    { id: 3, name: 'Presión tras pérdida', category: 'Táctico', duration: '25 min', desc: 'Reorganización defensiva en los primeros segundos tras perder el balón.' },
    { id: 4, name: 'Circuito de fuerza',   category: 'Físico',  duration: '30 min', desc: 'Trabajo de tren inferior con ejercicios de autocarga.' },
    { id: 5, name: 'Posesión 7v7',         category: 'Táctico', duration: '20 min', desc: 'Mantenimiento del balón con líneas de pase definidas.' },
    { id: 6, name: 'Control orientado',    category: 'Técnico', duration: '15 min', desc: 'Recepción y primer toque bajo presión de un defensor.' },
  ];

  let exercises = [];
  let currentExerciseFilter = 'Todos';

  function loadExercises() {
    exercises = getUserData().exercises;
    exerciseNextId = exercises.length ? Math.max(...exercises.map(ex => ex.id)) + 1 : 1;
    renderExercises(currentExerciseFilter);
  }

  function saveExercises() {
    getUserData().exercises = exercises;
    schedulePublish();
  }

  const exercisesGrid = document.getElementById('exercises-grid');

  function renderExercises(filter = 'Todos') {
    currentExerciseFilter = filter;
    exercisesGrid.innerHTML = '';
    exercises
      .filter(ex => filter === 'Todos' || ex.category === filter)
      .forEach(ex => {
        const s = exerciseCategoryStyles[ex.category];
        const card = document.createElement('div');
        card.className = `bg-card border ${s.ring} rounded-xl p-4`;
        card.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <span class="flex items-center gap-2 text-xs uppercase tracking-wide ${s.text} font-display font-600">
              <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>${ex.category}
            </span>
            <span class="text-xs text-muted">${ex.duration}</span>
          </div>
          <div class="flex items-start justify-between gap-2">
            <p class="font-display font-700 text-lg mb-1">${ex.name}</p>
            <button data-delete-exercise="${ex.id}" class="btn-delete-exercise shrink-0 text-muted hover:text-red-400 transition-colors p-1" title="Eliminar ejercicio">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
          <p class="text-sm text-muted">${ex.desc}</p>
        `;
        exercisesGrid.appendChild(card);
      });
  }

  exercisesGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete-exercise');
    if (!btn) return;
    exercises = exercises.filter(ex => ex.id !== Number(btn.dataset.deleteExercise));
    renderExercises(currentExerciseFilter);
    saveExercises();
  });

  document.getElementById('exercise-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-pill');
    if (!btn) return;
    document.querySelectorAll('.filter-pill').forEach(p => {
      const active = p === btn;
      p.classList.toggle('active', active);
      p.classList.toggle('bg-turf', active);
      p.classList.toggle('border-turf', active);
      p.classList.toggle('text-base', active);
      p.classList.toggle('border-border', !active);
      p.classList.toggle('text-muted', !active);
    });
    renderExercises(btn.dataset.filter);
  });

  const exerciseModalBackdrop = document.getElementById('exercise-modal-backdrop');
  const exerciseForm = document.getElementById('form-add-exercise');
  let exerciseNextId = 7;

  function openExerciseModal() {
    exerciseModalBackdrop.classList.remove('hidden');
    exerciseModalBackdrop.classList.add('flex');
  }
  function closeExerciseModal() {
    exerciseModalBackdrop.classList.add('hidden');
    exerciseModalBackdrop.classList.remove('flex');
    exerciseForm.reset();
  }

  document.getElementById('btn-add-exercise').addEventListener('click', openExerciseModal);
  document.getElementById('exercise-modal-close').addEventListener('click', closeExerciseModal);
  document.getElementById('exercise-modal-cancel').addEventListener('click', closeExerciseModal);
  exerciseModalBackdrop.addEventListener('click', (e) => { if (e.target === exerciseModalBackdrop) closeExerciseModal(); });

  exerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-exercise-name').value.trim();
    const category = document.getElementById('input-exercise-category').value;
    const duration = document.getElementById('input-exercise-duration').value.trim();
    const desc = document.getElementById('input-exercise-desc').value.trim();
    if (!name) return;
    exercises.push({ id: exerciseNextId++, name, category, duration: duration || '—', desc });
    renderExercises(currentExerciseFilter);
    saveExercises();
    closeExerciseModal();
  });

  // Calendario semanal (vista estática de ejemplo)
  const weekPlan = [
    { day: 'Lun', sessions: [{ label: 'Técnico', time: '18:00', category: 'Técnico' }] },
    { day: 'Mar', sessions: [{ label: 'Físico', time: '18:00', category: 'Físico' }] },
    { day: 'Mié', sessions: [] },
    { day: 'Jue', sessions: [{ label: 'Táctico', time: '18:00', category: 'Táctico' }] },
    { day: 'Vie', sessions: [{ label: 'Técnico', time: '18:30', category: 'Técnico' }] },
    { day: 'Sáb', sessions: [{ label: 'Partido', time: '17:00', category: 'Partido' }] },
    { day: 'Dom', sessions: [] },
  ];

  const calendarSessionStyles = {
    'Físico':  'bg-gold/15 text-gold border border-gold/30',
    'Táctico': 'bg-turf/15 text-turf border border-turf/30',
    'Técnico': 'bg-turfdark/20 text-turfline border border-turfdark/40',
    'Partido': 'bg-red-500/15 text-red-400 border border-red-500/30',
  };

  const calendarGrid = document.getElementById('calendar-grid');
  weekPlan.forEach(d => {
    const col = document.createElement('div');
    col.className = 'bg-card border border-border rounded-xl p-2 sm:p-3 min-h-[110px] flex flex-col';
    const sessionsHtml = d.sessions.length
      ? d.sessions.map(s => `
          <div class="rounded-lg px-2 py-1.5 mb-1.5 text-[11px] sm:text-xs font-display font-600 ${calendarSessionStyles[s.category]}">
            ${s.label}<br><span class="opacity-70">${s.time}</span>
          </div>`).join('')
      : `<span class="text-[11px] text-muted/60">Descanso</span>`;
    col.innerHTML = `
      <p class="text-xs uppercase tracking-wide text-muted font-display font-600 mb-2">${d.day}</p>
      ${sessionsHtml}
    `;
    calendarGrid.appendChild(col);
  });

  // ---------- Partido en Vivo (Módulo 5) ----------
  // De momento este módulo no se guarda entre sesiones ni se sincroniza con
  // la cuenta: el partido en vivo corre solo en memoria, en el dispositivo
  // que lo lleva. Si recargas la página a mitad de partido, se reinicia.
  let matchPlayers = [];
  let matchInitialized = false;
  let matchRunning = false;
  let matchSeconds = 0;
  let matchInterval = null;
  let matchHalf = 1;

  const matchClockEl = document.getElementById('match-clock');
  const fieldList = document.getElementById('field-list');
  const benchList = document.getElementById('bench-list');
  const fieldCountEl = document.getElementById('field-count');
  const benchCountEl = document.getElementById('bench-count');
  const matchEmptyState = document.getElementById('match-empty-state');
  const matchContent = document.getElementById('match-content');

  function formatClock(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function initMatchSquad() {
    if (!players.length) {
      matchPlayers = [];
      matchEmptyState.classList.remove('hidden');
      matchContent.classList.add('hidden');
      return;
    }
    matchEmptyState.classList.add('hidden');
    matchContent.classList.remove('hidden');

    const sorted = [...players].sort((a, b) => a.number - b.number);
    matchPlayers = sorted.map((p, i) => ({
      id: p.id,
      number: p.number,
      name: p.name,
      position: p.position,
      onField: i < 11,
      seconds: 0,
    }));
    matchSeconds = 0;
    matchHalf = 1;
    matchClockEl.textContent = formatClock(matchSeconds);
    document.getElementById('btn-toggle-half').textContent = '1ª Parte';
    matchInitialized = true;
  }

  function renderMatchLists() {
    if (!matchPlayers.length) return;
    const onField = matchPlayers.filter(p => p.onField).sort((a, b) => a.number - b.number);
    const onBench = matchPlayers.filter(p => !p.onField).sort((a, b) => a.number - b.number);
    fieldCountEl.textContent = onField.length;
    benchCountEl.textContent = onBench.length;

    fieldList.innerHTML = '';
    onField.forEach(p => {
      const row = document.createElement('div');
      row.className = 'bg-card border border-turf/30 rounded-lg px-3 py-2.5 flex items-center gap-3';
      row.innerHTML = `
        <span class="w-8 h-8 shrink-0 rounded-full bg-base border border-turf/50 flex items-center justify-center font-display font-700 text-sm">${p.number}</span>
        <span class="flex-1 min-w-0 truncate font-display font-600 text-sm">${p.name}</span>
        <span class="font-display font-700 text-sm tabular-nums text-turf">${formatClock(p.seconds)}</span>
        <button data-sub-out="${p.id}" class="btn-open-sub text-muted hover:text-ink p-1" title="Sustituir">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l4 4-4 4"/><path d="M21 7H9a4 4 0 0 0-4 4"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h12a4 4 0 0 0 4-4"/></svg>
        </button>
      `;
      fieldList.appendChild(row);

      // Selector de sustitución (oculto hasta que se pulse el icono)
      const subRow = document.createElement('div');
      subRow.id = `sub-select-${p.id}`;
      subRow.className = 'hidden pl-11 pr-3 -mt-1 mb-1';
      const options = onBench.map(b => `<option value="${b.id}">#${b.number} ${b.name}</option>`).join('');
      subRow.innerHTML = onBench.length
        ? `<select class="sub-select w-full bg-base border border-border rounded-lg px-2 py-1.5 text-sm text-ink" data-sub-out="${p.id}">
             <option value="">Elegir suplente que entra…</option>
             ${options}
           </select>`
        : `<p class="text-xs text-muted">No hay suplentes disponibles en el banquillo.</p>`;
      fieldList.appendChild(subRow);
    });

    benchList.innerHTML = '';
    if (!onBench.length) {
      benchList.innerHTML = `<p class="text-xs text-muted">No hay jugadores en el banquillo.</p>`;
    }
    onBench.forEach(p => {
      const row = document.createElement('div');
      row.className = 'bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-3';
      row.innerHTML = `
        <span class="w-8 h-8 shrink-0 rounded-full bg-base border border-border flex items-center justify-center font-display font-700 text-sm text-muted">${p.number}</span>
        <span class="flex-1 min-w-0 truncate font-display font-600 text-sm text-muted">${p.name}</span>
        <span class="font-display font-700 text-sm tabular-nums text-muted">${formatClock(p.seconds)}</span>
      `;
      benchList.appendChild(row);
    });
  }

  fieldList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-open-sub');
    if (!btn) return;
    document.querySelectorAll('[id^="sub-select-"]').forEach(el => {
      if (el.id !== `sub-select-${btn.dataset.subOut}`) el.classList.add('hidden');
    });
    document.getElementById(`sub-select-${btn.dataset.subOut}`).classList.toggle('hidden');
  });

  fieldList.addEventListener('change', (e) => {
    const select = e.target.closest('.sub-select');
    if (!select || !select.value) return;
    const outId = Number(select.dataset.subOut);
    const inId = Number(select.value);
    const outPlayer = matchPlayers.find(p => p.id === outId);
    const inPlayer = matchPlayers.find(p => p.id === inId);
    if (!outPlayer || !inPlayer) return;
    outPlayer.onField = false;
    inPlayer.onField = true;
    inPlayer.seconds = 0;
    renderMatchLists();
  });

  function tickMatchClock() {
    matchSeconds++;
    matchPlayers.forEach(p => { if (p.onField) p.seconds++; });
    matchClockEl.textContent = formatClock(matchSeconds);
    renderMatchLists();
  }

  document.getElementById('btn-toggle-clock').addEventListener('click', () => {
    matchRunning = !matchRunning;
    document.getElementById('icon-play').classList.toggle('hidden', matchRunning);
    document.getElementById('icon-pause').classList.toggle('hidden', !matchRunning);
    document.getElementById('clock-btn-label').textContent = matchRunning ? 'Pausar' : 'Reanudar';
    if (matchRunning) {
      matchInterval = setInterval(tickMatchClock, 1000);
    } else {
      clearInterval(matchInterval);
    }
  });

  document.getElementById('btn-reset-match').addEventListener('click', () => {
    matchRunning = false;
    clearInterval(matchInterval);
    matchClockEl.textContent = '00:00';
    document.getElementById('icon-play').classList.remove('hidden');
    document.getElementById('icon-pause').classList.add('hidden');
    document.getElementById('clock-btn-label').textContent = 'Iniciar';
    document.getElementById('btn-toggle-half').textContent = '1ª Parte';
    initMatchSquad();
    renderMatchLists();
  });

  document.getElementById('btn-toggle-half').addEventListener('click', (e) => {
    matchHalf = matchHalf === 1 ? 2 : 1;
    e.target.textContent = matchHalf === 1 ? '1ª Parte' : '2ª Parte';
  });

  // ---------- Scouting y Rival (Módulo 6) ----------
  let scoutingId = 1;
  let scoutingTargets = [];

  const defaultScoutingData = {
    rival: { name: '', system: '', notes: '' },
    targets: [
      { id: 1, name: 'Roc Alsina',  position: 'MED', club: 'U.E. Comarcal',    note: 'Buen golpeo de balón a balón parado. Rinde a buen nivel en categoría superior.' },
      { id: 2, name: 'Iker Montes', position: 'DEF', club: 'C.F. Puente Alto', note: 'Central zurdo, salida de balón limpia. Disponible en enero.' },
      { id: 3, name: 'Toni Camps',  position: 'DEL', club: 'A.E. Vallpark',    note: 'Delantero rápido, buen desmarque a la espalda. Pendiente de ver un partido más.' },
    ],
  };

  const inputRivalName = document.getElementById('input-rival-name');
  const inputRivalSystem = document.getElementById('input-rival-system');
  const inputRivalNotes = document.getElementById('input-rival-notes');

  function updateScoutingState() {
    getUserData().scouting = {
      rival: {
        name: inputRivalName.value,
        system: inputRivalSystem.value,
        notes: inputRivalNotes.value,
      },
      targets: scoutingTargets,
    };
  }

  function saveScoutingData() {
    updateScoutingState();
    schedulePublish();
  }

  // Pequeña espera tras dejar de escribir, para no publicar en cada pulsación de tecla.
  function scheduleScoutingSave() {
    updateScoutingState();
    schedulePublish(1200);
  }

  function loadScoutingData() {
    const data = getUserData().scouting || defaultScoutingData;
    inputRivalName.value = data.rival?.name || '';
    inputRivalSystem.value = data.rival?.system || '';
    inputRivalNotes.value = data.rival?.notes || '';
    scoutingTargets = data.targets || [];
    scoutingId = scoutingTargets.length ? Math.max(...scoutingTargets.map(t => t.id)) + 1 : 1;
    renderScoutingTargets();
  }

  [inputRivalName, inputRivalSystem, inputRivalNotes].forEach(el => {
    el.addEventListener('input', scheduleScoutingSave);
  });

  const scoutingGrid = document.getElementById('scouting-grid');
  const scoutingCountEl = document.getElementById('scouting-count');

  function renderScoutingTargets() {
    scoutingGrid.innerHTML = '';
    scoutingTargets.forEach(t => {
      const s = positionStyles[t.position];
      const card = document.createElement('div');
      card.className = 'bg-card border border-border hover:border-turf/40 rounded-xl p-4 transition-colors';
      card.innerHTML = `
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="min-w-0">
            <p class="font-display font-600 text-base truncate">${t.name}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>
              <span class="text-xs uppercase tracking-wide ${s.text}">${s.label}</span>
              ${t.club ? `<span class="text-xs text-muted">· ${t.club}</span>` : ''}
            </div>
          </div>
          <button data-delete-scout="${t.id}" class="btn-delete-scout shrink-0 text-muted hover:text-red-400 transition-colors p-1" title="Eliminar de seguimiento">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
        ${t.note ? `<p class="text-sm text-muted">${t.note}</p>` : ''}
      `;
      scoutingGrid.appendChild(card);
    });
    scoutingCountEl.textContent = scoutingTargets.length;
  }

  scoutingGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete-scout');
    if (!btn) return;
    scoutingTargets = scoutingTargets.filter(t => t.id !== Number(btn.dataset.deleteScout));
    renderScoutingTargets();
    saveScoutingData();
  });

  const scoutModalBackdrop = document.getElementById('scout-modal-backdrop');
  const scoutForm = document.getElementById('form-add-scout');

  function openScoutModal() {
    scoutModalBackdrop.classList.remove('hidden');
    scoutModalBackdrop.classList.add('flex');
  }
  function closeScoutModal() {
    scoutModalBackdrop.classList.add('hidden');
    scoutModalBackdrop.classList.remove('flex');
    scoutForm.reset();
  }

  document.getElementById('btn-add-scout').addEventListener('click', openScoutModal);
  document.getElementById('scout-modal-close').addEventListener('click', closeScoutModal);
  document.getElementById('scout-modal-cancel').addEventListener('click', closeScoutModal);
  scoutModalBackdrop.addEventListener('click', (e) => { if (e.target === scoutModalBackdrop) closeScoutModal(); });

  scoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-scout-name').value.trim();
    const position = document.getElementById('input-scout-position').value;
    const club = document.getElementById('input-scout-club').value.trim();
    const note = document.getElementById('input-scout-note').value.trim();
    if (!name) return;
    scoutingTargets.push({ id: scoutingId++, name, position, club, note });
    renderScoutingTargets();
    saveScoutingData();
    closeScoutModal();
  });

  // ---------- Cuentas: acceso y registro ----------
  function defaultUserData() {
    return {
      players: JSON.parse(JSON.stringify(defaultPlayers)),
      pizarra: { positions: null, strokes: [] },
      exercises: JSON.parse(JSON.stringify(defaultExercises)),
      scouting: JSON.parse(JSON.stringify(defaultScoutingData)),
    };
  }

  const authScreen = document.getElementById('auth-screen');
  const appRoot = document.getElementById('app-root');
  const authTabLogin = document.getElementById('auth-tab-login');
  const authTabRegister = document.getElementById('auth-tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');

  function showAuthError(el, message) {
    el.textContent = message;
    el.classList.remove('hidden');
  }
  function hideAuthError(el) {
    el.classList.add('hidden');
  }

  function setAuthTab(tab) {
    const showLogin = tab === 'login';
    formLogin.classList.toggle('hidden', !showLogin);
    formRegister.classList.toggle('hidden', showLogin);
    authTabLogin.classList.toggle('bg-turf', showLogin);
    authTabLogin.classList.toggle('text-base', showLogin);
    authTabLogin.classList.toggle('text-muted', !showLogin);
    authTabRegister.classList.toggle('bg-turf', !showLogin);
    authTabRegister.classList.toggle('text-base', !showLogin);
    authTabRegister.classList.toggle('text-muted', showLogin);
    hideAuthError(loginError);
    hideAuthError(registerError);
  }
  authTabLogin.addEventListener('click', () => setAuthTab('login'));
  authTabRegister.addEventListener('click', () => setAuthTab('register'));

  function bootApp() {
    authScreen.classList.add('hidden');
    appRoot.classList.remove('hidden');
    appRoot.classList.add('flex');
    loadPlayers();
    renderPitch();
    loadExercises();
    loadScoutingData();
    document.getElementById('today-date').textContent =
      new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    requestAnimationFrame(() => {
      positionBallMarker(document.querySelector('.nav-btn.active'));
    });
  }

  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const user = appState.users[username];
    if (!user || user.password !== password) {
      showAuthError(loginError, 'Usuario o contraseña incorrectos.');
      return;
    }
    currentUser = username;
    bootApp();
  });

  formRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;
    if (!username || !password) return;
    if (appState.users[username]) {
      showAuthError(registerError, 'Ese usuario ya existe. Elige otro nombre o inicia sesión.');
      return;
    }
    appState.users[username] = { password, ...defaultUserData() };
    currentUser = username;
    schedulePublish(200);
    bootApp();
  });

  // ---------- Exportar / Importar datos (respaldo entre dispositivos) ----------
  // Los datos solo viven en el localStorage de este navegador (ver nota al
  // principio del archivo). Estos botones permiten sacar un .json de la
  // cuenta activa y volver a cargarlo en otro dispositivo/navegador para
  // pasarse la plantilla y el resto de datos por WhatsApp, correo, etc.
  const importExportMsg = document.getElementById('import-export-msg');
  let importExportMsgTimer = null;

  function showImportExportMsg(text) {
    importExportMsg.textContent = text;
    importExportMsg.classList.remove('hidden');
    clearTimeout(importExportMsgTimer);
    importExportMsgTimer = setTimeout(() => importExportMsg.classList.add('hidden'), 4000);
  }

  document.getElementById('btn-export-data').addEventListener('click', () => {
    if (!currentUser) return;
    const userData = getUserData();
    const exportPayload = {
      app: 'oficina-entrenador',
      exportedAt: new Date().toISOString(),
      username: currentUser,
      data: {
        players: userData.players,
        pizarra: userData.pizarra,
        exercises: userData.exercises,
        scouting: userData.scouting,
      },
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `oficina-entrenador-${currentUser}-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showImportExportMsg('Datos exportados correctamente.');
  });

  const importFileInput = document.getElementById('input-import-file');
  document.getElementById('btn-import-data').addEventListener('click', () => importFileInput.click());

  importFileInput.addEventListener('change', () => {
    const file = importFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (error) {
        showImportExportMsg('El archivo no es un JSON válido.');
        importFileInput.value = '';
        return;
      }
      const incoming = parsed && parsed.data ? parsed.data : parsed;
      const hasKnownField = incoming && typeof incoming === 'object' &&
        ['players', 'pizarra', 'exercises', 'scouting'].some(key => key in incoming);
      if (!hasKnownField) {
        showImportExportMsg('El archivo no tiene un formato reconocido.');
        importFileInput.value = '';
        return;
      }
      const confirmed = window.confirm(
        'Esto reemplazará los datos actuales de tu cuenta (plantilla, pizarra, entrenamientos y scouting) por los del archivo importado. ¿Continuar?'
      );
      if (!confirmed) {
        importFileInput.value = '';
        return;
      }
      const userData = getUserData();
      if (Array.isArray(incoming.players)) userData.players = incoming.players;
      if (incoming.pizarra && typeof incoming.pizarra === 'object') userData.pizarra = incoming.pizarra;
      if (Array.isArray(incoming.exercises)) userData.exercises = incoming.exercises;
      if (incoming.scouting && typeof incoming.scouting === 'object') userData.scouting = incoming.scouting;
      persistState();
      loadPlayers();
      renderPitch();
      loadExercises();
      loadScoutingData();
      showImportExportMsg('Datos importados correctamente.');
      importFileInput.value = '';
    };
    reader.readAsText(file);
  });

  window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.nav-btn.active');
    if (activeBtn) positionBallMarker(activeBtn);
  });
