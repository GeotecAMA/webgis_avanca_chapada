/* Plataforma Avança Chapada Bahia — gerado pelo plugin "Sincronizar WebGIS GitHub" do QGIS.
 * Camadas, tópicos e estilos: data/camadas.json (exportado do QGIS).
 * Textos: conteudo.js. */
(() => {
  "use strict";

  const C = window.CONTEUDO || {};
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = n => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 6 });
  const ICON = {
    chevron: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    zoom: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>',
  };

  // ------------------------------------------------------------------ mapa
  const map = L.map("map", { zoomControl: false, preferCanvas: true, minZoom: 4, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 90 });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  map.setView([-12.6, -41.5], 8);
  L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

  // camadas por tipo em panes separados: polígonos < linhas < pontos.
  // Só os polígonos (muitas feições) usam canvas; o resto é SVG, que deixa o
  // clique passar para o canvas de baixo (canvas por cima bloquearia os cliques).
  const PANES = { mask: 350, polygon: 410, line: 420, outline: 430, point: 440 };
  const renderers = {};
  for (const [name, z] of Object.entries(PANES)) {
    map.createPane(name).style.zIndex = z;
    renderers[name] = name === "polygon" ? L.canvas({ pane: name, tolerance: 2 }) : L.svg({ pane: name });
  }

  const state = new Map();   // id -> {def, topic, on, layer, loading}
  let manifest = null, territoryBounds = null;

  const status = $("#status");
  let statusTimer;
  function showStatus(text, ms) {
    status.textContent = text; status.hidden = false;
    clearTimeout(statusTimer);
    if (ms) statusTimer = setTimeout(() => (status.hidden = true), ms);
  }
  const hideStatus = () => (status.hidden = true);

  // enquadra descontando o painel lateral aberto (no computador)
  function fitView(bounds, maxZoom = 15) {
    const p = document.getElementById("panel");
    const side = p && !p.classList.contains("closed") && window.innerWidth > 860 ? p.offsetWidth + 80 : 20;
    map.fitBounds(bounds, { paddingTopLeft: [side, 70], paddingBottomRight: [20, 20], maxZoom });
  }

  // ------------------------------------------------------------------ estilos
  function symFor(style, props) {
    if (style.type === "categorized") {
      const v = props[style.field];
      const c = style.classes.find(c => String(c.value) === String(v));
      return (c || style.other || { sym: { fill: "#9aa5b1", stroke: "#666", width: 1, fillOpacity: .4 } }).sym;
    }
    if (style.type === "graduated") {
      const v = Number(props[style.field]);
      const c = style.classes.find(c => v >= c.min && v <= c.max);
      return c ? c.sym : { fill: "#9aa5b1", stroke: "#666", width: 1, fillOpacity: .4 };
    }
    return style.sym;
  }
  function pointStyle(s) {
    return {
      radius: s.radius || 6, stroke: (s.width ?? 1) > 0, color: s.stroke || "#fff", weight: s.width ?? 1,
      fill: true, fillColor: s.fill || "#f29a1f", fillOpacity: s.fillOpacity ?? .9,
    };
  }
  function pathStyle(s, geom) {
    if (geom === "point") return pointStyle(s);
    return {
      stroke: (s.width ?? 1) > 0, color: s.stroke || "#333", weight: s.width ?? 1,
      opacity: s.strokeOpacity ?? 1, dashArray: s.dash || null,
      // polígono só de contorno recebe preenchimento invisível para continuar clicável
      fill: geom === "polygon", fillColor: s.fill || "#000", fillOpacity: s.fill ? (s.fillOpacity ?? .5) : 0,
    };
  }
  function swatch(s, geom) {
    const st = s.stroke || "none", w = Math.min(s.width ?? 1, 3), dash = s.dash ? ` stroke-dasharray="${s.dash}"` : "";
    if (s.icon) return `<img class="swatch" src="${esc(s.icon)}" alt="">`;
    if (geom === "point")
      return `<svg class="swatch" viewBox="0 0 18 18"><circle cx="9" cy="9" r="5.5" fill="${s.fill || "none"}" fill-opacity="${s.fillOpacity ?? 1}" stroke="${st}" stroke-width="${Math.max(w, 1)}"/></svg>`;
    if (geom === "line")
      return `<svg class="swatch" viewBox="0 0 18 18"><path d="M2 13 Q6 4 9 9 T16 5" fill="none" stroke="${st}" stroke-width="${Math.max(w, 1.5)}"${dash}/></svg>`;
    return `<svg class="swatch" viewBox="0 0 18 18"><rect x="2" y="2" width="14" height="14" rx="3" fill="${s.fill || "none"}" fill-opacity="${s.fill ? Math.max(s.fillOpacity ?? .5, .35) : 0}" stroke="${st}" stroke-width="${Math.max(w, 1)}"${dash}/></svg>`;
  }

  // ------------------------------------------------------------------ popups
  function popupHtml(def, props) {
    const rows = Object.entries(props || {})
      .filter(([, v]) => v !== null && v !== "")
      .map(([k, v]) => `<tr><th>${esc(def.aliases?.[k] || k)}</th><td>${esc(typeof v === "number" ? fmt(v) : v)}</td></tr>`);
    return `<div class="pop"><h3>${esc(def.name)}</h3>${rows.length ? `<div class="scroll"><table>${rows.join("")}</table></div>` : '<p class="more">Sem atributos.</p>'}</div>`;
  }

  // ------------------------------------------------------------------ camadas
  function buildLayer(def, data) {
    const pane = def.geom;
    return L.geoJSON(data, {
      pane, renderer: renderers[pane],
      style: f => pathStyle(symFor(def.style, f.properties || {}), def.geom),
      pointToLayer: (f, latlng) => {
        const s = symFor(def.style, f.properties || {});
        if (s.icon) {
          const z = s.size || 24;
          return L.marker(latlng, { pane, icon: L.icon({ iconUrl: s.icon, iconSize: [z, z], iconAnchor: [z / 2, z / 2], popupAnchor: [0, -z / 2] }) });
        }
        return L.circleMarker(latlng, { pane, renderer: renderers[pane], ...pointStyle(s) });
      },
      onEachFeature: (f, lyr) => {
        lyr.bindPopup(() => popupHtml(def, f.properties), { maxWidth: 360 });
        // rótulo ligado no QGIS: o nome fica escrito no mapa enquanto a camada estiver ativa
        const nome = def.label && f.properties ? f.properties[def.label] : null;
        if (nome !== null && nome !== undefined && nome !== "") {
          lyr.bindTooltip(String(nome), { permanent: true, direction: def.geom === "point" ? "right" : "center", className: "map-label", interactive: false, opacity: 1 });
        }
      },
    });
  }

  async function loadData(def) {
    // ?v=<data da exportação>: um GeoJSON novo nunca vem do cache, um inalterado continua em cache
    const r = await fetch(`${def.file}?v=${encodeURIComponent(manifest.generated || "")}`);
    if (!r.ok) throw new Error(`${def.file}: ${r.status}`);
    return r.json();
  }

  async function setLayer(id, on) {
    const st = state.get(id);
    if (!st || st.on === on) return;
    st.on = on;
    syncRow(st);
    if (!on) { if (st.layer) map.removeLayer(st.layer); return; }
    if (!st.layer) {
      if (st.loading) return;
      st.loading = true; syncRow(st);
      showStatus(`Carregando ${st.def.name}…`);
      try {
        st.layer = buildLayer(st.def, await loadData(st.def));
        hideStatus();
      } catch (e) {
        console.error(e);
        showStatus(`Não foi possível carregar ${st.def.name}.`, 4000);
        st.on = false;
      }
      st.loading = false; syncRow(st);
    }
    if (st.on && st.layer) { st.layer.addTo(map); reorder(); }
  }

  // mesma ordem do painel do QGIS: quem está mais acima na lista fica por cima
  function reorder() {
    const all = manifest.topics.flatMap(t => t.layers).reverse();
    for (const def of all) {
      const st = state.get(def.id);
      if (st.on && st.layer && map.hasLayer(st.layer)) st.layer.bringToFront();
    }
  }

  function zoomTo(id) {
    const st = state.get(id);
    const go = () => { const b = st.layer.getBounds(); if (b.isValid()) fitView(b); };
    if (st.layer) go(); else setLayer(id, true).then(() => st.layer && go());
  }

  // ------------------------------------------------------------------ território (máscara + contorno)
  async function drawTerritory(def) {
    const data = await loadData(def);
    const holes = [];
    for (const f of data.features || []) {
      const g = f.geometry; if (!g) continue;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      for (const p of polys) holes.push(p[0].map(([x, y]) => [y, x]));
    }
    const world = [[-89, -179], [-89, 179], [89, 179], [89, -179]];
    L.polygon([world, ...holes], {
      pane: "mask", renderer: renderers.mask, stroke: false, fillColor: "#ffffff", fillOpacity: .5, interactive: false,
    }).addTo(map);
    const outline = L.geoJSON(data, {
      pane: "outline", renderer: renderers.outline, interactive: false,
      style: { color: "#1d5e27", weight: 3, fill: false, opacity: .95 },
    }).addTo(map);
    territoryBounds = outline.getBounds();
    fitView(territoryBounds);
  }

  // ------------------------------------------------------------------ painel de camadas
  function renderTopics() {
    const host = $("#topics");
    host.innerHTML = "";
    manifest.topics.forEach((topic, ti) => {
      const el = document.createElement("div");
      el.className = "topic"; el.dataset.topic = ti;
      el.innerHTML = `
        <div class="topic-head">
          <label class="chk" title="Ligar/desligar o tópico"><input type="checkbox" data-topic="${ti}" aria-label="${esc(topic.name)}"><span class="box"></span></label>
          <button class="topic-name" type="button" aria-expanded="false">${esc(topic.name)}${ICON.chevron}</button>
          <span class="badge"></span>
        </div>
        <ul class="topic-layers">${topicBody(topic)}</ul>`;
      host.appendChild(el);
    });
    syncTopics();
  }

  // camadas soltas do tópico primeiro; depois cada subtópico com seu título
  function topicBody(topic) {
    const loose = topic.layers.filter(d => !d.sub);
    const subs = [...new Set(topic.layers.filter(d => d.sub).map(d => d.sub))];
    return loose.map(layerRow).join("") + subs.map(name =>
      `<li class="sub"><span class="sub-name">${esc(name)}</span><ul>${topic.layers.filter(d => d.sub === name).map(layerRow).join("")}</ul></li>`
    ).join("");
  }

  function layerRow(d) {
    const s = d.style;
    const sw = swatch(s.type === "single" ? s.sym : (s.classes[0] || {}).sym || {}, d.geom);
    const legend = s.type !== "single" && s.classes.length
      ? `<ul class="legend" hidden>${s.classes.map(c => `<li>${swatch(c.sym, d.geom)}${esc(c.label)}</li>`).join("")}</ul>` : "";
    return `
      <li class="lyr-wrap" data-id="${d.id}">
        <div class="lyr">
          <label>
            <span class="chk"><input type="checkbox" data-id="${d.id}"><span class="box"></span></span>
            ${sw}
            <span class="lname">${esc(d.name)}<small>${fmt(d.count)} ${d.count === 1 ? "feição" : "feições"}</small></span>
          </label>
          <span class="actions">
            <button class="icon-btn" type="button" data-zoom="${d.id}" title="Aproximar da camada" aria-label="Aproximar da camada">${ICON.zoom}</button>
            <a class="icon-btn" href="${esc(d.file)}" download title="Baixar GeoJSON" aria-label="Baixar GeoJSON">${ICON.download}</a>
          </span>
        </div>${legend}
      </li>`;
  }

  function syncRow(st) {
    const li = document.querySelector(`.lyr-wrap[data-id="${st.def.id}"]`);
    if (!li) return;
    $("input", li).checked = st.on;
    $(".lyr", li).classList.toggle("loading", !!st.loading);
    const lg = $(".legend", li); if (lg) lg.hidden = !st.on;
    syncTopics();
  }

  function syncTopics() {
    if (!manifest) return;
    manifest.topics.forEach((topic, ti) => {
      const el = document.querySelector(`.topic[data-topic="${ti}"]`);
      if (!el) return;
      const on = topic.layers.filter(d => state.get(d.id)?.on).length;
      const box = $(`input[data-topic="${ti}"]`, el);
      box.checked = on === topic.layers.length && on > 0;
      box.indeterminate = on > 0 && on < topic.layers.length;
      $(".badge", el).textContent = on ? `${on}/${topic.layers.length}` : "";
    });
  }

  $("#topics").addEventListener("click", e => {
    const name = e.target.closest(".topic-name");
    if (name) {
      const t = name.closest(".topic");
      t.classList.toggle("open");
      name.setAttribute("aria-expanded", t.classList.contains("open"));
      return;
    }
    const zoom = e.target.closest("[data-zoom]");
    if (zoom) zoomTo(zoom.dataset.zoom);
  });
  $("#topics").addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.id) setLayer(t.dataset.id, t.checked);
    if (t.dataset.topic) {
      const topic = manifest.topics[+t.dataset.topic];
      const turnOn = t.checked;
      topic.layers.forEach(d => setLayer(d.id, turnOn));
      if (turnOn) t.closest(".topic").classList.add("open");
    }
  });
  $("#clearAll").addEventListener("click", () => state.forEach((_, id) => setLayer(id, false)));

  // ------------------------------------------------------------------ mapas base
  const DEFAULT_BASES = [
    { name: "Claro (CARTO)", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", maxZoom: 20, attribution: "© OpenStreetMap © CARTO" },
  ];
  let currentBase = null;
  function renderBasemaps(list, initial) {
    const host = $("#basemaps");
    const thumb = url => url.replace("{s}", "a").replace("{r}", "").replace("{z}", 8).replace("{x}", 98).replace("{y}", 136);
    host.innerHTML = list.map((b, i) => `
      <label class="basemap" data-i="${i}">
        <input type="radio" name="base" value="${i}">
        <img src="${esc(thumb(b.url))}" alt="" loading="lazy">
        <span>${esc(b.name)}</span>
      </label>`).join("");
    const pick = i => {
      if (currentBase) map.removeLayer(currentBase);
      const b = list[i];
      currentBase = L.tileLayer(b.url, { maxZoom: b.maxZoom || 19, maxNativeZoom: Math.min(b.maxZoom || 19, 19), attribution: b.attribution || "" }).addTo(map);
      host.querySelectorAll(".basemap").forEach(el => el.classList.toggle("active", +el.dataset.i === i));
    };
    host.addEventListener("change", e => pick(+e.target.value));
    pick(initial);
  }

  // ------------------------------------------------------------------ abas e ferramentas
  document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
    $("#tab-camadas").hidden = tab.dataset.tab !== "camadas";
    $("#tab-base").hidden = tab.dataset.tab !== "base";
  }));
  const panel = $("#panel");
  if (window.matchMedia("(max-width: 860px)").matches) panel.classList.add("closed");
  $("#tPanel").addEventListener("click", () => panel.classList.toggle("closed"));
  $("#tHome").addEventListener("click", () => territoryBounds ? fitView(territoryBounds) : map.setView([-12.6, -41.5], 8));
  $("#tIn").addEventListener("click", () => map.zoomIn());
  $("#tOut").addEventListener("click", () => map.zoomOut());
  let locMarker;
  $("#tLocate").addEventListener("click", () => { showStatus("Obtendo sua localização…"); map.locate({ setView: true, maxZoom: 14 }); });
  map.on("locationfound", e => {
    hideStatus();
    if (locMarker) map.removeLayer(locMarker);
    locMarker = L.circleMarker(e.latlng, { radius: 8, color: "#fff", weight: 3, fillColor: "#2f9bd6", fillOpacity: 1, pane: "point" }).addTo(map);
  });
  map.on("locationerror", () => showStatus("Não foi possível obter sua localização.", 4000));

  // ------------------------------------------------------------------ busca
  const results = $("#searchResults");
  let searchMarker;
  function mark(latlng, label) {
    if (searchMarker) map.removeLayer(searchMarker);
    searchMarker = L.marker(latlng).addTo(map).bindPopup(esc(label)).openPopup();
  }
  $("#search").addEventListener("submit", async e => {
    e.preventDefault();
    const q = $("#q").value.trim();
    if (!q) return;
    const m = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (m) {
      const lat = +m[1], lon = +m[2];
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        map.setView([lat, lon], 13); mark([lat, lon], `${lat}, ${lon}`); results.hidden = true; return;
      }
    }
    results.innerHTML = '<li class="muted">Buscando…</li>'; results.hidden = false;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=br&accept-language=pt-BR&viewbox=-44.5,-10,-38.5,-15.5&q=${encodeURIComponent(q)}`;
      const list = await (await fetch(url)).json();
      if (!list.length) { results.innerHTML = '<li class="muted">Nada encontrado.</li>'; return; }
      results.innerHTML = list.map((r, i) => {
        const [first, ...rest] = r.display_name.split(", ");
        return `<li tabindex="0" data-i="${i}">${esc(first)}<small>${esc(rest.join(", "))}</small></li>`;
      }).join("");
      results.onclick = ev => {
        const li = ev.target.closest("li[data-i]"); if (!li) return;
        const r = list[+li.dataset.i];
        const bb = r.boundingbox.map(Number);
        fitView([[bb[0], bb[2]], [bb[1], bb[3]]]);
        mark([+r.lat, +r.lon], r.display_name.split(", ")[0]);
        results.hidden = true;
      };
      results.onkeydown = ev => { if (ev.key === "Enter") results.onclick(ev); };
    } catch {
      results.innerHTML = '<li class="muted">Busca indisponível no momento.</li>';
    }
  });
  document.addEventListener("click", e => { if (!e.target.closest("#search")) results.hidden = true; });

  // ------------------------------------------------------------------ páginas
  const PAGES = {
    glossario() {
      const items = [...(C.glossario || [])].sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"));
      return `<h1>Glossário</h1><p class="lead">Termos usados nas camadas e na plataforma.</p>
        <input type="search" id="gq" placeholder="Filtrar termos…" aria-label="Filtrar termos">
        <dl class="gloss" id="gl">${items.map(g => `<div data-t="${esc((g.termo + " " + g.definicao).toLowerCase())}"><dt>${esc(g.termo)}</dt><dd>${esc(g.definicao)}</dd></div>`).join("")}</dl>`;
    },
    contato() {
      const c = C.contato || {};
      const row = (k, v) => v ? `<tr><th>${k}</th><td>${v}</td></tr>` : "";
      return `<h1>Fale conosco</h1>
        <div class="card contact"><table class="contact-data">
          ${row("Área", esc(c.area))}
          ${row("Instituição", esc(c.instituicao))}
          ${row("Contato", c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : "")}
          ${row("E-mail", c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : "")}
        </table></div>`;
    },
  };
  function route() {
    const page = (location.hash.replace("#", "").split("/")[0]) || "mapa";
    const isMap = !/^(glossario|contato)$/.test(page) || /^-?\d/.test(page);
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.page === (isMap ? "mapa" : page)));
    $("#nav").classList.remove("open");
    $("#page").hidden = isMap;
    if (!isMap) {
      $("#pageInner").innerHTML = PAGES[page]();
      $("#page").scrollTop = 0;
      const gq = $("#gq");
      if (gq) gq.addEventListener("input", () => {
        const v = gq.value.toLowerCase();
        document.querySelectorAll("#gl > div").forEach(d => (d.hidden = !d.dataset.t.includes(v)));
      });
    } else {
      setTimeout(() => map.invalidateSize(), 0);
    }
  }
  window.addEventListener("hashchange", route);
  $("#navToggle").addEventListener("click", () => {
    const open = $("#nav").classList.toggle("open");
    $("#navToggle").setAttribute("aria-expanded", open);
  });

  // ------------------------------------------------------------------ rodapé
  function renderFooter(generated) {
    const org = o => {
      const inner = o.logo ? `<img src="${esc(o.logo)}" alt="${esc(o.nome)}">` : esc(o.nome);
      return o.url ? `<a class="org" href="${esc(o.url)}" target="_blank" rel="noopener">${inner}</a>` : `<span class="org">${inner}</span>`;
    };
    const grp = (label, list) => list?.length ? `<div class="grp"><span class="lbl">${label}</span>${list.map(org).join("")}</div>` : "";
    const when = generated ? new Date(generated).toLocaleDateString("pt-BR") : "";
    $("#footer").innerHTML = grp("Realização", C.realizacao) + grp("Execução", C.execucao) +
      (when ? `<span class="upd">Dados atualizados em ${when}</span>` : "");
  }

  // ------------------------------------------------------------------ início
  async function init() {
    if (C.titulo) document.title = C.titulo;
    renderFooter();
    route();
    try {
      // ?t= fura o cache de 10 min do GitHub Pages: a lista de camadas é sempre a última publicada
      manifest = await (await fetch(`data/camadas.json?t=${Date.now()}`, { cache: "no-store" })).json();
    } catch (e) {
      $("#topics").innerHTML = '<p class="muted">Não foi possível carregar as camadas.</p>';
      console.error(e);
      return;
    }
    if (manifest.title && !C.titulo) document.title = manifest.title;
    renderFooter(manifest.generated);

    const bases = [...(manifest.basemaps || []), ...DEFAULT_BASES];
    const vis = bases.findIndex(b => b.visible);
    renderBasemaps(bases, vis >= 0 ? vis : 0);

    manifest.topics.forEach(topic => topic.layers.forEach(def => state.set(def.id, { def, topic, on: false })));
    renderTopics();

    const boundary = manifest.boundary && state.get(manifest.boundary);
    if (boundary) drawTerritory(boundary.def).catch(console.error);

    // A plataforma abre sempre sem camadas ligadas (só o contorno do território):
    // quem consulta escolhe o que quer ver. A visibilidade do QGIS não é aplicada.

    // ponte para o relatório em PDF (assets/relatorio.js)
    window.AVANCA = { manifest, conteudo: C, esc, fmt, showStatus, hideStatus };
    document.dispatchEvent(new Event("avanca:pronto"));
  }
  init();
})();
