from playwright.sync_api import sync_playwright
from PIL import Image
src=open('/home/claude/mergulho/repo/index.html',encoding='utf-8').read()
A='const espera = ms => new Promise(r => setTimeout(r, ms));'; assert A in src
open('/tmp/ba/rapido_portal.html','w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 3)));'))
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-11';prog.leve=false;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:1,portal:%d};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
INV="""const inv=()=>{const p=[];const ids=new Set();for(let r=0;r<H;r++)for(let c=0;c<W;c++){const q=grid[r][c];
  if(temCasa(r,c)&&!q)p.push('vazio '+r+','+c);if(!q)continue;if(ids.has(q.id))p.push('id repetido');ids.add(q.id);if(q.chegou)p.push('chegou preso '+r+','+c);
  const el=els.get(q.id);if(!el){p.push('sem elemento '+r+','+c);continue;}
  const m=/translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(el.style.transform);
  if(!m||Math.abs(+m[1]-c*CEL)>1||Math.abs(+m[2]-r*CEL)>1)p.push('fora do lugar '+r+','+c);}return p;};"""
def abre(pg,i,cartoes=None):
    pg.evaluate("(i)=>{fechaCartao();limpaPartida();abreFase(i,true);}", i); pg.wait_for_timeout(500)
    for _ in range(5):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"):
            if cartoes is not None: cartoes.append(pg.evaluate("()=>document.querySelector('#cartao h3')?.textContent"))
            pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}"); pg.wait_for_timeout(300)
    pg.wait_for_timeout(400)
erros=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    pg.on('pageerror',lambda e:erros.append('página: '+str(e)))
    pg.on('console',lambda m:erros.append('console: '+m.text) if m.type=='error' and 'ERR_' not in m.text and 'CORS' not in m.text and '403' not in m.text else None)
    pg.goto('file:///tmp/ba/rapido_portal.html'); pg.wait_for_timeout(1200)
    pg.evaluate(INIT % 0)
    niveis=pg.evaluate("()=>{const o={};for(let i=52;i<900;i++){const f=fase(i);if(f.portal&&!o[f.obj.tipo])o[f.obj.tipo]=i;}return o;}")
    print('fases de teste:', {k:v+1 for k,v in niveis.items()})
    i0=niveis['coletar']; c=[]; abre(pg,i0,c)
    print('1) cartões:',c)
    print('   estado:',pg.evaluate("()=>{const m=document.querySelector('.marca-casa.portal-entra'),n=document.querySelector('.marca-casa.portal-sai');const dist=(mk,r,cc)=>{const q=mk.getBoundingClientRect(),z=celulasBox.children[r*W+cc].getBoundingClientRect();return Math.round(Math.abs(q.left-z.left)+Math.abs(q.top-z.top));};return {portal:J.portal,entradas:document.querySelectorAll('.marca-casa.portal-entra').length,saidas:document.querySelectorAll('.marca-casa.portal-sai').length,desalinhamentoPx:[dist(m,H-1,J.portal[0]),dist(n,TOPO[J.portal[1]],J.portal[1])],etiqueta:document.querySelector('.portal-tag')?.innerText};}"))
    pg.screenshot(path='/tmp/pt1.png')
    # 2) transporte em si (12 tentativas)
    r=pg.evaluate("async()=>{"+INV+"""const R={viagens:0,tipoCerto:0,entradaMudou:0,falhas:[]};const a=J.portal[0],b=J.portal[1],topo=TOPO[b];
      for(let k=0;k<12;k++){const ent=grid[H-1][a];ent.t=k%6;ent.sp=0;atualizaEl(ent);
        const velho=grid[topo][b];const ev=els.get(velho.id);if(ev){ev.remove();els.delete(velho.id);}grid[topo][b]=null;
        const v0=J.portalViagens||0,tIn=ent.t;gravidade();const novo=grid[topo][b];const viajou=(J.portalViagens||0)===v0+1;
        if(viajou)R.viagens++;if(novo&&novo.t===tIn)R.tipoCerto++;if(grid[H-1][a].t!==tIn)R.entradaMudou++;
        if(!novo||!viajou||novo.entrando!==topo||!novo.chegou)R.falhas.push('tentativa '+k);
        sincroniza();const pr=inv();if(pr.length)R.falhas.push('inv '+k+': '+pr[0]);}
      return R;}""")
    print('2) transporte (12x):',r)
    # 3) sem vaga na saída, sem viagem; 4) peça presa não viaja; 5) especial viaja
    r=pg.evaluate("async()=>{"+INV+"""const R={};const a=J.portal[0],b=J.portal[1];const outra=[0,1,2,3,4,5,6].find(c=>c!==a&&c!==b&&c!==J.portal[0]);
      let v0=J.portalViagens||0;const v=grid[TOPO[outra]][outra];const ev=els.get(v.id);if(ev){ev.remove();els.delete(v.id);}grid[TOPO[outra]][outra]=null;gravidade();sincroniza();
      R.vagaEmOutraColuna_semViagem=(J.portalViagens||0)===v0;
      v0=J.portalViagens||0;const ent=grid[H-1][a];ent.gaiola=1;const v2=grid[TOPO[b]][b];const e2=els.get(v2.id);if(e2){e2.remove();els.delete(v2.id);}grid[TOPO[b]][b]=null;gravidade();
      R.presaNaoViaja=(J.portalViagens||0)===v0&&grid[TOPO[b]][b].entrando!==TOPO[b];sincroniza();ent.gaiola=0;atualizaEl(ent);
      const ent2=grid[H-1][a];ent2.t=2;ent2.sp=LH;atualizaEl(ent2);const v3=grid[TOPO[b]][b];const e3=els.get(v3.id);if(e3){e3.remove();els.delete(v3.id);}grid[TOPO[b]][b]=null;gravidade();
      const nv=grid[TOPO[b]][b];R.especialViaja=nv.sp===LH&&nv.t===2;sincroniza();R.classeDoEspecial=els.get(nv.id).className.includes('esp-lh');R.problemas=inv();return R;}""")
    print('3-5) guardas:',r)
    # 6) estresse de invariantes
    for tp,i in niveis.items():
        abre(pg,i)
        r=pg.evaluate("async()=>{"+INV+"""window.faltaObjetivo=()=>99;J.mov=9999;const falhas=[];
          for(let m=1;m<=40&&!J.fim;m++){for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));const j=achaJogada();if(!j)break;
            await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
            const pr=inv();if(pr.length)falhas.push('jogada '+m+': '+pr.slice(0,2).join(' | '));}
          return {tipo:faseAtual().obj.tipo,jogadas:9999-J.mov,viagens:J.portalViagens||0,falhas:falhas.slice(0,3),portalLigado:!!J.portal,fantasmasRestantes:document.querySelectorAll('.portal-fantasma').length};}""")
        print('6) estresse',tp.ljust(9),r)
    # 7) região com regras que prendem peças (gelo) + portal
    abre(pg,i0)
    r=pg.evaluate("async()=>{"+INV+"""J.regra='gelo';window.faltaObjetivo=()=>99;J.mov=9999;const falhas=[];let presas=0;
      for(let m=1;m<=40&&!J.fim;m++){for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));const j=achaJogada();if(!j)break;
        await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
        const pr=inv();if(pr.length)falhas.push('jogada '+m+': '+pr.slice(0,2).join(' | '));}
      for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(grid[r][c]&&grid[r][c].gaiola)presas++;
      return {falhas:falhas.slice(0,3),peçasPresas:presas,viagens:J.portalViagens||0};}""")
    print('7) com regra do gelo:',r)
    # 8) especial tocado e estouro direto da entrada
    abre(pg,i0)
    r=pg.evaluate("async()=>{"+INV+"""window.faltaObjetivo=()=>99;J.mov=999;const a=J.portal[0];let s=null;for(let r=H-2;r>=0&&!s;r--)for(let c=0;c<W;c++){const q=grid[r][c];if(q&&!q.sp&&c!==a){s=[r,c];break;}}
      grid[s[0]][s[1]].sp=LH;atualizaEl(grid[s[0]][s[1]]);await disparaEspecial({r:s[0],c:s[1]});for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
      const p1=inv();await limpar(new Set([chave(H-1,a),chave(H-1,(a+1)%W)]),null);await resolver(null,null);const p2=inv();return {depoisDoEspecial:p1,depoisDeEstourarAEntrada:p2,ocupado:J.ocupado};}""")
    print('8) especial e estouro da entrada:',r)
    # 9) salvar e retomar
    abre(pg,i0)
    pg.evaluate("async()=>{window.faltaObjetivo=()=>99;for(let m=0;m<3;m++){const j=achaJogada();await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<200&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));}salvaPartida();}")
    antes=pg.evaluate("()=>({portal:J.portal})")
    pg.reload(); pg.wait_for_timeout(1200); pg.evaluate(INIT % 1)
    pg.evaluate("(i)=>{fechaCartao();filaCartoes.length=0;abreFase(i);}", i0); pg.wait_for_timeout(700)
    pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"retoma\"]');if(b)b.click();}"); pg.wait_for_timeout(1300)
    print('9) salvar/retomar: antes',antes,'| depois',pg.evaluate("()=>({portal:J.portal,aneis:document.querySelectorAll('.marca-casa.portal-entra,.marca-casa.portal-sai').length,etiqueta:document.querySelector('.portal-tag')?.innerText})"))
    print('ERROS:',erros[:5] or 'nenhum')
    b.close()
Image.open('/tmp/pt1.png').crop((0,150,393,790)).save('/home/claude/mergulho/shots/F94-portal.png')
