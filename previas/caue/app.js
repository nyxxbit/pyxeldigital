/* Cauê Consultoria: telas, troca animada, carregamento com a logo, antes e
   depois, e a ficha que monta a mensagem do WhatsApp. Dados em dados.js.
   O esquema de telas é o mesmo da Doriie: rota no endereço (#sobre), uma
   tela visível por vez, e a troca conduzida por tempo. */
(function () {
  'use strict';

  var D = window.CAUE;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function zap(texto) { return 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(texto); }

  document.documentElement.classList.add('js');

  /* ------------------------------------------------------------ contatos */

  var DUVIDA = 'Oi, Cauê! Vim pelo site e queria tirar uma dúvida sobre a consultoria.';
  $$('[data-zap]').forEach(function (a) { a.href = zap(DUVIDA); });
  $('#zapFicha').textContent = D.whatsappVisivel;
  $('#zapRodape').textContent = 'WhatsApp ' + D.whatsappVisivel;
  var insta = 'https://www.instagram.com/' + D.instagram + '/';
  $$('[data-insta]').forEach(function (a) { a.href = insta; });
  $$('[data-arroba]').forEach(function (s) { s.textContent = '@' + D.instagram; });
  $('#instaRodape').textContent = 'Instagram @' + D.instagram;

  /* ------------------------------------------------------------ alunos */

  /* Sem loading="lazy" de propósito: a foto mora numa tela escondida, e o
     navegador só pedia a imagem quase um segundo depois de a tela abrir. A
     animação de revelar mostrava um quadro preto. São poucas fotos. */
  function foto(base, alt, rotulo, classe) {
    return '<figure class="' + classe + '"><div class="foto-corte">' +
      '<img src="img/' + base + '-480.webp" srcset="img/' + base + '-480.webp 480w, img/' + base + '.webp 735w"' +
      ' sizes="(min-width: 900px) 30vw, 46vw" width="480" height="640" alt="' + esc(alt) + '" decoding="async">' +
      '<span class="cobre-foto" aria-hidden="true"></span>' +
      '<span class="etiqueta' + (classe === 'caso-depois' ? ' sinal' : '') + '">' + rotulo + '</span>' +
      '</div></figure>';
  }

  $('#casos').innerHTML = D.alunos.map(function (a, i) {
    return '<article class="caso" data-caso="' + i + '">' +
      '<div class="caso-par">' +
        foto(a.antes, a.nome + ' antes da transformação', 'Antes', 'caso-antes') +
        foto(a.depois, a.nome + ' depois da transformação', 'Depois', 'caso-depois') +
      '</div>' +
      '<div class="caso-rodape">' +
        '<p class="caso-nome">' + esc(a.nome) + '</p>' +
        '<p class="caso-legenda">' + esc(a.tempo ? a.tempo + ' · ' + a.legenda : a.legenda) + '</p>' +
        '<button class="rever" type="button" data-rever="' + i + '">Ver de novo <i aria-hidden="true">↺</i></button>' +
      '</div>' +
    '</article>';
  }).join('');

  /* Tirar e pôr a classe no mesmo quadro não reinicia nada: o reflow no
     meio é o que faz a animação rodar de novo. */
  function animarCaso(el) {
    el.classList.remove('anima');
    void el.offsetWidth;
    el.classList.add('anima');
  }

  /* ------------------------------------------------------------ telas */

  var TELAS = ['inicio', 'sobre', 'metodo', 'alunos', 'comecar'];
  var NOMES = { inicio: 'Cauê Consultoria', sobre: 'Sobre mim', metodo: 'Método', alunos: 'Alunos', comecar: 'Começar' };
  var atual = null;
  var trocando = false;
  var corte = $('#corteTela');
  var carga = $('#carregando');

  function telaDoHash() {
    var h = (location.hash || '').replace('#', '');
    return TELAS.indexOf(h) >= 0 ? h : 'inicio';
  }

  function posicionarTraco() {
    var ativo = $('.nav a[aria-current="page"]');
    var traco = $('#navTraco');
    if (!ativo || !ativo.offsetWidth) { traco.style.setProperty('--w', '0px'); return; }
    traco.style.setProperty('--x', ativo.offsetLeft + 12 + 'px');
    traco.style.setProperty('--w', ativo.offsetWidth - 24 + 'px');
  }

  function mostrar(nome) {
    TELAS.forEach(function (t) {
      var s = $('#t-' + t);
      s.hidden = t !== nome;
      s.classList.remove('chegou');
    });
    $$('.nav [data-ir], .barra [data-ir]').forEach(function (a) {
      if (a.getAttribute('data-ir') === nome) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    atual = nome;
    window.scrollTo(0, 0);
    document.title = nome === 'inicio' ? NOMES.inicio : NOMES[nome] + ' · Cauê Consultoria';
    posicionarTraco();
    var tela = $('#t-' + nome);
    void tela.offsetWidth;
    tela.classList.add('chegou');
    if (nome === 'alunos') $$('.caso').forEach(animarCaso);
    if (nome === 'inicio') { acender(); passearComparador(); }
  }

  function focarTitulo() {
    var h = $('#t-' + atual + ' h1');
    if (h) h.focus({ preventScroll: true });
  }

  /* As duas animações são conduzidas por tempo, não por "animationend".
     Com a aba em segundo plano o navegador congela a animação e o evento
     não chega; por tempo, a tela troca do mesmo jeito. Foi o que a Doriie
     ensinou. */
  function cortar(trocar, pronto) {
    corte.className = 'corte-tela';
    void corte.offsetWidth;
    corte.className = 'corte-tela cobre';
    setTimeout(function () {
      trocar();
      corte.className = 'corte-tela descobre';
      setTimeout(function () { corte.className = 'corte-tela'; pronto(); }, 480);
    }, 400);
  }

  /* A tela escura nasce do botão apertado: o círculo abre a partir dele. */
  function carregar(origem, trocar, pronto) {
    var x = '50%', y = '50%';
    if (origem && origem.getBoundingClientRect) {
      var r = origem.getBoundingClientRect();
      if (r.width) { x = Math.round(r.left + r.width / 2) + 'px'; y = Math.round(r.top + r.height / 2) + 'px'; }
    }
    carga.style.setProperty('--x', x);
    carga.style.setProperty('--y', y);
    carga.className = 'carregando ativo entra';
    setTimeout(function () { carga.className = 'carregando ativo monta'; }, 440);
    setTimeout(trocar, 1300);
    setTimeout(function () { carga.className = 'carregando ativo monta sai'; }, 1360);
    setTimeout(function () { carga.className = 'carregando'; pronto(); }, 1900);
  }

  function ir(nome, gravar, origem) {
    if (TELAS.indexOf(nome) < 0) nome = 'inicio';
    if (nome === atual) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (trocando) return;
    trocando = true;
    if (gravar) history.pushState(null, '', '#' + nome);
    var trocar = function () { mostrar(nome); };
    var fim = function () { trocando = false; focarTitulo(); };
    if (nome === 'comecar') carregar(origem, trocar, fim);
    else cortar(trocar, fim);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-ir]');
    if (a) {
      /* Ctrl/Cmd+clique abre em outra aba, como qualquer link. */
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      ir(a.getAttribute('data-ir'), true, a);
      return;
    }
    var r = e.target.closest('[data-rever]');
    if (r) animarCaso($('.caso[data-caso="' + r.getAttribute('data-rever') + '"]'));
  });

  /* Voltar e avançar do navegador trocam de tela. Âncora que não é tela
     (o "pular para o conteúdo") não mexe em nada. */
  window.addEventListener('popstate', function () {
    var h = (location.hash || '').replace('#', '');
    if (!h) ir('inicio', false);
    else if (TELAS.indexOf(h) >= 0) ir(h, false);
  });

  window.addEventListener('resize', posicionarTraco);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(posicionarTraco);

  /* ------------------------------------------------------------ ficha */

  var escolha = { objetivo: 0, momento: -1 };

  function montarOpcoes(alvo, lista, nome) {
    var html = '<div class="opcoes">' + lista.map(function (o, i) {
      return '<label class="opcao"><input type="radio" name="' + nome + '" value="' + i + '"' +
        (nome === 'objetivo' && i === 0 ? ' checked' : '') + '><span>' + esc(o.rotulo) + '</span></label>';
    }).join('') + '</div>';
    $(alvo).insertAdjacentHTML('beforeend', html);
  }
  montarOpcoes('#objetivos', D.objetivos, 'objetivo');
  montarOpcoes('#momentos', D.momentos, 'momento');

  /* A mensagem sai escrita como gente escreve, e a pessoa vê o texto antes
     de mandar: ninguém gosta de apertar um botão sem saber o que ele diz
     em nome dela. */
  function mensagem() {
    var nome = $('#nome').value.trim().replace(/\s+/g, ' ');
    var partes = ['Oi, Cauê! Vim pelo site.'];
    if (nome) partes.push('Meu nome é ' + nome + '.');
    var frase = 'Meu objetivo é ' + D.objetivos[escolha.objetivo].frase;
    if (escolha.momento >= 0) frase += ', e hoje eu ' + D.momentos[escolha.momento].frase;
    partes.push(frase + '.');
    partes.push('Queria saber como funciona a consultoria.');
    return partes.join(' ');
  }

  var balao = $('#balao');
  function atualizarBalao(piscar) {
    balao.textContent = mensagem();
    if (piscar) { balao.classList.remove('pisca'); void balao.offsetWidth; balao.classList.add('pisca'); }
  }

  $('#ficha').addEventListener('change', function (e) {
    if (e.target.name === 'objetivo') escolha.objetivo = Number(e.target.value);
    if (e.target.name === 'momento') escolha.momento = Number(e.target.value);
    atualizarBalao(true);
  });
  $('#nome').addEventListener('input', function () { atualizarBalao(false); });
  $('#ficha').addEventListener('submit', function (e) {
    e.preventDefault();
    window.open(zap(mensagem()), '_blank', 'noopener');
  });
  atualizarBalao(false);

  /* ------------------------------------------------------------ "a imagem" */

  /* "Sua imagem fala antes de você." acende palavra por palavra no ritmo
     da rolagem. Parada, a frase já é legível; a luz só marca o passo. */
  var frase = $('[data-palavras]');
  var palavras = frase.textContent.trim().split(/\s+/);
  frase.setAttribute('aria-label', frase.textContent.trim());
  frase.innerHTML = palavras.map(function (p) { return '<span class="p" aria-hidden="true">' + esc(p) + '</span>'; }).join(' ');
  var spans = $$('.p', frase);

  var pedido = false;
  function acender() {
    pedido = false;
    if (atual !== 'inicio') return;
    var r = frase.getBoundingClientRect();
    var alto = window.innerHeight;
    /* 0 quando a frase entra por baixo, 1 quando chega a um terço da tela. */
    var t = (alto - r.top) / (alto - alto / 3);
    var n = Math.max(0, Math.min(spans.length, Math.round(t * spans.length)));
    spans.forEach(function (s, i) { s.classList.toggle('acesa', i < n); });
  }
  window.addEventListener('scroll', function () {
    if (!pedido) { pedido = true; requestAnimationFrame(acender); }
  }, { passive: true });

  /* ------------------------------------------------------------ comparador */

  /* Antes e depois do início: a linha vai onde a pessoa arrastar. Mouse e
     caneta arrastam na hora. No dedo, o arrasto só vale quando o movimento
     é mais de lado do que de pé: senão quem só queria rolar a página
     puxava a linha sem querer. */
  var comp = $('#comparar');
  var demo = null;
  var mexeu = false;
  var passeou = false;
  var posicionar = function () {};
  var pararDemo = function () { if (demo) { cancelAnimationFrame(demo); demo = null; } };

  if (comp) {
    var pegador = $('.comparar-pegador', comp);
    var pos = 50;
    var toque = null;
    var arrastando = false;

    posicionar = function (p) {
      pos = Math.max(0, Math.min(100, p));
      comp.style.setProperty('--pos', pos + '%');
      pegador.setAttribute('aria-valuenow', String(Math.round(pos)));
      pegador.setAttribute('aria-valuetext', Math.round(pos) + '% da foto mostra o antes');
    };
    var pelaTela = function (x) {
      var r = comp.getBoundingClientRect();
      if (r.width) posicionar((x - r.left) / r.width * 100);
    };
    var comecarArrasto = function (id) {
      arrastando = true;
      comp.classList.add('arrastando');
      try { comp.setPointerCapture(id); } catch (x) { /* ponteiro já solto */ }
    };
    var soltar = function () { arrastando = false; toque = null; comp.classList.remove('arrastando'); };

    comp.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      mexeu = true;
      pararDemo();
      if (e.pointerType === 'touch') { toque = { x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
      comecarArrasto(e.pointerId);
      pelaTela(e.clientX);
    });
    comp.addEventListener('pointermove', function (e) {
      if (toque && !arrastando && e.pointerId === toque.id) {
        var dx = Math.abs(e.clientX - toque.x), dy = Math.abs(e.clientY - toque.y);
        if (dx < 6 && dy < 6) return;
        if (dx > dy) comecarArrasto(e.pointerId);
        else { toque = null; return; }
      }
      if (arrastando) pelaTela(e.clientX);
    });
    comp.addEventListener('pointerup', function (e) {
      /* Toque rápido, sem arrastar: a linha vai até onde o dedo tocou. */
      if (toque && !arrastando) pelaTela(e.clientX);
      soltar();
    });
    comp.addEventListener('pointercancel', soltar);

    pegador.addEventListener('keydown', function (e) {
      var passo = e.shiftKey ? 10 : 4;
      var alvo = {
        ArrowLeft: pos - passo, ArrowDown: pos - passo, ArrowRight: pos + passo, ArrowUp: pos + passo,
        Home: 0, End: 100, PageDown: pos - 20, PageUp: pos + 20
      }[e.key];
      if (alvo === undefined) return;
      e.preventDefault();
      mexeu = true;
      pararDemo();
      posicionar(alvo);
    });

    posicionar(50);
  }

  /* Na primeira vez que o início aparece, depois que a foto abre, a linha
     passeia sozinha uma vez: vai pro antes, volta pro depois e para no
     meio. Mostra que dá pra mexer sem precisar escrever "arraste". Se a
     pessoa já tocou na foto, o passeio não acontece. */
  function passearComparador() {
    if (!comp || passeou) return;
    passeou = true;
    setTimeout(function () {
      if (mexeu || atual !== 'inicio') return;
      var pontos = [[0, 50], [950, 80], [2000, 22], [2850, 50]];
      var suave = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
      var t0 = null;
      var quadro = function (agora) {
        if (t0 === null) t0 = agora;
        var t = agora - t0, k = 1;
        while (k < pontos.length - 1 && t > pontos[k][0]) k++;
        var a = pontos[k - 1], b = pontos[k];
        var u = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
        posicionar(a[1] + (b[1] - a[1]) * suave(u));
        demo = t < pontos[pontos.length - 1][0] ? requestAnimationFrame(quadro) : null;
      };
      demo = requestAnimationFrame(quadro);
    }, 1500);
  }

  /* ------------------------------------------------------------ partida */

  mostrar(telaDoHash());
})();
