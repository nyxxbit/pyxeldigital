/* Tudo que o site sabe sobre a consultoria. Veio do Cauê, pelo João, em
   29/09/2026. Nada aqui é inventado: o que não foi passado (preço, tempo
   da transformação, depoimento) não existe no site até ele mandar. */
window.CAUE = {
  whatsapp: '5517997154026',
  whatsappVisivel: '(17) 99715-4026',
  instagram: '237caue',

  /* O que a pessoa escolhe em "Começar". Cada opção tem o rótulo do botão
     e o pedaço de frase que entra na mensagem do WhatsApp, pra ela sair
     escrita como gente e não como formulário. */
  objetivos: [
    { rotulo: 'Ganhar massa', frase: 'ganhar massa' },
    { rotulo: 'Perder gordura', frase: 'perder gordura' },
    { rotulo: 'Definir o corpo', frase: 'definir o corpo' },
    { rotulo: 'Ainda não sei', frase: 'mudar minha aparência, mas ainda não sei bem por onde começar' }
  ],
  momentos: [
    { rotulo: 'Nunca treinei', frase: 'nunca treinei' },
    { rotulo: 'Treino, mas não evoluo', frase: 'treino, mas não estou evoluindo' },
    { rotulo: 'Já treino há um tempo', frase: 'já treino há um tempo' }
  ],

  /* Antes e depois. O primeiro é o próprio Cauê. Aluno novo entra aqui,
     com as fotos em img/ (rodar img/preparar-imagens.js) e com autorização
     por escrito de quem aparece. `tempo` só se ele informar. */
  alunos: [
    { nome: 'Cauê', legenda: 'Mesma pessoa. Outra imagem.', antes: 'caue-antes', depois: 'caue-depois', tempo: '' }
  ]
};
