# Teste do arrasto com toques reais: nenhuma peça pode ficar fora do lugar depois de um arrasto que não virou troca.
from playwright.sync_api import sync_playwright
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-12';prog.leve=false;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:1,portal:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
OFF="""()=>{const l=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++){const p=grid[r][c];if(!p)continue;const el=els.get(p.id);if(!el)continue;
  const a=el.getBoundingClientRect(),z=celulasBox.children[r*W+c].getBoundingClientRect();const d=Math.round(Math.hypot(a.left-z.left,a.top-z.top));
  if(d>2)l.push((p.esponja?'ESPONJA':'peça')+' ('+r+','+c+') desvio '+d+'px');}return l;}"""
falhou=[]; erros=[]
def confere(nome, valor):
    ok = not valor; print(('OK   ' if ok else 'FALHA'), nome, '' if ok else valor)
    if not ok: falhou.append(nome)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=False)
    pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///home/claude/mergulho/repo/index.html'); pg.wait_for_timeout(1300); pg.evaluate(INIT)
    pg.evaluate("()=>{limpaPartida();abreFase(827,true);}"); pg.wait_for_timeout(1000)
    for _ in range(4):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"): pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}"); pg.wait_for_timeout(450)
    pg.wait_for_timeout(700)
    cel=lambda r,c: pg.evaluate("([r,c])=>{const q=celulasBox.children[r*W+c].getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2,q.width];}",[r,c])
    r0,c0=pg.evaluate("()=>{for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(grid[r][c]&&grid[r][c].esponja)return [r,c];}")
    x,y,w=cel(r0,c0)
    for k in range(3):
        pg.mouse.move(x,y); pg.mouse.down(); pg.mouse.move(x+w*.18,y,steps=4); pg.wait_for_timeout(80); pg.mouse.move(x+w*.5,y,steps=3); pg.mouse.up(); pg.wait_for_timeout(450)
        confere('arrastar a esponja (%dª vez)'%(k+1), pg.evaluate(OFF))
    confere('a esponja continua no lugar', [] if pg.evaluate("([r,c])=>!!grid[r][c].esponja",[r0,c0]) else ['esponja saiu'])
    dr,dc=pg.evaluate("([r,c])=>[[0,-1],[0,1],[-1,0],[1,0]].find(([a,b])=>{const y=r+a,x=c+b;return y>=0&&y<H&&x>=0&&x<W&&grid[y][x]&&!grid[y][x].esponja;})",[r0,c0])
    px,py,_=cel(r0+dr,c0+dc)
    pg.mouse.move(px,py); pg.mouse.down(); pg.mouse.move(px-dc*w*.2,py-dr*w*.2,steps=4); pg.mouse.move(px-dc*w*.6,py-dr*w*.6,steps=4); pg.mouse.up(); pg.wait_for_timeout(700)
    confere('peça comum arrastada contra a esponja', pg.evaluate(OFF))
    pg.evaluate("async()=>{for(let k=0;k<200&&J.ocupado;k++)await new Promise(r=>setTimeout(r,10));}")
    qx,qy,qw=cel(3,0); pg.mouse.move(qx,qy); pg.mouse.down(); pg.mouse.move(qx-qw*.2,qy,steps=4); pg.mouse.move(qx-qw*.7,qy,steps=4); pg.mouse.up(); pg.wait_for_timeout(600)
    qx,qy,qw=cel(0,2); pg.mouse.move(qx,qy); pg.mouse.down(); pg.mouse.move(qx,qy-qw*.2,steps=4); pg.mouse.move(qx,qy-qw*.7,steps=4); pg.mouse.up(); pg.wait_for_timeout(600)
    confere('arrastar para fora da borda', pg.evaluate(OFF))
    qx,qy,qw=cel(4,3); pg.mouse.move(qx,qy); pg.mouse.down(); pg.mouse.move(qx+qw*.15,qy,steps=3); pg.wait_for_timeout(120); pg.mouse.up(); pg.wait_for_timeout(500)
    confere('soltar no meio do caminho', pg.evaluate(OFF))
    j=pg.evaluate("()=>achaJogada()"); m0=pg.evaluate("()=>J.mov")
    ax,ay,aw=cel(j[0],j[1]); bx,by,_=cel(j[2],j[3])
    pg.mouse.move(ax,ay); pg.mouse.down(); pg.mouse.move(ax+(bx-ax)*.4,ay+(by-ay)*.4,steps=4); pg.mouse.move(ax+(bx-ax)*.9,ay+(by-ay)*.9,steps=3); pg.mouse.up(); pg.wait_for_timeout(1800)
    confere('troca válida com o dedo (gasta 1 jogada)', [] if m0-pg.evaluate("()=>J.mov")==1 else ['não gastou 1 jogada'])
    confere('sem desvio depois da troca válida', pg.evaluate(OFF))
    N=pg.evaluate("()=>numLote(NOVIDADES_LOTES[0].id)")
    ate=lambda a,b: ','.join(str(x) for x in range(a,b,-1))          # a, a-1, ..., b+1 (as mais novas primeiro)
    esperado={'lote-%d'%(N-1):str(N),'lote-%d'%(N-3):ate(N,N-3),'lote-3':ate(N,N-6),'':ate(N,N-6),'lote-%d'%N:'nenhuma'}
    r={v:pg.evaluate("(v)=>{prog.viuNovidades=v;return lotesNovos().map(l=>l.id.replace('lote-','')).join(',')||'nenhuma';}",v) for v in esperado}
    confere('lotes de novidades por último visto (a mais nova é a %d)'%N, [] if r==esperado else [r])
    confere('erros de página', erros)
    b.close()
print('\nRESULTADO:', 'TUDO CERTO' if not falhou else 'FALHOU: '+', '.join(falhou))
