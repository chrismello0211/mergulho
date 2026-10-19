from playwright.sync_api import sync_playwright
erros=[]
src=open('/home/claude/mergulho/repo/index.html',encoding='utf-8').read()
A='const espera = ms => new Promise(r => setTimeout(r, ms));'
open('/tmp/ba/rapido_gancho.html','w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 3)));'))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///tmp/ba/rapido_gancho.html'); pg.wait_for_timeout(1200)
    pg.evaluate("()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-12';prog.leve=true;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}")
    def abre(i):
        pg.evaluate("(i)=>{fechaCartao();limpaPartida();abreFase(i,true);}", i); pg.wait_for_timeout(500)
        for _ in range(5):
            if pg.evaluate("!!document.querySelector('#veu.aberto')"): pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}"); pg.wait_for_timeout(300)
        pg.wait_for_timeout(300)
    FOGO="""async()=>{window.faltaObjetivo=()=>99;J.mov=999;let a=null;for(let r=H-1;r>=0&&!a;r--)for(let c=0;c<W;c++){const q=grid[r][c];if(q&&!q.sp&&!q.bau&&!q.lixo&&!q.gaiola&&!q.esponja){a=[r,c];break;}}
      grid[a[0]][a[1]].sp=LH;atualizaEl(grid[a[0]][a[1]]);const m0=J.mov,jr0=J.jogadasRegiao||0;await disparaEspecial({r:a[0],c:a[1]});
      for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
      let vazias=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(temCasa(y,x)&&!grid[y][x])vazias++;
      return {regra:J.regra,jogadasGastas:m0-J.mov,contadorDaRegiao:(J.jogadasRegiao||0)-jr0,ocupado:J.ocupado,casasVazias:vazias};}"""
    ig=pg.evaluate("()=>{for(let i=60;i<150;i++){if(regraDa(i)&&regraDa(i).id==='gelo'&&!fase(i).ressaca&&['pontos','coletar','papel','especiais'].includes(fase(i).obj.tipo))return i;}}")
    abre(ig); print('região do gelo (fase %d):'%(ig+1), pg.evaluate(FOGO))
    inn=pg.evaluate("()=>{for(let i=40;i<400;i++)if(fase(i).obj.tipo==='ninho')return i;}")
    abre(inn); r=pg.evaluate("()=>({ninhos:J.ninhos.length})"); print('fase de ninho (%d):'%(inn+1), r, pg.evaluate(FOGO))
    ie=pg.evaluate("()=>{for(let i=40;i<400;i++)if(fase(i).obj.tipo==='esponja')return i;}")
    abre(ie); print('fase de esponja (%d):'%(ie+1), pg.evaluate("()=>({esponjasAntes:contaEsponja()})"), pg.evaluate(FOGO))
    print('erros:', erros or 'nenhum')
    b.close()
