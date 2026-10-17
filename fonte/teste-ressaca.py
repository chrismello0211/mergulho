from playwright.sync_api import sync_playwright
from PIL import Image
src=open('/home/claude/mergulho/repo/index.html',encoding='utf-8').read()
A='const espera = ms => new Promise(r => setTimeout(r, ms));'
assert A in src
open('/tmp/ba/rapido_ress.html','w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 3)));'))
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-11';prog.leve=false;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:%d};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
INV="""const inv=()=>{const p=[];const ids=new Set();for(let r=0;r<H;r++)for(let c=0;c<W;c++){const q=grid[r][c];
  if(temCasa(r,c)&&!q)p.push('vazio '+r+','+c);if(!q)continue;if(ids.has(q.id))p.push('id repetido');ids.add(q.id);
  const el=els.get(q.id);if(!el){p.push('sem elemento '+r+','+c);continue;}
  const m=/translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(el.style.transform);
  if(!m||Math.abs(+m[1]-c*CEL)>1||Math.abs(+m[2]-r*CEL)>1)p.push('fora do lugar '+r+','+c);}return p;};"""
def abre(pg,i,cartoes=None):
    pg.evaluate("(i)=>{fechaCartao();limpaPartida();abreFase(i,true);}", i); pg.wait_for_timeout(500)
    for _ in range(5):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"):
            if cartoes is not None: cartoes.append(pg.evaluate("()=>document.querySelector('#cartao h3')?.textContent"))
            pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}"); pg.wait_for_timeout(300)
    pg.wait_for_timeout(300)
erros=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    pg.on('pageerror',lambda e:erros.append('página: '+str(e)))
    pg.on('console',lambda m:erros.append('console: '+m.text) if m.type=='error' and 'ERR_' not in m.text and 'CORS' not in m.text and '403' not in m.text else None)
    pg.goto('file:///tmp/ba/rapido_ress.html'); pg.wait_for_timeout(1200)
    pg.evaluate(INIT % 0)
    niveis=pg.evaluate("""()=>{const o={};for(let i=48;i<900;i++){const f=fase(i);if(f.ressaca&&!o[f.obj.tipo])o[f.obj.tipo]=i;}return o;}""")
    print('fases de teste por tipo:', {k:v+1 for k,v in niveis.items()})
    # 1) aviso na primeira vez + estado inicial
    c=[]; i0=niveis['coletar']; abre(pg,i0,c)
    print('1) cartões ao abrir:', c)
    print('   estado:', pg.evaluate("()=>({periodo:faseAtual().ressaca,ativo:J.ressaca,linha:J.ressacaLinha,faltam:J.ressacaIn,casasMarcadas:document.querySelectorAll('.casa.ressaca').length,etiqueta:document.querySelector('.ressaca-tag')?.innerText})"))
    pg.screenshot(path='/tmp/ress1.png')
    # 2) o deslize em si
    r=pg.evaluate("async()=>{"+INV+"""const r=J.ressacaLinha,dir=J.ressacaDir;const antes=grid[r].map(p=>p.id),papelAntes=JSON.stringify(papel);
      await deslizaFileira(r,dir);const depois=grid[r].map(p=>p.id);const esperado=antes.map((_,c)=>antes[(c-dir+W)%W]);
      return {direcao:dir>0?'→':'←',deslizeCerto:JSON.stringify(depois)===JSON.stringify(esperado),coberturaIntacta:JSON.stringify(papel)===papelAntes,problemas:inv()};}""")
    print('2) deslize:', r)
    # 3) bloqueios
    abre(pg,i0)
    r=pg.evaluate("""async()=>{const per=J.ressaca,l0=J.ressacaLinha;window.faltaObjetivo=()=>99;J.mov=999;
      grid[l0][3].lixo=1;atualizaEl(grid[l0][3]);
      for(let k=0;k<per;k++)await passoRessaca();const trocou=J.ressacaUltima>=0&&J.ressacaUltima!==l0;
      for(let r=0;r<H;r++){const q=grid[r][0];if(q&&!q.lixo){q.lixo=1;atualizaEl(q);}}
      const ant=J.ressacaUltima;for(let k=0;k<per;k++)await passoRessaca();
      return {linhaPresaFoiEvitada:trocou,todasBloqueadas_semDeslize:J.ressacaUltima===ant,semFileira:J.ressacaLinha,ressacaAindaLigada:J.ressaca};}""")
    print('3) bloqueios:', r)
    # 4) estresse de invariantes: 4 tipos, 40 jogadas cada
    for tp,i in niveis.items():
        abre(pg,i)
        r=pg.evaluate("async()=>{"+INV+"""window.faltaObjetivo=()=>99;J.mov=9999;const falhas=[];let desl=0,ult=J.ressacaUltima;const per=J.ressaca;
          for(let m=1;m<=40&&!J.fim;m++){for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
            const j=achaJogada();if(!j)break;await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
            const pr=inv();if(pr.length)falhas.push('jogada '+m+': '+pr.slice(0,2).join(' | '));if(J.ressacaUltima!==ult){desl++;ult=J.ressacaUltima;}}
          return {tipo:faseAtual().obj.tipo,periodo:per,deslizes:desl,jogadas:9999-J.mov,falhas:falhas.slice(0,3),ressacaLigada:J.ressaca,marcadas:document.querySelectorAll('.casa.ressaca').length};}""")
        print('4) estresse', tp.ljust(9), r)
    # 5) disparar especial conta como jogada da maré
    abre(pg,i0)
    r=pg.evaluate("""async()=>{window.faltaObjetivo=()=>99;J.mov=999;let a=null;for(let r=H-1;r>=0&&!a;r--)for(let c=0;c<W;c++){const q=grid[r][c];if(q&&!q.sp&&!q.bau&&!q.lixo){a=[r,c];break;}}
      grid[a[0]][a[1]].sp=LH;atualizaEl(grid[a[0]][a[1]]);const in0=J.ressacaIn,m0=J.mov;await disparaEspecial({r:a[0],c:a[1]});
      for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));return {faltavam:in0,faltam:J.ressacaIn,jogadasGastas:m0-J.mov,ocupado:J.ocupado};}""")
    print('5) especial tocado:', r)
    # 6) salvar e retomar
    abre(pg,i0)
    pg.evaluate("async()=>{window.faltaObjetivo=()=>99;for(let m=0;m<2;m++){const j=achaJogada();await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<200&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));}salvaPartida();}")
    antes=pg.evaluate("()=>({ativo:J.ressaca,faltam:J.ressacaIn,linha:J.ressacaLinha,dir:J.ressacaDir})")
    pg.reload(); pg.wait_for_timeout(1200); pg.evaluate(INIT % 1)
    pg.evaluate("(i)=>{fechaCartao();filaCartoes.length=0;abreFase(i);}", i0); pg.wait_for_timeout(700)
    pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"retoma\"]');if(b)b.click();}"); pg.wait_for_timeout(1200)
    depois=pg.evaluate("()=>({ativo:J.ressaca,faltam:J.ressacaIn,linha:J.ressacaLinha,dir:J.ressacaDir,marcadas:document.querySelectorAll('.casa.ressaca').length,etiqueta:document.querySelector('.ressaca-tag')?.innerText})")
    print('6) salvar/retomar: antes', antes, '| depois', depois)
    print('ERROS:', erros[:5] or 'nenhum')
    b.close()
