
  // ---------- Cuentas y datos: backend real (Supabase) ----------
  // Las cuentas (usuario + contraseña) y los datos de cada equipo viven en
  // una base de datos real, no en localStorage del navegador (ver
  // supabase_schema.sql y el README). Esto permite: contraseñas cifradas de
  // verdad, que un mismo usuario vea sus datos desde cualquier dispositivo,
  // y que el propietario del proyecto vea/gestione todas las cuentas desde
  // el panel de Supabase (Authentication > Users y Table Editor), sin
  // necesidad de un panel de administrador aparte dentro de la app.
  const SUPABASE_URL = 'https://gffbjjyrdlojwqfzjnyv.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_DjdcZUe7OG8Z5F1c30Bd3g__eENvTzw';
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Supabase Auth se identifica por email; usamos un dominio ficticio para
  // que el entrenador solo tenga que recordar un nombre de usuario.
  function usernameToEmail(username) {
    return `${username}@users.oficinaentrenadores.app`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  let currentUser = null; // { id, username } una vez ha iniciado sesión

  // ---------- Datos de la plantilla ----------
  const defaultPlayers = [
    { number: 1,  name: 'Marc Vidal',      position: 'POR', present: true  },
    { number: 4,  name: 'Àlex Puig',       position: 'DEF', present: true  },
    { number: 5,  name: 'Jordi Camps',     position: 'DEF', present: false },
    { number: 3,  name: 'Nil Serra',       position: 'DEF', present: true  },
    { number: 8,  name: 'Pau Ferrer',      position: 'MED', present: true  },
    { number: 6,  name: 'Bruno Soto',      position: 'MED', present: true  },
    { number: 10, name: 'Guillem Riera',   position: 'MED', present: false },
    { number: 7,  name: 'Aleix Roca',      position: 'DEL', present: true  },
    { number: 9,  name: 'Marc Aguilar',    position: 'DEL', present: true  },
    { number: 11, name: 'Dani Prats',      position: 'DEL', present: true  },
  ];

  let players = [];

  async function loadPlayers() {
    const { data, error } = await db.from('players').select('*').order('number', { ascending: true });
    if (error) {
      console.error('No se pudieron cargar los jugadores:', error);
      players = [];
    } else {
      players = data;
    }
    renderPlayers();
  }

  const positionStyles = {
    POR: { label: 'Portero',         border: 'border-gold/50',    text: 'text-gold',    dot: 'bg-gold'    },
    DEF: { label: 'Defensa',         border: 'border-turfdark/60', text: 'text-turfline', dot: 'bg-turfdark' },
    MED: { label: 'Centrocampista',  border: 'border-turf/50',    text: 'text-turf',    dot: 'bg-turf'    },
    DEL: { label: 'Delantero',       border: 'border-turf/80',    text: 'text-turf',    dot: 'bg-turf'    },
  };

  const grid = document.getElementById('players-grid');
  const countEl = document.getElementById('plantilla-count');

  grid.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.btn-delete-player');
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.deleteId);
      const { error } = await db.from('players').delete().eq('id', id);
      if (error) { console.error(error); alert('No se pudo eliminar el jugador.'); return; }
      players = players.filter(p => p.id !== id);
      renderPlayers();
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
      if (!player) return;
      const nextPresent = !player.present;
      const { error } = await db.from('players').update({ present: nextPresent }).eq('id', id);
      if (error) { console.error(error); return; }
      player.present = nextPresent;
      renderPlayers();
      return;
    }
    const viewBtn = e.target.closest('.btn-view-player');
    if (viewBtn) {
      const id = Number(viewBtn.dataset.viewId);
      const player = players.find(p => p.id === id);
      if (player) openPlayerStatsModal(player);
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
          <button type="button" data-view-id="${p.id}" class="btn-view-player flex items-center gap-4 flex-1 min-w-0 text-left bg-transparent p-0 cursor-pointer">
            <div class="w-14 h-14 shrink-0 rounded-full bg-night border-2 ${s.border} flex items-center justify-center">
              <span class="font-display font-700 text-xl">${p.number}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-display font-600 text-base leading-snug line-clamp-2" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>
                <span class="text-xs uppercase tracking-wide ${s.text}">${s.label}</span>
              </div>
            </div>
          </button>
          <div class="shrink-0 flex flex-col items-end gap-2">
            <button data-present-id="${p.id}" class="btn-toggle-present w-5 h-5 rounded-full border ${p.present ? 'bg-turf border-turf' : 'bg-transparent border-muted/40'} transition-colors" aria-label="${p.present ? 'Disponible (clic para marcar ausente)' : 'No disponible (clic para marcar presente)'}" title="${p.present ? 'Disponible (clic para marcar ausente)' : 'No disponible (clic para marcar presente)'}"></button>
            <div class="flex items-center gap-1">
              <button data-edit-id="${p.id}" class="btn-edit-player text-muted hover:text-turf transition-colors p-1" aria-label="Editar jugador" title="Editar jugador">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
              <button data-delete-id="${p.id}" class="btn-delete-player text-muted hover:text-red-400 transition-colors p-1" aria-label="Eliminar jugador" title="Eliminar jugador">
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

  // Accesibilidad: la tecla Escape cierra el modal abierto (todos los
  // backdrops ya cierran al pulsar fuera, así que reutilizamos ese cierre).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      if (!backdrop.classList.contains('hidden')) backdrop.click();
    });
  });

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
    historial:       { eyebrow: 'Módulo · Partido',   title: 'Historial de Partidos' },
    scouting:        { eyebrow: 'Módulo · Scouting',  title: 'Scouting y Rival' },
    admin:           { eyebrow: 'Administración',     title: 'Panel Admin' },
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
      matchInitialized = true;
      loadMatchState().then(renderMatchLists);
    }
    if (key === 'admin') {
      loadAdminPanel();
    }
    if (key === 'historial') {
      loadMatchHistory();
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const number = parseInt(document.getElementById('input-number').value, 10);
    const name = document.getElementById('input-name').value.trim();
    const position = document.getElementById('input-position').value;
    const present = inputPresent.checked;
    if (!name || !number) return;
    if (editingPlayerId !== null) {
      const { error } = await db.from('players').update({ number, name, position, present }).eq('id', editingPlayerId);
      if (error) { console.error(error); alert('No se pudo guardar el jugador.'); return; }
      const player = players.find(p => p.id === editingPlayerId);
      if (player) {
        player.number = number;
        player.name = name;
        player.position = position;
        player.present = present;
      }
    } else {
      const { data, error } = await db.from('players')
        .insert({ user_id: currentUser.id, number, name, position, present })
        .select()
        .single();
      if (error) { console.error(error); alert('No se pudo crear el jugador.'); return; }
      players.push(data);
    }
    renderPlayers();
    closeModal();
  });

  // ---------- Ficha de jugador: estadísticas de temporada ----------
  const playerStatsModalBackdrop = document.getElementById('player-stats-modal-backdrop');

  function closePlayerStatsModal() {
    playerStatsModalBackdrop.classList.add('hidden');
    playerStatsModalBackdrop.classList.remove('flex');
  }
  document.getElementById('player-stats-close').addEventListener('click', closePlayerStatsModal);
  playerStatsModalBackdrop.addEventListener('click', (e) => { if (e.target === playerStatsModalBackdrop) closePlayerStatsModal(); });

  async function openPlayerStatsModal(player) {
    document.getElementById('player-stats-name').textContent = `#${player.number} ${player.name}`;
    document.getElementById('player-stats-position').textContent = positionStyles[player.position]?.label || player.position;
    document.getElementById('player-stats-loading').classList.remove('hidden');
    document.getElementById('player-stats-body').classList.add('hidden');
    playerStatsModalBackdrop.classList.remove('hidden');
    playerStatsModalBackdrop.classList.add('flex');

    const [{ data: matchRows, error: matchesError }, { data: attendanceRows, error: attendanceError }] = await Promise.all([
      db.from('matches').select('events, players, duration_seconds'),
      db.from('training_attendance').select('present, training_sessions(session_date, label)').eq('player_id', player.id),
    ]);
    if (matchesError) console.error('No se pudieron cargar los partidos:', matchesError);
    if (attendanceError) console.error('No se pudo cargar la asistencia:', attendanceError);

    let goals = 0, yellows = 0, reds = 0, seconds = 0, totalMatchSeconds = 0;
    (matchRows || []).forEach(m => {
      (m.events || []).forEach(ev => {
        if (ev.playerId !== player.id || ev.team !== 'own') return;
        if (ev.type === 'goal') goals++;
        else if (ev.type === 'yellow') yellows++;
        else if (ev.type === 'red') reds++;
      });
      const mp = (m.players || []).find(mp => mp.id === player.id);
      if (mp) seconds += mp.seconds || 0;
      // Los partidos guardados antes de tener duration_seconds no cuentan
      // en el % (no sabemos cuánto duró el partido), pero sí en goles/minutos.
      if (m.duration_seconds) totalMatchSeconds += m.duration_seconds;
    });
    const minutesPct = totalMatchSeconds ? Math.round((seconds / totalMatchSeconds) * 100) : 0;
    const attendanceList = attendanceRows || [];
    const attendancePresent = attendanceList.filter(a => a.present).length;
    const attendanceTotal = attendanceList.length;

    document.getElementById('stat-player-goals').textContent = goals;
    document.getElementById('stat-player-minutes').textContent = Math.floor(seconds / 60);
    document.getElementById('stat-player-minutes-pct').textContent = `${minutesPct}% de los minutos disputados`;
    document.getElementById('stat-player-cards').innerHTML =
      `<span class="text-gold">${yellows}</span> <span class="text-muted text-base">/</span> <span class="text-red-400">${reds}</span>`;
    document.getElementById('stat-player-attendance').textContent = `${attendancePresent} / ${attendanceTotal}`;
    renderPlayerAttendanceByWeek(attendanceList);

    document.getElementById('player-stats-loading').classList.add('hidden');
    document.getElementById('player-stats-body').classList.remove('hidden');
  }

  function renderPlayerAttendanceByWeek(attendanceList) {
    const list = document.getElementById('player-stats-attendance-list');
    list.innerHTML = '';
    const withDate = attendanceList.filter(a => a.training_sessions && a.training_sessions.session_date);
    if (!withDate.length) {
      list.innerHTML = '<p class="text-xs text-muted">Todavía no hay sesiones de entrenamiento registradas.</p>';
      return;
    }
    const weeks = new Map();
    withDate.forEach(a => {
      const weekKey = dateStr(mondayOf(new Date(a.training_sessions.session_date + 'T00:00:00')));
      if (!weeks.has(weekKey)) weeks.set(weekKey, []);
      weeks.get(weekKey).push(a);
    });
    [...weeks.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([weekKey, rows]) => {
        const weekStart = new Date(weekKey + 'T00:00:00');
        const weekEnd = addDays(weekStart, 6);
        const header = document.createElement('p');
        header.className = 'text-xs text-muted uppercase tracking-wide mt-2 mb-1';
        header.textContent = `Semana del ${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
        list.appendChild(header);
        rows
          .sort((a, b) => b.training_sessions.session_date.localeCompare(a.training_sessions.session_date))
          .forEach(a => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-sm';
            const dateLabel = new Date(a.training_sessions.session_date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            row.innerHTML = `
              <span class="w-2 h-2 rounded-full shrink-0 ${a.present ? 'bg-turf' : 'bg-red-400'}"></span>
              <span class="flex-1 min-w-0 truncate">${dateLabel}</span>
              <span class="text-muted text-xs truncate">${escapeHtml(a.training_sessions.label || '')}</span>
            `;
            list.appendChild(row);
          });
      });
  }

  // ---------- Pizarra Táctica (Módulo 3) ----------
  // Formación por defecto 1-4-3-3 (Fútbol 11) y 1-2-3-1 (Fútbol 7).
  // Eje Y: 0 = portería rival (arriba), 100 = nuestra portería (abajo).
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

  const blueFormation7 = [
    { id: 'b1', num: 1,  x: 50, y: 94 },
    { id: 'b2', num: 2,  x: 30, y: 78 },
    { id: 'b4', num: 4,  x: 70, y: 78 },
    { id: 'b6', num: 6,  x: 25, y: 60 },
    { id: 'b8', num: 8,  x: 50, y: 58 },
    { id: 'b10', num: 10, x: 75, y: 60 },
    { id: 'b9', num: 9,  x: 50, y: 46 },
  ];
  const redFormation7 = blueFormation7.map(p => ({ id: 'r' + p.id, num: p.num, x: p.x, y: 100 - p.y }));

  const defaultBallPos = { x: 50, y: 50 };

  function currentFormations() {
    const format = currentUser && currentUser.gameFormat === 'F7' ? 'F7' : 'F11';
    return format === 'F7'
      ? { blue: blueFormation7, red: redFormation7 }
      : { blue: blueFormation, red: redFormation };
  }

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

  async function savePizarraData() {
    const positions = {};
    pitch.querySelectorAll('.token').forEach(token => {
      positions[token.id] = { x: parseFloat(token.style.left), y: parseFloat(token.style.top) };
    });
    const { error } = await db.from('pizarra').upsert({
      user_id: currentUser.id,
      positions,
      strokes: drawnStrokes,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('No se pudo guardar la pizarra:', error);
  }

  async function renderPitch() {
    pitch.querySelectorAll('.token').forEach(token => token.remove());
    const { data: saved, error } = await db.from('pizarra').select('*').maybeSingle();
    if (error) console.error('No se pudo cargar la pizarra:', error);
    const savedPos = saved ? saved.positions : null;
    drawnStrokes = saved && saved.strokes ? saved.strokes : [];
    const { blue, red } = currentFormations();
    blue.forEach(p => pitch.appendChild(createChip(p, 'blue', savedPos)));
    red.forEach(p => pitch.appendChild(createChip(p, 'red', savedPos)));
    pitch.appendChild(createBall(savedPos && savedPos.ball ? savedPos.ball : null));
    resizeCanvas();
    redrawCanvas();
  }

  document.getElementById('btn-reset-pizarra').addEventListener('click', () => {
    const { blue, red } = currentFormations();
    [...blue, ...red].forEach(p => {
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
    { name: 'Rondo 4v2',            category: 'Técnico', duration: '15 min', desc: 'Posesión en espacio reducido para mejorar el primer toque.' },
    { name: 'Series de sprints',    category: 'Físico',  duration: '20 min', desc: '6x40m con recuperación activa entre repeticiones.' },
    { name: 'Presión tras pérdida', category: 'Táctico', duration: '25 min', desc: 'Reorganización defensiva en los primeros segundos tras perder el balón.' },
    { name: 'Circuito de fuerza',   category: 'Físico',  duration: '30 min', desc: 'Trabajo de tren inferior con ejercicios de autocarga.' },
    { name: 'Posesión 7v7',         category: 'Táctico', duration: '20 min', desc: 'Mantenimiento del balón con líneas de pase definidas.' },
    { name: 'Control orientado',    category: 'Técnico', duration: '15 min', desc: 'Recepción y primer toque bajo presión de un defensor.' },
  ];

  let exercises = [];
  let currentExerciseFilter = 'Todos';

  async function loadExercises() {
    const { data, error } = await db.from('exercises').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('No se pudieron cargar los ejercicios:', error);
      exercises = [];
    } else {
      exercises = data.map(ex => ({
        id: ex.id, name: ex.name, category: ex.category, duration: ex.duration, desc: ex.description,
        playersNeeded: ex.players_needed, equipment: ex.equipment, favorite: !!ex.favorite, variantOf: ex.variant_of,
      }));
    }
    renderExercises(currentExerciseFilter);
  }

  const exercisesGrid = document.getElementById('exercises-grid');

  function renderExercises(filter = 'Todos') {
    currentExerciseFilter = filter;
    exercisesGrid.innerHTML = '';
    exercises
      .filter(ex => filter === 'Todos' || ex.category === filter)
      .slice()
      .sort((a, b) => (b.favorite - a.favorite))
      .forEach(ex => {
        const s = exerciseCategoryStyles[ex.category];
        const baseExercise = ex.variantOf ? exercises.find(e => e.id === ex.variantOf) : null;
        const card = document.createElement('div');
        card.className = `bg-card border ${s.ring} rounded-xl p-4 cursor-grab`;
        card.draggable = true;
        card.dataset.exerciseId = ex.id;
        card.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <span class="flex items-center gap-2 text-xs uppercase tracking-wide ${s.text} font-display font-600">
              <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>${ex.category}
            </span>
            <span class="text-xs text-muted">${escapeHtml(ex.duration || '')}</span>
          </div>
          <div class="flex items-start justify-between gap-2">
            <p class="font-display font-700 text-lg mb-1 flex items-center gap-1.5">
              ${ex.favorite ? '<span class="text-gold" title="Favorito">★</span>' : ''}${escapeHtml(ex.name)}
            </p>
            <div class="flex items-center gap-1 shrink-0">
              <button data-edit-exercise="${ex.id}" class="btn-edit-exercise text-muted hover:text-turf transition-colors p-1" aria-label="Editar ejercicio" title="Editar ejercicio">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
              <button data-delete-exercise="${ex.id}" class="btn-delete-exercise text-muted hover:text-red-400 transition-colors p-1" aria-label="Eliminar ejercicio" title="Eliminar ejercicio">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          </div>
          <p class="text-sm text-muted">${escapeHtml(ex.desc || '')}</p>
          ${(ex.playersNeeded || ex.equipment) ? `<p class="text-xs text-muted mt-2">${[ex.playersNeeded ? `${ex.playersNeeded} jugadores` : '', ex.equipment ? escapeHtml(ex.equipment) : ''].filter(Boolean).join(' · ')}</p>` : ''}
          ${baseExercise ? `<p class="text-xs text-muted/80 mt-2 italic">Variante de: ${escapeHtml(baseExercise.name)}</p>` : ''}
        `;
        exercisesGrid.appendChild(card);
      });
  }

  exercisesGrid.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.btn-delete-exercise');
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.deleteExercise);
      const { error } = await db.from('exercises').delete().eq('id', id);
      if (error) { console.error(error); return; }
      exercises = exercises.filter(ex => ex.id !== id);
      renderExercises(currentExerciseFilter);
      return;
    }
    const editBtn = e.target.closest('.btn-edit-exercise');
    if (editBtn) {
      const ex = exercises.find(x => x.id === Number(editBtn.dataset.editExercise));
      if (ex) openExerciseModal(ex);
    }
  });

  document.getElementById('exercise-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-pill');
    if (!btn) return;
    document.querySelectorAll('.filter-pill').forEach(p => {
      const active = p === btn;
      p.classList.toggle('active', active);
      p.classList.toggle('bg-turf', active);
      p.classList.toggle('border-turf', active);
      p.classList.toggle('text-night', active);
      p.classList.toggle('border-border', !active);
      p.classList.toggle('text-muted', !active);
    });
    renderExercises(btn.dataset.filter);
  });

  const exerciseModalBackdrop = document.getElementById('exercise-modal-backdrop');
  const exerciseForm = document.getElementById('form-add-exercise');
  const exerciseModalTitle = document.getElementById('exercise-modal-title');
  const exerciseModalSubmit = document.getElementById('exercise-modal-submit');
  const exerciseVariantOfSelect = document.getElementById('input-exercise-variant-of');
  let editingExerciseId = null;

  function populateExerciseVariantOptions(excludeId) {
    const options = exercises
      .filter(ex => ex.id !== excludeId)
      .map(ex => `<option value="${ex.id}">${escapeHtml(ex.name)}</option>`).join('');
    exerciseVariantOfSelect.innerHTML = `<option value="">Ninguno (ejercicio base)</option>${options}`;
  }

  function openExerciseModal(ex) {
    editingExerciseId = ex ? ex.id : null;
    populateExerciseVariantOptions(editingExerciseId);
    if (ex) {
      exerciseModalTitle.textContent = 'Editar ejercicio';
      exerciseModalSubmit.textContent = 'Guardar cambios';
      document.getElementById('input-exercise-name').value = ex.name || '';
      document.getElementById('input-exercise-category').value = ex.category;
      document.getElementById('input-exercise-duration').value = ex.duration || '';
      document.getElementById('input-exercise-desc').value = ex.desc || '';
      document.getElementById('input-exercise-players').value = ex.playersNeeded || '';
      document.getElementById('input-exercise-equipment').value = ex.equipment || '';
      document.getElementById('input-exercise-favorite').checked = !!ex.favorite;
      exerciseVariantOfSelect.value = ex.variantOf || '';
    } else {
      exerciseModalTitle.textContent = 'Nuevo ejercicio';
      exerciseModalSubmit.textContent = 'Guardar';
      exerciseForm.reset();
    }
    exerciseModalBackdrop.classList.remove('hidden');
    exerciseModalBackdrop.classList.add('flex');
  }
  function closeExerciseModal() {
    exerciseModalBackdrop.classList.add('hidden');
    exerciseModalBackdrop.classList.remove('flex');
    exerciseForm.reset();
    editingExerciseId = null;
  }

  document.getElementById('btn-add-exercise').addEventListener('click', () => openExerciseModal());
  document.getElementById('exercise-modal-close').addEventListener('click', closeExerciseModal);
  document.getElementById('exercise-modal-cancel').addEventListener('click', closeExerciseModal);
  exerciseModalBackdrop.addEventListener('click', (e) => { if (e.target === exerciseModalBackdrop) closeExerciseModal(); });

  exerciseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('input-exercise-name').value.trim();
    const category = document.getElementById('input-exercise-category').value;
    const duration = document.getElementById('input-exercise-duration').value.trim();
    const desc = document.getElementById('input-exercise-desc').value.trim();
    const playersNeeded = document.getElementById('input-exercise-players').value ? Number(document.getElementById('input-exercise-players').value) : null;
    const equipment = document.getElementById('input-exercise-equipment').value.trim();
    const favorite = document.getElementById('input-exercise-favorite').checked;
    const variantOf = exerciseVariantOfSelect.value ? Number(exerciseVariantOfSelect.value) : null;
    if (!name) return;
    const payload = {
      name, category, duration: duration || '—', description: desc,
      players_needed: playersNeeded, equipment, favorite, variant_of: variantOf,
    };
    if (editingExerciseId !== null) {
      const { error } = await db.from('exercises').update(payload).eq('id', editingExerciseId);
      if (error) { console.error(error); alert('No se pudo guardar el ejercicio.'); return; }
      const ex = exercises.find(x => x.id === editingExerciseId);
      if (ex) Object.assign(ex, { name, category, duration: payload.duration, desc, playersNeeded, equipment, favorite, variantOf });
    } else {
      const { data, error } = await db.from('exercises')
        .insert({ user_id: currentUser.id, ...payload })
        .select()
        .single();
      if (error) { console.error(error); alert('No se pudo crear el ejercicio.'); return; }
      exercises.push({
        id: data.id, name: data.name, category: data.category, duration: data.duration, desc: data.description,
        playersNeeded: data.players_needed, equipment: data.equipment, favorite: !!data.favorite, variantOf: data.variant_of,
      });
    }
    renderExercises(currentExerciseFilter);
    closeExerciseModal();
  });

  // ---------- Calendario semanal real + asistencia a entrenamientos ----------
  const calendarSessionStyles = {
    'Físico':  'bg-gold/15 text-gold border border-gold/30',
    'Táctico': 'bg-turf/15 text-turf border border-turf/30',
    'Técnico': 'bg-turfdark/20 text-turfline border border-turfdark/40',
    'Partido': 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  function mondayOf(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=domingo..6=sábado
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function dateStr(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { const copy = new Date(d); copy.setDate(copy.getDate() + n); return copy; }

  let currentWeekStart = mondayOf(new Date());
  let weekSessions = [];
  let calendarView = 'week'; // 'week' | 'month'
  let currentMonthCursor = new Date();
  let monthSessions = [];

  const calendarGrid = document.getElementById('calendar-grid');
  const calendarMonthGrid = document.getElementById('calendar-month-grid');
  const calendarWeekLabel = document.getElementById('calendar-week-label');
  const calendarCategoryDot = { 'Físico': 'bg-gold', 'Táctico': 'bg-turf', 'Técnico': 'bg-turfdark', 'Partido': 'bg-red-500' };

  function firstOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }

  async function loadWeekSessions() {
    const start = dateStr(currentWeekStart);
    const end = dateStr(addDays(currentWeekStart, 6));
    const { data, error } = await db.from('training_sessions')
      .select('*')
      .gte('session_date', start)
      .lte('session_date', end)
      .order('time', { ascending: true });
    if (error) { console.error('No se pudieron cargar las sesiones:', error); weekSessions = []; }
    else weekSessions = data;
    renderCalendar();
  }

  function renderCalendar() {
    const start = currentWeekStart;
    const end = addDays(start, 6);
    calendarWeekLabel.textContent =
      `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

    calendarGrid.innerHTML = '';
    const todayIso = dateStr(new Date());
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      const iso = dateStr(day);
      const isToday = iso === todayIso;
      const daySessions = weekSessions.filter(s => s.session_date === iso);

      const col = document.createElement('div');
      col.className = `bg-card border ${isToday ? 'border-turf/60' : 'border-border'} rounded-xl p-2 sm:p-3 min-h-[130px] flex flex-col transition-colors`;
      const sessionsHtml = daySessions.length
        ? daySessions.map(s => `
            <div data-session-id="${s.id}" draggable="true" class="btn-open-session cursor-grab active:cursor-grabbing rounded-lg px-2 py-1.5 mb-1.5 text-[11px] sm:text-xs font-display font-600 ${calendarSessionStyles[s.category] || calendarSessionStyles['Táctico']}">
              ${escapeHtml(s.label)}${s.time ? `<br><span class="opacity-70">${s.time}</span>` : ''}
            </div>`).join('')
        : '';
      col.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs uppercase tracking-wide ${isToday ? 'text-turf' : 'text-muted'} font-display font-600">${DAY_NAMES[i]} <span class="opacity-70">${day.getDate()}</span></p>
          <button type="button" data-add-day="${iso}" class="btn-add-session text-muted hover:text-turf transition-colors" aria-label="Añadir sesión" title="Añadir sesión">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
        <div class="flex-1">${sessionsHtml || '<span class="text-[11px] text-muted/60">Sin sesión</span>'}</div>
      `;
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('border-turf'); });
      col.addEventListener('dragleave', () => col.classList.remove('border-turf'));
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('border-turf');

        const sessionId = Number(e.dataTransfer.getData('text/session-id'));
        if (sessionId) {
          await moveSessionToDay(sessionId, iso);
          return;
        }

        const exerciseId = Number(e.dataTransfer.getData('text/exercise-id'));
        const exercise = exercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;
        const parsedMin = exercise.duration ? parseInt(exercise.duration, 10) : null;
        await createSession({
          session_date: iso, time: '18:00', label: exercise.name, category: exercise.category,
          items: [{ position: 0, block: 'Principal', exercise_id: exercise.id, name: exercise.name, duration_minutes: Number.isFinite(parsedMin) ? parsedMin : null }],
        });
      });
      calendarGrid.appendChild(col);
    }
  }

  async function createSession({ session_date, time, label, category, objective, items }) {
    const { data, error } = await db.from('training_sessions')
      .insert({ user_id: currentUser.id, session_date, time, label, category, objective: objective || null })
      .select()
      .single();
    if (error) { console.error(error); alert('No se pudo crear la sesión.'); return; }
    weekSessions.push(data);
    if (items && items.length) {
      const { error: itemsError } = await db.from('session_items')
        .insert(items.map(it => ({ ...it, user_id: currentUser.id, session_id: data.id })));
      if (itemsError) console.error('No se pudieron guardar los ejercicios de la sesión:', itemsError);
    }
    renderCalendar();
  }

  exercisesGrid.addEventListener('dragstart', (e) => {
    const card = e.target.closest('[data-exercise-id]');
    if (!card) return;
    e.dataTransfer.setData('text/exercise-id', card.dataset.exerciseId);
  });

  calendarGrid.addEventListener('dragstart', (e) => {
    const sessionEl = e.target.closest('.btn-open-session');
    if (!sessionEl) return;
    e.dataTransfer.setData('text/session-id', sessionEl.dataset.sessionId);
  });

  calendarGrid.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.btn-add-session');
    if (addBtn) { openSessionModal(addBtn.dataset.addDay); return; }
    const sessionEl = e.target.closest('.btn-open-session');
    if (sessionEl) { openSessionDetail(Number(sessionEl.dataset.sessionId)); return; }
  });

  async function moveSessionToDay(sessionId, newIso) {
    const session = weekSessions.find(s => s.id === sessionId);
    if (session && session.session_date === newIso) return;
    const { error } = await db.from('training_sessions').update({ session_date: newIso }).eq('id', sessionId);
    if (error) { console.error('No se pudo mover la sesión:', error); alert('No se pudo mover la sesión.'); return; }
    if (session) session.session_date = newIso;
    else await loadWeekSessions();
    renderCalendar();
  }

  // ---------- Vista mensual del calendario ----------
  async function loadMonthSessions() {
    const monthStart = firstOfMonth(currentMonthCursor);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const gridStart = mondayOf(monthStart);
    const gridEnd = addDays(mondayOf(monthEnd), 6);
    const { data, error } = await db.from('training_sessions')
      .select('*')
      .gte('session_date', dateStr(gridStart))
      .lte('session_date', dateStr(gridEnd))
      .order('time', { ascending: true });
    if (error) { console.error('No se pudieron cargar las sesiones del mes:', error); monthSessions = []; }
    else monthSessions = data;
    renderCalendarMonth();
  }

  function renderCalendarMonth() {
    const monthStart = firstOfMonth(currentMonthCursor);
    calendarWeekLabel.textContent = monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const gridStart = mondayOf(monthStart);
    const todayIso = dateStr(new Date());
    calendarMonthGrid.innerHTML = '';
    for (let i = 0; i < 42; i++) {
      const day = addDays(gridStart, i);
      const iso = dateStr(day);
      const inMonth = day.getMonth() === monthStart.getMonth();
      const isToday = iso === todayIso;
      const daySessions = monthSessions.filter(s => s.session_date === iso);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.dataset.monthDay = iso;
      cell.className = `btn-open-month-day text-left bg-card border ${isToday ? 'border-turf/60' : 'border-border'} rounded-lg p-1.5 sm:p-2 min-h-[60px] sm:min-h-[76px] flex flex-col gap-1 transition-colors hover:border-turf/40 ${inMonth ? '' : 'opacity-40'}`;
      const dots = daySessions.slice(0, 4).map(s => `<span class="w-1.5 h-1.5 rounded-full ${calendarCategoryDot[s.category] || calendarCategoryDot['Táctico']}"></span>`).join('');
      cell.innerHTML = `
        <span class="text-xs font-display font-600 ${isToday ? 'text-turf' : 'text-muted'}">${day.getDate()}</span>
        <span class="flex flex-wrap gap-1">${dots}</span>
        ${daySessions.length > 4 ? `<span class="text-[10px] text-muted">+${daySessions.length - 4}</span>` : ''}
      `;
      calendarMonthGrid.appendChild(cell);
    }
  }

  calendarMonthGrid.addEventListener('click', (e) => {
    const cell = e.target.closest('.btn-open-month-day');
    if (!cell) return;
    currentWeekStart = mondayOf(new Date(cell.dataset.monthDay + 'T00:00:00'));
    switchCalendarView('week');
    loadWeekSessions();
  });

  function updateCalendarViewButtons() {
    [['btn-calendar-view-week', 'week'], ['btn-calendar-view-month', 'month']].forEach(([id, view]) => {
      const btn = document.getElementById(id);
      const active = calendarView === view;
      btn.classList.toggle('bg-turf', active);
      btn.classList.toggle('text-night', active);
      btn.classList.toggle('text-muted', !active);
    });
  }

  function switchCalendarView(view) {
    calendarView = view;
    calendarGrid.classList.toggle('hidden', view !== 'week');
    calendarMonthGrid.classList.toggle('hidden', view !== 'month');
    updateCalendarViewButtons();
  }

  document.getElementById('btn-calendar-view-week').addEventListener('click', () => {
    switchCalendarView('week');
    renderCalendar();
  });
  document.getElementById('btn-calendar-view-month').addEventListener('click', () => {
    switchCalendarView('month');
    currentMonthCursor = new Date(currentWeekStart);
    loadMonthSessions();
  });

  document.getElementById('btn-week-prev').addEventListener('click', () => {
    if (calendarView === 'month') { currentMonthCursor = new Date(currentMonthCursor.getFullYear(), currentMonthCursor.getMonth() - 1, 1); loadMonthSessions(); }
    else { currentWeekStart = addDays(currentWeekStart, -7); loadWeekSessions(); }
  });
  document.getElementById('btn-week-next').addEventListener('click', () => {
    if (calendarView === 'month') { currentMonthCursor = new Date(currentMonthCursor.getFullYear(), currentMonthCursor.getMonth() + 1, 1); loadMonthSessions(); }
    else { currentWeekStart = addDays(currentWeekStart, 7); loadWeekSessions(); }
  });
  document.getElementById('btn-week-today').addEventListener('click', () => {
    currentWeekStart = mondayOf(new Date());
    currentMonthCursor = new Date();
    if (calendarView === 'month') loadMonthSessions(); else loadWeekSessions();
  });

  updateCalendarViewButtons();

  // ---- Modal: nueva/editar sesión, con plan de ejercicios por bloques ----
  const sessionModalBackdrop = document.getElementById('session-modal-backdrop');
  const sessionForm = document.getElementById('form-add-session');
  const sessionItemsListEl = document.getElementById('session-items-list');
  const SESSION_BLOCKS = ['Calentamiento', 'Principal', 'Vuelta a la calma'];
  let sessionItemsDraft = []; // [{ block, exerciseId, name, duration }]

  function updateSessionItemsTotalLabel() {
    const totalMin = sessionItemsDraft.reduce((s, it) => s + (Number(it.duration) || 0), 0);
    document.getElementById('session-items-total').textContent =
      `${sessionItemsDraft.length} ejercicio${sessionItemsDraft.length === 1 ? '' : 's'} · ${totalMin} min`;
  }

  function renderSessionItemsDraft() {
    sessionItemsListEl.innerHTML = '';
    sessionItemsDraft.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'bg-card border border-border rounded-lg p-3';
      const exerciseOptions = exercises.map(ex =>
        `<option value="${ex.id}" ${item.exerciseId === ex.id ? 'selected' : ''}>${escapeHtml(ex.name)}</option>`).join('');
      row.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
          <select data-item-field="block" data-item-idx="${idx}" class="session-item-field bg-night border border-border rounded-lg px-2 py-1.5 text-xs text-ink">
            ${SESSION_BLOCKS.map(b => `<option value="${b}" ${item.block === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
          <span class="flex-1"></span>
          <button type="button" data-remove-item="${idx}" class="btn-remove-session-item text-muted hover:text-red-400 p-1" aria-label="Quitar ejercicio del plan">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="grid grid-cols-[1fr_90px] gap-2 ${item.exerciseId ? '' : 'mb-2'}">
          <select data-item-field="exerciseId" data-item-idx="${idx}" class="session-item-field bg-night border border-border rounded-lg px-2 py-1.5 text-sm text-ink">
            <option value="" ${!item.exerciseId ? 'selected' : ''}>Personalizado…</option>
            ${exerciseOptions}
          </select>
          <input data-item-field="duration" data-item-idx="${idx}" type="number" min="0" value="${item.duration || ''}" placeholder="min" class="session-item-field bg-night border border-border rounded-lg px-2 py-1.5 text-sm text-ink">
        </div>
        ${!item.exerciseId ? `<input data-item-field="name" data-item-idx="${idx}" type="text" value="${escapeHtml(item.name || '')}" placeholder="Nombre del ejercicio" class="session-item-field w-full bg-night border border-border rounded-lg px-2 py-1.5 text-sm text-ink">` : ''}
      `;
      sessionItemsListEl.appendChild(row);
    });
    updateSessionItemsTotalLabel();
  }

  sessionItemsListEl.addEventListener('change', (e) => {
    const field = e.target.closest('.session-item-field');
    if (!field) return;
    const item = sessionItemsDraft[Number(field.dataset.itemIdx)];
    if (!item) return;
    const key = field.dataset.itemField;
    if (key === 'exerciseId') {
      const exId = field.value ? Number(field.value) : null;
      item.exerciseId = exId;
      if (exId) {
        const ex = exercises.find(x => x.id === exId);
        if (ex) {
          item.name = ex.name;
          const parsedMin = ex.duration ? parseInt(ex.duration, 10) : null;
          if (Number.isFinite(parsedMin)) item.duration = parsedMin;
        }
      }
      renderSessionItemsDraft();
      return;
    }
    if (key === 'duration') item.duration = field.value ? Number(field.value) : null;
    else if (key === 'block') item.block = field.value;
    else if (key === 'name') item.name = field.value;
    updateSessionItemsTotalLabel();
  });

  sessionItemsListEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-session-item');
    if (!btn) return;
    sessionItemsDraft.splice(Number(btn.dataset.removeItem), 1);
    renderSessionItemsDraft();
  });

  document.getElementById('btn-add-session-item').addEventListener('click', () => {
    const lastBlock = sessionItemsDraft.length ? sessionItemsDraft[sessionItemsDraft.length - 1].block : 'Principal';
    sessionItemsDraft.push({ block: lastBlock, exerciseId: null, name: '', duration: null });
    renderSessionItemsDraft();
  });

  function openSessionModal(iso) {
    document.getElementById('session-modal-title').textContent = 'Nueva sesión';
    document.getElementById('input-session-editing-id').value = '';
    document.getElementById('input-session-date').value = iso;
    document.getElementById('input-session-label').value = '';
    document.getElementById('input-session-category').value = 'Táctico';
    document.getElementById('input-session-time').value = '18:00';
    document.getElementById('input-session-objective').value = '';
    sessionItemsDraft = [];
    renderSessionItemsDraft();
    sessionModalBackdrop.classList.remove('hidden');
    sessionModalBackdrop.classList.add('flex');
  }

  async function openSessionModalForEdit(sessionId) {
    const session = weekSessions.find(s => s.id === sessionId);
    if (!session) return;
    document.getElementById('session-modal-title').textContent = 'Editar sesión';
    document.getElementById('input-session-editing-id').value = sessionId;
    document.getElementById('input-session-date').value = session.session_date;
    document.getElementById('input-session-label').value = session.label;
    document.getElementById('input-session-category').value = session.category;
    document.getElementById('input-session-time').value = session.time || '18:00';
    document.getElementById('input-session-objective').value = session.objective || '';
    const { data: items, error } = await db.from('session_items').select('*').eq('session_id', sessionId).order('position', { ascending: true });
    if (error) console.error('No se pudieron cargar los ejercicios de la sesión:', error);
    sessionItemsDraft = (items || []).map(it => ({ block: it.block, exerciseId: it.exercise_id, name: it.name, duration: it.duration_minutes }));
    renderSessionItemsDraft();
    sessionModalBackdrop.classList.remove('hidden');
    sessionModalBackdrop.classList.add('flex');
  }

  function closeSessionModal() {
    sessionModalBackdrop.classList.add('hidden');
    sessionModalBackdrop.classList.remove('flex');
    sessionForm.reset();
  }
  document.getElementById('session-modal-close').addEventListener('click', closeSessionModal);
  document.getElementById('session-modal-cancel').addEventListener('click', closeSessionModal);
  sessionModalBackdrop.addEventListener('click', (e) => { if (e.target === sessionModalBackdrop) closeSessionModal(); });

  sessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const session_date = document.getElementById('input-session-date').value;
    const label = document.getElementById('input-session-label').value.trim();
    const category = document.getElementById('input-session-category').value;
    const time = document.getElementById('input-session-time').value;
    const objective = document.getElementById('input-session-objective').value.trim();
    const editingId = document.getElementById('input-session-editing-id').value;
    if (!label || !session_date) return;

    const items = sessionItemsDraft
      .filter(it => it.exerciseId || (it.name && it.name.trim()))
      .map((it, idx) => ({
        position: idx,
        block: it.block || 'Principal',
        exercise_id: it.exerciseId || null,
        name: (it.exerciseId ? exercises.find(ex => ex.id === it.exerciseId)?.name : it.name) || 'Ejercicio',
        duration_minutes: it.duration ? Number(it.duration) : null,
      }));

    if (editingId) {
      const sessionId = Number(editingId);
      const { error: updateError } = await db.from('training_sessions').update({ label, category, time, session_date, objective }).eq('id', sessionId);
      if (updateError) { console.error(updateError); alert('No se pudo actualizar la sesión.'); return; }
      const { error: delError } = await db.from('session_items').delete().eq('session_id', sessionId);
      if (delError) console.error('No se pudieron limpiar los ejercicios anteriores de la sesión:', delError);
      if (items.length) {
        const { error: insError } = await db.from('session_items')
          .insert(items.map(it => ({ ...it, user_id: currentUser.id, session_id: sessionId })));
        if (insError) console.error('No se pudieron guardar los ejercicios de la sesión:', insError);
      }
      const idx = weekSessions.findIndex(s => s.id === sessionId);
      if (idx !== -1) weekSessions[idx] = { ...weekSessions[idx], label, category, time, session_date, objective };
      renderCalendar();
    } else {
      await createSession({ session_date, time, label, category, objective, items });
    }
    closeSessionModal();
  });

  // ---- Modal: detalle de sesión + asistencia ----
  const sessionDetailBackdrop = document.getElementById('session-detail-modal-backdrop');
  let currentSessionId = null;

  function renderSessionDetailPlan(items) {
    const planEl = document.getElementById('session-detail-plan');
    planEl.innerHTML = '';
    if (!items.length) {
      planEl.innerHTML = '<p class="text-xs text-muted">Sin ejercicios añadidos todavía.</p>';
      return;
    }
    const totalMin = items.reduce((s, it) => s + (it.duration_minutes || 0), 0);
    const totalP = document.createElement('p');
    totalP.className = 'text-xs text-muted mb-2';
    totalP.textContent = `${items.length} ejercicio${items.length === 1 ? '' : 's'} · ${totalMin} min en total`;
    planEl.appendChild(totalP);

    let lastBlock = null;
    items.forEach(it => {
      if (it.block !== lastBlock) {
        lastBlock = it.block;
        const header = document.createElement('p');
        header.className = 'text-xs uppercase tracking-wide text-turf font-display font-600 mt-2 mb-1';
        header.textContent = it.block;
        planEl.appendChild(header);
      }
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-sm';
      row.innerHTML = `
        <span class="flex-1 min-w-0 truncate">${escapeHtml(it.name)}</span>
        ${it.duration_minutes ? `<span class="text-xs text-muted shrink-0">${it.duration_minutes} min</span>` : ''}
      `;
      planEl.appendChild(row);
    });
  }

  let currentSessionDetailItems = [];

  async function openSessionDetail(sessionId) {
    const session = weekSessions.find(s => s.id === sessionId);
    if (!session) return;
    currentSessionId = sessionId;
    document.getElementById('session-detail-title').textContent = session.label;
    document.getElementById('session-detail-meta').textContent =
      `${new Date(session.session_date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}${session.time ? ' · ' + session.time : ''} · ${session.category}${session.objective ? ' · ' + session.objective : ''}`;
    document.getElementById('input-duplicate-session-date').value = '';

    const list = document.getElementById('session-detail-attendance');
    list.innerHTML = '<p class="text-xs text-muted">Cargando…</p>';
    document.getElementById('session-detail-plan').innerHTML = '<p class="text-xs text-muted">Cargando…</p>';
    sessionDetailBackdrop.classList.remove('hidden');
    sessionDetailBackdrop.classList.add('flex');

    const [{ data: items, error: itemsError }, { data: attendance, error: attError }] = await Promise.all([
      db.from('session_items').select('*').eq('session_id', sessionId).order('position', { ascending: true }),
      db.from('training_attendance').select('*').eq('session_id', sessionId),
    ]);
    if (itemsError) console.error('No se pudieron cargar los ejercicios de la sesión:', itemsError);
    if (attError) console.error('No se pudo cargar la asistencia:', attError);
    currentSessionDetailItems = items || [];
    renderSessionDetailPlan(currentSessionDetailItems);

    const attendanceMap = {};
    (attendance || []).forEach(a => { attendanceMap[a.player_id] = a; });

    list.innerHTML = '';
    if (!players.length) {
      list.innerHTML = '<p class="text-xs text-muted">No hay jugadores en la plantilla.</p>';
      return;
    }
    players.slice().sort((a, b) => a.number - b.number).forEach(p => {
      const rec = attendanceMap[p.id];
      const present = rec ? rec.present : true;
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2';
      row.innerHTML = `
        <span class="w-7 h-7 shrink-0 rounded-full bg-night border border-border flex items-center justify-center font-display font-700 text-xs">${p.number}</span>
        <span class="flex-1 min-w-0 truncate font-display font-600 text-sm">${escapeHtml(p.name)}</span>
        <button type="button" data-attendance-player="${p.id}" class="btn-toggle-attendance w-5 h-5 rounded-full border ${present ? 'bg-turf border-turf' : 'bg-transparent border-muted/40'} transition-colors" aria-label="${present ? 'Presente (clic para marcar ausente)' : 'Ausente (clic para marcar presente)'}" title="${present ? 'Presente (clic para marcar ausente)' : 'Ausente (clic para marcar presente)'}"></button>
      `;
      list.appendChild(row);
    });
  }

  document.getElementById('session-detail-attendance').addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-toggle-attendance');
    if (!btn || !currentSessionId) return;
    const playerId = Number(btn.dataset.attendancePlayer);
    const present = btn.classList.contains('bg-transparent');
    const { error } = await db.from('training_attendance')
      .upsert({ user_id: currentUser.id, session_id: currentSessionId, player_id: playerId, present }, { onConflict: 'session_id,player_id' });
    if (error) { console.error(error); return; }
    btn.classList.toggle('bg-turf', present);
    btn.classList.toggle('border-turf', present);
    btn.classList.toggle('bg-transparent', !present);
    btn.classList.toggle('border-muted/40', !present);
    btn.title = present ? 'Presente (clic para marcar ausente)' : 'Ausente (clic para marcar presente)';
  });

  function closeSessionDetailModal() {
    sessionDetailBackdrop.classList.add('hidden');
    sessionDetailBackdrop.classList.remove('flex');
    currentSessionId = null;
  }
  document.getElementById('session-detail-close').addEventListener('click', closeSessionDetailModal);
  sessionDetailBackdrop.addEventListener('click', (e) => { if (e.target === sessionDetailBackdrop) closeSessionDetailModal(); });

  document.getElementById('btn-edit-session').addEventListener('click', () => {
    if (!currentSessionId) return;
    const sessionId = currentSessionId;
    closeSessionDetailModal();
    openSessionModalForEdit(sessionId);
  });

  document.getElementById('btn-delete-session').addEventListener('click', async () => {
    if (!currentSessionId) return;
    const confirmed = window.confirm('¿Eliminar esta sesión y su asistencia registrada?');
    if (!confirmed) return;
    const { error } = await db.from('training_sessions').delete().eq('id', currentSessionId);
    if (error) { console.error(error); alert('No se pudo eliminar la sesión.'); return; }
    weekSessions = weekSessions.filter(s => s.id !== currentSessionId);
    renderCalendar();
    closeSessionDetailModal();
  });

  document.getElementById('btn-duplicate-session').addEventListener('click', async () => {
    if (!currentSessionId) return;
    const targetDate = document.getElementById('input-duplicate-session-date').value;
    if (!targetDate) { alert('Elige el día al que quieres duplicar la sesión.'); return; }
    const session = weekSessions.find(s => s.id === currentSessionId) ||
      monthSessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const items = currentSessionDetailItems.map((it, idx) => ({
      position: idx, block: it.block, exercise_id: it.exercise_id, name: it.name, duration_minutes: it.duration_minutes,
    }));
    await createSession({
      session_date: targetDate, time: session.time, label: session.label, category: session.category,
      objective: session.objective, items,
    });
    closeSessionDetailModal();
    alert(`Sesión duplicada al ${new Date(targetDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}.`);
  });

  // ---------- Partido en Vivo (Módulo 5) ----------
  // El partido EN CURSO se guarda en Supabase (tabla match_state):
  // cronómetro, parte, minutos por jugador, rival, fecha y eventos (goles y
  // tarjetas) sobreviven a un refresco de página o a cerrar la pestaña. Al
  // recargar, el partido queda en pausa (hay que pulsar "Reanudar") para no
  // tener que calcular el tiempo transcurrido mientras la app no estaba
  // abierta. Al pulsar "Finalizar partido" se copia todo a la tabla
  // `matches` (histórico), de donde se calculan las estadísticas de
  // temporada de cada jugador (ver openPlayerStatsModal).
  let matchPlayers = [];
  let matchInitialized = false;
  let matchRunning = false;
  let matchSeconds = 0;
  let matchInterval = null;
  let matchHalf = 1;
  let matchEvents = [];

  const matchClockEl = document.getElementById('match-clock');
  const fieldList = document.getElementById('field-list');
  const benchList = document.getElementById('bench-list');
  const fieldCountEl = document.getElementById('field-count');
  const benchCountEl = document.getElementById('bench-count');
  const matchEmptyState = document.getElementById('match-empty-state');
  const matchContent = document.getElementById('match-content');
  const inputMatchRival = document.getElementById('input-match-rival');
  const inputMatchDate = document.getElementById('input-match-date');

  function periodsForFormat(format) { return format === 'F7' ? 4 : 2; }
  function startersForFormat(format) { return format === 'F7' ? 7 : 11; }
  function periodLabel(n) { return ['1ª Parte', '2ª Parte', '3ª Parte', '4ª Parte'][n - 1] || `${n}ª Parte`; }
  function todayIsoDate() { return new Date().toISOString().slice(0, 10); }

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

    const starters = startersForFormat(currentUser?.gameFormat);
    const sorted = [...players].sort((a, b) => a.number - b.number);
    matchPlayers = sorted.map((p, i) => ({
      id: p.id,
      number: p.number,
      name: p.name,
      position: p.position,
      onField: i < starters,
      starter: i < starters,
      seconds: 0,
    }));
    matchSeconds = 0;
    matchHalf = 1;
    matchEvents = [];
    matchClockEl.textContent = formatClock(matchSeconds);
    document.getElementById('btn-toggle-half').textContent = periodLabel(matchHalf);
    matchInitialized = true;
  }

  async function saveMatchState() {
    if (!currentUser) return;
    const { error } = await db.from('match_state').upsert({
      user_id: currentUser.id,
      half: matchHalf,
      seconds: matchSeconds,
      players: matchPlayers,
      rival: inputMatchRival.value,
      match_date: inputMatchDate.value || todayIsoDate(),
      events: matchEvents,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('No se pudo guardar el estado del partido:', error);
  }

  // Se llama una vez, la primera vez que se entra en la pantalla de Partido:
  // intenta recuperar un partido guardado; si la plantilla ha cambiado desde
  // entonces (jugador añadido/borrado), empieza uno nuevo para no arrastrar
  // datos inconsistentes. El partido recuperado siempre queda en pausa.
  async function loadMatchState() {
    if (!players.length) {
      matchPlayers = [];
      matchEmptyState.classList.remove('hidden');
      matchContent.classList.add('hidden');
      return;
    }
    matchEmptyState.classList.add('hidden');
    matchContent.classList.remove('hidden');

    const { data: saved, error } = await db.from('match_state').select('*').maybeSingle();
    if (error) console.error('No se pudo cargar el estado del partido:', error);

    const currentIds = new Set(players.map(p => p.id));
    const savedPlayers = saved && Array.isArray(saved.players) ? saved.players : null;
    const savedMatchesSquad = savedPlayers && savedPlayers.length === players.length &&
      savedPlayers.every(p => currentIds.has(p.id));

    if (savedMatchesSquad) {
      matchPlayers = savedPlayers;
      matchSeconds = saved.seconds || 0;
      matchHalf = saved.half || 1;
      matchEvents = Array.isArray(saved?.events) ? saved.events : [];
    } else {
      initMatchSquad();
    }
    inputMatchRival.value = (saved && saved.rival) || '';
    inputMatchDate.value = (saved && saved.match_date) || todayIsoDate();
    matchRunning = false;
    clearInterval(matchInterval);
    matchClockEl.textContent = formatClock(matchSeconds);
    document.getElementById('icon-play').classList.remove('hidden');
    document.getElementById('icon-pause').classList.add('hidden');
    document.getElementById('clock-btn-label').textContent = 'Iniciar';
    document.getElementById('btn-toggle-half').textContent = periodLabel(matchHalf);
    matchInitialized = true;
    renderMatchEvents();
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
        <span class="w-8 h-8 shrink-0 rounded-full bg-night border border-turf/50 flex items-center justify-center font-display font-700 text-sm">${p.number}</span>
        <span class="flex-1 min-w-0 truncate font-display font-600 text-sm">${escapeHtml(p.name)}</span>
        <span class="font-display font-700 text-sm tabular-nums text-turf">${formatClock(p.seconds)}</span>
        <button data-sub-out="${p.id}" class="btn-open-sub text-muted hover:text-ink p-1" aria-label="Sustituir" title="Sustituir">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l4 4-4 4"/><path d="M21 7H9a4 4 0 0 0-4 4"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h12a4 4 0 0 0 4-4"/></svg>
        </button>
      `;
      fieldList.appendChild(row);

      // Selector de sustitución (oculto hasta que se pulse el icono)
      const subRow = document.createElement('div');
      subRow.id = `sub-select-${p.id}`;
      subRow.className = 'hidden pl-11 pr-3 -mt-1 mb-1';
      const options = onBench.map(b => `<option value="${b.id}">#${b.number} ${escapeHtml(b.name)}</option>`).join('');
      subRow.innerHTML = onBench.length
        ? `<select class="sub-select w-full bg-night border border-border rounded-lg px-2 py-1.5 text-sm text-ink" data-sub-out="${p.id}">
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
        <span class="w-8 h-8 shrink-0 rounded-full bg-night border border-border flex items-center justify-center font-display font-700 text-sm text-muted">${p.number}</span>
        <span class="flex-1 min-w-0 truncate font-display font-600 text-sm text-muted">${escapeHtml(p.name)}</span>
        <span class="font-display font-700 text-sm tabular-nums text-muted">${formatClock(p.seconds)}</span>
      `;
      benchList.appendChild(row);
    });
    populateMatchPickers();
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
    saveMatchState();
  });

  // El reloj guarda solo cada 5 segundos (y en cada acción manual, más abajo)
  // para no disparar una escritura a la base de datos cada segundo.
  let matchTicksSinceSave = 0;
  function tickMatchClock() {
    matchSeconds++;
    matchPlayers.forEach(p => { if (p.onField) p.seconds++; });
    matchClockEl.textContent = formatClock(matchSeconds);
    renderMatchLists();
    matchTicksSinceSave++;
    if (matchTicksSinceSave >= 5) {
      matchTicksSinceSave = 0;
      saveMatchState();
    }
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
      saveMatchState();
    }
  });

  function resetMatchUiToZero() {
    matchRunning = false;
    clearInterval(matchInterval);
    matchClockEl.textContent = '00:00';
    document.getElementById('icon-play').classList.remove('hidden');
    document.getElementById('icon-pause').classList.add('hidden');
    document.getElementById('clock-btn-label').textContent = 'Iniciar';
    initMatchSquad();
    inputMatchRival.value = '';
    inputMatchDate.value = todayIsoDate();
    renderMatchLists();
    renderMatchEvents();
  }

  document.getElementById('btn-reset-match').addEventListener('click', () => {
    const confirmed = window.confirm('Esto borra el partido actual (marcador, tarjetas y minutos) sin guardarlo en el historial. ¿Continuar?');
    if (!confirmed) return;
    resetMatchUiToZero();
    saveMatchState();
  });

  document.getElementById('btn-toggle-half').addEventListener('click', (e) => {
    const total = periodsForFormat(currentUser?.gameFormat);
    matchHalf = matchHalf >= total ? 1 : matchHalf + 1;
    e.target.textContent = periodLabel(matchHalf);
    saveMatchState();
  });

  // ---- Marcador, goles y tarjetas ----
  const goalOwnPicker = document.getElementById('goal-own-picker');
  const cardPicker = document.getElementById('card-picker');
  const matchEventsList = document.getElementById('match-events-list');

  function populateMatchPickers() {
    const options = matchPlayers.slice().sort((a, b) => a.number - b.number)
      .map(p => `<option value="${p.id}">#${p.number} ${escapeHtml(p.name)}</option>`).join('');
    document.getElementById('select-goal-scorer').innerHTML = `<option value="">Sin especificar</option>${options}`;
    document.getElementById('select-card-player').innerHTML = `<option value="">Jugador…</option>${options}`;
  }

  function scoreFromEvents(events) {
    let own = 0, rival = 0;
    (events || []).forEach(ev => {
      if (ev.type !== 'goal') return;
      if (ev.team === 'own') own++; else rival++;
    });
    return { own, rival };
  }

  function renderMatchEvents() {
    const { own, rival } = scoreFromEvents(matchEvents);
    document.getElementById('score-own').textContent = own;
    document.getElementById('score-rival').textContent = rival;

    matchEventsList.innerHTML = '';
    if (!matchEvents.length) {
      matchEventsList.innerHTML = '<p class="text-xs text-muted text-center">Sin goles ni tarjetas todavía.</p>';
      return;
    }
    matchEvents.slice().sort((a, b) => a.minute - b.minute).forEach(ev => {
      const icon = ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : '🟥';
      const label = ev.type === 'goal'
        ? (ev.team === 'own' ? `Gol${ev.playerName ? ' — ' + escapeHtml(ev.playerName) : ''}` : 'Gol rival')
        : `${ev.type === 'yellow' ? 'Amarilla' : 'Roja'} — ${escapeHtml(ev.playerName || '')}`;
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 bg-night/60 border border-border rounded-lg px-3 py-1.5 text-sm';
      row.innerHTML = `
        <span class="text-xs text-muted tabular-nums w-9 shrink-0">${ev.minute}'</span>
        <span class="flex-1 truncate">${icon} ${label}</span>
        <button type="button" data-remove-event="${ev.id}" class="btn-remove-event shrink-0 text-muted hover:text-red-400 px-1" aria-label="Eliminar evento">×</button>
      `;
      matchEventsList.appendChild(row);
    });
  }

  function addMatchEvent({ type, team, playerId, playerName }) {
    matchEvents.push({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type, team, playerId, playerName,
      minute: Math.floor(matchSeconds / 60),
      half: matchHalf,
    });
    renderMatchEvents();
    saveMatchState();
  }

  matchEventsList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-event');
    if (!btn) return;
    matchEvents = matchEvents.filter(ev => ev.id !== btn.dataset.removeEvent);
    renderMatchEvents();
    saveMatchState();
  });

  document.getElementById('btn-goal-own').addEventListener('click', () => {
    cardPicker.classList.add('hidden');
    goalOwnPicker.classList.toggle('hidden');
  });
  document.getElementById('btn-add-card').addEventListener('click', () => {
    goalOwnPicker.classList.add('hidden');
    cardPicker.classList.toggle('hidden');
  });
  document.getElementById('btn-goal-rival').addEventListener('click', () => {
    addMatchEvent({ type: 'goal', team: 'rival', playerId: null, playerName: null });
  });
  document.getElementById('btn-confirm-goal-own').addEventListener('click', () => {
    const select = document.getElementById('select-goal-scorer');
    const playerId = select.value ? Number(select.value) : null;
    const player = playerId ? matchPlayers.find(p => p.id === playerId) : null;
    addMatchEvent({ type: 'goal', team: 'own', playerId, playerName: player ? player.name : null });
    select.value = '';
    goalOwnPicker.classList.add('hidden');
  });
  document.getElementById('btn-confirm-card').addEventListener('click', () => {
    const type = document.getElementById('select-card-type').value;
    const select = document.getElementById('select-card-player');
    const playerId = select.value ? Number(select.value) : null;
    if (!playerId) return;
    const player = matchPlayers.find(p => p.id === playerId);
    addMatchEvent({ type, team: 'own', playerId, playerName: player ? player.name : null });
    select.value = '';
    cardPicker.classList.add('hidden');
  });

  let matchInfoSaveTimer = null;
  inputMatchRival.addEventListener('input', () => {
    clearTimeout(matchInfoSaveTimer);
    matchInfoSaveTimer = setTimeout(saveMatchState, 800);
  });
  inputMatchDate.addEventListener('change', saveMatchState);

  document.getElementById('btn-finish-match').addEventListener('click', async () => {
    if (!matchPlayers.length) return;
    const rival = inputMatchRival.value.trim();
    const confirmed = window.confirm(
      `Se guardará este partido${rival ? ' contra ' + rival : ''} en el historial y empezará uno nuevo. ¿Continuar?`
    );
    if (!confirmed) return;
    const format = currentUser?.gameFormat === 'F7' ? 'F7' : 'F11';
    const { error } = await db.from('matches').insert({
      user_id: currentUser.id,
      rival: rival || null,
      match_date: inputMatchDate.value || todayIsoDate(),
      format,
      periods: periodsForFormat(format),
      events: matchEvents,
      players: matchPlayers,
      duration_seconds: matchSeconds,
    });
    if (error) { console.error(error); alert('No se pudo guardar el partido en el historial.'); return; }
    resetMatchUiToZero();
    await saveMatchState();
    loadMatchHistory();
  });

  // ---------- Historial de Partidos ----------
  let matchHistory = [];
  let currentHistoryMatchId = null;
  const historyGrid = document.getElementById('history-grid');
  const historyCountEl = document.getElementById('history-count');
  const matchHistoryModalBackdrop = document.getElementById('match-history-modal-backdrop');

  async function loadMatchHistory() {
    historyGrid.innerHTML = '<p class="text-sm text-muted">Cargando…</p>';
    const { data, error } = await db.from('matches').select('*').order('match_date', { ascending: false });
    if (error) { console.error('No se pudieron cargar los partidos:', error); matchHistory = []; }
    else matchHistory = data;
    renderMatchHistory();
  }

  function renderMatchHistory() {
    historyCountEl.textContent = matchHistory.length;
    historyGrid.innerHTML = '';
    if (!matchHistory.length) {
      historyGrid.innerHTML = '<p class="text-sm text-muted">Todavía no hay partidos finalizados. Se guardan aquí al pulsar "Finalizar partido" en Partido en Vivo.</p>';
      return;
    }
    matchHistory.forEach(m => {
      const { own, rival } = scoreFromEvents(m.events);
      const card = document.createElement('div');
      card.dataset.matchId = m.id;
      card.className = 'btn-open-match cursor-pointer bg-card border border-border hover:border-turf/40 rounded-xl p-4 transition-colors';
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-2">
          <p class="font-display font-700 text-lg truncate">${escapeHtml(m.rival || 'Rival sin nombre')}</p>
          <span class="text-xs uppercase tracking-wide text-muted shrink-0">${m.format === 'F7' ? 'Fútbol 7' : 'Fútbol 11'}</span>
        </div>
        <div class="flex items-center justify-between">
          <p class="font-display font-700 text-2xl"><span class="text-turf">${own}</span> <span class="text-muted text-base">—</span> <span>${rival}</span></p>
          <p class="text-xs text-muted">${new Date(m.match_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      `;
      historyGrid.appendChild(card);
    });
  }

  historyGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.btn-open-match');
    if (!card) return;
    openMatchHistoryDetail(Number(card.dataset.matchId));
  });

  let historyEditMode = false;
  let historyEditEvents = [];
  const historyDetailViewFields = document.getElementById('history-detail-view-fields');
  const historyDetailEditFields = document.getElementById('history-detail-edit-fields');
  const historyDetailViewActions = document.getElementById('history-detail-view-actions');
  const historyDetailEditActions = document.getElementById('history-detail-edit-actions');
  const historyDetailEditAddEvent = document.getElementById('history-detail-edit-add-event');
  const historyEditRivalInput = document.getElementById('history-edit-rival');
  const historyEditDateInput = document.getElementById('history-edit-date');
  const historyEditEventPlayerSelect = document.getElementById('history-edit-event-player');

  function setHistoryEditMode(on) {
    historyEditMode = on;
    historyDetailViewFields.classList.toggle('hidden', on);
    historyDetailEditFields.classList.toggle('hidden', !on);
    historyDetailViewActions.classList.toggle('hidden', on);
    historyDetailEditActions.classList.toggle('hidden', !on);
    historyDetailEditActions.classList.toggle('flex', on);
    historyDetailEditAddEvent.classList.toggle('hidden', !on);
  }

  function renderHistoryDetailEvents(m) {
    const eventsList = document.getElementById('history-detail-events');
    eventsList.innerHTML = '';
    const events = historyEditMode ? historyEditEvents : (m.events || []);
    if (!events.length) {
      eventsList.innerHTML = '<p class="text-xs text-muted">Sin goles ni tarjetas en este partido.</p>';
      return;
    }
    events.slice().sort((a, b) => a.minute - b.minute).forEach(ev => {
      const icon = ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : '🟥';
      const label = ev.type === 'goal'
        ? (ev.team === 'own' ? `Gol${ev.playerName ? ' — ' + escapeHtml(ev.playerName) : ''}` : 'Gol rival')
        : `${ev.type === 'yellow' ? 'Amarilla' : 'Roja'} — ${escapeHtml(ev.playerName || '')}`;
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 bg-night/60 border border-border rounded-lg px-3 py-1.5 text-sm';
      row.innerHTML = `
        <span class="text-xs text-muted tabular-nums w-9 shrink-0">${ev.minute}'</span>
        <span class="flex-1 truncate">${icon} ${label}</span>
        ${historyEditMode ? `<button type="button" data-remove-history-event="${ev.id}" class="btn-remove-history-event shrink-0 text-muted hover:text-red-400 px-1" aria-label="Eliminar evento">×</button>` : ''}
      `;
      eventsList.appendChild(row);
    });
  }

  document.getElementById('history-detail-events').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-history-event');
    if (!btn || !historyEditMode) return;
    historyEditEvents = historyEditEvents.filter(ev => ev.id !== btn.dataset.removeHistoryEvent);
    const m = matchHistory.find(x => x.id === currentHistoryMatchId);
    renderHistoryDetailEvents(m);
  });

  document.getElementById('btn-edit-match-history').addEventListener('click', () => {
    const m = matchHistory.find(x => x.id === currentHistoryMatchId);
    if (!m) return;
    historyEditEvents = JSON.parse(JSON.stringify(m.events || []));
    historyEditRivalInput.value = m.rival || '';
    historyEditDateInput.value = m.match_date || '';
    const options = (m.players || []).slice().sort((a, b) => a.number - b.number)
      .map(p => `<option value="${p.id}">#${p.number} ${escapeHtml(p.name)}</option>`).join('');
    historyEditEventPlayerSelect.innerHTML = `<option value="">Sin especificar</option>${options}`;
    document.getElementById('history-edit-event-minute').value = '';
    setHistoryEditMode(true);
    renderHistoryDetailEvents(m);
  });

  document.getElementById('btn-cancel-edit-match-history').addEventListener('click', () => {
    const m = matchHistory.find(x => x.id === currentHistoryMatchId);
    if (!m) return;
    setHistoryEditMode(false);
    renderHistoryDetailEvents(m);
  });

  document.getElementById('btn-history-add-event').addEventListener('click', () => {
    const typeValue = document.getElementById('history-edit-event-type').value;
    const minute = Number(document.getElementById('history-edit-event-minute').value) || 0;
    const playerId = historyEditEventPlayerSelect.value ? Number(historyEditEventPlayerSelect.value) : null;
    const m = matchHistory.find(x => x.id === currentHistoryMatchId);
    const player = playerId ? (m.players || []).find(p => p.id === playerId) : null;
    if ((typeValue === 'yellow' || typeValue === 'red') && !playerId) { alert('Elige un jugador para la tarjeta.'); return; }
    const event = typeValue === 'goal-rival'
      ? { type: 'goal', team: 'rival', playerId: null, playerName: null, minute }
      : typeValue === 'goal-own'
      ? { type: 'goal', team: 'own', playerId, playerName: player ? player.name : null, minute }
      : { type: typeValue, team: 'own', playerId, playerName: player ? player.name : null, minute };
    historyEditEvents.push({ id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...event });
    historyEditEventPlayerSelect.value = '';
    document.getElementById('history-edit-event-minute').value = '';
    renderHistoryDetailEvents(m);
  });

  document.getElementById('btn-save-match-history').addEventListener('click', async () => {
    if (!currentHistoryMatchId) return;
    const rival = historyEditRivalInput.value.trim();
    const match_date = historyEditDateInput.value;
    if (!match_date) { alert('La fecha no puede quedar vacía.'); return; }
    const { error } = await db.from('matches')
      .update({ rival: rival || null, match_date, events: historyEditEvents })
      .eq('id', currentHistoryMatchId);
    if (error) { console.error(error); alert('No se pudieron guardar los cambios del partido.'); return; }
    const m = matchHistory.find(x => x.id === currentHistoryMatchId);
    m.rival = rival || null;
    m.match_date = match_date;
    m.events = historyEditEvents;
    setHistoryEditMode(false);
    renderMatchHistory();
    openMatchHistoryDetail(currentHistoryMatchId);
  });

  function closeMatchHistoryModal() {
    matchHistoryModalBackdrop.classList.add('hidden');
    matchHistoryModalBackdrop.classList.remove('flex');
    currentHistoryMatchId = null;
    setHistoryEditMode(false);
  }
  document.getElementById('history-detail-close').addEventListener('click', closeMatchHistoryModal);
  matchHistoryModalBackdrop.addEventListener('click', (e) => { if (e.target === matchHistoryModalBackdrop) closeMatchHistoryModal(); });

  function openMatchHistoryDetail(matchId) {
    const m = matchHistory.find(x => x.id === matchId);
    if (!m) return;
    currentHistoryMatchId = matchId;
    const { own, rival } = scoreFromEvents(m.events);
    const hasStarterInfo = (m.players || []).some(p => typeof p.starter === 'boolean');

    document.getElementById('history-detail-rival').textContent = m.rival || 'Rival sin nombre';
    document.getElementById('history-detail-meta').textContent =
      `${new Date(m.match_date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${m.format === 'F7' ? 'Fútbol 7' : 'Fútbol 11'}${m.duration_seconds ? ' · ' + formatClock(m.duration_seconds) : ''}`;
    document.getElementById('history-detail-score').innerHTML =
      `<span class="text-turf">${own}</span> <span class="text-muted text-xl">—</span> <span>${rival}</span>`;

    const playersList = document.getElementById('history-detail-players');
    playersList.innerHTML = '';
    (m.players || []).slice().sort((a, b) => a.number - b.number).forEach(p => {
      const pGoals = (m.events || []).filter(ev => ev.playerId === p.id && ev.type === 'goal' && ev.team === 'own').length;
      const pYellow = (m.events || []).filter(ev => ev.playerId === p.id && ev.type === 'yellow').length;
      const pRed = (m.events || []).filter(ev => ev.playerId === p.id && ev.type === 'red').length;
      const icons = [
        pGoals ? `⚽×${pGoals}` : '',
        pYellow ? `🟨×${pYellow}` : '',
        pRed ? `🟥×${pRed}` : '',
      ].filter(Boolean).join(' ');
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2';
      row.innerHTML = `
        <span class="w-7 h-7 shrink-0 rounded-full bg-night border border-border flex items-center justify-center font-display font-700 text-xs">${p.number}</span>
        <span class="flex-1 min-w-0 truncate font-display font-600 text-sm">${escapeHtml(p.name)}</span>
        ${hasStarterInfo ? `<span class="text-xs uppercase tracking-wide ${p.starter ? 'text-turf' : 'text-muted'} shrink-0">${p.starter ? 'Titular' : 'Suplente'}</span>` : ''}
        <span class="text-xs text-muted tabular-nums shrink-0">${Math.floor((p.seconds || 0) / 60)}'</span>
        <span class="text-xs shrink-0">${icons}</span>
      `;
      playersList.appendChild(row);
    });

    setHistoryEditMode(false);
    renderHistoryDetailEvents(m);

    matchHistoryModalBackdrop.classList.remove('hidden');
    matchHistoryModalBackdrop.classList.add('flex');
  }

  document.getElementById('btn-delete-match-history').addEventListener('click', async () => {
    if (!currentHistoryMatchId) return;
    const confirmed = window.confirm('¿Eliminar este partido del historial? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    const { error } = await db.from('matches').delete().eq('id', currentHistoryMatchId);
    if (error) { console.error(error); alert('No se pudo eliminar el partido.'); return; }
    matchHistory = matchHistory.filter(m => m.id !== currentHistoryMatchId);
    renderMatchHistory();
    closeMatchHistoryModal();
  });

  // ---------- Scouting y Rival (Módulo 6) ----------
  let scoutingTargets = [];

  const defaultScoutingTargets = [
    { name: 'Roc Alsina',  position: 'MED', club: 'U.E. Comarcal',    note: 'Buen golpeo de balón a balón parado. Rinde a buen nivel en categoría superior.' },
    { name: 'Iker Montes', position: 'DEF', club: 'C.F. Puente Alto', note: 'Central zurdo, salida de balón limpia. Disponible en enero.' },
    { name: 'Toni Camps',  position: 'DEL', club: 'A.E. Vallpark',    note: 'Delantero rápido, buen desmarque a la espalda. Pendiente de ver un partido más.' },
  ];

  const inputRivalName = document.getElementById('input-rival-name');
  const inputRivalSystem = document.getElementById('input-rival-system');
  const inputRivalNotes = document.getElementById('input-rival-notes');

  async function saveRivalInfo() {
    const { error } = await db.from('scouting_rival').upsert({
      user_id: currentUser.id,
      name: inputRivalName.value,
      system: inputRivalSystem.value,
      notes: inputRivalNotes.value,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('No se pudo guardar la info del rival:', error);
  }

  // Pequeña espera tras dejar de escribir, para no guardar en cada pulsación de tecla.
  let scoutingSaveTimer = null;
  function scheduleScoutingSave() {
    clearTimeout(scoutingSaveTimer);
    scoutingSaveTimer = setTimeout(saveRivalInfo, 1200);
  }

  let scoutingReports = [];

  async function loadScoutingData() {
    const [{ data: rival, error: rivalError }, { data: targets, error: targetsError }, { data: reports, error: reportsError }] = await Promise.all([
      db.from('scouting_rival').select('*').maybeSingle(),
      db.from('scouting_targets').select('*').order('created_at', { ascending: true }),
      db.from('scouting_reports').select('*').order('created_at', { ascending: false }),
    ]);
    if (rivalError) console.error('No se pudo cargar la info del rival:', rivalError);
    if (targetsError) console.error('No se pudieron cargar los fichajes:', targetsError);
    if (reportsError) console.error('No se pudieron cargar los informes anteriores:', reportsError);
    inputRivalName.value = rival?.name || '';
    inputRivalSystem.value = rival?.system || '';
    inputRivalNotes.value = rival?.notes || '';
    scoutingTargets = targets || [];
    scoutingReports = reports || [];
    renderScoutingTargets();
    renderScoutingReports();
  }

  [inputRivalName, inputRivalSystem, inputRivalNotes].forEach(el => {
    el.addEventListener('input', scheduleScoutingSave);
  });

  const scoutingReportsListEl = document.getElementById('scouting-reports-list');
  const scoutingReportsCountEl = document.getElementById('scouting-reports-count');

  function renderScoutingReports() {
    scoutingReportsListEl.innerHTML = '';
    scoutingReportsCountEl.textContent = scoutingReports.length;
    if (!scoutingReports.length) {
      scoutingReportsListEl.innerHTML = '<p class="text-sm text-muted">Todavía no hay informes guardados. Pulsa "Guardar informe en histórico" para archivar las notas actuales.</p>';
      return;
    }
    scoutingReports.forEach(r => {
      const dateLabel = new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      const details = document.createElement('details');
      details.className = 'bg-card border border-border rounded-xl px-4 py-3';
      details.innerHTML = `
        <summary class="flex items-center justify-between gap-3 cursor-pointer list-none">
          <span class="min-w-0 truncate">
            <span class="font-display font-600">${escapeHtml(r.opponent || 'Rival')}</span>
            <span class="text-xs text-muted ml-2">${dateLabel}${r.system ? ` · ${escapeHtml(r.system)}` : ''}</span>
          </span>
          <button type="button" data-delete-report="${r.id}" class="btn-delete-report shrink-0 text-muted hover:text-red-400 transition-colors p-1" aria-label="Eliminar informe" title="Eliminar informe">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </summary>
        <p class="text-sm text-muted mt-2 whitespace-pre-wrap">${escapeHtml(r.notes || '(sin notas)')}</p>
      `;
      scoutingReportsListEl.appendChild(details);
    });
  }

  scoutingReportsListEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete-report');
    if (!btn) return;
    e.preventDefault();
    const id = Number(btn.dataset.deleteReport);
    const { error } = await db.from('scouting_reports').delete().eq('id', id);
    if (error) { console.error(error); return; }
    scoutingReports = scoutingReports.filter(r => r.id !== id);
    renderScoutingReports();
  });

  document.getElementById('btn-save-scouting-report').addEventListener('click', async () => {
    const opponent = inputRivalName.value.trim();
    const system = inputRivalSystem.value.trim();
    const notes = inputRivalNotes.value.trim();
    if (!opponent && !system && !notes) return;
    const { data, error } = await db.from('scouting_reports')
      .insert({ user_id: currentUser.id, opponent, system, notes })
      .select()
      .single();
    if (error) { console.error(error); alert('No se pudo guardar el informe.'); return; }
    scoutingReports.unshift(data);
    renderScoutingReports();
  });

  const scoutingGrid = document.getElementById('scouting-grid');
  const scoutingCountEl = document.getElementById('scouting-count');

  const scoutingStatusOrder = ['Observación', 'Contactado', 'Descartado'];
  const scoutingStatusStyles = {
    'Observación': 'bg-gold/15 text-gold border border-gold/30',
    'Contactado':  'bg-turf/15 text-turf border border-turf/30',
    'Descartado':  'bg-red-500/15 text-red-400 border border-red-500/30',
  };

  function scoutingPositionStyle(position) {
    return positionStyles[position] || { label: position || 'Sin posición', text: 'text-muted', dot: 'bg-muted/60' };
  }

  function renderScoutingTargets() {
    scoutingGrid.innerHTML = '';
    scoutingTargets.forEach(t => {
      const s = scoutingPositionStyle(t.position);
      const status = t.status || 'Observación';
      const card = document.createElement('div');
      card.className = 'bg-card border border-border hover:border-turf/40 rounded-xl p-4 transition-colors';
      card.innerHTML = `
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="min-w-0">
            <p class="font-display font-600 text-base truncate">${escapeHtml(t.name)}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>
              <span class="text-xs uppercase tracking-wide ${s.text}">${escapeHtml(s.label)}</span>
              ${t.club ? `<span class="text-xs text-muted">· ${escapeHtml(t.club)}</span>` : ''}
            </div>
            ${t.contact ? `<p class="text-xs text-muted mt-1">${escapeHtml(t.contact)}</p>` : ''}
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button data-edit-scout="${t.id}" class="btn-edit-scout text-muted hover:text-turf transition-colors p-1" aria-label="Editar fichaje" title="Editar fichaje">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button data-delete-scout="${t.id}" class="btn-delete-scout text-muted hover:text-red-400 transition-colors p-1" aria-label="Eliminar de seguimiento" title="Eliminar de seguimiento">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>
        ${t.note ? `<p class="text-sm text-muted mb-3">${escapeHtml(t.note)}</p>` : ''}
        <button data-cycle-status="${t.id}" class="btn-cycle-scout-status text-xs uppercase tracking-wide font-display font-600 px-2.5 py-1 rounded-full ${scoutingStatusStyles[status]}" title="Pulsa para cambiar el estado">
          ${status}
        </button>
      `;
      scoutingGrid.appendChild(card);
    });
    scoutingCountEl.textContent = scoutingTargets.length;
  }

  scoutingGrid.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.btn-delete-scout');
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.deleteScout);
      const { error } = await db.from('scouting_targets').delete().eq('id', id);
      if (error) { console.error(error); return; }
      scoutingTargets = scoutingTargets.filter(t => t.id !== id);
      renderScoutingTargets();
      return;
    }
    const editBtn = e.target.closest('.btn-edit-scout');
    if (editBtn) {
      const target = scoutingTargets.find(t => t.id === Number(editBtn.dataset.editScout));
      if (target) openScoutModal(target);
      return;
    }
    const statusBtn = e.target.closest('.btn-cycle-scout-status');
    if (statusBtn) {
      const id = Number(statusBtn.dataset.cycleStatus);
      const target = scoutingTargets.find(t => t.id === id);
      if (!target) return;
      const nextStatus = scoutingStatusOrder[(scoutingStatusOrder.indexOf(target.status || 'Observación') + 1) % scoutingStatusOrder.length];
      const { error } = await db.from('scouting_targets').update({ status: nextStatus }).eq('id', id);
      if (error) { console.error(error); return; }
      target.status = nextStatus;
      renderScoutingTargets();
    }
  });

  const scoutModalBackdrop = document.getElementById('scout-modal-backdrop');
  const scoutForm = document.getElementById('form-add-scout');
  const scoutModalTitle = document.getElementById('scout-modal-title');
  const scoutModalSubmit = document.getElementById('scout-modal-submit');
  let editingScoutId = null;

  function openScoutModal(target) {
    editingScoutId = target ? target.id : null;
    if (target) {
      scoutModalTitle.textContent = 'Editar fichaje';
      scoutModalSubmit.textContent = 'Guardar cambios';
      document.getElementById('input-scout-name').value = target.name || '';
      document.getElementById('input-scout-position').value = target.position || '';
      document.getElementById('input-scout-club').value = target.club || '';
      document.getElementById('input-scout-contact').value = target.contact || '';
      document.getElementById('input-scout-status').value = target.status || 'Observación';
      document.getElementById('input-scout-note').value = target.note || '';
    } else {
      scoutModalTitle.textContent = 'Nuevo fichaje';
      scoutModalSubmit.textContent = 'Guardar';
      scoutForm.reset();
    }
    scoutModalBackdrop.classList.remove('hidden');
    scoutModalBackdrop.classList.add('flex');
  }
  function closeScoutModal() {
    scoutModalBackdrop.classList.add('hidden');
    scoutModalBackdrop.classList.remove('flex');
    scoutForm.reset();
    editingScoutId = null;
  }

  document.getElementById('btn-add-scout').addEventListener('click', () => openScoutModal());
  document.getElementById('scout-modal-close').addEventListener('click', closeScoutModal);
  document.getElementById('scout-modal-cancel').addEventListener('click', closeScoutModal);
  scoutModalBackdrop.addEventListener('click', (e) => { if (e.target === scoutModalBackdrop) closeScoutModal(); });

  scoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('input-scout-name').value.trim();
    const position = document.getElementById('input-scout-position').value.trim();
    const club = document.getElementById('input-scout-club').value.trim();
    const contact = document.getElementById('input-scout-contact').value.trim();
    const status = document.getElementById('input-scout-status').value;
    const note = document.getElementById('input-scout-note').value.trim();
    if (!name) return;
    if (editingScoutId !== null) {
      const { error } = await db.from('scouting_targets')
        .update({ name, position, club, contact, status, note })
        .eq('id', editingScoutId);
      if (error) { console.error(error); alert('No se pudo guardar el fichaje.'); return; }
      const target = scoutingTargets.find(t => t.id === editingScoutId);
      if (target) Object.assign(target, { name, position, club, contact, status, note });
    } else {
      const { data, error } = await db.from('scouting_targets')
        .insert({ user_id: currentUser.id, name, position, club, contact, status, note })
        .select()
        .single();
      if (error) { console.error(error); alert('No se pudo guardar el fichaje.'); return; }
      scoutingTargets.push(data);
    }
    renderScoutingTargets();
    closeScoutModal();
  });

  // ---------- Cuentas: acceso y registro ----------
  // Rellena una cuenta recién creada con datos de ejemplo, igual que antes,
  // para que la primera vez que se entra la app no se vea vacía.
  async function seedDefaultData(userId) {
    await db.from('players').insert(
      defaultPlayers.map(p => ({ user_id: userId, number: p.number, name: p.name, position: p.position, present: p.present }))
    );
    await db.from('exercises').insert(
      defaultExercises.map(ex => ({ user_id: userId, name: ex.name, category: ex.category, duration: ex.duration, description: ex.desc }))
    );
    await db.from('scouting_targets').insert(
      defaultScoutingTargets.map(t => ({ user_id: userId, name: t.name, position: t.position, club: t.club, note: t.note }))
    );
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
    authTabLogin.classList.toggle('text-night', showLogin);
    authTabLogin.classList.toggle('text-muted', !showLogin);
    authTabRegister.classList.toggle('bg-turf', !showLogin);
    authTabRegister.classList.toggle('text-night', !showLogin);
    authTabRegister.classList.toggle('text-muted', showLogin);
    hideAuthError(loginError);
    hideAuthError(registerError);
  }
  authTabLogin.addEventListener('click', () => setAuthTab('login'));
  authTabRegister.addEventListener('click', () => setAuthTab('register'));

  async function loadProfileSettings() {
    const { data, error } = await db.from('profiles').select('is_admin, game_format').eq('user_id', currentUser.id).maybeSingle();
    if (error) { console.error('No se pudo cargar el perfil:', error); return { isAdmin: false, gameFormat: 'F11' }; }
    return {
      isAdmin: !!(data && data.is_admin),
      gameFormat: (data && data.game_format === 'F7') ? 'F7' : 'F11',
    };
  }

  const formatSwitch = document.getElementById('format-switch');
  function renderFormatSwitch() {
    formatSwitch.querySelectorAll('.format-btn').forEach(btn => {
      const active = btn.dataset.format === currentUser.gameFormat;
      btn.classList.toggle('bg-turf', active);
      btn.classList.toggle('text-night', active);
      btn.classList.toggle('text-muted', !active);
    });
  }
  formatSwitch.addEventListener('click', async (e) => {
    const btn = e.target.closest('.format-btn');
    if (!btn || btn.dataset.format === currentUser.gameFormat) return;
    currentUser.gameFormat = btn.dataset.format;
    renderFormatSwitch();
    renderPitch();
    document.getElementById('btn-toggle-half').textContent = periodLabel(matchHalf);
    const { error } = await db.from('profiles').update({ game_format: currentUser.gameFormat }).eq('user_id', currentUser.id);
    if (error) console.error('No se pudo guardar el formato de equipo:', error);
  });

  async function bootApp() {
    authScreen.classList.add('hidden');
    appRoot.classList.remove('hidden');
    appRoot.classList.add('flex');
    document.getElementById('current-username').textContent = currentUser.username;
    const profileSettings = await loadProfileSettings();
    currentUser.isAdmin = profileSettings.isAdmin;
    currentUser.gameFormat = profileSettings.gameFormat;
    document.getElementById('nav-admin-item').classList.toggle('hidden', !currentUser.isAdmin);
    renderFormatSwitch();
    await Promise.all([loadPlayers(), renderPitch(), loadExercises(), loadScoutingData(), loadWeekSessions()]);
    document.getElementById('today-date').textContent =
      new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    requestAnimationFrame(() => {
      positionBallMarker(document.querySelector('.nav-btn.active'));
    });
  }

  document.querySelectorAll('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.querySelector('.icon-eye').classList.toggle('hidden', show);
      btn.querySelector('.icon-eye-off').classList.toggle('hidden', !show);
      btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    if (!username || !password) return;
    hideAuthError(loginError);
    const { data, error } = await db.auth.signInWithPassword({ email: usernameToEmail(username), password });
    if (error) {
      showAuthError(loginError, 'Usuario o contraseña incorrectos.');
      return;
    }
    currentUser = { id: data.user.id, username: data.user.user_metadata?.username || username };
    await bootApp();
  });

  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;
    if (!username || !password) return;
    hideAuthError(registerError);
    const { data, error } = await db.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username } },
    });
    if (error) {
      showAuthError(registerError, error.message || 'No se pudo crear la cuenta.');
      return;
    }
    currentUser = { id: data.user.id, username };
    await db.from('profiles').insert({ user_id: currentUser.id, username });
    await seedDefaultData(currentUser.id);
    await bootApp();
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await db.auth.signOut();
    location.reload();
  });

  // Si ya había una sesión activa (misma pestaña/navegador), entra directo
  // sin pedir usuario y contraseña otra vez.
  (async function restoreSession() {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      currentUser = { id: session.user.id, username: session.user.user_metadata?.username || session.user.email.split('@')[0] };
      await bootApp();
    }
  })();

  // ---------- Panel de administrador ----------
  // Solo lo ve quien tenga is_admin=true en la tabla profiles (ver
  // supabase_migration_02_admin_and_match.sql). Deja ver todas las cuentas
  // registradas y vaciar los datos de un equipo. Borrar la cuenta de acceso
  // en sí (usuario + contraseña) se sigue haciendo desde el panel de
  // Supabase, porque eso requiere la clave secreta "service_role", que
  // nunca debe ir en el código de un sitio estático.
  const adminUsersList = document.getElementById('admin-users-list');
  const adminUsersCountEl = document.getElementById('admin-users-count');

  async function loadAdminPanel() {
    adminUsersList.innerHTML = '<p class="text-sm text-muted">Cargando…</p>';
    const [{ data: profiles, error: profilesError }, { data: playerRows, error: playersError }] = await Promise.all([
      db.from('profiles').select('*').order('created_at', { ascending: true }),
      db.from('players').select('user_id'),
    ]);
    if (profilesError) {
      console.error(profilesError);
      adminUsersList.innerHTML = '<p class="text-sm text-red-400">No se pudo cargar la lista de usuarios.</p>';
      return;
    }
    if (playersError) console.error(playersError);
    const counts = {};
    (playerRows || []).forEach(r => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });

    adminUsersCountEl.textContent = profiles.length;
    adminUsersList.innerHTML = '';
    profiles.forEach(p => {
      const row = document.createElement('div');
      row.className = 'bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap';
      const dateStr = p.created_at
        ? new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
      row.innerHTML = `
        <div class="min-w-0">
          <p class="font-display font-600 text-base truncate">
            ${escapeHtml(p.username)}
            ${p.is_admin ? '<span class="ml-2 text-xs uppercase text-gold">Admin</span>' : ''}
            ${p.user_id === currentUser.id ? '<span class="ml-2 text-xs uppercase text-muted">(tú)</span>' : ''}
          </p>
          <p class="text-xs text-muted mt-1">Registrado el ${dateStr} · ${counts[p.user_id] || 0} jugadores en su plantilla</p>
        </div>
        <button data-wipe-user="${p.user_id}" data-wipe-username="${escapeHtml(p.username)}" class="btn-wipe-user shrink-0 border border-red-500/30 hover:bg-red-500/15 text-red-400 font-display font-600 uppercase text-xs tracking-wide px-3 py-2 rounded-lg transition-colors">
          Vaciar datos
        </button>
      `;
      adminUsersList.appendChild(row);
    });
  }

  adminUsersList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-wipe-user');
    if (!btn) return;
    const userId = btn.dataset.wipeUser;
    const username = btn.dataset.wipeUsername;
    const confirmed = window.confirm(
      `Esto borrará TODA la plantilla, pizarra, entrenamientos y scouting de "${username}". La cuenta de acceso no se borra (eso se hace desde Supabase). ¿Continuar?`
    );
    if (!confirmed) return;
    const tables = ['players', 'pizarra', 'exercises', 'scouting_rival', 'scouting_targets', 'scouting_reports', 'match_state', 'matches', 'training_sessions', 'training_attendance', 'session_items'];
    for (const table of tables) {
      const { error } = await db.from(table).delete().eq('user_id', userId);
      if (error) console.error(`No se pudo borrar ${table} para ${username}:`, error);
    }
    await loadAdminPanel();
  });

  // ---------- Exportar / Importar datos (respaldo / copia manual) ----------
  // Los datos ya viven en el servidor y se ven desde cualquier dispositivo,
  // así que esto ya no hace falta para el uso normal del día a día. Se deja
  // como copia de seguridad manual descargable, por si alguien quiere
  // guardar un respaldo de su equipo en su ordenador.
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
    const positions = {};
    pitch.querySelectorAll('.token').forEach(token => {
      positions[token.id] = { x: parseFloat(token.style.left), y: parseFloat(token.style.top) };
    });
    const exportPayload = {
      app: 'oficina-entrenador',
      exportedAt: new Date().toISOString(),
      username: currentUser.username,
      data: {
        players: players.map(({ number, name, position, present }) => ({ number, name, position, present })),
        pizarra: { positions, strokes: drawnStrokes },
        exercises: exercises.map(({ name, category, duration, desc, playersNeeded, equipment, favorite }) => ({ name, category, duration, desc, playersNeeded, equipment, favorite })),
        scouting: {
          rival: { name: inputRivalName.value, system: inputRivalSystem.value, notes: inputRivalNotes.value },
          targets: scoutingTargets.map(({ name, position, club, contact, status, note }) => ({ name, position, club, contact, status, note })),
        },
      },
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `oficina-entrenador-${currentUser.username}-${dateStamp}.json`;
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
    reader.onload = async () => {
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
      try {
        if (Array.isArray(incoming.players)) {
          await db.from('players').delete().eq('user_id', currentUser.id);
          if (incoming.players.length) {
            await db.from('players').insert(incoming.players.map(p => ({
              user_id: currentUser.id, number: p.number, name: p.name, position: p.position, present: !!p.present,
            })));
          }
        }
        if (incoming.pizarra && typeof incoming.pizarra === 'object') {
          await db.from('pizarra').upsert({
            user_id: currentUser.id,
            positions: incoming.pizarra.positions || null,
            strokes: incoming.pizarra.strokes || [],
            updated_at: new Date().toISOString(),
          });
        }
        if (Array.isArray(incoming.exercises)) {
          await db.from('exercises').delete().eq('user_id', currentUser.id);
          if (incoming.exercises.length) {
            await db.from('exercises').insert(incoming.exercises.map(ex => ({
              user_id: currentUser.id, name: ex.name, category: ex.category, duration: ex.duration,
              description: ex.desc ?? ex.description,
              players_needed: ex.playersNeeded ?? null, equipment: ex.equipment ?? null, favorite: !!ex.favorite,
            })));
          }
        }
        if (incoming.scouting && typeof incoming.scouting === 'object') {
          const rival = incoming.scouting.rival || {};
          await db.from('scouting_rival').upsert({
            user_id: currentUser.id,
            name: rival.name || '',
            system: rival.system || '',
            notes: rival.notes || '',
            updated_at: new Date().toISOString(),
          });
          if (Array.isArray(incoming.scouting.targets)) {
            await db.from('scouting_targets').delete().eq('user_id', currentUser.id);
            if (incoming.scouting.targets.length) {
              await db.from('scouting_targets').insert(incoming.scouting.targets.map(t => ({
                user_id: currentUser.id, name: t.name, position: t.position, club: t.club, contact: t.contact || null, status: t.status || 'Observación', note: t.note,
              })));
            }
          }
        }
        await Promise.all([loadPlayers(), renderPitch(), loadExercises(), loadScoutingData()]);
        showImportExportMsg('Datos importados correctamente.');
      } catch (err) {
        console.error(err);
        showImportExportMsg('Hubo un error al importar los datos.');
      }
      importFileInput.value = '';
    };
    reader.readAsText(file);
  });

  window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.nav-btn.active');
    if (activeBtn) positionBallMarker(activeBtn);
  });
