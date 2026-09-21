# Fontes do Mergulho

O `index.html` da raiz é montado a partir desta pasta. Para mexer no jogo, edite aqui e remonte:

    python montar.py

Depois suba o `VERSAO` no `sw.js` (por exemplo `v2026.09.21` para `v2026.09.22`). Sem isso, quem já instalou continua vendo a versão antiga do cache.

## O que tem em cada arquivo

| Arquivo | Conteúdo |
|---|---|
| `cabeca.html` | `<head>` e todo o CSS: cenário de cada mundo, tabuleiro, cobertura, HUD, mapa, cartões |
| `corpo.html` | Marcação das três telas (início, mapa, jogo) e do cartão |
| `pwa-cabeca.html` | Links do manifest e dos ícones |
| `pwa-registro.html` | Registro do service worker |
| `m1.js` | Mundos, as 30 fases, padrões de cobertura, progresso salvo e som |
| `pecas.js` | Desenho das 6 peças nos 5 mundos, e dos especiais (correnteza, bolha, pérola) |
| `cena.js` | Fundo de cada mundo (raios, chão, bolhas, neve marinha, fagulhas) e a troca de mundo |
| `js2.js` | Motor do combinar 3: corridas, especiais, combos, gravidade, embaralho |
| `m3.js` | Desenho do tabuleiro, limpeza, cascata e toque |
| `m4.js` | HUD, fim de fase, cartões, mapa e arranque |
| `calib.js` | Bot de calibragem das fases |
| `PLANO.md` | Decisões de design (paleta, tipografia, princípios) |

## Desafio da semana e ranking

O desafio usa a semana como semente (`chaveSemana()` em `m1.js`), então o tabuleiro e a ordem das peças novas saem iguais para todo mundo. O recorde fica no aparelho.

Para ligar o ranking entre amigos, preencha a URL do Realtime Database em `m4.js`:

    const Placar = { url: 'https://seu-projeto-default-rtdb.firebaseio.com', ... }

Ele grava em `/mergulho/<semana>/<id>.json` e lê `/mergulho/<semana>.json`. As regras do banco precisam permitir escrita nesse caminho. Sem a URL, o ranking fica só local e nada é enviado.

## Mexeu numa fase?

As jogadas e as marcas de estrela de cada fase estão em `m1.js`, na lista `FASES`. Elas foram medidas com um bot que joga 80 partidas por fase. Se mudar jogadas ou objetivo, meça de novo (precisa do Node):

    python calibrar.py x fixo

A coluna `marcas` que sair é o que vai na fase.
