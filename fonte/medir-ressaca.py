import sys
from playwright.sync_api import sync_playwright
tipo=sys.argv[1]; mx=int(sys.argv[2]); K=int(sys.argv[3])
src=open('/home/claude/mergulho/repo/index.html',encoding='utf-8').read()
A='const espera = ms => new Promise(r => setTimeout(r, ms));'; assert A in src
open('/tmp/ba/rapido_%s.html'%tipo,'w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 3)));'))
JOGA="""async()=>{
  const f=faseAtual(),tp=f.obj.tipo,oferta=f.mov;J.mov=oferta*2;let gastas=0,tent=0;
  const livre=async()=>{for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,10));};
  while(!J.fim&&J.mov>0&&tent<500){tent++;await livre();
    const rem=[0,0,0,0,0,0];if(tp==='coletar')for(const [c,n] of f.obj.itens)rem[c]=Math.max(0,n-(J.coletado[c]||0));
    let melhor=null,nota=-1e9;
    for(let r=0;r<H;r++)for(let c=0;c<W;c++)for(const [dr,dc] of [[0,1],[1,0]]){
      const r2=r+dr,c2=c+dc;if(r2>=H||c2>=W)continue;const a=grid[r][c],b=grid[r2][c2];if(!a||!b||a.bau||b.bau||a.esponja||b.esponja)continue;
      if(!criaCombo(r,c,r2,c2))continue;
      grid[r][c]=b;grid[r2][c2]=a;const runs=acharCorridas();const cells=new Set();
      for(const co of runs)for(let k=0;k<co.len;k++)cells.add(co.dir==='h'?co.r*W+(co.c+k):(co.r+k)*W+co.c);
      let s=0;for(const k of cells){const y=Math.floor(k/W),x=k%W;const q=grid[y][x];
        if(tp==='coletar')s+=(q&&rem[q.t]>0)?3:1;else if(tp==='papel')s+=(papel[y][x]>0)?4:.5;else s+=1;}
      if(cells.size>=4)s+=(tp==='especiais'?6:2);s+=Math.random()*.01;
      grid[r][c]=a;grid[r2][c2]=b;if(s>nota){nota=s;melhor=[r,c,r2,c2];}}
    if(!melhor)break;
    const antes=J.mov;await tentaTroca({r:melhor[0],c:melhor[1]},{r:melhor[2],c:melhor[3]});await livre();
    const acabou=faltaPrincipal()===0;if(J.mov<antes||acabou)gastas++;
    if(acabou)return {ok:true,usadas:gastas,mov:oferta};}
  return {ok:false,usadas:gastas,mov:oferta};}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    erros=[];pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///tmp/ba/rapido_%s.html'%tipo);pg.wait_for_timeout(1200)
    pg.evaluate("()=>{fechaCartao();filaCartoes.length=0;prog.max=1000;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-11';prog.leve=true;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}")
    niveis=pg.evaluate("""([tp,mx])=>{const l=[];for(let i=48;i<900;i++){const f=fase(i);if(f.ressaca&&f.obj.tipo===tp)l.push(i);}const o=[];for(let j=0;j<mx&&l.length;j++)o.push(l[Math.floor(j*l.length/mx)]);return [...new Set(o)];}""",[tipo,mx])
    acc={'COM':[], 'SEM':[]}
    for i in niveis:
        linha=[]
        for cond in ('COM','SEM'):
            res=[]
            for g in range(K):
                pg.evaluate("([i,off])=>{const f=fase(i);if(f.ressacaOrig===undefined)f.ressacaOrig=f.ressaca;f.ressaca=off?0:f.ressacaOrig;limpaPartida();abreFase(i,true);}",[i,cond=='SEM']);pg.wait_for_timeout(200)
                for _ in range(4):
                    if pg.evaluate("!!document.querySelector('#veu.aberto')"):pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}");pg.wait_for_timeout(120)
                res.append(pg.evaluate(JOGA))
            gan=sorted(r['usadas'] for r in res if r['ok']);dentro=sum(1 for r in res if r['ok'] and r['usadas']<=r['mov'])
            acc[cond].extend(r['usadas'] if r['ok'] else 999 for r in res)
            linha.append('%s: dentro %d/%d, mediana %s'%(cond,dentro,K,gan[len(gan)//2] if gan else '-'))
        print('fase',str(i+1).rjust(4),'oferece',pg.evaluate("(i)=>fase(i).mov",i),'|',' | '.join(linha),flush=True)
    for cond in ('COM','SEM'):
        t=sorted(acc[cond]);q=lambda p:t[min(len(t)-1,int(p*(len(t)-1)+.5))]
        print('RESULTADO %s %s: precisam p50=%s p80=%s (999=não venceu) | travam %d%%'%(tipo,cond,q(.5),q(.8),round(sum(1 for x in t if x==999)/len(t)*100)))
    print('erros:',erros[:2] or 'nenhum')
    b.close()
