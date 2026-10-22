# Notificações do Mergulho

Três passos. Só o primeiro é no console do Firebase; o resto é copiar e colar no terminal.

## 1. Três valores do console (projeto mergulho-c6230)
1. Engrenagem → **Configurações do projeto** → aba **Geral** → "Seus apps". Se não houver um app da Web (ícone `</>`), crie um (nome "Mergulho", sem Hosting). Copie `messagingSenderId` e `appId`.
2. Mesma tela → aba **Cloud Messaging** → "Configuração da Web" → **Certificados push da Web** → **Gerar par de chaves**. Copie a chave (a pública).
3. Mande os três pro Claude, ou cole no `fonte/cabeca.html`, no bloco `window.MERGULHO_NUVEM` (`remetente`, `app`, `vapid`), e rode `python3 fonte/montar.py`.

Enquanto os três estiverem vazios, o jogo funciona igual e o botão de Notificações nem aparece.

## 2. Publicar as funções (uma vez só)
Precisa do Node 20 no computador.

    npm install -g firebase-tools
    firebase login
    cd funcoes/functions
    npm install
    npm test                     # 83 verificações, roda sem internet
    cd ..
    firebase deploy --only functions --project mergulho-c6230

Na primeira vez o Firebase pede pra ativar APIs (Cloud Functions, Cloud Build, Artifact Registry, Eventarc, Cloud Scheduler, Pub/Sub): aceite. Se o primeiro deploy der erro de permissão, espere uns minutos e rode de novo (acontece na 2ª geração).

| função | quando roda | o que faz |
|---|---|---|
| avisaPedidoDeVida | alguém grava em /mergulho/pedidos/{cardume}/{uid} | avisa o resto do cardume (no máximo 1 aviso a cada 30 min por pedido) |
| avisaVidaRecebida | alguém grava em /mergulho/presentes/{uid}/{de} | avisa quem recebeu |
| avisaVidasCheias | a cada 10 min | avisa quem ficou com as 5 vidas (uma vez por recarga) |
| lembraBauDoDia | todo dia às 19h (Brasília) | lembra quem ainda não pegou o baú |
| avisaEventoDoFimDeSemana | sábado às 9h | avisa que o evento começou |

Cada pessoa escolhe nos Ajustes do jogo quais desses quer receber.

## 3. Regras do banco
O jogo grava em `/mergulho/avisos/{uid}`. Se as regras do Realtime Database já deixam quem está logado gravar em `/mergulho`, não precisa fazer nada. Se não, acrescente dentro de "mergulho":

    "avisos": { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } }

As funções usam acesso de administrador e não dependem das regras.

## Quem joga no iPhone
iOS 16.4 ou mais novo, com o jogo instalado: no Safari, Compartilhar → **Adicionar à Tela de Início**, e abrir o jogo por esse ícone. Depois: Ajustes → Notificações → Ligar. No Android funciona direto no Chrome.

## Custo
Nessa escala (poucos jogadores), funções e envios ficam dentro da cota gratuita do plano Blaze. O Cloud Scheduler dá 3 agendamentos grátis por conta de cobrança, e usamos exatamente 3 (vidas, baú, evento); se a conta já tiver outro, cada um a mais custa uns US$ 0,10 por mês.
