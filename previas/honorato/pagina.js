/* Honorato — versão clara conduzida por foto.
   Tela de abertura, troca de seção com cortina, carrossel de nenhum,
   revelação e sombra da barra. */
(function () {
  'use strict';

  window.__vivo = true;

  var raiz    = document.documentElement;
  var topo    = document.getElementById('topo');
  var cortina = document.getElementById('cortina');
  var cargaTxt = document.getElementById('carga-txt');

  /* -----------------------------------------------------------------
     Tela de abertura

     Sai quando as fontes e as imagens da primeira tela chegam, ou em
     1,8s, o que vier antes. O teto existe porque esperar carregamento
     sem limite é como a tela de abertura vira tela de espera: se a rede
     do cliente estiver ruim, ele fica olhando a logo em vez do site.
     ----------------------------------------------------------------- */
  var saiu = false;
  function abrir() {
    if (saiu) return;
    saiu = true;
    cortina.classList.remove('abertura');
    cortina.classList.remove('ver');
  }

  var prontos = [];
  if (document.fonts && document.fonts.ready) prontos.push(document.fonts.ready);
  var capa = document.querySelector('.capa > img');
  if (capa && !capa.complete) {
    prontos.push(new Promise(function (r) {
      capa.addEventListener('load', r, { once: true });
      capa.addEventListener('error', r, { once: true });
    }));
  }
  Promise.all(prontos).then(function () { setTimeout(abrir, 260); });
  setTimeout(abrir, 1800);

  /* -----------------------------------------------------------------
     Sombra da barra
     ----------------------------------------------------------------- */
  var solto = false;
  function barra() {
    var agora = window.scrollY > 40;
    if (agora !== solto) { topo.classList.toggle('solto', agora); solto = agora; }
  }
  barra();
  window.addEventListener('scroll', barra, { passive: true });

  /* -----------------------------------------------------------------
     Troca de seção
     ----------------------------------------------------------------- */
  var abas    = [].slice.call(document.querySelectorAll('.menu a[role="tab"]'));
  var paineis = [].slice.call(document.querySelectorAll('.painel'));
  var PRIMEIRA = paineis.length ? paineis[0].id : '';
  var trocando = false;
  var ENTRA = 260, SEGURA = 240;

  function arrastarAba(a) {
    var t = a.parentNode;
    var meio = a.offsetLeft - t.clientWidth / 2 + a.offsetWidth / 2;
    if (Math.abs(t.scrollLeft - meio) > 40) t.scrollTo({ left: meio, behavior: 'smooth' });
  }

  /* Repõe a revelação de forma SÍNCRONA, com leitura de offsetHeight no
     meio. Dentro de requestAnimationFrame também funcionaria, e sumiria:
     rAF é estrangulado em aba oculta, e o painel abriria carregado e
     invisível. */
  function replantar(sec) {
    var alvos = [].slice.call(sec.querySelectorAll('.rv, .esc'));
    alvos.forEach(function (el) { el.classList.remove('in'); });
    alvos.forEach(function (el) { void el.offsetHeight; el.classList.add('in'); });
  }

  function mostrar(id, quieto) {
    var alvo = document.getElementById(id);
    if (!alvo) return;
    paineis.forEach(function (p) {
      var meu = p === alvo;
      p.classList.toggle('ativa', meu);
      if (meu) p.removeAttribute('tabindex'); else p.setAttribute('tabindex', '-1');
    });
    abas.forEach(function (a) {
      var meu = a.hash.slice(1) === id;
      a.classList.toggle('aqui', meu);
      a.setAttribute('aria-selected', meu ? 'true' : 'false');
      if (meu) arrastarAba(a);
    });
    /* A capa é da PRIMEIRA seção, não de todas.

       Ela é um bloco de tela inteira que ficava acima de qualquer painel:
       trocava de aba, rolava um dedo para cima e era a mesma
       "barba, cabelo, hora marcada" de novo. Se cada seção é uma página,
       a capa é a capa da primeira, não um cabeçalho repetido. */
    raiz.classList.toggle('com-capa', id === PRIMEIRA);

    if (!quieto) replantar(alvo);
  }

  function trocar(id) {
    if (trocando) return;
    var alvo = document.getElementById(id);
    if (!alvo || alvo.classList.contains('ativa')) return;
    trocando = true;

    var aba = document.getElementById('aba-' + id);
    if (cargaTxt) cargaTxt.textContent = aba ? aba.textContent.trim() : 'Barbearia';
    cortina.classList.add('ver');

    setTimeout(function () {
      mostrar(id);

      /* Vai para o PAINEL, sempre. A barra fica no topo do documento,
         então rolar "até a barra" seria rolar até zero, e zero é a capa:
         a pessoa trocaria de seção e veria a mesma capa. */
      var altura = topo ? topo.getBoundingClientRect().height : 0;
      window.scrollTo({ top: Math.max(0, alvo.offsetTop - altura - 8), behavior: 'auto' });
      barra();
      if (history.replaceState) history.replaceState(null, '', '#' + id);

      setTimeout(function () {
        cortina.classList.remove('ver');
        trocando = false;
      }, SEGURA);
    }, ENTRA);
  }

  abas.forEach(function (a) {
    a.addEventListener('click', function (ev) { ev.preventDefault(); trocar(a.hash.slice(1)); });
    a.addEventListener('keydown', function (ev) {
      var i = abas.indexOf(a), n = null;
      if (ev.key === 'ArrowRight') n = abas[(i + 1) % abas.length];
      if (ev.key === 'ArrowLeft')  n = abas[(i - 1 + abas.length) % abas.length];
      if (ev.key === 'Home')       n = abas[0];
      if (ev.key === 'End')        n = abas[abas.length - 1];
      if (!n) return;
      ev.preventDefault(); n.focus(); trocar(n.hash.slice(1));
    });
  });

  /* o "a seguir" no fim de cada painel, e o botão da capa */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-adiante]');
    if (!a) return;
    var destino = a.getAttribute('data-adiante');
    var el = destino && document.getElementById(destino);
    if (!el || !el.classList.contains('painel')) return;
    ev.preventDefault();
    trocar(destino);
  });

  /* na partida, a capa aparece só se o painel de abertura for o primeiro */
  raiz.classList.add('com-capa');

  var pedido = location.hash.slice(1);
  var inicial = pedido && document.getElementById(pedido);
  if (inicial && inicial.classList.contains('painel')) mostrar(pedido, true);
  window.addEventListener('hashchange', function () {
    var h = location.hash.slice(1);
    var el = h && document.getElementById(h);
    if (el && el.classList.contains('painel')) trocar(h);
  });

  /* -----------------------------------------------------------------
     Revelação
     ----------------------------------------------------------------- */
  var alvos = [].slice.call(document.querySelectorAll('.rv, .esc'));
  if (!('IntersectionObserver' in window)) {
    alvos.forEach(function (a) { a.classList.add('in'); });
  } else {
    var olho = new IntersectionObserver(function (ent, obs) {
      ent.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
    alvos.forEach(function (a) { olho.observe(a); });

    /* O observador pode existir, ser criado sem erro e nunca disparar.
       Já aconteceu neste projeto, e o resultado é a página abrindo com
       tudo invisível. */
    setTimeout(function () {
      if (!alvos.some(function (a) { return a.classList.contains('in'); })) {
        raiz.classList.remove('anima');
        alvos.forEach(function (a) { a.classList.add('in'); });
      }
    }, 2600);
  }
})();
