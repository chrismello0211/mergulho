from playwright.sync_api import sync_playwright
import os
URL = 'file:///home/claude/mergulho/repo/index.html'
OUT = '/home/claude/mergulho/shots/'; os.makedirs(OUT, exist_ok=True)
erros = []
integro = """()=>{let b=0;for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(!grid[r][c])b++;
  const ids=new Set();for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(grid[r][c])ids.add(String(grid[r][c].id));
  return {pecas:document.querySelectorAll('.peca').length,buracos:b,
          orfas:[...document.querySelectorAll('.peca')].filter(e=>!ids.has(e.dataset.id)).length};}"""

def joga(pg, n, espera=260):
    for _ in range(n):
        if pg.evaluate("J.fim"): break
        j = pg.evaluate("()=>achaJogada()")
        if not j: break
        pg.evaluate("async(j)=>{await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]})}", j)
        pg.wait_for_timeout(espera)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
    pg.on('pageerror', lambda e: erros.append('PAGEERROR: ' + str(e)))
    pg.on('console', lambda m: erros.append('CONSOLE: ' + m.text) if m.type == 'error' and '403' not in m.text else None)
    pg.goto(URL); pg.wait_for_timeout(1300)
    pg.evaluate("()=>{fechaCartao();prog.max=60;prog.dia=hoje();for(let m=0;m<5;m++)prog.vistos[m]=true;salvaProg();}")

    # ── BAÚ ────────────────────────────────────────────────
    pg.evaluate("abreFase(9)"); pg.wait_for_timeout(900)
    print('aviso do baú aparece:', pg.evaluate("!!document.querySelector('#veu.aberto')"))
    pg.screenshot(path=OUT + 'b-aviso.png')
    pg.click('[data-ac="comeca"]'); pg.wait_for_timeout(600)
    print('HUD:', pg.evaluate("document.querySelector('#objetivo').innerText.replace(/\\n/g,' ')"),
          '| fundo marcado:', pg.evaluate("document.querySelectorAll('.casa.fundo').length"),
          '| mesa com-bau:', pg.evaluate("mesa.classList.contains('com-bau')"))
    joga(pg, 4, 700)
    print('baús na tela:', pg.evaluate("()=>{let n=0;for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(grid[r][c]&&grid[r][c].bau)n++;return n;}"),
          '| entregues:', pg.evaluate("J.bauFeito"))
    pg.screenshot(path=OUT + 'b-bau.png')
    # empurrar baú de lado gasta jogada
    pos = pg.evaluate("()=>{for(let r=0;r<H;r++)for(let c=0;c<W-1;c++)if(grid[r][c]&&grid[r][c].bau)return [r,c];return null;}")
    if pos:
        mov0 = pg.evaluate("J.mov")
        pg.evaluate("async(p)=>{await tentaTroca({r:p[0],c:p[1]},{r:p[0],c:p[1]+1})}", pos)
        pg.wait_for_timeout(1400)
        print('empurrou o baú: jogada gasta =', mov0 - pg.evaluate("J.mov") == 1,
              '| baú andou =', pg.evaluate("(p)=>!!(grid[p[0]][p[1]+1]&&grid[p[0]][p[1]+1].bau)", pos))
    joga(pg, 26, 620)
    pg.wait_for_timeout(1500)
    print('fim da fase de baú:', pg.evaluate("[J.bauFeito, J.fim, document.querySelector('#cartao h3')?.textContent]"), pg.evaluate(integro))
    pg.screenshot(path=OUT + 'b-fim-bau.png')

    # ── ALGA QUE VOLTA ─────────────────────────────────────
    pg.evaluate("()=>{fechaCartao();prog.vistos.cresce=false;abreFase(11);}"); pg.wait_for_timeout(1000)
    print('aviso da alga:', pg.evaluate("document.querySelector('#cartao h3')?.textContent"))
    pg.click('[data-ac="comeca"]'); pg.wait_for_timeout(500)
    total0 = pg.evaluate("J.papelTotal")
    marcou = 0
    for _ in range(14):
        joga(pg, 1, 700)
        if pg.evaluate("document.querySelectorAll('.casa.vai-crescer').length"): marcou += 1
    print('avisos de crescimento vistos:', marcou, '| total de camadas', total0, '→', pg.evaluate("J.papelTotal"),
          '| cobertas agora:', pg.evaluate("casasCobertas(papel)"))
    pg.screenshot(path=OUT + 'b-alga.png')

    # ── DESAFIO DA SEMANA ──────────────────────────────────
    pg.evaluate("()=>{fechaCartao();tela('tela-inicio');mostraDesafio();}"); pg.wait_for_timeout(600)
    pg.screenshot(path=OUT + 'b-desafio-cartao.png')
    pg.click('[data-ac="desafio"]'); pg.wait_for_timeout(1200)
    tab1 = pg.evaluate("grid.map(l=>l.map(p=>p.t).join('')).join('|')")
    print('desafio abriu:', pg.evaluate("[J.desafio, J.mov, desafioAtual.semana, document.getElementById('fase-nome').textContent]"))
    pg.screenshot(path=OUT + 'b-desafio.png')
    joga(pg, 3, 600)
    pg.evaluate("()=>{abreDesafio();}"); pg.wait_for_timeout(1200)
    tab2 = pg.evaluate("grid.map(l=>l.map(p=>p.t).join('')).join('|')")
    print('mesma semente dá o mesmo tabuleiro:', tab1 == tab2)
    pg.evaluate("()=>{J.pontos=18500;J.mov=0;confere();}"); pg.wait_for_timeout(1500)
    print('cartão do desafio:', pg.evaluate("document.querySelector('#cartao h3')?.textContent"),
          '| melhor salvo:', pg.evaluate("prog.desafio.melhor"), '| botão compartilhar:', pg.evaluate("!!document.querySelector('[data-ac=\\'compartilha\\']')"))
    pg.screenshot(path=OUT + 'b-desafio-fim.png')
    # jogo normal depois do desafio volta ao sorteio comum
    pg.evaluate("()=>{fechaCartao();abreFase(3);}"); pg.wait_for_timeout(900)
    print('voltou ao normal:', pg.evaluate("[J.desafio===undefined||J.desafio===false, rnd===Math.random]"))

    # ── fases geradas com baú e alga ───────────────────────
    ruins = []
    for i in [61, 64, 70, 77, 88, 95, 120]:
        pg.evaluate("(i)=>abreFase(i)", i); pg.wait_for_timeout(450)
        ok = pg.evaluate("""()=>({p:document.querySelectorAll('.peca').length,esperado:(()=>{let n=0;for(let c=0;c<W;c++)n+=H-TOPO[c];return n;})(),casas:TOPO.reduce((a,t)=>a+(H-t),0),j:!!achaJogada(),c:acharCorridas().length,
                                  t:faseAtual().obj.tipo,cr:!!faseAtual().obj.cresce})""")
        if ok['p'] != ok.get('esperado', 56) or not ok['j'] or ok['c'] != 0: ruins.append((i + 1, ok))
    print('fases geradas conferidas:', ruins or 'todas certas')
    b.close()
print('erros:', erros or 'nenhum')
