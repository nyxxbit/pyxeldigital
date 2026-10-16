/* Doriie Sorveteria: rotas, cardápio, sabores e sacola.
 *
 * Dinheiro é centavo inteiro do começo ao fim. O preço da sacola é sempre
 * recalculado a partir de dados.js, nunca lido do que ficou guardado no
 * navegador: se a Renata mudar um preço, quem voltou ao site com a sacola
 * cheia vê o preço novo, e não o de uma semana atrás.
 */
(function () {
  'use strict';

  var D = window.DORIIE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ITEM = {};
  D.itens.forEach(function (it) { ITEM[it.id] = it; });

  /* De qual produto é cada foto: a vitrine só guarda o nome do arquivo. */
  var DONO = {};
  D.itens.forEach(function (it) { it.fotos.forEach(function (f) { if (!DONO[f]) DONO[f] = it; }); });

  /* O servidor guarda imagem em cache por uma hora. Trocar a foto sem
     trocar o endereço deixaria a antiga na tela: mudou foto, sobe o número. */
  var VERSAO_FOTOS = 4;
  function foto(f, mini) { return 'img/' + (mini ? 'mini/' : '') + f + '.webp?v=' + VERSAO_FOTOS; }

  /* ---------------------------------------------------------- utilidades */

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function semAcento(v) {
    return String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function reais(c) {
    var inteiro = Math.floor(c / 100);
    var cent = String(c % 100);
    if (cent.length < 2) cent = '0' + cent;
    return 'R$ ' + String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + cent;
  }

  /* "R$ 30" quando é redondo, pra etiqueta; "R$ 32,50" quando não é. */
  function reaisCurto(c) {
    return c % 100 === 0 ? 'R$ ' + (c / 100) : reais(c);
  }

  function peso(g) {
    return g >= 1000 ? String(g / 1000).replace('.', ',') + ' kg' : g + ' g';
  }

  /* Tudo que o navegador guarda passa por aqui. Em aba anônima, com site
     bloqueado ou com a cota cheia, o acesso lança erro; a sacola continua
     funcionando, só não sobrevive a um recarregar. */
  var guarda = {
    ler: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    gravar: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* segue sem guardar */ } }
  };

  var avisoTimer;
  function aviso(txt) {
    var el = $('#aviso');
    el.textContent = txt;
    el.classList.add('on');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }

  function linkWhats(texto) {
    return 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(texto);
  }

  /* ---------------------------------------------------------- preço */

  /* Devolve [mínimo, máximo] por unidade. Os dois são iguais quando o
     preço é fixo; diferem na taça suja, que varia pelo sabor. */
  function precoUnidade(it, sel) {
    sel = sel || {};
    if (it.porQuilo) {
      var g = sel.gramas || it.pesos[0];
      /* pesos são múltiplos de 500 g, e 6500 × 500 / 1000 é inteiro exato.
         O arredondamento só existe pra blindar um peso fora da lista. */
      var v = Math.round(it.porQuilo * g / 1000);
      return [v, v];
    }
    if (it.variacoes) {
      var alvo = it.variacoes.filter(function (x) { return x.rot === sel.variacao; })[0] || it.variacoes[0];
      return [alvo.preco, alvo.preco];
    }
    if (it.faixa) return [it.faixa[0], it.faixa[1]];
    return [it.preco, it.preco];
  }

  function textoPrecoCartao(it) {
    if (it.porQuilo) return '<small>o quilo</small>' + reaisCurto(it.porQuilo);
    if (it.variacoes) return '<small>a partir de</small>' + reaisCurto(it.variacoes[0].preco);
    if (it.faixa) return reaisCurto(it.faixa[0]) + ' a ' + reaisCurto(it.faixa[1]).replace('R$ ', '');
    return reaisCurto(it.preco);
  }

  function textoFaixa(par) {
    /* Sem repetir o R$: 'R$ 200,50 a 212,50' cabe numa linha da sacola, e
       'R$ 200,50 a R$ 212,50' quebrava no meio do segundo valor. */
    return par[0] === par[1] ? reais(par[0]) : reais(par[0]) + ' a ' + reais(par[1]).replace('R$ ', '');
  }

  function precisaEscolher(it) {
    return !!(it.variacoes || it.porQuilo || it.sabor || it.encomenda);
  }

  /* ---------------------------------------------------------- sabores */

  function listaDeSabores(chave) {
    var S = D.sabores;
    if (chave === 'picole') {
      return S.picoleFruta.lista.map(function (n) { return { nome: n, grupo: 'fruta' }; })
        .concat(S.picoleLeite.lista.map(function (n) { return { nome: n, grupo: 'ao leite' }; }));
    }
    if (chave === 'skimo') {
      return S.skimo.lista.filter(function (n) { return n !== 'Tradicional'; }).map(function (n) { return { nome: n }; });
    }
    return (S[chave] ? S[chave].lista : []).map(function (n) { return { nome: n }; });
  }

  /* A cor da bolinha é enfeite, não informação: sai do nome do sabor.
     A ordem importa, o primeiro que casa ganha: "Ninho com morango" é
     rosa, não creme; "Torta de limão" é verde. */
  var CORES = [
    [/^doriie$/, '#D4B594'],
    [/morango|red velvet|groselha|amarena|melancia/, '#E97793'],
    [/uva|blueberry|jaboticaba|acai|ameixa/, '#6E3A7E'],
    [/limao|maca verde|pistache|abacate|kiwi/, '#B7D78A'],
    [/ceu azul|blue ice/, '#72B6E6'],
    [/goiab|caribe|tangerina|laranja|mamao/, '#F09A6B'],
    [/abacaxi|maracuja|milho|caju|melao/, '#F4CE66'],
    [/chocolate|brigadeiro|ovomaltine|kit kat|charge|ferreiro|floresta negra|chokito|choco|oreo|prestigio|sensacao|fondue|avela|kinder|lakatella|frappuccino|crocante|tradicional|bombom/, '#6B3A22'],
    [/doce de leite|caramelo|bala baiana|amendoim|camafeu|tamarindo/, '#C99A63'],
    [/ninho|leitinho|creme|flocos|iogurte|leite condensado|ouro branco|floresta branca|sonho|cheesecake|coco|nata|mousse/, '#F1E4CC']
  ];
  function corDoSabor(nome) {
    var n = semAcento(nome);
    for (var i = 0; i < CORES.length; i++) if (CORES[i][0].test(n)) return CORES[i][1];
    return '#F1E4CC';
  }

  /* ---------------------------------------------------------- horário */

  function situacao() {
    var d = new Date();
    var m = d.getHours() * 60 + d.getMinutes();
    var aberto = m >= D.horario.abre && m < D.horario.fecha;
    var fecha = (D.horario.fecha / 60) + 'h';
    var abre = (D.horario.abre / 60) + 'h';
    return {
      aberto: aberto,
      curto: aberto ? 'Aberto · até ' + fecha : 'Fechado · abre ' + abre,
      longo: aberto ? '<b>Aberto agora.</b> Fecha às ' + fecha + '.' : 'Fechado agora. Abre às ' + abre + ', todo dia.'
    };
  }

  function pintarStatus() {
    var s = situacao();
    $$('[data-status]').forEach(function (el) {
      el.textContent = s.curto;
      el.classList.toggle('sim', s.aberto);
    });
    $$('[data-status-longo]').forEach(function (el) { el.innerHTML = s.longo; });
  }

  /* ---------------------------------------------------------- links fixos */

  function ligarLinks() {
    $$('[data-whats]').forEach(function (a) { a.href = linkWhats('Olá, Doriie! Vim pelo site.'); });
    var end = D.endereco.rua + ', ' + D.endereco.cidade;
    $$('[data-endereco]').forEach(function (el) { el.textContent = end; });
    $('#mapaAriranha').href = 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(D.endereco.rua + ', ' + D.endereco.cidade + ' ' + D.endereco.uf + ' ' + D.endereco.cep);
    $('#linkInsta').href = 'https://www.instagram.com/' + D.instagram + '/';
  }

  /* ---------------------------------------------------------- rotas e cortina */

  var TELAS = ['inicio', 'cardapio', 'sabores', 'familia', 'visite'];
  var NOMES = { inicio: 'Doriie Sorveteria', cardapio: 'Cardápio', sabores: 'Sabores', familia: 'A família', visite: 'Visite' };
  var atual = null;
  var trocando = false;
  var cortina = $('#cortina');

  function telaDoHash() {
    var h = (location.hash || '').replace('#', '');
    return TELAS.indexOf(h) >= 0 ? h : 'inicio';
  }

  function mostrar(nome) {
    TELAS.forEach(function (t) { $('#t-' + t).hidden = t !== nome; });
    $$('[data-ir]').forEach(function (a) {
      if (a.closest('.nav') || a.closest('.barra')) {
        if (a.getAttribute('data-ir') === nome) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
    });
    atual = nome;
    window.scrollTo(0, 0);
    document.title = nome === 'inicio' ? 'Doriie Sorveteria · Ariranha' : NOMES[nome] + ' · Doriie Sorveteria';
    if (nome === 'familia') $('#letras').classList.add('chegou');
    if (nome === 'cardapio') vigiarRail();
  }

  function focarTitulo() {
    var h = $('#t-' + atual + ' h1');
    if (h) h.focus({ preventScroll: true });
  }

  /* A cortina é conduzida por tempo, não por "animationend". Com a aba em
     segundo plano o navegador congela a animação e o evento não chega;
     por tempo, ela sai do caminho do mesmo jeito. */
  var seguranca;
  function soltarCortina() {
    cortina.className = 'cortina fora';
    trocando = false;
    clearTimeout(seguranca);
  }

  function abrirPrimeira() {
    mostrar(telaDoHash());
    cortina.className = 'cortina escrevendo';
    seguranca = setTimeout(soltarCortina, 4000);
    setTimeout(function () {
      cortina.className = 'cortina escrevendo subindo';
      setTimeout(soltarCortina, 660);
    }, 1050);
  }

  function ir(nome, gravarHistorico) {
    if (TELAS.indexOf(nome) < 0) nome = 'inicio';
    fecharSacola();
    if (nome === atual) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (trocando) return;
    trocando = true;
    $('#cortinaDestino').textContent = NOMES[nome];
    cortina.className = 'cortina descendo-prep';
    void cortina.offsetWidth;
    cortina.className = 'cortina descendo';
    seguranca = setTimeout(soltarCortina, 4000);

    setTimeout(function () {
      cortina.className = 'cortina escrevendo';
      mostrar(nome);
      if (gravarHistorico) history.pushState(null, '', '#' + nome);
      setTimeout(function () {
        cortina.className = 'cortina escrevendo subindo';
        setTimeout(function () { soltarCortina(); focarTitulo(); }, 660);
      }, 640);
    }, 440);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-ir]');
    if (!a) return;
    e.preventDefault();
    ir(a.getAttribute('data-ir'), true);
  });
  /* So hash de tela move a cortina. O link 'Pular para o conteudo' muda o
     hash pra #conteudo, e sem este filtro o roteador leria isso como
     'volta pro inicio', tirando a pessoa da tela onde ela estava. */
  window.addEventListener('popstate', function () {
    var h = (location.hash || '').replace('#', '');
    if (h === '' || TELAS.indexOf(h) >= 0) ir(telaDoHash(), false);
  });

  /* ---------------------------------------------------------- início */

  /* A parede do início: só a foto, sem nome, preço nem botão. O nome em
     cada foto correndo poluía a tela, e preço e botão já estão no
     cardápio; tocar abre a foto grande, com tudo isso.
     No computador são três colunas; no celular, uma faixa só com todas as
     fotos (duas faixas em sentidos opostos também poluíam). Cada coluna
     leva o conteúdo duas vezes: a animação anda metade dela e volta ao
     começo sem emenda. A cópia é aria-hidden, pra não ser lida em dobro. */
  var telaLarga = window.matchMedia('(min-width: 1024px)');

  function montarParede() {
    var cols = $$('#parede .parede-col');
    var usadas = telaLarga.matches ? cols.length : 1;
    var grupos = [];
    for (var g = 0; g < usadas; g++) grupos.push([]);
    D.vitrine.filter(function (f) { return DONO[f]; }).forEach(function (f, i) { grupos[i % usadas].push(f); });
    cols.forEach(function (col, c) {
      if (c >= usadas) { col.innerHTML = ''; return; }
      var fotos = grupos[c].map(function (f) {
        var it = DONO[f];
        return '<figure class="parede-item" data-ver="' + it.id + '" data-foto="' + f + '">' +
          '<img src="' + foto(f, true) + '" alt="' + esc(it.nome) + '" width="440" height="550"></figure>';
      }).join('');
      col.innerHTML = '<div class="parede-grupo">' + fotos + '</div><div class="parede-grupo" aria-hidden="true">' + fotos + '</div>';
    });
    marcarFotos();
  }

  /* O quadro da casa troca de foto sozinho, com a troca suave do CSS.
     Tocar abre a foto que está na tela: o alvo do visor acompanha a vez. */
  function montarCasa() {
    var fig = $('#casaFotos');
    var fotos = D.casa.filter(function (f) { return DONO[f]; });
    if (!fig || fotos.length < 2) return;
    fig.innerHTML = fotos.map(function (f, n) {
      return '<img src="' + foto(f) + '" alt="' + esc(DONO[f].nome) + '" width="880" height="1100" loading="lazy"' + (n === 0 ? ' class="visivel"' : '') + '>';
    }).join('');
    var i = 0;
    function mostra(n) {
      var imgs = $$('img', fig);
      imgs[i].classList.remove('visivel');
      i = n % imgs.length;
      imgs[i].classList.add('visivel');
      fig.setAttribute('data-ver', DONO[fotos[i]].id);
      fig.setAttribute('data-foto', fotos[i]);
      if (fig.hasAttribute('aria-label')) fig.setAttribute('aria-label', 'Ver foto maior: ' + DONO[fotos[i]].nome);
    }
    /* Com "reduzir movimento" ligado, troca mais devagar em vez de parar
       (design.md: laço infinito com duração zero congela a página). */
    var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setInterval(function () { if (atual === 'inicio' && !document.hidden) mostra(i + 1); }, reduz ? 6000 : 3500);
  }

  function montarInicio() {
    montarParede();
    montarCasa();
    /* Girar o celular ou redimensionar a janela troca uma faixa por três
       colunas: remonta, senão ficava a divisão da largura anterior. */
    if (telaLarga.addEventListener) telaLarga.addEventListener('change', montarParede);
    else if (telaLarga.addListener) telaLarga.addListener(montarParede);
  }

  /* ---------------------------------------------------------- cardápio */

  function itemCardapio(it) {
    var legendas = D.legendasBolo || {};
    var galeria = it.cat === 'bolos'
      ? '<div class="galeria" tabindex="0" aria-label="Fotos de bolos de sorvete">' + it.fotos.map(function (f) {
          var leg = legendas[f];
          return '<figure data-ver="' + it.id + '"><img src="' + foto(f) + '" width="880" height="1100" alt="Bolo de sorvete' + (leg ? ' de ' + esc(leg) : '') + '" loading="lazy">' +
            (leg ? '<figcaption>' + esc(leg) + '</figcaption>' : '') + '</figure>';
        }).join('') + '</div>'
      : '';
    return galeria +
      '<article class="item' + (it.cat === 'bolos' ? ' item-encomenda' : '') + '">' +
        (it.cat === 'bolos' ? '' : '<div class="item-foto" data-ver="' + it.id + '"><img src="' + foto(it.fotos[0]) + '" width="880" height="1100" alt="' + esc(it.nome) + '" loading="lazy"></div>') +
        '<div class="item-info">' +
          (it.encomenda ? '<span class="selo-encomenda">Sob encomenda</span>' : '') +
          '<h3>' + esc(it.nome) + '</h3>' +
          '<p>' + esc(it.desc) + '</p>' +
          '<div class="item-pe"><span class="preco">' + textoPrecoCartao(it) + '</span>' +
          '<button class="btn-add" type="button" data-add="' + it.id + '">' + (it.encomenda ? 'Encomendar' : 'Adicionar') + '</button></div>' +
        '</div>' +
      '</article>';
  }

  function montarCardapio() {
    $('#rail').innerHTML = D.categorias.map(function (c, i) {
      return '<a href="#cardapio" data-cat="' + c.id + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(c.nome) + '</a>';
    }).join('');

    $('#listaCardapio').innerHTML = D.categorias.map(function (c) {
      var itens = D.itens.filter(function (it) { return it.cat === c.id; });
      /* contar item numa categoria de um produto so nao informa nada */
      var conta = c.id === 'bolos' ? 'por encomenda' : itens.length + (itens.length === 1 ? ' item' : ' itens');
      return '<section class="categoria" id="cat-' + c.id + '" aria-labelledby="hc-' + c.id + '">' +
        '<h2 id="hc-' + c.id + '">' + esc(c.nome) + ' <small>' + conta + '</small></h2>' +
        (c.id === 'bolos' ? itens.map(itemCardapio).join('') : '<div class="lista ' + (itens.length % 3 === 0 ? 'grade' : 'linhas') + '">' + itens.map(itemCardapio).join('') + '</div>') +
        '</section>';
    }).join('');

    $('#rail').addEventListener('click', function (e) {
      var a = e.target.closest('[data-cat]');
      if (!a) return;
      e.preventDefault();
      var alvo = $('#cat-' + a.getAttribute('data-cat'));
      if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* A pílula acesa segue a categoria que está na tela. */
  var observador;
  function vigiarRail() {
    if (observador || !('IntersectionObserver' in window)) return;
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id.replace('cat-', '');
        $$('#rail a').forEach(function (a) {
          var on = a.getAttribute('data-cat') === id;
          a.classList.toggle('on', on);
          if (on && a.scrollIntoView) a.parentNode.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
        });
      });
    }, { rootMargin: '-150px 0px -60% 0px' });
    $$('.categoria').forEach(function (s) { observador.observe(s); });
  }

  /* ---------------------------------------------------------- paredão de sabores */

  var GRUPOS = [
    { id: 'massa', rot: 'Sorvete' },
    { id: 'picoleFruta', rot: 'Picolé de fruta' },
    { id: 'picoleLeite', rot: 'Picolé ao leite' },
    { id: 'skimo', rot: 'Skimo' },
    { id: 'acai', rot: 'Açaí' },
    { id: 'agua', rot: 'Sorvete de água' }
  ];
  var filtro = 'todos';
  var TOTAL_SABORES = GRUPOS.reduce(function (s, g) { return s + D.sabores[g.id].lista.length; }, 0);

  function montarSabores() {
    $('#filtroSabor').innerHTML = [{ id: 'todos', rot: 'Todos' }].concat(GRUPOS).map(function (g) {
      return '<button type="button" data-filtro="' + g.id + '" aria-pressed="' + (g.id === 'todos') + '">' + esc(g.rot) + '</button>';
    }).join('');

    $('#filtroSabor').addEventListener('click', function (e) {
      var b = e.target.closest('[data-filtro]');
      if (!b) return;
      filtro = b.getAttribute('data-filtro');
      $$('#filtroSabor button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      pintarSabores();
    });
    $('#buscaSabor').addEventListener('input', pintarSabores);
    pintarSabores();
  }

  function destacar(nome, q) {
    if (!q) return esc(nome);
    var n = semAcento(nome), i = n.indexOf(q);
    if (i < 0) return esc(nome);
    return esc(nome.slice(0, i)) + '<mark>' + esc(nome.slice(i, i + q.length)) + '</mark>' + esc(nome.slice(i + q.length));
  }

  function pintarSabores() {
    var bruto = $('#buscaSabor').value.trim();
    var q = semAcento(bruto);
    var achados = 0, html = '';

    GRUPOS.forEach(function (g) {
      if (filtro !== 'todos' && filtro !== g.id) return;
      var grupo = D.sabores[g.id];
      var lista = grupo.lista.filter(function (n) { return !q || semAcento(n).indexOf(q) >= 0; });
      if (!lista.length) return;
      achados += lista.length;
      html += '<section class="grupo"><h2>' + esc(g.rot) + ' <small>' + lista.length + ' · ' + esc(grupo.desc) + '</small></h2>' +
        '<ul class="bolas">' + lista.map(function (n) {
          var casa = n === 'Doriie';
          return '<li class="bola' + (casa ? ' casa' : '') + '"><i style="background:' + corDoSabor(n) + '"></i>' + destacar(n, q) + '</li>';
        }).join('') + '</ul></section>';
    });

    if (!achados) {
      html = '<div class="nada"><p>Não achamos “' + esc(bruto) + '”.</p>' +
        '<a class="btn btn-caramelo" href="' + esc(linkWhats('Olá, Doriie! Vocês têm sabor ' + bruto + '?')) + '" target="_blank" rel="noopener">Perguntar pra Doriie</a></div>';
    }
    $('#paredao').innerHTML = html;
    $('#contagemSabor').textContent = q || filtro !== 'todos'
      ? achados + ' de ' + TOTAL_SABORES + ' sabores'
      : TOTAL_SABORES + ' sabores';
  }

  /* ---------------------------------------------------------- opções do item */

  var escolha = null;   // { id, variacao, gramas, sabores[], obs, qtd }
  var quemAbriu = null;

  function abrirOpcoes(it, botao) {
    quemAbriu = botao || null;
    escolha = {
      id: it.id,
      variacao: it.variacoes ? it.variacoes[0].rot : null,
      gramas: it.porQuilo ? (it.pesos.indexOf(1000) >= 0 ? 1000 : it.pesos[0]) : null,
      sabores: [],
      obs: '',
      qtd: 1
    };
    var cat = D.categorias.filter(function (c) { return c.id === it.cat; })[0];
    $('#opCat').textContent = cat ? cat.nome : '';
    $('#opTitulo').textContent = it.nome;

    var h = '<p class="op-desc">' + esc(it.desc) + '</p>';

    if (it.variacoes) {
      h += '<div class="op-grupo"><p>Tamanho</p><div class="escolhas" data-grupo="variacao">' +
        it.variacoes.map(function (v, i) {
          return '<button type="button" data-valor="' + esc(v.rot) + '" aria-pressed="' + (i === 0) + '">' + esc(v.rot) + ' <small>' + reaisCurto(v.preco) + '</small></button>';
        }).join('') + '</div></div>';
    }

    if (it.porQuilo) {
      h += '<div class="op-grupo"><p>Quanto <span>' + reaisCurto(it.porQuilo) + ' o quilo</span></p><div class="escolhas" data-grupo="gramas">' +
        it.pesos.map(function (g) {
          return '<button type="button" data-valor="' + g + '" aria-pressed="' + (g === escolha.gramas) + '">' + peso(g) + ' <small>' + reaisCurto(Math.round(it.porQuilo * g / 1000)) + '</small></button>';
        }).join('') + '</div><p class="op-aviso">O peso é aproximado. O valor final é o da balança.</p></div>';
    }

    if (it.sabor) {
      var lista = listaDeSabores(it.sabor);
      var busca = lista.length > 12 ? '<input class="op-busca" type="search" placeholder="Procurar sabor" aria-label="Procurar sabor" data-busca-op>' : '';
      h += '<div class="op-grupo"><p>' + (it.varios ? 'Sabores <span>' + (it.ate ? 'até ' + it.ate : 'quantos quiser') + '</span>' : 'Sabor') + '</p>' + busca +
        '<div class="escolhas escolhas-rolagem" data-grupo="sabor">' +
        lista.map(function (s) {
          return '<button type="button" data-valor="' + esc(s.nome) + '" aria-pressed="false"><i style="background:' + corDoSabor(s.nome) + '"></i>' +
            esc(s.nome) + (s.grupo ? ' <small>' + s.grupo + '</small>' : '') + '</button>';
        }).join('') + '</div><p class="op-aviso" data-falta-sabor hidden>Escolha ' + (it.varios ? 'pelo menos um sabor' : 'o sabor') + '.</p></div>';
    }

    if (it.encomenda) {
      h += '<div class="op-grupo"><p>Sabor e dia da encomenda</p>' +
        '<textarea class="op-obs" rows="3" data-obs placeholder="Ex.: prestígio, pra sábado à tarde"></textarea>' +
        '<p class="op-desc">A Doriie confirma o sabor, o tamanho e o prazo pelo WhatsApp.</p></div>';
    }

    $('#opCorpo').innerHTML = h;
    $('#opQtd').textContent = '1';
    atualizarBotaoOpcoes();
    abrirPainel('#opcoes', '#veuOpcoes');
  }

  function atualizarBotaoOpcoes() {
    var it = ITEM[escolha.id];
    var u = precoUnidade(it, escolha);
    var t = [u[0] * escolha.qtd, u[1] * escolha.qtd];
    $('#opAdicionar').textContent = 'Adicionar · ' + textoFaixa(t);
  }

  $('#opCorpo').addEventListener('click', function (e) {
    var b = e.target.closest('.escolhas button');
    if (!b) return;
    var grupo = b.parentNode.getAttribute('data-grupo');
    var valor = b.getAttribute('data-valor');
    var it = ITEM[escolha.id];
    if (grupo === 'sabor' && it.varios) {
      var i = escolha.sabores.indexOf(valor);
      /* Banana split são três bolas: o quarto sabor não cabe. Avisa em vez
         de trocar sozinho um sabor que a pessoa já tinha escolhido. */
      if (i < 0 && it.ate && escolha.sabores.length >= it.ate) {
        aviso('Na ' + it.nome.toLowerCase() + ' vão até ' + it.ate + ' sabores.');
        return;
      }
      if (i >= 0) escolha.sabores.splice(i, 1); else escolha.sabores.push(valor);
      b.setAttribute('aria-pressed', String(i < 0));
    } else {
      $$('button', b.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      if (grupo === 'variacao') escolha.variacao = valor;
      if (grupo === 'gramas') escolha.gramas = +valor;
      if (grupo === 'sabor') escolha.sabores = [valor];
    }
    var falta = $('[data-falta-sabor]');
    if (falta && escolha.sabores.length) falta.hidden = true;
    atualizarBotaoOpcoes();
  });

  $('#opCorpo').addEventListener('input', function (e) {
    if (e.target.matches('[data-busca-op]')) {
      var q = semAcento(e.target.value.trim());
      $$('[data-grupo="sabor"] button').forEach(function (b) {
        b.hidden = !!q && semAcento(b.getAttribute('data-valor')).indexOf(q) < 0;
      });
    }
    if (e.target.matches('[data-obs]')) escolha.obs = e.target.value;
  });

  $('#opMenos').addEventListener('click', function () {
    if (escolha.qtd > 1) { escolha.qtd--; $('#opQtd').textContent = escolha.qtd; atualizarBotaoOpcoes(); }
  });
  $('#opMais').addEventListener('click', function () {
    if (escolha.qtd < 30) { escolha.qtd++; $('#opQtd').textContent = escolha.qtd; atualizarBotaoOpcoes(); }
  });

  $('#opAdicionar').addEventListener('click', function () {
    var it = ITEM[escolha.id];
    if (it.sabor && !escolha.sabores.length) {
      var falta = $('[data-falta-sabor]');
      if (falta) { falta.hidden = false; falta.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      return;
    }
    var origem = $('#opAdicionar');
    colocar(escolha);
    fecharPainel('#opcoes', '#veuOpcoes');
    voar(origem);
  });

  /* ---------------------------------------------------------- foto ampliada */

  /* Toda foto de produto abre grande. O João tocou na foto do cardápio
     esperando ver maior e nada acontecia. */
  var visor = { id: null, i: 0 };
  var toque = null, arrastou = false;

  function marcarFotos() {
    $$('[data-ver]').forEach(function (el) {
      var it = ITEM[el.getAttribute('data-ver')];
      if (!it) return;
      /* A cópia da parede existe só pro laço da animação: fora do Tab. */
      if (el.closest('[aria-hidden="true"]')) { el.tabIndex = -1; return; }
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.setAttribute('aria-label', 'Ver foto maior: ' + it.nome);
    });
  }

  /* Abre na foto que foi tocada, e não na primeira do produto: quem tocou
     na taça de amendoim espera ver a de amendoim. */
  function fotoTocada(el) {
    if (el.getAttribute('data-foto')) return el.getAttribute('data-foto');
    var img = $('img', el);
    return img ? img.getAttribute('src').split('/').pop().replace(/\.webp(\?.*)?$/, '') : '';
  }

  function abrirVisor(el) {
    var it = ITEM[el.getAttribute('data-ver')];
    if (!it) return;
    quemAbriu = el;
    visor.id = it.id;
    visor.i = Math.max(0, it.fotos.indexOf(fotoTocada(el)));
    $('#visorTitulo').textContent = it.nome;
    $('#visorPreco').innerHTML = textoPrecoCartao(it);
    $('#visorAdd').textContent = it.encomenda ? 'Encomendar' : 'Adicionar';
    $('#visorAnt').hidden = $('#visorProx').hidden = it.fotos.length < 2;
    mostrarFoto();
    abrirPainel('#visor', '#veuVisor');
  }

  function mostrarFoto() {
    var it = ITEM[visor.id];
    var f = it.fotos[visor.i];
    var leg = (D.legendasBolo || {})[f];
    var img = $('#visorImg');
    img.src = foto(f);
    img.alt = it.nome + (leg ? ' de ' + leg : '');
    if (img.animate) img.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    var cat = D.categorias.filter(function (c) { return c.id === it.cat; })[0];
    var partes = [leg || (cat ? cat.nome : '')];
    if (it.fotos.length > 1) partes.push((visor.i + 1) + ' de ' + it.fotos.length);
    $('#visorConta').textContent = partes.join(' · ');
  }

  function passarFoto(d) {
    var n = ITEM[visor.id].fotos.length;
    if (n < 2) return;
    visor.i = (visor.i + d + n) % n;
    mostrarFoto();
  }

  $('#visorAnt').addEventListener('click', function () { passarFoto(-1); });
  $('#visorProx').addEventListener('click', function () { passarFoto(1); });

  /* Arrastar pro lado troca a foto, como em qualquer galeria de celular. */
  $('#visorPalco').addEventListener('pointerdown', function (e) { toque = { x: e.clientX, y: e.clientY }; arrastou = false; });
  $('#visorPalco').addEventListener('pointerup', function (e) {
    if (!toque) return;
    var dx = e.clientX - toque.x, dy = e.clientY - toque.y;
    toque = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { arrastou = true; passarFoto(dx < 0 ? 1 : -1); }
  });

  /* Adicionar pelo visor fecha a foto antes de abrir a ficha de opções,
     senão ficam duas camadas escuras uma sobre a outra. */
  $('#visorAdd').addEventListener('click', function () {
    var it = ITEM[visor.id];
    var volta = quemAbriu;
    fecharPainel('#visor', '#veuVisor');
    if (precisaEscolher(it)) abrirOpcoes(it, volta);
    else { colocar({ id: it.id, qtd: 1 }); voar(volta); }
  });

  /* ---------------------------------------------------------- sacola */

  var CHAVE = 'doriie-sacola-v1';
  var sacola = (guarda.ler(CHAVE) || []).filter(function (l) { return l && ITEM[l.id] && l.qtd > 0; });

  function chaveDaLinha(l) {
    return [l.id, l.variacao || '', l.gramas || '', (l.sabores || []).slice().sort().join('+'), l.obs || ''].join('|');
  }

  function colocar(esc0) {
    var nova = {
      id: esc0.id, variacao: esc0.variacao || null, gramas: esc0.gramas || null,
      sabores: (esc0.sabores || []).slice(), obs: (esc0.obs || '').trim(), qtd: esc0.qtd || 1
    };
    var k = chaveDaLinha(nova);
    var igual = sacola.filter(function (l) { return chaveDaLinha(l) === k; })[0];
    if (igual) igual.qtd = Math.min(30, igual.qtd + nova.qtd); else sacola.push(nova);
    salvarSacola();
    aviso(ITEM[nova.id].nome + ' na sacola.');
  }

  function salvarSacola() {
    guarda.gravar(CHAVE, sacola);
    pintarSacola();
  }

  function totais() {
    return sacola.reduce(function (t, l) {
      var u = precoUnidade(ITEM[l.id], l);
      return [t[0] + u[0] * l.qtd, t[1] + u[1] * l.qtd];
    }, [0, 0]);
  }

  function detalhe(l) {
    var p = [];
    if (l.variacao) p.push(l.variacao);
    if (l.gramas) p.push(peso(l.gramas));
    if (l.sabores && l.sabores.length) p.push(l.sabores.join(', '));
    if (l.obs) p.push('“' + l.obs + '”');
    return p.join(' · ');
  }

  function pintarSacola() {
    var n = sacola.reduce(function (s, l) { return s + l.qtd; }, 0);
    $$('[data-contador]').forEach(function (el) {
      el.textContent = n;
      el.classList.toggle('zero', n === 0);
    });

    $('#sacolaItens').innerHTML = sacola.map(function (l, i) {
      var it = ITEM[l.id];
      var u = precoUnidade(it, l);
      return '<li class="si">' +
        '<img src="' + foto(it.fotos[0]) + '" alt="" loading="lazy">' +
        '<div><p class="si-nome">' + esc(it.nome) + '</p>' +
        (detalhe(l) ? '<p class="si-det">' + esc(detalhe(l)) + '</p>' : '') +
        '<p class="si-preco">' + textoFaixa([u[0] * l.qtd, u[1] * l.qtd]) + '</p></div>' +
        '<div class="si-lado"><div class="qtd qtd-p">' +
          '<button type="button" data-menos="' + i + '" aria-label="Diminuir ' + esc(it.nome) + '">−</button>' +
          '<output>' + l.qtd + '</output>' +
          '<button type="button" data-mais="' + i + '" aria-label="Aumentar ' + esc(it.nome) + '">+</button></div>' +
          '<button class="si-tirar" type="button" data-tirar="' + i + '">Tirar</button></div>' +
        '</li>';
    }).join('');

    var vazia = sacola.length === 0;
    $('#sacolaVazia').hidden = !vazia;
    $('#pedido').hidden = vazia;
    $('#sacolaPe').hidden = vazia;

    var t = totais();
    $('#sacolaTotal').textContent = textoFaixa(t);
    var notas = [];
    if (sacola.some(function (l) { return ITEM[l.id].faixa; })) notas.push('A taça suja varia de R$ 26 a R$ 32 pelo sabor.');
    if (sacola.some(function (l) { return ITEM[l.id].porQuilo; })) notas.push('No quilo, o valor final é o da balança.');
    $('#totalNota').textContent = notas.join(' ');
  }

  $('#sacolaItens').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var i;
    if (b.hasAttribute('data-mais')) { i = +b.getAttribute('data-mais'); sacola[i].qtd = Math.min(30, sacola[i].qtd + 1); }
    else if (b.hasAttribute('data-menos')) { i = +b.getAttribute('data-menos'); sacola[i].qtd--; if (sacola[i].qtd < 1) sacola.splice(i, 1); }
    else if (b.hasAttribute('data-tirar')) { i = +b.getAttribute('data-tirar'); sacola.splice(i, 1); }
    else return;
    salvarSacola();
  });

  /* "Entrega" pede endereço. A Doriie é quem confirma se entrega e quanto
     custa: o site não promete taxa nem raio que ninguém confirmou. */
  $('#pedido').addEventListener('change', function (e) {
    if (e.target.name === 'receber') $('#campoEndereco').hidden = e.target.value !== 'Entrega';
  });

  /* Guarda o que a pessoa digitou (nome, endereço), pra não pedir de novo
     no próximo pedido. Só no navegador dela. */
  var CHAVE_FORM = 'doriie-cliente-v1';
  (function lembrarFormulario() {
    var f = $('#pedido');
    var salvo = guarda.ler(CHAVE_FORM) || {};
    if (salvo.nome) f.nome.value = salvo.nome;
    if (salvo.endereco) f.endereco.value = salvo.endereco;
    f.addEventListener('input', function () {
      guarda.gravar(CHAVE_FORM, { nome: f.nome.value, endereco: f.endereco.value });
    });
  })();

  function montarMensagem() {
    var f = $('#pedido');
    var linhas = ['Olá, Doriie! Quero fazer um pedido pelo site:', ''];
    sacola.forEach(function (l) {
      var it = ITEM[l.id];
      var u = precoUnidade(it, l);
      var d = detalhe(l);
      linhas.push(l.qtd + 'x ' + it.nome + (d ? ' (' + d + ')' : '') + ' — ' + textoFaixa([u[0] * l.qtd, u[1] * l.qtd]));
    });
    linhas.push('');
    linhas.push('Total: ' + textoFaixa(totais()));
    var nota = $('#totalNota').textContent;
    if (nota) linhas.push('(' + nota + ')');
    linhas.push('');
    linhas.push('Nome: ' + f.nome.value.trim());
    var receber = f.receber.value;
    linhas.push('Receber: ' + receber + (receber === 'Entrega' && f.endereco.value.trim() ? ', ' + f.endereco.value.trim() : ''));
    linhas.push('Pagamento: ' + f.pagamento.value);
    if (f.obs.value.trim()) linhas.push('Obs.: ' + f.obs.value.trim());
    return linhas.join('\n');
  }

  $('#enviarPedido').addEventListener('click', function () {
    var f = $('#pedido');
    var faltou = null;
    f.nome.classList.remove('faltou');
    f.endereco.classList.remove('faltou');
    if (!f.nome.value.trim()) faltou = f.nome;
    else if (f.receber.value === 'Entrega' && !f.endereco.value.trim()) faltou = f.endereco;
    if (faltou) {
      faltou.classList.add('faltou');
      faltou.focus();
      aviso(faltou === f.nome ? 'Falta o seu nome.' : 'Falta o endereço da entrega.');
      return;
    }
    var url = linkWhats(montarMensagem());
    var janela = window.open(url, '_blank', 'noopener');
    if (!janela) location.href = url;
    aviso('Pedido pronto no WhatsApp. É só enviar lá.');
  });

  /* ---------------------------------------------------------- painéis */

  var painelAberto = null;

  function abrirPainel(sel, veuSel) {
    var p = $(sel), v = $(veuSel);
    p.hidden = false; v.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { p.classList.add('on'); v.classList.add('on'); });
    });
    painelAberto = { p: sel, v: veuSel };
    setTimeout(function () { var f = $('.fechar', p); if (f) f.focus(); }, 60);
  }

  function fecharPainel(sel, veuSel) {
    var p = $(sel), v = $(veuSel);
    if (p.hidden) return;
    p.classList.remove('on'); v.classList.remove('on');
    document.body.style.overflow = '';
    setTimeout(function () { p.hidden = true; v.hidden = true; }, 420);
    painelAberto = null;
    if (quemAbriu && document.contains(quemAbriu)) quemAbriu.focus({ preventScroll: true });
  }

  function abrirSacola(botao) { quemAbriu = botao || null; pintarSacola(); abrirPainel('#sacola', '#veuSacola'); }
  function fecharSacola() { fecharPainel('#sacola', '#veuSacola'); }

  document.addEventListener('click', function (e) {
    var ver = e.target.closest('[data-ver]');
    if (ver) { abrirVisor(ver); return; }
    if (e.target.closest('#visor [data-fechar]')) { fecharPainel('#visor', '#veuVisor'); return; }
    /* Tocar no escuro em volta da foto fecha. Depois de arrastar, não: o
       dedo que passa a foto costuma soltar fora dela, e fecharia o visor. */
    if (e.target === $('#visor') || e.target === $('#visorPalco')) {
      if (!arrastou) fecharPainel('#visor', '#veuVisor');
      arrastou = false;
      return;
    }
    var add = e.target.closest('[data-add]');
    if (add) {
      var it = ITEM[add.getAttribute('data-add')];
      if (!it) return;
      if (precisaEscolher(it)) abrirOpcoes(it, add);
      else { colocar({ id: it.id, qtd: 1 }); voar(add); }
      return;
    }
    if (e.target.closest('[data-abrir-sacola]')) { abrirSacola(e.target.closest('[data-abrir-sacola]')); return; }
    if (e.target.closest('[data-fechar-sacola]')) { fecharSacola(); return; }
    if (e.target.closest('#opcoes [data-fechar]') || e.target === $('#veuOpcoes')) { fecharPainel('#opcoes', '#veuOpcoes'); return; }
    if (e.target.closest('#sacola [data-fechar]') || e.target === $('#veuSacola')) { fecharSacola(); return; }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && painelAberto) { fecharPainel(painelAberto.p, painelAberto.v); return; }
    if (painelAberto && painelAberto.p === '#visor' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      passarFoto(e.key === 'ArrowRight' ? 1 : -1);
      return;
    }
    var ver = e.target.closest && e.target.closest('[data-ver]');
    if (ver && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirVisor(ver); }
  });

  /* ---------------------------------------------------------- o voo até a sacola */

  function voar(de) {
    var alvo = $$('[data-abrir-sacola]').filter(function (b) { return b.offsetParent !== null; })[0];
    if (!alvo || !de || !de.getBoundingClientRect || !document.body.animate) { pular(); return; }
    var a = de.getBoundingClientRect(), b = alvo.getBoundingClientRect();
    var x0 = a.left + a.width / 2 - 9, y0 = a.top + a.height / 2 - 9;
    var x1 = b.left + b.width / 2 - 9, y1 = b.top + b.height / 2 - 9;
    var bolinha = document.createElement('div');
    bolinha.className = 'voo';
    document.body.appendChild(bolinha);
    var anim = bolinha.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1)', opacity: 1 },
      { transform: 'translate(' + ((x0 + x1) / 2) + 'px,' + (Math.min(y0, y1) - 90) + 'px) scale(1.2)', opacity: 1, offset: .5 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.5)', opacity: .9 }
    ], { duration: 620, easing: 'cubic-bezier(.4,0,.2,1)' });
    /* por tempo e por evento: com a aba escondida o evento pode não vir */
    var feito = false;
    function fim() { if (feito) return; feito = true; bolinha.remove(); pular(); }
    anim.onfinish = fim;
    setTimeout(fim, 900);
  }

  function pular() {
    $$('[data-contador]').forEach(function (c) {
      c.classList.remove('pula'); void c.offsetWidth; c.classList.add('pula');
    });
  }

  /* ---------------------------------------------------------- partida */

  ligarLinks();
  pintarStatus();
  setInterval(pintarStatus, 60000);
  montarInicio();
  montarCardapio();
  marcarFotos();
  montarSabores();
  pintarSacola();
  abrirPrimeira();
})();
