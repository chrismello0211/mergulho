# Jogador guloso que enxerga especiais: a cada jogada escolhe, entre as trocas válidas e os especiais que dá pra disparar,
# a ação que limpa mais peças (contando a reação em cadeia dos especiais). Mede quantos pontos saem em m jogadas.
import sys
from playwright.sync_api import sync_playwright
modo=int(sys.argv[1]); mx=int(sys.argv[2]); K=int(sys.argv[3])      # modo 0 = jogadas e metas naturais da fase; senão, força m jogadas
src=open('/home/claude/mergulho/repo/index.html',encoding='utf-8').read()
A='const espera = ms => new Promise(r => setTimeout(r, ms));'; assert A in src
arq='/tmp/ba/rapido_enig%d.html'%modo
open(arq,'w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 3)));'))
JOGA="""async(m)=>{
  const f=faseAtual();if(m>0)J.mov=m;const inicio=J.mov;let feitas=0,tent=0;
  const livre=async()=>{for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,10));};
  const tamanho=conj=>{const be=bonusEspeciais,ep=efeitosPendentes.length;try{expandir(conj,null);}catch(e){}const n=conj.size;bonusEspeciais=be;efeitosPendentes.length=ep;return n;};
  while(!J.fim&&J.mov>0&&tent<40){tent++;await livre();let melhor=null,nota=-1;
    for(let r=0;r<H;r++)for(let c=0;c<W;c++){const p=grid[r][c];
      if(p&&p.sp){const n=tamanho(new Set([chave(r,c)]))+.5;if(n>nota){nota=n;melhor={t:'fogo',r:r,c:c};}}
      for(const [dr,dc] of [[0,1],[1,0]]){const r2=r+dr,c2=c+dc;if(r2>=H||c2>=W)continue;const a=grid[r][c],b=grid[r2][c2];if(!a||!b||a.bau||b.bau)continue;
        if(!criaCombo(r,c,r2,c2))continue;grid[r][c]=b;grid[r2][c2]=a;const cells=new Set();
        for(const co of acharCorridas())for(let k=0;k<co.len;k++)cells.add(co.dir==='h'?chave(co.r,co.c+k):chave(co.r+k,co.c));
        const n=tamanho(cells)+Math.random()*.01;grid[r][c]=a;grid[r2][c2]=b;if(n>nota){nota=n;melhor={t:'troca',r:r,c:c,r2:r2,c2:c2};}}}
    if(!melhor)break;
    if(melhor.t==='fogo')await disparaEspecial({r:melhor.r,c:melhor.c});else await tentaTroca({r:melhor.r,c:melhor.c},{r:melhor.r2,c:melhor.c2});
    feitas++;await livre();}
  for(let k=0;k<250&&(!J.fim||J.ocupado);k++)await new Promise(r=>setTimeout(r,20));
  await new Promise(r=>setTimeout(r,400));
  return {pontos:J.pontos,marcas:f.marcas.slice(),mov:inicio,feitas:feitas,especiaisNoInicio:0};}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    erros=[];pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file://'+arq);pg.wait_for_timeout(1200)
    pg.evaluate("()=>{fechaCartao();filaCartoes.length=0;prog.max=1000;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-99';prog.leve=true;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:1,portal:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}")
    niveis=pg.evaluate("""(mx)=>{const l=[];for(let i=44;i<900;i++)if((i+1)%100&&fase(i).enigma)l.push(i);const o=[];for(let j=0;j<mx&&l.length;j++)o.push(l[Math.floor(j*l.length/mx)]);return [...new Set(o)];}""",mx)
    todos=[];estrelas=[0,0,0];n=0
    for i in niveis:
        pts=[]
        for g in range(K):
            pg.evaluate("(i)=>{fechaCartao();limpaPartida();abreFase(i,true);}",i);pg.wait_for_timeout(220)
            for _ in range(4):
                if pg.evaluate("!!document.querySelector('#veu.aberto')"):pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}");pg.wait_for_timeout(120)
            r=pg.evaluate(JOGA,modo);pts.append(r['pontos']);todos.append(r['pontos']);n+=1
            for k in range(3):
                if r['pontos']>=r['marcas'][k]:estrelas[k]+=1
        print('fase',str(i+1).rjust(4),'| jogadas',r['mov'],'| metas',r['marcas'],'| pontos',sorted(pts),flush=True)
    t=sorted(todos);q=lambda p:t[min(len(t)-1,int(p*(len(t)-1)+.5))]
    print('QUANTIS (p20,p35,p50,p65,p80,p92):',[q(x) for x in (.2,.35,.5,.65,.8,.92)],'| min',t[0],'máx',t[-1])
    if modo==0:print('com as metas de hoje, o jogador guloso faz: 1ª estrela %d%% | 2ª estrela %d%% | 3ª estrela %d%% das partidas'%tuple(round(x/n*100) for x in estrelas))
    print('erros:',erros[:2] or 'nenhum')
    b.close()
