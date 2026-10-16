import sys
from playwright.sync_api import sync_playwright
tipo = sys.argv[1]; max_niveis = int(sys.argv[2]); jogos = int(sys.argv[3]); alto = int(sys.argv[4]) if len(sys.argv) > 4 else 0
src = open('/home/claude/mergulho/repo/index.html', encoding='utf-8').read()
A = 'const espera = ms => new Promise(r => setTimeout(r, ms));'
assert A in src
open('/tmp/ba/rapido_%s.html' % tipo,'w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 2)));'))
JOGA = """async()=>{
  const f=faseAtual(), tp=f.obj.tipo, oferta=f.mov; J.mov=oferta*2; const inicio=J.mov; let tentativas=0, gastas=0;
  const alvos=()=>{const l=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++){const p=grid[r][c];
    if(tp==='lixo'&&p&&p.lixo)l.push([r,c]); if(tp==='presos'&&p&&p.gaiola)l.push([r,c]); if(tp==='bolhas'&&p&&p.bolha)l.push([r,c]);
    if(tp==='coral'&&J.coral&&J.coral[r][c]===1)l.push([r,c]); if(tp==='perolas'&&J.perolas&&J.perolas[r][c]>0)l.push([r,c]);}return l;};
  const livre=async()=>{for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,10));};
  while(!J.fim&&J.mov>0&&tentativas<400){
    tentativas++; await livre();
    const A=alvos();let melhor=null,nota=1e9,tam=0;
    for(let r=0;r<H;r++)for(let c=0;c<W;c++)for(const [dr,dc] of [[0,1],[1,0]]){
      const r2=r+dr,c2=c+dc;if(r2>=H||c2>=W)continue;const a=grid[r][c],b=grid[r2][c2];if(!a||!b||a.bau||b.bau)continue;
      if(!criaCombo(r,c,r2,c2))continue;
      grid[r][c]=b;grid[r2][c2]=a;const runs=acharCorridas();const cells=new Set();
      for(const co of runs)for(let k=0;k<co.len;k++)cells.add(co.dir==='h'?co.r*W+(co.c+k):(co.r+k)*W+co.c);
      grid[r][c]=a;grid[r2][c2]=b;
      let d=99;for(const k of cells){const y=Math.floor(k/W),x=k%W;for(const [ay,ax] of A)d=Math.min(d,Math.max(Math.abs(y-ay),Math.abs(x-ax)));}
      if(d<nota||(d===nota&&cells.size>tam)){nota=d;tam=cells.size;melhor=[r,c,r2,c2];}
    }
    if(!melhor)break;
    const antes=J.mov; await tentaTroca({r:melhor[0],c:melhor[1]},{r:melhor[2],c:melhor[3]}); await livre();
    const acabou=faltaPrincipal()===0;
    if(J.mov<antes||acabou)gastas++;   /* conta a jogada que de fato aconteceu (na vitória o jogo zera as que sobram) */
    if(acabou)return {ok:true,usadas:gastas,mov:oferta,falta:0};
  }
  return {ok:false,usadas:gastas,mov:oferta,falta:faltaPrincipal()};}"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    erros=[]; pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///tmp/ba/rapido_%s.html' % tipo); pg.wait_for_timeout(1200)
    pg.evaluate("()=>{fechaCartao();filaCartoes.length=0;prog.max=1000;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-6';prog.leve=true;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}")
    niveis=pg.evaluate("""([tp,mx,alto])=>{const l=[];for(let i=30;i<900;i++){if((i+1)%100===0)continue;const f=fase(i),o=f.obj;if(o.tipo!==tp||o.corrente||o.mancha)continue;l.push([i,f.mov]);}
      const pick=(a,k)=>{const o=[];for(let j=0;j<k&&a.length;j++)o.push(a[Math.floor(j*a.length/k)]);return o;};
      if(alto){const altos=l.filter(x=>x[1]>=44),baixos=l.filter(x=>x[1]<44);const na=Math.min(Math.ceil(mx/2),altos.length);return pick(altos,na).concat(pick(baixos,mx-na));}
      return pick(l,mx);}""",[tipo,max_niveis,alto])
    TODOS=[]; DENTRO=[]; OFERTAS=[]
    for i,mov in niveis:
        res=[]
        for g in range(jogos):
            pg.evaluate("(i)=>{limpaPartida();abreFase(i,true);}", i); pg.wait_for_timeout(200)
            for _ in range(4):
                if pg.evaluate("!!document.querySelector('#veu.aberto')"): pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}"); pg.wait_for_timeout(120)
            res.append(pg.evaluate(JOGA))
        gan=sorted(r['usadas'] for r in res if r['ok']); dentro=sum(1 for r in res if r['ok'] and r['usadas']<=mov)
        TODOS.extend(r['usadas'] if r['ok'] else 999 for r in res); DENTRO.append((dentro,len(res))); OFERTAS.append(mov)
        print('fase',str(i+1).rjust(4),'oferece',str(mov).rjust(2),'| dentro da oferta',dentro,'de',len(res),'| venceram (com o dobro de jogadas)',len(gan),'| precisaram, mediana:',gan[len(gan)//2] if gan else '-',flush=True)
    t=sorted(TODOS); q=lambda p:t[min(len(t)-1,int(p*(len(t)-1)+.5))]
    ofs=sorted(OFERTAS)
    print('RESULTADO %s: oferta mediana %d | precisam p50=%s p80=%s p90=%s (999 = nem com o dobro) | vencem dentro da oferta: %d%% | travam: %d%%' % (tipo, ofs[len(ofs)//2], q(.5), q(.8), q(.9), round(sum(d for d,_ in DENTRO)/sum(n for _,n in DENTRO)*100), round(sum(1 for x in t if x==999)/len(t)*100)))
    print('erros:', erros[:2] or 'nenhum')
    b.close()
