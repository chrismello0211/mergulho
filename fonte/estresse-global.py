import sys
from playwright.sync_api import sync_playwright
parte=int(sys.argv[1]); partes=int(sys.argv[2])
src=open('/home/claude/mergulho/repo/index.html',encoding='utf-8').read()
A='const espera = ms => new Promise(r => setTimeout(r, ms));'; assert A in src
open('/tmp/ba/rapido_global%d.html'%parte,'w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 3)));'))
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=1100;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-99';prog.leve=false;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:1,portal:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
INV="""const inv=()=>{const p=[];const ids=new Set();for(let r=0;r<H;r++)for(let c=0;c<W;c++){const q=grid[r][c];
  if(temCasa(r,c)&&!q)p.push('vazio '+r+','+c);if(!q)continue;if(ids.has(q.id))p.push('id repetido');ids.add(q.id);if(q.chegou)p.push('chegou preso');
  const el=els.get(q.id);if(!el){p.push('sem elemento '+r+','+c);continue;}
  const m=/translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(el.style.transform);
  if(!m||Math.abs(+m[1]-c*CEL)>1||Math.abs(+m[2]-r*CEL)>1)p.push('fora do lugar '+r+','+c);}return p;};"""
def fecha_cartoes(pg):
    ocioso=0
    for _ in range(14):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"):
            ocioso=0
            pg.evaluate("""()=>{const b=document.querySelector('#cartao [data-ac="comeca"]')||document.querySelector('#cartao .bt');if(b)b.click();}""")
        else:
            ocioso+=1
            if ocioso>=3: break
        pg.wait_for_timeout(350)
erros=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    pg.on('pageerror',lambda e:erros.append('página: '+str(e)))
    pg.on('console',lambda m:erros.append('console: '+m.text) if m.type=='error' and 'ERR_' not in m.text and 'CORS' not in m.text and '403' not in m.text else None)
    pg.goto('file:///tmp/ba/rapido_global%d.html'%parte); pg.wait_for_timeout(1200); pg.evaluate(INIT)
    alvos=pg.evaluate("""()=>{const L=[];const tp=f=>f.obj.corrente?'corrente':f.obj.mancha?'mancha':f.obj.tipo;
      for(const t of ['pontos','coletar','papel','especiais','bau','presos','bolhas','corrente','mancha','ninho','perolas','lixo','coral','esponja']){
        let a=null,b=null;for(let i=40;i<900;i++){if((i+1)%100===0)continue;const f=fase(i);if(tp(f)!==t)continue;if(a===null)a=i;else if(b===null&&i>300){b=i;break;}}
        if(a!==null)L.push([a,t]);if(b!==null)L.push([b,t+' (2ª)']);}
      const um=(nome,fn)=>{for(let i=40;i<900;i++){if((i+1)%100!==0&&fn(i)){L.push([i,nome]);return;}}};
      um('RESSACA',i=>fase(i).ressaca);um('PORTAL',i=>fase(i).portal&&fase(i).obj.tipo==='coletar');um('PORTAL pontos',i=>fase(i).portal&&fase(i).obj.tipo==='pontos');
      um('RELÓGIO',i=>tempoDa(i)>0);um('ENIGMA',i=>fase(i).enigma);
      for(const i of [99,199,299,399,599,699,799,899,999])L.push([i,'MESTRE '+(i+1)]);
      return L;}""")
    meus=[x for k,x in enumerate(alvos) if k%partes==parte]
    if len(sys.argv)>3: meus=[[int(x),'MESTRE '+str(int(x)+1)] for x in sys.argv[3].split(',')]
    tj=0; tf=0
    for i,rot in meus:
        pg.evaluate("(i)=>{fechaCartao();limpaPartida();abreFase(i,true);}", i); pg.wait_for_timeout(450)
        fecha_cartoes(pg)
        r=pg.evaluate("async()=>{"+INV+"""window.faltaObjetivo=()=>99;J.mov=9999;if(J.tempoModo)J.tempoRestante=99999;const falhas=[];let m=0;
          for(m=1;m<=24&&!J.fim;m++){for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));const j=achaJogada();if(!j)break;
            await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<400&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
            const pr=inv();if(pr.length)falhas.push('jogada '+m+': '+pr.slice(0,2).join(' | '));}
          await new Promise(r=>setTimeout(r,1100));
          return {jogadas:m-1,falhas:falhas.slice(0,2),fantasmas:document.querySelectorAll('.portal-fantasma').length,ocupado:J.ocupado};}""")
        tj+=r['jogadas']; tf+=len(r['falhas'])
        print(('fase %4d'%(i+1)), rot.ljust(16), 'jogadas',str(r['jogadas']).rjust(2),'| falhas:',r['falhas'] or 'nenhuma', '' if not r['fantasmas'] else '| FANTASMAS %d'%r['fantasmas'], '' if not r['ocupado'] else '| TRAVOU', flush=True)
    print('PARTE %d: %d jogadas, %d falhas | erros de página/console: %s'%(parte,tj,tf,erros[:4] or 'nenhum'))
    b.close()
