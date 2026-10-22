# O aviso do "modo leve" chega sozinho e não pode cobrir o cartão de começar a fase (a fase ficava trancada, sem botão pra iniciar).
# modo 'antigo' reproduz o que o código antigo fazia (escrever por cima); modo 'novo' usa avisoModoLeve().
import sys
from playwright.sync_api import sync_playwright
modo=sys.argv[1]
AVISO_ANTIGO="""()=>cartao('<h3>Liguei o modo leve</h3><p>aviso</p><div class="bts"><button class="bt" data-ac="fecha">Beleza</button></div>')"""
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-99';prog.leve=false;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,esponja:1,ressaca:1,portal:1};for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
falhou=[]
def ok(nome,cond,extra=''):
    print(('OK   ' if cond else 'FALHA'),nome,extra)
    if not cond: falhou.append(nome)
estado="()=>({aberto:document.getElementById('veu').classList.contains('aberto'),titulo:(document.querySelector('#cartao h3')||{}).textContent||null,temComeca:!!document.querySelector('#cartao [data-ac=\"comeca\"]'),ocupado:J.ocupado})"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    erros=[]; pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///home/claude/mergulho/repo/index.html'); pg.wait_for_timeout(1300); pg.evaluate(INIT)
    # 1) o aviso chega com o cartão de começar a fase aberto
    pg.evaluate("()=>{fechaCartao();limpaPartida();abreFase(45,true);}"); pg.wait_for_timeout(900)
    s0=pg.evaluate(estado); ok('o cartão de começar a fase está aberto (com o botão de começar)',s0['aberto'] and s0['temComeca'],s0)
    pg.evaluate(AVISO_ANTIGO if modo=='antigo' else "()=>avisoModoLeve()"); pg.wait_for_timeout(2200)
    s1=pg.evaluate(estado)
    ok('o aviso NÃO cobriu o cartão de começar a fase',s1['temComeca'],s1)
    if s1['temComeca']:
        vistos=[]
        pg.evaluate("()=>document.querySelector('#cartao [data-ac=\"comeca\"]').click()")
        for _ in range(8):
            pg.wait_for_timeout(1800)
            s=pg.evaluate(estado)
            if not s['aberto']: continue
            vistos.append(s['titulo'])
            if s['titulo']=='Liguei o modo leve': break
            pg.evaluate("()=>{const b=document.querySelector('#cartao [data-ac=\"comeca\"]')||document.querySelector('#cartao .bt');if(b)b.click();}")
        ok('o aviso só apareceu DEPOIS dos cartões de começar a fase, e uma vez só',len(vistos)>=2 and vistos[-1]=='Liguei o modo leve' and vistos.count('Liguei o modo leve')==1,vistos)
        pg.evaluate("()=>document.querySelector('#cartao .bt').click()"); pg.wait_for_timeout(500)
    else:
        pg.evaluate("()=>{const b=document.querySelector('#cartao .bt');if(b)b.click();}"); pg.wait_for_timeout(600)   # a pessoa toca em "Beleza"
    s3=pg.evaluate(estado)
    r=pg.evaluate("""async()=>{window.faltaObjetivo=()=>99;J.mov=999;const j=achaJogada();const m0=J.mov;await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,10));return {gastou:m0-J.mov};}""")
    ok('depois de fechar tudo, dá pra jogar',r['gastou']==1,{'estado':s3,'jogada':r})
    # 2) sem nenhum cartão aberto, o aviso aparece direto
    if modo!='antigo':
        pg.evaluate("()=>{fechaCartao();}"); pg.wait_for_timeout(400); pg.evaluate("()=>avisoModoLeve()"); pg.wait_for_timeout(700)
        s4=pg.evaluate(estado); ok('sem cartão aberto, o aviso aparece na hora',s4['aberto'] and s4['titulo']=='Liguei o modo leve',s4)
    ok('erros de página',not erros,erros[:2])
    b.close()
print('\nRESULTADO (%s):'%modo,'TUDO CERTO' if not falhou else 'FALHOU: '+'; '.join(falhou))
