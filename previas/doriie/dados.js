/* Tudo que o site sabe sobre a Doriie.
 *
 * Preço é CENTAVO INTEIRO, sempre. Regra do projeto: a soma de float
 * acumula resíduo no carrinho, e o total que aparece na tela deixa de bater
 * com o que a Renata cobra. 1600 é R$ 16,00.
 *
 * Nada aqui foi inventado. Cardápio, preços e sabores vieram da Renata pelo
 * João em 28/09, lidos do cardápio digital dela. Onde falta informação, o
 * campo não existe, e o site se vira sem ele (ver dados/direcao.md).
 */
window.DORIIE = {
  whatsapp: '5517997548783',
  instagram: 'doriiesorveteria',
  endereco: { rua: 'Rua São João, 335', cidade: 'Ariranha', uf: 'SP', cep: '15960-000' },

  /* Todo dia, feriado também. Minutos desde a meia-noite. */
  horario: { abre: 8 * 60, fecha: 23 * 60 },

  /* Quem contou foi a Renata. A grafia com acento (Ícaro, Ítalo, Eloá) é a
     mais comum desses nomes; ela escreveu sem, pela pressa do WhatsApp.
     Está na lista de coisas a confirmar com ela. */
  familia: [
    ['D', 'Daniel'], ['O', 'Otavão'], ['R', 'Renata'],
    ['I', 'Ícaro'], ['I', 'Ítalo'], ['E', 'Eloá']
  ],

  categorias: [
    { id: 'montagens', nome: 'Taças e montagens', curto: 'Taças' },
    { id: 'acai', nome: 'Açaí e milk shake', curto: 'Açaí' },
    { id: 'quilo', nome: 'No quilo', curto: 'Quilo' },
    { id: 'bolos', nome: 'Bolo de sorvete', curto: 'Bolos' },
    { id: 'picole', nome: 'Picolé e skimo', curto: 'Picolé' }
  ],

  /* preco: valor fixo.  faixa: [min, max] quando o preço depende do sabor.
     variacoes: tamanhos com preço próprio.  porQuilo + pesos (em gramas):
     o valor é proporcional e o final é pela balança.
     sabor: de qual lista de sabores escolher.  varios: pode escolher mais
     de um sabor.  ate: no máximo quantos.  fotos: mais de uma foto do
     mesmo produto.
     Cestinha, banana split, copo da felicidade e bolo no copo levam sorvete:
     o João pediu (29/09) que o cliente escolha o sabor. O limite segue o
     que a descrição conta (três bolas, duas camadas de sorvete); a Renata
     confere no pedido que chega pelo WhatsApp. */
  itens: [
    { id: 'taca-suja', cat: 'montagens', nome: 'Taça suja', destaque: true,
      fotos: ['10-taca-suja-rosa', '11-taca-suja-amendoim', '13-taca-chocolate-bolinhas', '12-taca-creme-calda'],
      faixa: [2600, 3200], sabor: 'massa',
      desc: 'Taça alta coberta de calda escorrendo, com chantilly por cima. O valor vai de R$ 26 a R$ 32 conforme o sabor.' },

    { id: 'feijoada', cat: 'montagens', nome: 'Feijoada', destaque: true,
      fotos: ['04-feijoada-sobremesa'], preco: 3000,
      desc: 'Não é feijoada. É a sobremesa que imita uma, servida na tigela de barro.' },

    { id: 'copo-felicidade', cat: 'montagens', nome: 'Copo da felicidade', destaque: true,
      fotos: ['14-copo-da-felicidade-camadas'], preco: 1900, sabor: 'massa', varios: true, ate: 2,
      desc: 'Creme de avelã, bolo, sorvete, gotas de chocolate, mais sorvete e chantilly, em camadas.' },

    { id: 'banana-split', cat: 'montagens', nome: 'Banana split', destaque: true,
      fotos: ['08-banana-split'], preco: 2300, sabor: 'massa', varios: true, ate: 3,
      desc: 'Três bolas de sorvete com chantilly, calda e cereja.' },

    { id: 'cestinha', cat: 'montagens', nome: 'Cestinha recheada',
      fotos: ['07-cestinha-recheada'], preco: 1600, sabor: 'massa',
      desc: 'Cestinha de casquinha com sorvete, calda de chocolate, confeitos e cereja.' },

    { id: 'bolo-copo', cat: 'montagens', nome: 'Bolo de sorvete no copo',
      fotos: ['09-bolo-sorvete-copo'], preco: 1700, sabor: 'massa',
      desc: 'Bolo, sorvete e calda em camadas no copo, com chantilly por cima.' },

    { id: 'acai-copo', cat: 'acai', nome: 'Açaí no copo',
      fotos: ['06-acai-copo', '17-acai-copo-fachada'], sabor: 'acai',
      variacoes: [{ rot: '300 ml', preco: 1600 }, { rot: '500 ml', preco: 2100 }],
      desc: 'Escolha o açaí: natural, com leite Ninho, com avelã ou com creme de morango.' },

    { id: 'milkshake', cat: 'acai', nome: 'Milk shake',
      fotos: ['05-milkshake'], sabor: 'massa',
      variacoes: [{ rot: '300 ml', preco: 1600 }, { rot: '500 ml', preco: 1900 }],
      desc: 'Batido com o sorvete que você escolher.' },

    { id: 'sorvete-kg', cat: 'quilo', nome: 'Sorvete no quilo',
      fotos: ['16-potes-sorvete-acai', '19-casquinhas-quatro-maos'], sabor: 'massa', varios: true,
      porQuilo: 6500, pesos: [500, 1000, 1500, 2000],
      desc: 'Monte o pote com os sabores que quiser. O valor final é pelo peso na balança.' },

    { id: 'acai-kg', cat: 'quilo', nome: 'Açaí no quilo',
      fotos: ['26-acai-no-quilo', '18-acai-pote-salao'], sabor: 'acai',
      porQuilo: 6500, pesos: [500, 1000, 1500, 2000],
      desc: 'O mesmo açaí do copo, no pote. O valor final é pelo peso na balança.' },

    { id: 'bolo-kg', cat: 'bolos', nome: 'Bolo de sorvete', encomenda: true,
      fotos: ['20-bolo-de-sorvete', '21-bolo-prestigio', '22-bolo-morango-calda', '23-bolo-ouro-branco', '24-bolo-sortido-confeitos', '25-bolo-creme-castanhas'],
      porQuilo: 6500, pesos: [1000, 1500, 2000, 2500, 3000],
      desc: 'Vendido por quilo, sob encomenda. Conte o sabor e o dia que precisa, e a Doriie confirma pelo WhatsApp.' },

    { id: 'picole', cat: 'picole', nome: 'Picolé',
      fotos: ['01-picole-caixas'], preco: 300, sabor: 'picole',
      desc: '33 sabores, entre fruta e ao leite.' },

    { id: 'skimo', cat: 'picole', nome: 'Skimo tradicional',
      fotos: ['03-skimo-tradicional'], preco: 500,
      desc: 'O clássico, coberto de chocolate.' },

    { id: 'skimo-recheado', cat: 'picole', nome: 'Skimo recheado',
      fotos: ['02-skimo-recheado'], preco: 600, sabor: 'skimo',
      desc: 'Dez recheios, do prestígio ao brigadeiro.' },

    { id: 'moreninha', cat: 'picole', nome: 'Moreninha',
      fotos: ['15-moreninha'], preco: 700,
      desc: 'O picolé de casquinha.' }
  ],

  /* A parede do início: as fotos que correm, na ordem. Picolé em embalagem
     de fábrica (Skimo, Moreninha) fica só no cardápio. No máximo duas
     taças sujas: três seguidas com o mesmo nome parecia repetição. */
  vitrine: [
    '10-taca-suja-rosa', '04-feijoada-sobremesa', '08-banana-split', '06-acai-copo',
    '14-copo-da-felicidade-camadas', '22-bolo-morango-calda', '07-cestinha-recheada', '13-taca-chocolate-bolinhas',
    '05-milkshake', '09-bolo-sorvete-copo', '11-taca-suja-amendoim', '19-casquinhas-quatro-maos',
    '02-skimo-recheado', '12-taca-creme-calda'
  ],

  /* As que se revezam no quadro da seção "A casa": fotos de loja e de
     balcão, diferentes das da parede do topo, pra não repetir. */
  casa: [
    '18-acai-pote-salao', '16-potes-sorvete-acai', '17-acai-copo-fachada',
    '19-casquinhas-quatro-maos', '01-picole-caixas'
  ],

  /* Legenda só quando a foto deixa o sabor claro (tem a embalagem do doce
     em cima, ou a fruta inteira). As outras ficam sem nome: melhor calado
     que chutando o sabor de um bolo que a gente não provou. */
  legendasBolo: {
    '21-bolo-prestigio': 'Prestígio',
    '22-bolo-morango-calda': 'Morango',
    '23-bolo-ouro-branco': 'Ouro Branco'
  },

  /* Lista da Renata. Só a grafia foi acertada (condesado, amendoin, fundue)
     e "musse" virou "mousse" em todas, pra não aparecer escrito de dois
     jeitos na mesma tela. */
  sabores: {
    massa: {
      nome: 'Sorvete', desc: 'massa, ao leite',
      lista: ['Flocos', 'Ninho com morango', 'Ameixa', 'Uva', 'Céu azul', 'Kinder ovo', 'Oreo',
        'Bombom de morango', 'Mousse de uva', 'Blueberry', 'Sonho de ninho', 'Ninho', 'Abacaxi suíço',
        'Morango', 'Floresta branca', 'Sensação', 'Lakatella', 'Torta de limão', 'Doriie',
        'Ninho trufado', 'Coco Malásia', 'Pistache', 'Mousse de maracujá', 'Iogurte com amarena',
        'Mamão', 'Abacaxi ao caramelo', 'Doce de leite folhado', 'Camafeu', 'Cheesecake com goiabada',
        'Maçã verde', 'Ouro branco', 'Torta de ninho', 'Doce de leite', 'Milho', 'Bala baiana',
        'Torta de morango', 'Ninho avelã', 'Choconinho', 'Charge', 'Kit Kat', 'Ferreiro', 'Red velvet',
        'Frappuccino', 'Floresta negra', 'Fondue', 'Caribe', 'Chocotela', 'Ovomaltine']
    },
    agua: { nome: 'Sorvete de água', desc: 'sem leite', lista: ['Limão', 'Tamarindo'] },
    picoleFruta: {
      nome: 'Picolé de fruta', desc: 'R$ 3',
      lista: ['Caju', 'Groselha', 'Melancia', 'Abacaxi', 'Limão', 'Goiaba', 'Laranja', 'Maçã verde',
        'Tangerina', 'Tamarindo', 'Uva', 'Maracujá']
    },
    picoleLeite: {
      nome: 'Picolé ao leite', desc: 'R$ 3',
      lista: ['Doce de leite', 'Leitinho', 'Milho verde', 'Mousse de maracujá', 'Limão suíço', 'Creme',
        'Morango', 'Ameixa', 'Coco branco', 'Mamão', 'Nata', 'Abacate', 'Amendoim', 'Ninho morango',
        'Leite condensado', 'Blue ice', 'Abacaxi suíço', 'Chocolate', 'Melão', 'Jaboticaba', 'Red velvet']
    },
    skimo: {
      nome: 'Skimo', desc: 'tradicional R$ 5, recheado R$ 6',
      lista: ['Tradicional', 'Abacaxi suíço', 'Limão suíço', 'Prestígio', 'Ferreiro', 'Chokito',
        'Morango', 'Sensação', 'Brigadeiro', 'Crocante', 'Maracujá']
    },
    acai: {
      nome: 'Açaí', desc: 'no copo ou no quilo',
      lista: ['Açaí natural', 'Açaí com leite Ninho', 'Açaí com avelã', 'Açaí com creme de morango']
    }
  }
};
