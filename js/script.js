/* BookTracker — estantes, avaliação, resenha e páginas lidas por dia */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const banco = {
  ler(k, padrao) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch { return padrao; } },
  salvar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } }
};
const iso = (d = new Date()) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const diasAtras = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const norm = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const HOJE = iso();
const CAPAS = [['#1f4d3a', '#4f8a6e'], ['#7a2e2e', '#c25b4a'], ['#22335b', '#4a6fb5'], ['#5b3a6e', '#9a6bb5'], ['#8a5a14', '#d39b3a'], ['#2e4a4a', '#5f9090'], ['#3b3b3b', '#7a7a7a'], ['#6e2e4f', '#b55b86']];

function exemplos() {
  const log = (pares) => Object.fromEntries(pares.map(([d, p]) => [diasAtras(d), p]));
  return [
    { id: 1, titulo: 'Torto Arado', autor: 'Itamar Vieira Junior', paginas: 264, genero: 'Romance', status: 'lendo', pagina: 142, nota: 0, resenha: '', inicio: diasAtras(9), fim: '', leituras: log([[9, 18], [8, 22], [7, 15], [5, 30], [4, 12], [2, 25], [1, 20]]) },
    { id: 2, titulo: 'Código Limpo', autor: 'Robert C. Martin', paginas: 425, genero: 'Tecnologia', status: 'lendo', pagina: 60, nota: 0, resenha: '', inicio: diasAtras(6), fim: '', leituras: log([[6, 20], [3, 15], [0, 25]]) },
    { id: 3, titulo: 'Dom Casmurro', autor: 'Machado de Assis', paginas: 256, genero: 'Clássico', status: 'lido', pagina: 256, nota: 5, resenha: 'Capitu traiu ou não traiu? Li em uma semana e fiquei pensando nisso por dias.', inicio: diasAtras(60), fim: diasAtras(52), leituras: log([[13, 40], [12, 38], [11, 27]]) },
    { id: 4, titulo: 'Hábitos Atômicos', autor: 'James Clear', paginas: 320, genero: 'Autoajuda', status: 'lido', pagina: 320, nota: 4, resenha: 'Ideias simples e práticas. A parte de melhorar 1% por dia é a que mais ficou.', inicio: diasAtras(120), fim: diasAtras(95), leituras: {} },
    { id: 5, titulo: 'O Hobbit', autor: 'J. R. R. Tolkien', paginas: 336, genero: 'Fantasia', status: 'lido', pagina: 336, nota: 5, resenha: '', inicio: diasAtras(200), fim: diasAtras(180), leituras: {} },
    { id: 6, titulo: 'A Hora da Estrela', autor: 'Clarice Lispector', paginas: 88, genero: 'Clássico', status: 'lido', pagina: 88, nota: 4, resenha: 'Curto e intenso.', inicio: diasAtras(30), fim: diasAtras(28), leituras: {} },
    { id: 7, titulo: 'Duna', autor: 'Frank Herbert', paginas: 680, genero: 'Ficção científica', status: 'quero', pagina: 0, nota: 0, resenha: '', inicio: '', fim: '', leituras: {} },
    { id: 8, titulo: 'Cem Anos de Solidão', autor: 'Gabriel García Márquez', paginas: 448, genero: 'Romance', status: 'quero', pagina: 0, nota: 0, resenha: '', inicio: '', fim: '', leituras: {} },
    { id: 9, titulo: 'Sapiens', autor: 'Yuval Noah Harari', paginas: 472, genero: 'História', status: 'quero', pagina: 0, nota: 0, resenha: '', inicio: '', fim: '', leituras: {} }
  ];
}
let livros = banco.ler('bk_livros', null) ?? exemplos();
let meta = banco.ler('bk_meta', 6);
const salvar = () => banco.salvar('bk_livros', livros);
let estante = 'lido';

function hash(t) { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function capa(l) { const [a, b] = CAPAS[hash(l.titulo) % CAPAS.length]; return `<div class="capa" style="--a:${a};--b:${b}" aria-hidden="true"><b>${escapar(l.titulo)}</b><small>${escapar(l.autor || '')}</small></div>`; }
const estrelas = (n) => '★'.repeat(n) + `<span class="apagada">${'★'.repeat(5 - n)}</span>`;
const pct = (l) => Math.min(100, Math.round((l.pagina / l.paginas) * 100));

/* ---------- Desenho ---------- */
function desenhar() {
  const ano = new Date().getFullYear();
  const lidosAno = livros.filter((l) => l.status === 'lido' && l.fim?.startsWith(String(ano))).length;
  $('#ano').textContent = ano;
  $('#lidos-ano').textContent = lidosAno;
  $('#meta').textContent = meta;
  $('#barra-meta').style.width = `${Math.min(100, (lidosAno / meta) * 100)}%`;
  // ritmo necessário para bater a meta
  const inicioAno = new Date(ano, 0, 1), fimAno = new Date(ano, 11, 31);
  const esperado = Math.round(meta * ((Date.now() - inicioAno) / (fimAno - inicioAno)));
  $('#meta-txt').textContent = lidosAno >= meta ? 'Meta batida! 🎉' : lidosAno >= esperado ? 'Você está no ritmo certo.' : `Para ficar no ritmo, o ideal seria ter lido ${esperado}.`;

  // Gráfico dos últimos 14 dias
  const porDia = Array.from({ length: 14 }, (_, i) => { const d = diasAtras(13 - i); return { d, p: livros.reduce((s, l) => s + (l.leituras?.[d] || 0), 0) }; });
  const max = Math.max(10, ...porDia.map((x) => x.p));
  const total14 = porDia.reduce((s, x) => s + x.p, 0);
  $('#grafico').innerHTML = porDia.map((x) => `<div class="${x.d === HOJE ? 'hoje' : ''}" title="${new Date(x.d + 'T12:00').toLocaleDateString('pt-BR')}: ${x.p} páginas"><i class="${x.p ? '' : 'zero'}" style="height:${(x.p / max) * 100}%"></i><span>${+x.d.slice(8)}</span></div>`).join('');
  $('#grafico').setAttribute('aria-label', `${total14} páginas nos últimos 14 dias`);
  $('#media-dia').textContent = `média ${Math.round(total14 / 14)} pág/dia`;

  // Números
  const paginas = livros.reduce((s, l) => s + (l.status === 'lido' ? l.paginas : l.status === 'lendo' ? l.pagina : 0), 0);
  $('#n-paginas').textContent = paginas.toLocaleString('pt-BR');
  let seq = 0, i = livros.some((l) => l.leituras?.[HOJE]) ? 0 : 1;
  while (livros.some((l) => l.leituras?.[diasAtras(i)])) { seq++; i++; }
  $('#n-seq').textContent = seq;
  const notas = livros.filter((l) => l.nota);
  $('#n-nota').textContent = notas.length ? (notas.reduce((s, l) => s + l.nota, 0) / notas.length).toFixed(1).replace('.', ',') + ' ★' : '—';

  // Lendo agora
  const lendo = livros.filter((l) => l.status === 'lendo');
  $('#lendo').innerHTML = lendo.length ? lendo.map((l) => {
    const restam = l.paginas - l.pagina;
    const dias = Object.values(l.leituras || {}).filter(Boolean);
    const media = dias.length ? dias.reduce((s, x) => s + x, 0) / dias.length : 0;
    const previsao = media ? Math.ceil(restam / media) : null;
    return `<article class="lendo-card">${capa(l)}<div>
      <h3>${escapar(l.titulo)}</h3><span class="autor">${escapar(l.autor)}</span>
      <div class="progresso"><span>pág. ${l.pagina} de ${l.paginas}</span><b>${pct(l)}%</b></div>
      <div class="barra"><i style="width:${pct(l)}%"></i></div>
      <p class="nota">${previsao ? `No seu ritmo (${Math.round(media)} pág/dia), termina em ~${previsao} ${previsao === 1 ? 'dia' : 'dias'}.` : 'Registre sua leitura para ver a previsão.'}</p>
      <div class="acoes-card"><button class="btn pequeno" data-ler="${l.id}">+ Registrar leitura</button><button class="btn sec pequeno" data-editar="${l.id}">Editar</button></div>
    </div></article>`;
  }).join('') : '<p class="vazio">Nenhum livro em leitura. Que tal começar um da sua lista?</p>';

  // Estantes
  const cont = (s) => livros.filter((l) => l.status === s).length;
  $('#c-lido').textContent = cont('lido'); $('#c-quero').textContent = cont('quero'); $('#c-todos').textContent = livros.length;
  const t = norm($('#busca').value);
  let lista = livros.filter((l) => (estante === 'todos' || l.status === estante) && (!t || norm(l.titulo).includes(t) || norm(l.autor).includes(t)));
  lista = lista.sort((a, b) => (estante === 'lido' ? (b.fim || '').localeCompare(a.fim || '') : b.id - a.id));
  const nomes = { lido: 'Lido', lendo: 'Lendo', quero: 'Quero ler' };
  $('#estante').innerHTML = lista.length ? lista.map((l) => `<li class="livro"><button class="abrir" data-editar="${l.id}" aria-label="Abrir ${escapar(l.titulo)}">${capa(l)}</button>
      <h3>${escapar(l.titulo)}</h3><p>${escapar(l.autor)}</p>
      ${l.status === 'lido' ? `<p class="estrelas-mini" aria-label="Nota ${l.nota} de 5">${l.nota ? estrelas(l.nota) : '<span class="apagada">sem nota</span>'}</p>` : ''}
      ${estante === 'todos' ? `<span class="tag-status">${nomes[l.status]}</span>` : l.status === 'quero' ? `<button class="link" data-comecar="${l.id}">Começar a ler</button>` : ''}</li>`).join('')
    : `<li class="vazio">${t ? 'Nenhum livro encontrado.' : estante === 'quero' ? 'Sua lista de desejos está vazia.' : 'Nenhum livro aqui ainda.'}</li>`;
  salvar();
}

/* ---------- Formulário de livro ---------- */
const dlgL = $('#dlg-livro');
let editando = null, notaForm = 0;
$('#f-estrelas').innerHTML = [1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" aria-label="${n} estrelas">★</button>`).join('');
function marcarNota(n) { notaForm = n; $$('#f-estrelas button').forEach((b) => b.classList.toggle('acesa', +b.dataset.n <= n)); }
$('#f-estrelas').addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) marcarNota(+b.dataset.n === notaForm ? 0 : +b.dataset.n); });
function statusForm() { $('#form-livro').classList.toggle('e-lido', document.querySelector('[name=status]:checked').value === 'lido'); }
$('#form-livro').addEventListener('change', statusForm);
function abrirLivro(l = null, status = null) {
  editando = l;
  $('#dl-titulo').textContent = l ? 'Editar livro' : 'Adicionar livro';
  $('#f-titulo').value = l?.titulo || ''; $('#f-autor').value = l?.autor || ''; $('#f-paginas').value = l?.paginas || ''; $('#f-genero').value = l?.genero || '';
  document.querySelector(`[name=status][value=${status || l?.status || 'lendo'}]`).checked = true;
  $('#f-fim').value = l?.fim || HOJE; $('#f-resenha').value = l?.resenha || '';
  marcarNota(l?.nota || 0); statusForm();
  $('#f-excluir').hidden = !l; $('#f-excluir').textContent = 'Excluir livro';
  dlgL.showModal();
}
$('#novo').addEventListener('click', () => abrirLivro());
dlgL.addEventListener('close', () => {
  if (dlgL.returnValue !== 'salvar') return;
  const status = document.querySelector('[name=status]:checked').value;
  const d = { titulo: $('#f-titulo').value.trim(), autor: $('#f-autor').value.trim(), paginas: Math.max(1, +$('#f-paginas').value || 1), genero: $('#f-genero').value.trim(), status };
  if (!d.titulo) return;
  const l = editando || { id: Date.now(), pagina: 0, nota: 0, resenha: '', inicio: '', fim: '', leituras: {} };
  Object.assign(l, d);
  if (status === 'lido') { l.nota = notaForm; l.resenha = $('#f-resenha').value.trim(); l.fim = $('#f-fim').value || HOJE; l.pagina = l.paginas; }
  if (status === 'lendo' && !l.inicio) l.inicio = HOJE;
  l.pagina = Math.min(l.pagina, l.paginas);
  if (!editando) livros.push(l);
  estante = status === 'lendo' ? estante : status;
  marcarAba(); desenhar(); toast(editando ? 'Livro atualizado' : `“${l.titulo}” adicionado`);
});
$('#f-excluir').addEventListener('click', (e) => {
  if (e.target.textContent !== 'Confirmar exclusão') { e.target.textContent = 'Confirmar exclusão'; return; }
  livros = livros.filter((l) => l !== editando); dlgL.close(); desenhar(); toast('Livro excluído');
});

/* ---------- Registrar leitura do dia ---------- */
const dlgR = $('#dlg-leitura');
let lendoAgora = null;
function abrirLeitura(l) {
  lendoAgora = l;
  $('#dr-livro').textContent = `${l.titulo} · você está na página ${l.pagina} de ${l.paginas}`;
  $('#r-pagina').value = Math.min(l.paginas, l.pagina + 20); $('#r-pagina').max = l.paginas; $('#r-pagina').min = 0;
  $('#r-data').value = HOJE; $('#r-data').max = HOJE;
  calcLeitura(); dlgR.showModal(); $('#r-pagina').select();
}
function calcLeitura() {
  const n = (+$('#r-pagina').value || 0) - lendoAgora.pagina;
  $('#r-calc').textContent = n > 0 ? `+${n} páginas lidas${+$('#r-pagina').value >= lendoAgora.paginas ? ' · livro concluído! 🎉' : ''}` : n < 0 ? 'Página menor que a atual: o progresso será corrigido.' : '';
}
$('#form-leitura').addEventListener('input', calcLeitura);
dlgR.addEventListener('close', () => {
  if (dlgR.returnValue !== 'salvar') return;
  const l = lendoAgora, nova = Math.min(l.paginas, Math.max(0, Math.round(+$('#r-pagina').value || 0))), data = $('#r-data').value || HOJE;
  const delta = nova - l.pagina;
  l.leituras ||= {};
  if (delta > 0) l.leituras[data] = (l.leituras[data] || 0) + delta;
  l.pagina = nova;
  desenhar();
  if (nova >= l.paginas) { toast('Livro concluído! Dê sua nota e escreva a resenha.'); abrirLivro(l, 'lido'); }
  else toast(delta > 0 ? `+${delta} páginas registradas` : 'Progresso atualizado');
});

/* ---------- Eventos gerais ---------- */
document.addEventListener('click', (e) => {
  const ler = e.target.closest('[data-ler]');
  if (ler) { abrirLeitura(livros.find((l) => l.id === +ler.dataset.ler)); return; }
  const ed = e.target.closest('[data-editar]');
  if (ed) { abrirLivro(livros.find((l) => l.id === +ed.dataset.editar)); return; }
  const com = e.target.closest('[data-comecar]');
  if (com) { const l = livros.find((x) => x.id === +com.dataset.comecar); l.status = 'lendo'; l.inicio = HOJE; desenhar(); toast(`Boa leitura de “${l.titulo}”!`); scrollTo({ top: 0, behavior: 'smooth' }); }
});
function marcarAba() { $$('[data-estante]').forEach((b) => b.setAttribute('aria-selected', b.dataset.estante === estante)); }
$$('[data-estante]').forEach((b) => b.addEventListener('click', () => { estante = b.dataset.estante; marcarAba(); desenhar(); }));
$('#busca').addEventListener('input', desenhar);
$('#editar-meta').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  if (btn.querySelector('input')) return;
  btn.innerHTML = `<input type="number" min="1" max="999" value="${meta}" aria-label="Meta de livros do ano" style="width:64px;border:1px solid var(--linha);border-radius:8px;padding:2px 6px"> livros`;
  const inp = btn.querySelector('input');
  inp.focus(); inp.select();
  const fechar = () => { const v = parseInt(inp.value, 10); if (v > 0 && v < 1000) { meta = v; banco.salvar('bk_meta', meta); } btn.innerHTML = '<span id="meta"></span> livros'; desenhar(); };
  inp.addEventListener('blur', fechar, { once: true });
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.value = meta; inp.blur(); } });
});
$$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

let timerToast;
function toast(msg) { const t = $('#toast'); (document.querySelector('dialog[open]') || document.body).append(t); t.textContent = msg; t.hidden = false; clearTimeout(timerToast); timerToast = setTimeout(() => { t.hidden = true; }, 2600); }

desenhar();
