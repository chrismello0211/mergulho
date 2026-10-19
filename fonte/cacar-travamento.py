# Caça travamentos: roda as fases de uma parte do estresse global registrando por quais etapas cada jogada passa.
# Se o jogo ficar "ocupado" por mais de 6 s, mostra em qual etapa parou e o estado da tela.
import sys
from playwright.sync_api import sync_playwright
parte=int(sys.argv[1]); partes=int(sys.argv[2])
src=open('/home/claude/mergulho/repo/index.html',encoding='utf-8').read()
A='const espera = ms => new Promise(r => setTimeout(r, ms));'; assert A in src
open('/tmp/ba/rapido_trava%d.html'%parte,'w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 3)));'))
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=1100;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-12';prog.leve=false;prog.leveEscolhido=true;aplicaLeve();window.__limiteTravado=999999;prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:1,portal:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
TRACE="""()=>{window.__T=[];const nomes=['tentaTroca','tentaTrocaInterna','disparaEspecial','resolver','limpar','passoMestre','passoBau','passoBolha','passoRessaca','passoCrescer','confere','venceu','perdeu','estouroFinal','mostraCartaoFase','voaPerola','embaralha','animaTroca','espera'];
  for(const n of nomes){const o=window[n];if(typeof o!=='function'||o.__tr)continue;
    const w=function(...a){window.__T.push(n+'>');const r=o.apply(this,a);if(r&&typeof r.then==='function')return r.then(v=>{window.__T.push(n+'<');return v;},e=>{window.__T.push(n+'!');throw e;});window.__T.push(n+'<');return r;};w.__tr=1;window[n]=w;}
  window.__T.length=0;return nomes.filter(n=>typeof window[n]==='function').length;}"""
STRESS="""async()=>{window.faltaObjetivo=()=>99;J.mov=9999;if(J.tempoModo)J.tempoRestante=99999;const rel={feitas:0,travou:null};
  for(let m=1;m<=30&&!J.fim;m++){for(let k=0;k<400&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
    if(J.ocupado){rel.travou={antesDaJogada:m};break;}
    const j=achaJogada();if(!j)break;window.__T.length=0;const m0=J.mov;
    tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});
    for(let k=0;k<750&&(J.ocupado||J.mov===m0&&k<20);k++)await new Promise(r=>setTimeout(r,8));
    if(J.ocupado){rel.travou={naJogada:m,etapas:window.__T.slice(-14).join(' ')};break;}
    rel.feitas++;}
  if(rel.travou){const v=document.getElementById('veu');rel.travou.tela={cartaoAberto:v.classList.contains('aberto'),titulo:(document.querySelector('#cartao h3')||{}).textContent||null,fim:J.fim,escondida:document.hidden,regra:J.regra||null,cond:J.cond||null,tipo:faseAtual().obj.tipo};}
  return rel;}"""
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
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    erros=[]; pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///tmp/ba/rapido_trava%d.html'%parte); pg.wait_for_timeout(1200); pg.evaluate(INIT)
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
    achados=0
    for i,rot in meus:
        pg.evaluate("(i)=>{fechaCartao();limpaPartida();abreFase(i,true);}",i); pg.wait_for_timeout(450)
        fecha_cartoes(pg)
        pg.evaluate(TRACE)
        r=pg.evaluate(STRESS)
        if r['travou']:
            achados+=1; print('TRAVOU fase',i+1,rot,'|',r,flush=True)
        else: print('ok fase',i+1,rot,'jogadas',r['feitas'],flush=True)
    print('PARTE %d: %d fases, %d travamentos | erros de página: %s'%(parte,len(meus),achados,erros[:2] or 'nenhum'))
    b.close()
