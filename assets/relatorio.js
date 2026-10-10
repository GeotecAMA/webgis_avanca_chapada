/* Relatório de vocação territorial em PDF — Plataforma Avança Chapada Bahia.
 * Lê data/perfil_municipios.json (gerado pelo plugin do QGIS: quanto de cada camada existe em cada município,
 * população, elemento mais próximo, IVS, conjuntos elétricos e curadoria) e monta, para um município ou conjunto:
 *   0 quadro de fatos · 1 como ler · 2 retrato por tema · 3 indicadores por tema · 4 oportunidades ·
 *   5 síntese de prioridades · 6 dados pendentes · 7 nota metodológica e fontes.
 * Regras do relatório: camada não é oportunidade confirmada; ausência é informação; potencial não é viabilidade.
 * Bibliotecas (carregadas só ao gerar): jsPDF e jsPDF-AutoTable, via cdnjs. */
(() => {
  "use strict";

  const LIBS = [
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
  ];
  const SOMA_ROTULO = { pot_mw: "Potência outorgada (MW)" };
  const VERDE = [29, 94, 39], VERDE2 = [45, 122, 49], CINZA = [93, 106, 120], TINTA = [29, 39, 51], LARANJA = [196, 110, 16];
  const FAIXA = [[246, 196, 49], [242, 154, 31], [45, 122, 49], [140, 198, 63], [29, 94, 39]];
  const NIVEIS = ["A validar", "Preliminar", "Confirmado"];
  const COR_NIVEL = { "A validar": [150, 92, 12], "Preliminar": [24, 95, 150], "Confirmado": [29, 94, 39] };

  // ------------------------------------------------------------------ textos fixos
  const TXT = {
    comoLer: "Este relatório é um diagnóstico para leitura do território e priorização de ações. Não é estudo de viabilidade nem projeto de investimento. " +
      "As oportunidades indicam onde aprofundar a análise, não o que está pronto para implantar. Não há aqui valor de investimento, emprego, rentabilidade ou fonte de financiamento.",
    regras: [
      "Camada não é oportunidade confirmada: um recurso geográfico gera, no máximo, uma oportunidade “a validar”.",
      "Ausência é informação: o relatório declara o que a plataforma não registra no recorte e a distância até o registro mais próximo dentro do território.",
      "Potencial não é viabilidade: toda oportunidade depende das condições, dos riscos e do próximo passo descritos na ficha.",
    ],
    niveis: [
      ["A validar", "Há apenas indício geográfico ou de contexto (camada, proximidade, cobertura).", "Dado quantitativo do tema ou consulta ao ator responsável."],
      ["Preliminar", "Há dado quantitativo oficial ou do projeto ligado diretamente ao tema, ainda teórico ou não validado.", "Validação em campo ou documento do ator responsável."],
      ["Confirmado", "Dado validado e registrado na planilha de curadoria, com fonte e data.", "—"],
    ],
    categorias: "Potencial local: apoia-se em recursos, atividades, organizações ou competências já presentes no recorte e gera benefício local. " +
      "Investimento externo: depende de capital, tecnologia, infraestrutura, mercado ou parceiros de fora do recorte. As duas categorias podem se relacionar; a ficha indica a ligação.",
    politicas: "A relação com políticas públicas (por exemplo, as missões da Nova Indústria Brasil) indica aderência temática com base nas evidências do recorte. " +
      "Não representa compromisso de apoio, financiamento ou priorização por qualquer instituição.",
    planejadas: "Empreendimentos planejados incluem pedidos de outorga e obras não iniciadas, sem garantia de implantação.",
    distancias: "Distâncias medidas em linha reta a partir do limite municipal, considerando apenas os registros dentro do território. " +
      "As linhas de transmissão do ONS têm traçado esquemático; a distância a elas é aproximada.",
    prioridades: "A ordem segue três critérios: força da evidência, benefício local direto e custo do próximo passo. Ela indica onde aprofundar primeiro, não o que financiar.",
    nota: "Como os valores são calculados: quantidade (pontos), extensão (linhas, km) ou área (polígonos, km²) de cada camada da plataforma dentro dos limites municipais do recorte. " +
      "“% do território” compara o recorte com o total dos municípios. Camadas de área podem se sobrepor (por exemplo, unidades de conservação), e a soma pode superar a área do recorte. " +
      "População e domicílios: soma dos setores censitários do Censo 2022 pelo código do município. " +
      "IVS: Índice de Vulnerabilidade Social do Ipea, de 0 a 1; quanto maior, maior a vulnerabilidade. Os valores são de 2010 e não foram recalculados. " +
      "DEC e FEC: soma dos valores mensais de 2025 publicados pela ANEEL para cada conjunto elétrico; valem para o conjunto inteiro, que pode cobrir vários municípios ou parte de um. " +
      "Relatório informativo, gerado automaticamente a partir das bases reunidas na plataforma; consulte a fonte de cada camada para fins legais.",
  };

  // temas do retrato: casados com o nome do tópico da plataforma
  const TEMAS = [
    { re: /arranjos produtivos/i, fora: "Atividades econômicas existentes, produção agrícola e pecuária, empresas e atores locais.",
      situacao: "Em modelagem pelo projeto. Sem valores publicados, a vocação produtiva não pode ser afirmada.", fonte: "Equipe do projeto (planilha de arranjos produtivos e biogás)." },
    { re: /log[ií]stica/i, fora: "Rodovias estaduais e municipais; ferrovias.",
      situacao: "Só rodovias federais e aeródromos. “Nada no recorte” não significa ausência de estradas.", fonte: "SEINFRA-BA (rodovias federais); ANAC (aeródromos e helipontos)." },
    { re: /energia/i, fora: "Rede de distribuição, recurso solar e eólico, capacidade de conexão.",
      situacao: "Linhas do ONS com traçado esquemático. Usinas planejadas sem garantia de implantação. DEC e FEC valem para o conjunto elétrico, não para o município.",
      fonte: "ONS/SINDAT (transmissão); ANEEL/SIGEL (geração); ANEEL, base geográfica da distribuidora de 31/12/2025 e indicadores coletivos de continuidade de 2025 (DEC e FEC)." },
    { re: /h[ií]dric/i, fora: "Outorgas, vazões, qualidade da água e poços.",
      situacao: "Descreve só a rede de drenagem. Origem das camadas de bacias e microrregiões a confirmar.", fonte: "IBGE, base contínua 1:250.000 (2025); ANA/SNIRH (2017)." },
    { re: /geolog/i, fora: "Poços e produtividade dos aquíferos.",
      situacao: "Escala 1:2.500.000: inadequada para decisão municipal.", fonte: "SGB/CPRM." },
    { re: /res[ií]duos/i, fora: "Situação atual dos lixões; geração e destinação dos resíduos urbanos.",
      situacao: "Base sem instituição de origem e data confirmadas; validar em campo.", fonte: "Base de lixões reunida pelo projeto (origem a confirmar)." },
    { re: /socioambient/i, fora: "Planos de manejo e zoneamento das unidades de conservação; terras indígenas; territórios quilombolas; assentamentos; cadastro ambiental rural.",
      situacao: "Cobertura vegetal do INEMA incompleta no extremo oeste do território.", fonte: "MMA/CNUC (unidades de conservação); INEMA 2019, 1:50.000 (cobertura vegetal); IBGE, 1:250.000 (vegetação e bioma)." },
    { re: /clim[aá]tic/i, fora: "Áreas suscetíveis à desertificação; cartas de suscetibilidade a inundação.",
      situacao: "Chuva de 1977–2006 e temperatura de 1970–2000: séries desatualizadas; temperatura de fonte não oficial.", fonte: "SGB (setores de risco); SEI-BA (terrenos sujeitos a inundação); SUDENE 2021 (Semiárido); ANA/CPRM (isoietas); WorldClim 2.1 (temperatura)." },
    { re: /socia(l|is)/i, fora: "Demais resultados do Censo 2022; indicadores econômicos municipais.",
      situacao: "Índice calculado com o Censo 2010: desatualizado. O Ipea prepara a atualização com o Censo 2022.", fonte: "Ipea, Atlas da Vulnerabilidade Social (Censo 2010); IBGE, Censo 2022 (população e domicílios)." },
  ];
  const TEMA_PADRAO = { fora: "", situacao: "Consulte a fonte da camada.", fonte: "Ver a fonte de cada camada na plataforma." };

  const $ = (s, el = document) => el.querySelector(s);
  const N = (v, d = 0) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: d });
  const N3 = v => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dataBR = iso => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");
  const pl = (n, um, varios) => `${N(n)} ${n === 1 ? um : varios}`;
  // nomes em caixa alta (unidades de conservação, aeródromos) viram texto corrido; siglas e códigos ficam como estão
  const titulo_ = s => {
    s = String(s);
    if (s !== s.toUpperCase() || /\d/.test(s) || s.split(/\s+/).some(w => w.length <= 3 && !/^(DE|DA|DO|DAS|DOS|E|RIO)$/.test(w))) return s;
    return s.toLowerCase().replace(/(^|[\s\-/(])([a-zà-ú])/g, (m, x, y) => x + y.toUpperCase()).replace(/\s(D[aeo]s?|E)\s/g, m => m.toLowerCase());
  };

  let perfil = null;

  function loadScript(src) {
    return new Promise((ok, err) => {
      if ([...document.scripts].some(s => s.src === src)) return ok();
      const el = document.createElement("script");
      el.src = src; el.onload = ok; el.onerror = () => err(new Error("Falha ao carregar " + src));
      document.head.appendChild(el);
    });
  }

  async function getPerfil() {
    if (!perfil) {
      const r = await fetch(`data/perfil_municipios.json?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error("perfil_municipios.json: " + r.status);
      perfil = await r.json();
    }
    return perfil;
  }

  // ------------------------------------------------------------------ agregação
  function agregar(P, cods) {
    const out = { area: 0, pop: 0, pop_urb: 0, pop_rur: 0, dom: 0, dom_ocup: 0, temPop: false, camadas: {} };
    const set = new Set(cods);
    for (const m of P.municipios) {
      if (!set.has(m.cod)) continue;
      out.area += m.area_km2;
      if (m.pop !== undefined) { out.temPop = true; for (const k of ["pop", "pop_urb", "pop_rur", "dom", "dom_ocup"]) out[k] += m[k] || 0; }
    }
    for (const cod of cods) {
      for (const [id, rec] of Object.entries(P.stats[cod] || {})) {
        const a = (out.camadas[id] ||= { v: 0, classes: {}, somas: {}, itens: {}, pts: [], prox: null });
        a.v += rec.v || 0;
        for (const [k, v] of Object.entries(rec.classes || {})) a.classes[k] = (a.classes[k] || 0) + v;
        for (const [campo, d] of Object.entries(rec.somas || {})) {
          const s = (a.somas[campo] ||= {});
          for (const [k, v] of Object.entries(d)) s[k] = (s[k] || 0) + v;
        }
        for (const [k, v] of rec.itens || []) a.itens[k] = (a.itens[k] || 0) + v;
        for (const p of rec.pts || []) a.pts.push(p);
        if (rec.prox && (!a.prox || rec.prox.km < a.prox.km)) a.prox = rec.prox;
      }
    }
    for (const a of Object.values(out.camadas)) if (a.v > 0) a.prox = null;   // só vale quando não há nada no recorte
    return out;
  }

  const valor = (geom, v) => geom === "point" ? N(v) : geom === "line" ? `${N(v, 1)} km` : `${N(v, 1)} km²`;
  const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
  const cam = (P, re) => P.camadas.filter(c => re.test(c.name));
  const tema = topico => TEMAS.find(t => t.re.test(topico)) || TEMA_PADRAO;
  const itensTop = (a, n) => Object.entries(a.itens || {}).sort((x, y) => y[1] - x[1]).slice(0, n);
  const classesTop = (a, n) => Object.entries(a.classes || {}).sort((x, y) => y[1] - x[1]).slice(0, n);
  const proxTxt = p => `${p.nome ? titulo_(p.nome) + ", " : ""}a ${N(p.km, 1)} km${p.classe ? ` (${String(p.classe).toLowerCase()})` : ""}`;

  // ------------------------------------------------------------------ blocos à parte: arranjos produtivos, IVS, conjuntos elétricos
  function aplResumo(P, cods) {
    const A = P.apl;
    const res = { temDado: false, linhas: [], comDado: 0 };
    if (!A) return res;
    const itens = cods.map(c => A.dados[c] || {});
    res.comDado = itens.filter(d => Object.entries(d).some(([k, v]) => k !== "status" && k !== "fonte" && k !== "observacao" && v !== "" && v !== null)).length;
    for (const campo of A.campos) {
      const vals = itens.map(d => d[campo.k]).filter(v => v !== undefined && v !== null && v !== "");
      if (!vals.length) continue;
      const nums = vals.map(v => Number(String(v).replace(",", "."))).filter(v => Number.isFinite(v));
      if (campo.k === "status") {
        const cont = {}; vals.forEach(v => (cont[v] = (cont[v] || 0) + 1));
        res.linhas.push([campo.label, Object.entries(cont).map(([k, n]) => `${k} (${n})`).join("; ")]);
      } else if (nums.length === vals.length) {
        res.linhas.push([campo.label, N(nums.reduce((a, b) => a + b, 0), 1)]); res.temDado = true;
      } else {
        const uni = [...new Set(vals.map(String))];
        res.linhas.push([campo.label, uni.slice(0, 5).join("; ") + (uni.length > 5 ? "…" : "")]); res.temDado = true;
      }
    }
    return res;
  }

  function socialResumo(P, cods) {
    const S = P.social;
    if (!S) return null;
    const nome = Object.fromEntries(P.municipios.map(m => [m.cod, m.nome]));
    const todos = Object.entries(S.dados).filter(([, d]) => Number.isFinite(d.ivs)).sort((a, b) => a[1].ivs - b[1].ivs);
    const pos = Object.fromEntries(todos.map(([c], i) => [c, i + 1]));
    const linhas = cods.filter(c => S.dados[c] && Number.isFinite(S.dados[c].ivs))
      .map(c => ({ cod: c, nome: nome[c], pos: pos[c], ...S.dados[c] })).sort((a, b) => a.ivs - b.ivs);
    if (!linhas.length) return null;
    const faixa = f => String(f || "").replace(/\s*\(.*\)$/, "").toLowerCase();
    const cont = {}; linhas.forEach(l => (cont[faixa(l.faixa)] = (cont[faixa(l.faixa)] || 0) + 1));
    const ano = linhas[0].ano || 2010;
    let frase;
    if (linhas.length === 1) {
      const l = linhas[0];
      frase = `IVS ${ano}: ${N3(l.ivs)}, faixa ${faixa(l.faixa)} (${l.pos}º menor entre os ${todos.length} municípios)`;
    } else {
      frase = `IVS ${ano} entre ${N3(linhas[0].ivs)} (${linhas[0].nome}) e ${N3(linhas[linhas.length - 1].ivs)} (${linhas[linhas.length - 1].nome}); ` +
        Object.entries(cont).map(([k, n]) => `${n} na faixa ${k}`).join(", ");
    }
    return { linhas, total: todos.length, ano, frase, faixa };
  }

  function conjuntosResumo(P, cods) {
    const C = P.conjuntos;
    if (!C) return null;
    const nome = Object.fromEntries(P.municipios.map(m => [m.cod, m.nome]));
    const por = {};
    for (const c of cods) for (const r of C.dados[c] || []) {
      const k = r.cod_conj ?? r.conjunto;
      (por[k] ||= { ...r, muns: [] }).muns.push({ nome: nome[c], pct: r.pct });
    }
    const lista = Object.values(por).sort((a, b) => pct(b.dec_h, b.dec_lim) - pct(a.dec_h, a.dec_lim));
    if (!lista.length) return null;
    const acimaDec = lista.filter(r => r.dec_h > r.dec_lim), acimaFec = lista.filter(r => r.fec_n > r.fec_lim);
    const decs = lista.map(r => r.dec_h), ano = lista[0].ano || "";
    const sit = !acimaDec.length && !acimaFec.length ? (lista.length === 1 ? "dentro dos limites de DEC e FEC" : "todos dentro dos limites de DEC e FEC")
      : [acimaDec.length ? `${acimaDec.length} acima do limite de DEC` : "", acimaFec.length ? `${acimaFec.length} acima do limite de FEC` : ""].filter(Boolean).join("; ");
    const faixaDec = lista.length === 1 ? `DEC de ${N(decs[0], 2)} h/ano` : `DEC entre ${N(Math.min(...decs), 2)} e ${N(Math.max(...decs), 2)} h/ano`;
    return { lista, ano, frase: `${pl(lista.length, "conjunto elétrico atende", "conjuntos elétricos atendem")} o recorte (${ano}): ${faixaDec}; ${sit}`, distrib: lista[0].distrib || "" };
  }

  // ------------------------------------------------------------------ 2. retrato por tema
  function retrato(P, sel, cods, extras) {
    const linhas = [];
    const umMun = cods.length === 1;
    for (const topico of [...new Set(P.camadas.map(c => c.topic).concat(P.apl ? [P.apl.topic] : [], P.social ? [P.social.topic] : []))]) {
      const T = tema(topico), tem = [], nao = [];
      if (P.apl && P.apl.topic === topico) {
        const st = extras.apl.linhas.find(l => /situa|status/i.test(l[0]));
        if (extras.apl.temDado) tem.push(...extras.apl.linhas.slice(0, 6).map(l => `${l[0]}: ${l[1]}`));
        else { tem.push(`Situação do dado: ${st ? st[1].toLowerCase() : "aguardando modelagem"}`); nao.push("Arranjo produtivo, resíduos e potencial de biogás (em modelagem)"); }
      }
      if (P.social && P.social.topic === topico && extras.social) {
        tem.push(extras.social.frase);
        if (umMun) { const l = extras.social.linhas[0]; tem.push(`Dimensões: infraestrutura urbana ${N3(l.ivs_infra)}; capital humano ${N3(l.ivs_cap_h)}; renda e trabalho ${N3(l.ivs_renda)}`); }
        if (sel.temPop) tem.push(`População (Censo 2022): ${N(sel.pop)} habitantes, ${N(pct(sel.pop_urb, sel.pop), 1)}% urbana`);
      }
      for (const c of P.camadas.filter(x => x.topic === topico)) {
        const s = sel.camadas[c.id];
        if (!s || !(s.v > 0)) {
          nao.push(c.name + (s && s.prox ? ` (mais próximo: ${proxTxt(s.prox)})` : ""));
          continue;
        }
        let t = `${c.name}: ${valor(c.geom, s.v)}`;
        if (c.geom === "polygon" && pct(s.v, sel.area) < 99.5) t += ` (${N(pct(s.v, sel.area), 1)}% da área)`;
        const cl = classesTop(s, 3), it = itensTop(s, 3);
        if (it.length && c.geom !== "point") t += ` — ${it.map(([k, v]) => `${titulo_(k)} (${valor(c.geom, v)})`).join("; ")}`;
        else if (cl.length > 1 || (cl.length === 1 && c.classes.length > 1)) {
          t += ` — ${cl.map(([k, v]) => c.geom === "polygon" ? `${k} ${N(pct(v, s.v), 1)}%` : `${k}: ${valor(c.geom, v)}`).join("; ")}`;
        }
        const mw = s.somas.pot_mw && s.somas.pot_mw._total;
        if (mw > 0) t += `; ${N(mw, 1)} MW outorgados`;
        if (umMun && s.pts.length && s.pts.length <= 3) t += ` — ${s.pts.map(p => `lat ${N(p[0], 6)}; long ${N(p[1], 6)}`).join(" · ")}`;
        tem.push(t);
      }
      if (P.conjuntos && P.conjuntos.topic === topico && extras.conj) tem.push(`Qualidade do fornecimento: ${extras.conj.frase}`);
      if (!tem.length && !nao.length) continue;
      if (T.fora) nao.push(`Fora da plataforma: ${T.fora}`);
      linhas.push([topico, tem.length ? tem.map(x => "• " + x).join("\n") : "Nada dentro do recorte", nao.length ? nao.map(x => "• " + x).join("\n") : "—", T.situacao]);
    }
    return linhas;
  }

  // ------------------------------------------------------------------ 4. oportunidades (catálogo + regras de geração)
  // Sinais que acionam cada regra, para um recorte já agregado.
  function sinais(P, sel, cods) {
    const g = re => { const c = cam(P, re)[0]; return c ? { def: c, s: sel.camadas[c.id] || { v: 0, classes: {}, somas: {}, itens: {}, pts: [], prox: null } } : null; };
    const en = [/centrais solares/i, /centrais e[óo]licas/i, /hidrel[ée]tricas/i, /subesta[çc][õo]es/i, /linhas de transmiss/i].map(g).filter(Boolean);
    const dentro = en.filter(x => x.s.v > 0), perto = en.filter(x => !(x.s.v > 0) && x.s.prox && x.s.prox.km <= 20);
    const operando = en.slice(0, 3).reduce((n, x) => n + Object.entries(x.s.classes).filter(([k]) => /em opera/i.test(k)).reduce((a, [, v]) => a + v, 0), 0);
    const lix = g(/lix[õo]es/i), uc = g(/unidades de conserva/i), risco = g(/setores de risco/i);
    return {
      apl: !!P.apl, lix, uc, risco, en, dentro, perto, operando,
      rod: g(/rodovias/i), semi: g(/semi[áa]rido/i), veg: g(/cobertura vegetal/i),
      tLix: lix && lix.s.v > 0, tUc: uc && pct(uc.s.v, sel.area) >= 10, tRisco: risco && risco.s.v > 0,
      tEn: dentro.length > 0 || perto.length > 0,
    };
  }

  function oportunidades(P, sel, tudo, cods, extras) {
    const G = sinais(P, sel, cods);
    const nomes = P.municipios.filter(m => cods.includes(m.cod)).map(m => m.nome);
    const umMun = cods.length === 1, nMun = P.municipios.length;
    const onde = umMun ? nomes[0] : nomes.length <= 3 ? nomes.join(", ") : `${nomes.length} municípios do recorte`;
    const prefeitura = umMun ? "Prefeitura" : "Prefeituras";
    // escala: quantos municípios do território acionam a mesma regra
    const porMun = P.municipios.map(m => sinais(P, agregar(P, [m.cod]), [m.cod]));
    const conta = k => porMun.filter(x => x[k]).length;
    const ucPct = G.uc ? pct(G.uc.s.v, sel.area) : 0;
    const semRod = G.rod && !(G.rod.s.v > 0) ? `sem rodovia federal no recorte${G.rod.s.prox ? ` (mais próxima a ${N(G.rod.s.prox.km, 1)} km)` : ""}` : "";
    const ctxSocial = extras.social ? ` Contexto social: ${extras.social.frase}.` : "";
    const ctxConj = extras.conj ? ` Qualidade do fornecimento na distribuição: ${extras.conj.frase}. Esse indicador não mede capacidade de conexão para geração.` : "";
    const riscoUc = ucPct >= 0.5 ? `${N(ucPct, 1)}% do recorte em unidades de conservação, com regras próprias; ` : "";
    const ops = [];

    if (G.apl) {
      const A = extras.apl, tot = aplResumo(P, P.municipios.map(m => m.cod));
      const antro = G.veg && Object.entries(G.veg.s.classes).find(([k]) => /antropizad/i.test(k));
      ops.push({
        id: "BIOGAS_RESIDUOS", cat: "local", catTxt: "Potencial local; relaciona-se ao arranjo regional de biogás e biometano",
        titulo: "Aproveitamento de resíduos agrícolas e pecuários para biogás", curto: "Resíduos agrícolas e pecuários para biogás",
        nivel: A.temDado ? "Preliminar" : "A validar",
        razao: A.temDado ? "Há valores lançados pela equipe do projeto, ainda teóricos e sem validação em campo." : "Os valores de arranjos produtivos, resíduos e biogás estão em modelagem e ainda não foram publicados para o recorte. Necessário: concluir a modelagem.",
        evidencia: (A.temDado ? A.linhas.filter(l => !/situa|status|fonte|observa/i.test(l[0])).slice(0, 5).map(l => `${l[0]}: ${l[1]}`).join("; ") + " (planilha do projeto)."
          : "Não há valor publicado de resíduos ou de potencial de biogás para o recorte.") +
          (antro ? ` Áreas antropizadas: ${N(antro[1], 1)} km² (${N(pct(antro[1], sel.area), 1)}% do recorte), segundo a cobertura vegetal do INEMA (2019).` : ""),
        area: `${onde}; localização das áreas produtoras a validar`,
        atores: `Produtores rurais e unidades de beneficiamento: a identificar (não há cadastro de atores na plataforma). ${prefeitura}.` + ctxSocial,
        condicoes: ["Concentração espacial e sazonalidade dos resíduos; usos concorrentes; logística de coleta", semRod].filter(Boolean).join("; ") + ".",
        riscos: `${riscoUc}manejo de efluentes e proteção de cursos d'água.`,
        entrega: "Caracterização quantitativa e qualitativa dos resíduos e mapa das fontes geradoras.",
        escala: `A mesma metodologia cobre os ${nMun} municípios do território.`,
        passo: "Concluir a modelagem e lançar os valores na planilha de arranjos produtivos.", acao: "Concluir a modelagem e lançar na planilha",
        politica: "Nova Indústria Brasil, Missão 5 (bioeconomia, descarbonização e transição energética) e Missão 1 (cadeias agroindustriais): resíduo de cadeia agrícola convertido em energia. Condicionada à confirmação do potencial.",
        indicador: `Municípios do recorte com resíduos ou biogás lançados na planilha. Linha de base: ${A.comDado} de ${cods.length}.`, ind: `Municípios com dado lançado (${A.comDado} de ${cods.length})`,
      });
      ops.push({
        id: "BIOGAS_REGIONAL", cat: "externo", catTxt: "Investimento externo; relaciona-se ao aproveitamento de resíduos para biogás",
        titulo: "Integração a um arranjo regional de biogás e biometano", curto: "Arranjo regional de biogás e biometano",
        nivel: "A validar", razao: "Não há estudo de localização, de logística nem de demanda. Necessário: modelagem territorial concluída e mapa de demanda energética.",
        evidencia: "Depende do resultado da modelagem do potencial por município. O papel do recorte (sede ou fornecedor de resíduos) só pode ser indicado depois dela.",
        area: `${onde} e municípios vizinhos, a definir pela modelagem`,
        atores: `Operador ou investidor externo, produtores e ${prefeitura.toLowerCase()}: a identificar.`,
        condicoes: ["Logística de coleta", semRod, "compradores de biometano (sem dado); tecnologia e operação"].filter(Boolean).join("; ") + ".",
        riscos: "Custo e impacto do transporte de resíduos; dependência de poucos fornecedores.",
        entrega: "Estudo de localização e de raio de coleta para o território.",
        escala: `Territorial: ${nMun} municípios.`,
        passo: "Concluir a modelagem do potencial por município.", acao: "Concluir a modelagem por município",
        politica: "Nova Indústria Brasil, Missão 5 e Missão 1, condicionada ao resultado da modelagem.",
        indicador: `Municípios do território com potencial modelado na planilha. Linha de base: ${tot.comDado} de ${nMun}.`, ind: `Municípios modelados (${tot.comDado} de ${nMun})`,
      });
    }

    if (G.tLix) {
      const n = G.lix.s.v, tl = cam(P, /lix[õo]es/i)[0], totLix = (tudo.camadas[tl.id] || {}).v || 0;
      ops.push({
        id: "LIXAO", cat: "local", catTxt: "Potencial local, com dependência de investimento externo para a destinação final",
        titulo: "Encerramento de lixão e tratamento da fração orgânica dos resíduos urbanos", curto: "Encerramento de lixão e fração orgânica",
        nivel: "A validar", razao: "A base de lixões não tem instituição de origem nem data confirmadas, e a situação atual é desconhecida. Necessário: vistoria de campo e dados municipais de resíduos.",
        evidencia: `${pl(n, "lixão registrado", "lixões registrados")}` + (umMun && G.lix.s.pts.length && G.lix.s.pts.length <= 3 ? ` (${G.lix.s.pts.map(p => `lat ${N(p[0], 6)}; long ${N(p[1], 6)}`).join(" · ")})` : "") + "." +
          (sel.temPop ? ` População de ${N(sel.pop)} habitantes (Censo 2022), ${N(pct(sel.pop_urb, sel.pop), 1)}% urbana.` : "") + " Geração de resíduos urbanos: sem dado.",
        area: `${onde}, entorno ${n === 1 ? "do ponto registrado" : "dos pontos registrados"}`,
        atores: `${prefeitura}, ${umMun ? "titular" : "titulares"} do serviço de limpeza urbana. Catadores, cooperativas e consórcio intermunicipal: a identificar.` + ctxSocial,
        condicoes: "Quantidade e composição dos resíduos; arranjo consorciado; área licenciável; distância a aterro regional (sem dado).",
        riscos: "Passivo ambiental da área; proximidade de cursos d'água; inclusão de catadores.",
        entrega: `Diagnóstico ${n === 1 ? "do lixão" : "dos lixões"} e estudo de alternativas de destinação com aproveitamento da fração orgânica.`,
        escala: `${conta("tLix")} dos ${nMun} municípios do território têm lixão registrado (${pl(totLix, "ponto", "pontos")}).`,
        passo: "Vistoria de campo e consulta ao plano municipal de resíduos e ao sistema nacional de informações de saneamento.", acao: "Vistoria de campo e dados municipais de resíduos",
        politica: "Política Nacional de Resíduos Sólidos (Lei 12.305/2010: encerramento de lixões) e Nova Indústria Brasil, Missão 3 (infraestrutura, saneamento, moradia e mobilidade). Válida somente após a validação de campo.",
        indicador: `Lixões do recorte com situação verificada em campo (ativo ou encerrado). Linha de base: 0 de ${N(n)}.`, ind: `Lixões com situação verificada (0 de ${N(n)})`,
      });
    }

    if (G.tUc) {
      const tu = tudo.camadas[G.uc.def.id] || { v: 0 }, it = itensTop(G.uc.s, 3);
      ops.push({
        id: "UC_NASCENTES", cat: "local", catTxt: "Potencial local",
        titulo: "Conservação de nascentes e uso público em unidades de conservação", curto: "Nascentes e uso público em unidades de conservação",
        nivel: "A validar", razao: "A existência das unidades é oficial (CNUC); não há dado sobre atividade econômica, visitação ou serviços ambientais associados. Necessário: planos de manejo e consulta ao órgão gestor.",
        evidencia: `${N(G.uc.s.v, 1)} km² em unidades de conservação (${N(ucPct, 1)}% do recorte)` + (it.length ? `: ${it.map(([k, v]) => `${titulo_(k)} (${N(v, 1)} km²)`).join("; ")}` : "") + ". As áreas podem se sobrepor.",
        area: `Porção de ${onde} dentro das unidades de conservação`,
        atores: "Órgãos gestores das unidades, conforme o CNUC. Conselhos gestores, prestadores de serviço e moradores: a identificar.",
        condicoes: ["Plano de manejo e zoneamento (sem dado); acesso viário", semRod, "rodovias estaduais fora da plataforma"].filter(Boolean).join("; ") + ".",
        riscos: "Pressão sobre nascentes e vegetação nativa; capacidade de suporte desconhecida.",
        entrega: "Mapa de áreas prioritárias para proteção de nascentes e de usos permitidos, compatível com o zoneamento.",
        escala: `Unidades de conservação somam ${N(tu.v)} km² no território (${N(pct(tu.v, tudo.area), 1)}% da área, com sobreposições); ${conta("tUc")} dos ${nMun} municípios têm 10% ou mais da área em unidades.`,
        passo: "Obter os planos de manejo das unidades e incorporar o zoneamento à plataforma.", acao: "Obter planos de manejo e zoneamento",
        politica: "Sem conexão demonstrável com os dados atuais. Registrar como agenda ambiental do território; reavaliar se a validação identificar cadeia produtiva associada.",
        indicador: "Unidades de conservação do recorte com plano de manejo obtido e zoneamento na plataforma. Linha de base: nenhuma.", ind: "Unidades com zoneamento na plataforma (nenhuma)",
      });
    }

    if (G.tRisco) {
      const n = G.risco.s.v, tr = (tudo.camadas[G.risco.def.id] || {}).v || 0, cl = classesTop(G.risco.s, 4);
      ops.push({
        id: "RISCO", cat: "local", catTxt: "Potencial local, com dependência de investimento externo para obras",
        titulo: "Redução de risco em áreas ocupadas", curto: "Redução de risco em áreas ocupadas",
        nivel: "Preliminar", razao: "Setores mapeados em campo pelo SGB. Falta confirmar a situação atual e as intervenções já realizadas.",
        evidencia: `${pl(n, "setor de risco geológico ou hidrológico mapeado", "setores de risco geológico ou hidrológico mapeados")} pelo SGB` + (cl.length ? ` (grau de risco: ${cl.map(([k, v]) => `${k.toLowerCase()} ${N(v)}`).join("; ")})` : "") + ".",
        area: `${onde}, nos setores mapeados`,
        atores: `Defesa Civil municipal e ${prefeitura.toLowerCase()}. Moradores das áreas mapeadas.` + ctxSocial,
        condicoes: "Projetos de intervenção e recursos para obras (sem dado); atualização do mapeamento.",
        riscos: "População exposta em áreas de risco; ocupação de margens e encostas.",
        entrega: "Atualização da situação dos setores e lista de intervenções prioritárias.",
        escala: `${conta("tRisco")} dos ${nMun} municípios do território têm setor de risco mapeado (${pl(tr, "setor", "setores")}).`,
        passo: "Consultar a Defesa Civil municipal sobre a situação atual dos setores.", acao: "Consultar a Defesa Civil municipal",
        politica: "Política Nacional de Proteção e Defesa Civil (Lei 12.608/2012) e, de forma indireta, Nova Indústria Brasil, Missão 3 (infraestrutura, saneamento, moradia e mobilidade).",
        indicador: `Setores de risco do recorte com situação atualizada. Linha de base: 0 de ${N(n)}.`, ind: `Setores com situação atualizada (0 de ${N(n)})`,
      });
    }

    if (G.tEn) {
      const desc = x => {
        const mw = x.s.somas.pot_mw && x.s.somas.pot_mw._total, cl = classesTop(x.s, 3);
        return `${x.def.name}: ${valor(x.def.geom, x.s.v)}` + (cl.length ? ` (${cl.map(([k, v]) => `${k.toLowerCase()}: ${valor(x.def.geom, v)}`).join("; ")})` : "") + (mw > 0 ? `, ${N(mw, 1)} MW outorgados` : "");
      };
      const totEn = G.en.slice(0, 3).map(x => { const t = tudo.camadas[x.def.id] || { v: 0, classes: {} }; const op = Object.entries(t.classes).filter(([k]) => /em opera/i.test(k)).reduce((a, [, v]) => a + v, 0); return `${x.def.name.replace(/\s*\(.*\)$/, "").toLowerCase()}: ${N(t.v)} (${N(op)} em operação)`; });
      const semi = G.semi && G.semi.s.v > 0 ? ` ${N(Math.min(100, pct(G.semi.s.v, sel.area)))}% do recorte no Semiárido.` : "";
      ops.push({
        id: "ENERGIA_RENOVAVEL", cat: "externo", catTxt: "Investimento externo",
        titulo: "Geração de energia renovável e conexão à rede", curto: "Geração renovável e conexão à rede",
        nivel: G.operando > 0 ? "Preliminar" : "A validar",
        razao: G.operando > 0 ? "Há geração em operação no recorte (ANEEL). Faltam o recurso solar e eólico, a capacidade de conexão e a situação das obras planejadas."
          : G.dentro.length ? "Há apenas infraestrutura planejada ou de transmissão no recorte. Necessário: recurso solar e eólico, rede de distribuição e situação das obras planejadas."
            : "Só há indício de proximidade. Necessário: recurso solar e eólico, rede de distribuição e situação das obras planejadas.",
        evidencia: (G.dentro.length ? G.dentro.map(desc).join(". ") + "." : "Nenhuma usina, subestação ou linha de transmissão no recorte.") +
          (G.perto.length ? ` No entorno, dentro do território: ${G.perto.map(x => `${x.def.name.replace(/\s*\(.*\)$/, "").toLowerCase()} — ${proxTxt(x.s.prox)}`).join("; ")}.` : "") + semi,
        area: `A definir em ${onde}` + (ucPct >= 0.5 ? `, fora das unidades de conservação (${N(ucPct, 1)}% do recorte)` : ""),
        atores: `Empreendedores de geração e transmissoras (externos). ${prefeitura} e proprietários rurais.`,
        condicoes: "Capacidade de conexão à rede; licenciamento ambiental." + ctxConj,
        riscos: "Conflito com unidades de conservação, nascentes e vegetação nativa; empreendimentos planejados podem não se implantar.",
        entrega: "Nota de pré-análise locacional, com áreas aptas e restrições, sem estimativa de potência.",
        escala: `No território: ${totEn.join("; ")}. ${conta("tEn")} dos ${nMun} municípios acionam esta regra.`,
        passo: "Incorporar à plataforma o recurso solar e eólico e a rede de distribuição.", acao: "Incorporar recurso solar e eólico e rede de distribuição",
        politica: G.operando > 0 ? "Nova Indústria Brasil, Missão 5 (bioeconomia, descarbonização e transição energética): há geração renovável em operação no recorte."
          : "Nova Indústria Brasil, Missão 5 (transição energética), de forma indireta: a evidência atual não sustenta afirmar aptidão do recorte.",
        indicador: "Camada de recurso solar e eólico publicada na plataforma (sim ou não). Linha de base: não.", ind: "Camada de recurso solar e eólico publicada (não)",
      });
    }

    // curadoria: validações registradas pela equipe elevam (ou rebaixam) o nível inicial da regra
    for (const o of ops) {
      const regs = (P.curadoria || []).filter(r => String(r.oportunidade).trim().toUpperCase() === o.id && cods.includes(String(r.cod_ibge)));
      if (!regs.length) continue;
      const rank = cods.map(c => { const r = regs.find(x => String(x.cod_ibge) === c); const i = r ? NIVEIS.findIndex(n => n.toLowerCase() === String(r.nivel_evidencia || "").trim().toLowerCase()) : -1; return i >= 0 ? i : NIVEIS.indexOf(o.nivel); });
      o.nivel = NIVEIS[Math.min(...rank)];
      const fontes = [...new Set(regs.map(r => [r.fonte_validacao, r.data].filter(Boolean).join(", ")).filter(Boolean))];
      o.razao = `Nível registrado na planilha de curadoria${regs.length < cods.length ? ` para ${regs.length} de ${cods.length} municípios` : ""}` + (fontes.length ? `: ${fontes.join("; ")}.` : ".") + ` Regra inicial: ${o.razao}`;
      const atores = [...new Set(regs.map(r => r.atores).filter(Boolean))];
      if (atores.length) o.atores = `Identificados na curadoria: ${atores.join("; ")}. ` + o.atores;
    }

    // numeração por categoria e ordem de prioridade
    let l = 0, e = 0;
    ops.sort((a, b) => (a.cat === b.cat ? 0 : a.cat === "local" ? -1 : 1));
    ops.forEach(o => (o.sigla = o.cat === "local" ? `L${++l}` : `E${++e}`));
    const ordem = [...ops].sort((a, b) => NIVEIS.indexOf(b.nivel) - NIVEIS.indexOf(a.nivel) || (a.cat === b.cat ? 0 : a.cat === "local" ? -1 : 1));
    return { ops, ordem, onde };
  }

  // ------------------------------------------------------------------ 6. dados pendentes, para o recorte
  function pendencias(P, sel, cods, extras, G) {
    const p = [];
    if (P.apl && !extras.apl.temDado) p.push(["Em modelagem", "Arranjos produtivos, resíduos e potencial de biogás por município", "Sem eles, a vocação produtiva não pode ser afirmada e as oportunidades de biogás não saem de “a validar”."]);
    if (G.tLix) p.push(["A validar em campo", "Lixões: origem da base, data e situação atual de cada ponto", "A base não tem instituição de origem confirmada; pode haver pontos encerrados ou duplicados."]);
    p.push(["Ausente", "Atores locais: cooperativas, associações, consórcios e empresas", "O campo “beneficiários e atores” fica como “a identificar” nas fichas."]);
    p.push(["Ausente", "Economia municipal: produção agrícola e pecuária, PIB, empresas por atividade", "Sem isso não se descreve atividade econômica existente."]);
    p.push(["Ausente", "Rodovias estaduais e municipais", "Logística aparece como “nada no recorte” onde só faltam rodovias federais."]);
    p.push(["Ausente", "Rede de distribuição de energia, recurso solar e eólico, capacidade de conexão", "A oportunidade de geração depende disso para avançar de nível."]);
    p.push(["Ausente", "Outorgas, poços, vazões e qualidade da água", "Recursos hídricos hoje só descrevem a rede de drenagem."]);
    if (G.uc && G.uc.s.v > 0) p.push(["Ausente", "Planos de manejo e zoneamento das unidades de conservação", "Definem o que é permitido dentro das unidades do recorte."]);
    p.push(["Ausente", "Terras indígenas, territórios quilombolas, assentamentos e cadastro ambiental rural", "Os riscos socioambientais ficam incompletos."]);
    if (extras.social) p.push(["Desatualizado", `Índice de Vulnerabilidade Social (${extras.social.ano})`, "Calculado com o Censo 2010. O Ipea prepara a atualização com o Censo 2022; até lá, o índice retrata a situação de mais de uma década atrás."]);
    p.push(["Desatualizado", "Precipitação (1977–2006) e temperatura máxima (1970–2000, fonte não oficial)", "Vulnerabilidade climática sem a normal climatológica mais recente."]);
    if (extras.conj) p.push(["Escala diferente", "DEC e FEC por município", "A ANEEL apura por conjunto elétrico. O relatório lista os conjuntos que atendem o recorte e não converte os valores para o município."]);
    p.push(["Escala inadequada", "Domínios hidrogeológicos (1:2.500.000)", "Não sustenta leitura municipal."]);
    p.push(["Aproximado", "Distâncias ao registro mais próximo", "Consideram só o que está dentro do território; o traçado das linhas de transmissão do ONS é esquemático."]);
    p.push(["A confirmar", "Redação das políticas públicas citadas", "As conexões usam a formulação divulgada da Nova Indústria Brasil; conferir no plano de ação vigente."]);
    return p;
  }

  // ------------------------------------------------------------------ mapa de localização (canvas -> imagem)
  async function mapaLocalizacao(P, cods) {
    const M = window.AVANCA.manifest;
    const def = M.topics.flatMap(t => t.layers).find(l => l.id === P.layerMunicipios);
    if (!def) return null;
    const gj = await (await fetch(`${def.file}?v=${encodeURIComponent(M.generated || "")}`)).json();
    let x0 = 180, x1 = -180, y0 = 90, y1 = -90;
    const aneis = f => { const g = f.geometry; return !g ? [] : g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? g.coordinates.flat() : []; };
    gj.features.forEach(f => aneis(f).forEach(r => r.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); })));
    const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
    const H = 760, pad = 18, esc_ = (H - 2 * pad) / (y1 - y0), Wd = Math.round((x1 - x0) * k * esc_ + 2 * pad);
    const cv = document.createElement("canvas"); cv.width = Wd; cv.height = H;
    const g = cv.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, Wd, H);
    const px = ([x, y]) => [pad + (x - x0) * k * esc_, pad + (y1 - y) * esc_];
    const set = new Set(cods);
    const desenha = (f, fill, stroke, lw) => {
      g.beginPath();
      aneis(f).forEach(r => { r.forEach((c, i) => { const [a, b] = px(c); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.closePath(); });
      g.fillStyle = fill; g.fill("evenodd"); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke();
    };
    const sel = gj.features.filter(f => set.has(String(f.properties[P.campoCodigo])));
    gj.features.filter(f => !sel.includes(f)).forEach(f => desenha(f, "#eef1f4", "#aab3bd", 1.5));
    sel.forEach(f => desenha(f, "rgba(45,122,49,.75)", "#1d5e27", 3));
    if (sel.length <= 8) {
      g.font = "600 22px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 6; g.strokeStyle = "#ffffff"; g.fillStyle = "#12331a";
      sel.forEach(f => {
        let a = 0, b = 0, n = 0; aneis(f)[0].forEach(c => { const [u, v] = px(c); a += u; b += v; n++; });
        const nome = String(f.properties[P.campoNome]); g.strokeText(nome, a / n, b / n); g.fillText(nome, a / n, b / n);
      });
    }
    return { url: cv.toDataURL("image/jpeg", 0.9), w: Wd, h: H };   // JPEG: PDF de ~100 KB em vez de 3 MB
  }

  // ------------------------------------------------------------------ PDF
  async function gerar(cods, opcoes = {}) {
    const A = window.AVANCA;
    A.showStatus("Gerando relatório…");
    try {
      const P = await getPerfil();
      for (const u of LIBS) await loadScript(u);
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210, Hp = 297, M = 14, L = W - 2 * M;
      const nomes = P.municipios.filter(m => cods.includes(m.cod)).map(m => m.nome);
      const todos = cods.length === P.municipios.length;
      const sel = agregar(P, cods), tudo = agregar(P, P.municipios.map(m => m.cod));
      const titulo = (A.conteudo && A.conteudo.titulo) || P.title || "Plataforma";
      const recorte = todos ? "Território completo" : nomes.length === 1 ? nomes[0] : `Conjunto de ${nomes.length} municípios`;
      const extras = { apl: aplResumo(P, cods), social: socialResumo(P, cods), conj: conjuntosResumo(P, cods) };
      const O = oportunidades(P, sel, tudo, cods, extras);
      const G = sinais(P, sel, cods);

      // cabeçalho
      doc.setFillColor(...VERDE); doc.rect(0, 0, W, 22, "F");
      FAIXA.forEach((c, i) => { doc.setFillColor(...c); doc.rect((W / 5) * i, 22, W / 5, 1.6, "F"); });
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(titulo, M, 10);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text("Relatório de vocação territorial", M, 16.5);
      doc.setFontSize(8.5); doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, W - M, 16.5, { align: "right" });

      let y = 34;
      doc.setTextColor(...VERDE); doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.text(recorte, M, y); y += 6;
      if (!todos && nomes.length > 1) {
        doc.setTextColor(...CINZA); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        const t = doc.splitTextToSize(nomes.join(", "), L); doc.text(t, M, y); y += t.length * 4 + 1;
      }
      y += 2;

      // 0. mapa + quadro de fatos
      const topo = y;
      const mapa = await mapaLocalizacao(P, cods).catch(() => null);
      let hMapa = 0;
      if (mapa) {
        const wm = 62; hMapa = Math.min(84, wm * mapa.h / mapa.w);
        const wReal = hMapa * mapa.w / mapa.h;
        doc.addImage(mapa.url, "JPEG", M, y, wReal, hMapa);
        doc.setDrawColor(226, 230, 235); doc.rect(M, y, wReal, hMapa);
      }
      const fatos = [
        ["Municípios no recorte", `${N(cods.length)} de ${N(P.municipios.length)}`],
        ["Área", `${N(sel.area, 1)} km²`],
        ["Participação no território", `${N(pct(sel.area, tudo.area), 1)}%`],
        ["Dados da plataforma", dataBR(P.generated)],
      ];
      if (sel.temPop) fatos.push(
        ["População (Censo 2022)", `${N(sel.pop)} hab.`],
        ["Urbana / rural", `${N(pct(sel.pop_urb, sel.pop), 1)}% / ${N(pct(sel.pop_rur, sel.pop), 1)}%`],
        ["Domicílios (ocupados)", `${N(sel.dom)} (${N(sel.dom_ocup)})`],
        ["Densidade", `${N(sel.pop / Math.max(sel.area, 0.01), 1)} hab/km²`]);
      const nLin = Math.ceil(fatos.length / 2);
      fatos.forEach(([k, v], i) => {
        const xf = M + 72 + (i >= nLin ? 58 : 0), yy = topo + 5 + (i % nLin) * 14;
        doc.setTextColor(...CINZA); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(k.toUpperCase(), xf, yy);
        doc.setTextColor(...TINTA); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(v, xf, yy + 5.6);
      });
      y = topo + Math.max(hMapa, nLin * 14 + 2) + 8;

      const quebra = h => { if (y + h > Hp - 18) { doc.addPage(); y = 18; } };
      const secao = t => {
        quebra(18); doc.setTextColor(...VERDE); doc.setFont("helvetica", "bold"); doc.setFontSize(12.5); doc.text(t, M, y);
        doc.setDrawColor(...VERDE); doc.setLineWidth(0.4); doc.line(M, y + 1.6, W - M, y + 1.6); y += 7;
      };
      const sub = t => { quebra(12); doc.setTextColor(...TINTA); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.text(t, M, y); y += 5.5; };
      const par = (t, o = {}) => {
        doc.setFont("helvetica", o.bold ? "bold" : "normal"); doc.setFontSize(o.size || 9); doc.setTextColor(...(o.cor || TINTA));
        const linhas = doc.splitTextToSize(t, L - (o.recuo || 0)), h = (o.size || 9) * 0.46;
        for (const ln of linhas) { quebra(h + 1); doc.text(ln, M + (o.recuo || 0), y); y += h; }
        y += o.depois === undefined ? 1.8 : o.depois;
      };
      const estilo = { font: "helvetica", fontSize: 8.2, cellPadding: 1.5, textColor: TINTA, lineColor: [226, 230, 235], overflow: "linebreak", valign: "top" };
      const tabela = o => {
        doc.autoTable({ startY: y, margin: { left: M, right: M, bottom: 18, top: 18 }, theme: "grid", styles: estilo, headStyles: { fillColor: VERDE, textColor: 255 }, rowPageBreak: "avoid", ...o });
        y = doc.lastAutoTable.finalY + 6;
      };

      // 1. como ler
      secao("1. Como ler este relatório");
      par(TXT.comoLer);
      TXT.regras.forEach(r => par("• " + r, { recuo: 2, depois: 0.8 }));
      y += 2;
      tabela({ head: [["Nível de evidência", "Critério", "O que eleva o nível"]], body: TXT.niveis, columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" } },
        didParseCell: d => { if (d.section === "body" && d.column.index === 0) d.cell.styles.textColor = COR_NIVEL[d.cell.raw] || TINTA; } });
      par(TXT.categorias, { size: 8.5, cor: CINZA });

      // 2. retrato por tema
      secao("2. Retrato territorial por tema");
      par("Para cada tema: o que a plataforma registra no recorte, o que não registra (com a distância ao registro mais próximo dentro do território) e a situação do dado.", { size: 8.5, cor: CINZA });
      tabela({ head: [["Tema", "Registra", "Não registra", "Situação do dado"]], body: retrato(P, sel, cods, extras),
        styles: { ...estilo, fontSize: 7.8 }, columnStyles: { 0: { cellWidth: 26, fontStyle: "bold" }, 1: { cellWidth: 66 }, 2: { cellWidth: 52 } }, rowPageBreak: "auto" });
      par(TXT.distancias + " " + TXT.planejadas, { size: 8, cor: CINZA });

      // 3. indicadores por tema
      secao("3. Indicadores por tema");
      if (P.apl) {
        tabela({ head: [["Arranjos produtivos e potencial de biogás", "No recorte"]], body: extras.apl.linhas.length ? extras.apl.linhas : [["Situação do dado", "Aguardando modelagem"]],
          headStyles: { fillColor: VERDE2, textColor: 255 }, columnStyles: { 0: { cellWidth: 78 } } });
      }
      for (const topico of [...new Set(P.camadas.map(c => c.topic))]) {
        const body = [], subs = new Set();
        for (const c of P.camadas.filter(x => x.topic === topico)) {
          const s = sel.camadas[c.id], t = tudo.camadas[c.id];
          if (!s || !(s.v > 0)) continue;
          const extra = c.geom === "polygon" ? ` (${N(pct(s.v, sel.area), 1)}% da área)` : "";
          body.push([(c.sub ? c.sub + " · " : "") + c.name, valor(c.geom, s.v) + extra, todos ? "—" : `${N(pct(s.v, t.v))}%`]);
          const ordem = Object.entries(s.classes).sort((a, b) => b[1] - a[1]).slice(0, 8);
          if (ordem.length > 1 || (ordem.length === 1 && c.classes.length > 1)) {
            for (const [k, v] of ordem) { subs.add(body.length); body.push([`      ${k}`, valor(c.geom, v), todos ? "—" : `${N(pct(v, t.classes[k] || 0))}%`]); }
          }
          for (const [campo, d] of Object.entries(s.somas)) {
            const rot = SOMA_ROTULO[campo] || campo;
            for (const [k, v] of Object.entries(d)) {
              if (!(v > 0)) continue;
              const tt = ((t.somas[campo] || {})[k]) || 0;
              subs.add(body.length);
              body.push([`      ${rot}${k === "_total" ? " – total" : " – " + k.toLowerCase()}`, N(v, 1), todos ? "—" : `${N(pct(v, tt))}%`]);
            }
          }
        }
        if (!body.length) continue;
        quebra(22);
        tabela({ head: [[topico, "No recorte", "% do território"]], body, styles: { ...estilo, fontSize: 8.5 }, rowPageBreak: "auto",
          columnStyles: { 1: { halign: "right", cellWidth: 56 }, 2: { halign: "right", cellWidth: 26 } },
          didParseCell: d => { if (d.section === "body" && subs.has(d.row.index)) { d.cell.styles.textColor = CINZA; d.cell.styles.fontSize = 8; } } });
      }
      if (extras.conj) {
        const C = extras.conj;
        quebra(26);
        tabela({ head: [[`Qualidade do fornecimento de energia · conjuntos elétricos (${C.distrib}, ${C.ano})`, cods.length === 1 ? "% da área do município" : "Municípios do recorte", "DEC (h/ano)", "Limite DEC", "FEC (interrup./ano)", "Limite FEC", "Consumidores"]],
          body: C.lista.map(r => [titulo_(r.conjunto), cods.length === 1 ? `${N(r.muns[0].pct, 1)}%` : (r.muns.length <= 3 ? r.muns.map(m => m.nome).join(", ") : `${r.muns.length} municípios`),
            N(r.dec_h, 2), N(r.dec_lim, 0), N(r.fec_n, 2), N(r.fec_lim, 0), N(r.num_con)]),
          styles: { ...estilo, fontSize: 8 }, columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
          didParseCell: d => { if (d.section === "body" && ((d.column.index === 2 && C.lista[d.row.index].dec_h > C.lista[d.row.index].dec_lim) || (d.column.index === 4 && C.lista[d.row.index].fec_n > C.lista[d.row.index].fec_lim))) { d.cell.styles.textColor = [180, 30, 30]; d.cell.styles.fontStyle = "bold"; } } });
        par("DEC: horas sem energia por consumidor no ano. FEC: número de interrupções por consumidor no ano. Valores e limites são do conjunto elétrico inteiro, que pode cobrir vários municípios ou parte de um; os consumidores são os do conjunto, não os do município.", { size: 8, cor: CINZA });
      }
      if (extras.social) {
        const S = extras.social;
        quebra(26);
        tabela({ head: [[`Vulnerabilidade social · IVS ${S.ano} (Ipea)`, "IVS", "Faixa", "Infraestrutura urbana", "Capital humano", "Renda e trabalho", `Posição entre ${S.total}`]],
          body: S.linhas.map(l => [l.nome, N3(l.ivs), titulo_(S.faixa(l.faixa)), N3(l.ivs_infra), N3(l.ivs_cap_h), N3(l.ivs_renda), `${l.pos}º`]),
          styles: { ...estilo, fontSize: 8 }, columnStyles: { 1: { halign: "right", fontStyle: "bold" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } } });
        par("Índice de 0 a 1: quanto maior, maior a vulnerabilidade. Faixas do Ipea: muito baixa (até 0,200), baixa (até 0,300), média (até 0,400), alta (até 0,500) e muito alta (acima de 0,500). A posição 1 é a do menor índice. Valores do Censo 2010, anteriores às mudanças da última década.", { size: 8, cor: CINZA });
      }

      // 4. oportunidades
      secao("4. Oportunidades para o território");
      const nL = O.ops.filter(o => o.cat === "local").length, nE = O.ops.length - nL, nConf = O.ops.filter(o => o.nivel === "Confirmado").length;
      if (!O.ops.length) par("Nenhuma regra de oportunidade foi acionada pelos dados do recorte.");
      else par(`${pl(O.ops.length, "oportunidade é acionada", "oportunidades são acionadas")} pelos dados do recorte: ${N(nL)} de potencial local e ${N(nE)} de investimento externo. ` +
        (nConf ? `${pl(nConf, "está confirmada", "estão confirmadas")}.` : "Nenhuma está confirmada.") + " A ficha só aparece quando o dado correspondente existe no recorte ou no entorno.");
      for (const [cat, rot] of [["local", "Potencial local"], ["externo", "Investimento externo"]]) {
        const lista = O.ops.filter(o => o.cat === cat);
        if (!lista.length) continue;
        sub(rot);
        for (const o of lista) {
          quebra(40);
          const cor = cat === "local" ? VERDE2 : LARANJA;
          tabela({
            head: [[{ content: `${o.sigla}. ${o.titulo}`, colSpan: 2 }]], headStyles: { fillColor: cor, textColor: 255, fontSize: 9 },
            body: [["Evidência territorial", o.evidencia], ["Município ou área", o.area], ["Categoria", o.catTxt], ["Nível de evidência", `${o.nivel}. ${o.razao}`],
              ["Beneficiários e atores", o.atores], ["Condições e infraestrutura", o.condicoes], ["Riscos socioambientais", o.riscos], ["Entrega esperada", o.entrega],
              ["Possibilidade de escala", o.escala], ["Próximo passo", o.passo], ["Conexão com políticas públicas", o.politica], ["Indicador", o.indicador]],
            columnStyles: { 0: { cellWidth: 40, fontStyle: "bold", textColor: CINZA } },
            didParseCell: d => { if (d.section === "body" && d.row.index === 3 && d.column.index === 1) { d.cell.styles.textColor = COR_NIVEL[o.nivel]; d.cell.styles.fontStyle = "bold"; } },
          });
        }
      }
      if (O.ops.length) par(TXT.politicas, { size: 8, cor: CINZA });

      // 5. síntese de prioridades
      if (O.ops.length) {
        secao("5. Síntese de prioridades");
        par(TXT.prioridades, { size: 8.5, cor: CINZA });
        tabela({ head: [["#", "Oportunidade", "Município", "Categoria", "Evidência", "Ação seguinte", "Indicador (linha de base)"]],
          body: O.ordem.map((o, i) => [i + 1, `${o.curto} (${o.sigla})`, O.onde, o.cat === "local" ? "Potencial local" : "Investimento externo", o.nivel, o.acao, o.ind]),
          styles: { ...estilo, fontSize: 7.8 }, columnStyles: { 0: { cellWidth: 7, halign: "center" }, 1: { cellWidth: 40 }, 2: { cellWidth: 24 }, 3: { cellWidth: 22 }, 4: { cellWidth: 19, fontStyle: "bold" } },
          didParseCell: d => { if (d.section === "body" && d.column.index === 4) d.cell.styles.textColor = COR_NIVEL[d.cell.raw] || TINTA; } });
      }

      // 6. dados pendentes
      secao(`${O.ops.length ? 6 : 5}. Dados pendentes`);
      par("O que está ausente, desatualizado, em modelagem ou a validar em campo, e limita as conclusões deste relatório para o recorte.", { size: 8.5, cor: CINZA });
      tabela({ head: [["Situação", "Dado", "Por que importa"]], body: pendencias(P, sel, cods, extras, G), columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" }, 1: { cellWidth: 66 } } });

      // 7. nota metodológica e fontes
      secao(`${O.ops.length ? 7 : 6}. Nota metodológica e fontes`);
      par(TXT.nota, { size: 8, cor: CINZA });
      const topicos = [...new Set(P.camadas.map(c => c.topic).concat(P.apl ? [P.apl.topic] : [], P.social ? [P.social.topic] : []))];
      tabela({ head: [["Tema", "Fontes das camadas"]], body: topicos.map(t => [t, tema(t).fonte]), styles: { ...estilo, fontSize: 7.8 }, columnStyles: { 0: { cellWidth: 46, fontStyle: "bold" } } });

      // rodapé em todas as páginas
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i); doc.setDrawColor(226, 230, 235); doc.setLineWidth(0.2); doc.line(M, Hp - 12, W - M, Hp - 12);
        doc.setTextColor(...CINZA); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
        doc.text(`${titulo} · ${location.origin}${location.pathname}`, M, Hp - 8);
        doc.text(`${i} / ${total}`, W - M, Hp - 8, { align: "right" });
      }
      const arquivo = `vocacao_${slug(todos ? "territorio-completo" : nomes.length === 1 ? nomes[0] : nomes.length + "-municipios")}.pdf`;
      if (opcoes.retornar) { A.showStatus("Relatório gerado.", 2000); return { doc, paginas: total, oportunidades: O, arquivo }; }
      doc.save(arquivo);
      A.showStatus("Relatório gerado.", 3000);
    } catch (e) {
      console.error(e);
      A.showStatus("Não foi possível gerar o relatório.", 5000);
      if (opcoes.retornar) throw e;
    }
  }

  // ------------------------------------------------------------------ janela de seleção
  async function abrir() {
    const A = window.AVANCA;
    if (!A) return;
    let P;
    try { P = await getPerfil(); } catch (e) { console.error(e); return A.showStatus("Relatório indisponível: perfil municipal não publicado.", 5000); }
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rvTit">
        <header>
          <h2 id="rvTit">Relatório de vocação (PDF)</h2>
          <p>Escolha um município ou um conjunto de municípios. O relatório traz o retrato do recorte por tema, as oportunidades que os dados sustentam (potencial local e investimento externo, com nível de evidência), as prioridades e os dados que ainda faltam.</p>
        </header>
        <div class="body">
          <div class="tools">
            <input type="search" id="rvBusca" placeholder="Filtrar municípios…" aria-label="Filtrar municípios">
            <button type="button" id="rvTodos">Selecionar todos</button>
            <button type="button" id="rvLimpar">Limpar</button>
          </div>
          <div class="mun-grid" id="rvLista">
            ${P.municipios.map(m => `<label data-n="${esc(m.nome.toLowerCase())}"><span class="chk"><input type="checkbox" value="${esc(m.cod)}"><span class="box"></span></span>${esc(m.nome)}<small>${N(m.area_km2)} km²</small></label>`).join("")}
          </div>
        </div>
        <footer>
          <span class="count" id="rvCont">Nenhum município selecionado</span>
          <button type="button" id="rvFechar">Cancelar</button>
          <button type="button" class="go" id="rvGerar" disabled>Gerar PDF</button>
        </footer>
      </div>`;
    document.body.appendChild(back);
    const boxes = () => [...back.querySelectorAll("#rvLista input")];
    const marcados = () => boxes().filter(b => b.checked).map(b => b.value);
    const sync = () => {
      const n = marcados().length;
      $("#rvCont", back).textContent = n === 0 ? "Nenhum município selecionado" : n === 1 ? "1 município selecionado" : `${n} municípios selecionados`;
      $("#rvGerar", back).disabled = n === 0;
    };
    const fechar = () => { back.remove(); document.removeEventListener("keydown", tecla); };
    const tecla = e => { if (e.key === "Escape") fechar(); };
    document.addEventListener("keydown", tecla);
    back.addEventListener("click", e => { if (e.target === back) fechar(); });
    $("#rvFechar", back).addEventListener("click", fechar);
    $("#rvLista", back).addEventListener("change", sync);
    $("#rvTodos", back).addEventListener("click", () => { back.querySelectorAll("#rvLista label:not([hidden]) input").forEach(b => (b.checked = true)); sync(); });
    $("#rvLimpar", back).addEventListener("click", () => { boxes().forEach(b => (b.checked = false)); sync(); });
    $("#rvBusca", back).addEventListener("input", e => {
      const v = e.target.value.toLowerCase();
      back.querySelectorAll("#rvLista label").forEach(l => (l.hidden = !l.dataset.n.includes(v)));
    });
    $("#rvGerar", back).addEventListener("click", () => { const c = marcados(); fechar(); gerar(c); });
    $("#rvBusca", back).focus();
  }

  document.addEventListener("click", e => { if (e.target.closest("#btnReport, #tReport")) abrir(); });
  window.AVANCA_RELATORIO = { abrir, gerar };   // para testes
})();
