from playwright.sync_api import sync_playwright
from PIL import Image
erros=[]
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-8';prog.leve=false;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///home/claude/mergulho/repo/index.html'); pg.wait_for_timeout(1400)
    pg.evaluate(INIT)
    ti=pg.evaluate("()=>{for(let i=560;i<700;i++)if(tempoDa(i)>0&&fase(i).obj.tipo==='coletar')return i;}")
    pg.evaluate("(i)=>{limpaPartida();abreFase(i,true);}", ti); pg.wait_for_timeout(1100)
    for _ in range(4):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"): pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}"); pg.wait_for_timeout(450)
    print('fase', ti+1, 'de relógio |', pg.evaluate("()=>({relogio:J.tempoRestante,tetoDeJogadas:J.mov,jogadasNormais:faseAtual().mov})"))
    # impede a vitória pelo objetivo, pra medir só o relógio
    pg.evaluate("()=>{window.faltaObjetivo=()=>99;}")
    r=pg.evaluate("""async()=>{const t0=performance.now(),s0=J.tempoRestante,p0=J.pontos;let n=0;
      while(performance.now()-t0<60000&&!J.fim){const j=achaJogada();if(!j)break;await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});n++;}
      await new Promise(r=>setTimeout(r,1200));
      return {segundosReais:Math.round((performance.now()-t0)/1000),jogadasFeitas:n,relogioGastou:s0-J.tempoRestante,pontos:J.pontos-p0,acabou:J.fim,cartao:document.getElementById('veu').classList.contains('aberto')?document.querySelector('#cartao h3')?.textContent:null};}""")
    print('tocando sem pensar até o fim:', r)
    print('erros:', erros or 'nenhum')
    b.close()
a=Image.open('/home/claude/mergulho/shots/F88-esponja.png'); c=Image.open('/home/claude/mergulho/shots/F89-regiao.png')
out=Image.new('RGB',(a.width+c.width+12,max(a.height,c.height)),(20,20,20)); out.paste(a,(0,0)); out.paste(c,(a.width+12,0)); out.save('/home/claude/mergulho/shots/F90-esponja-regiao.png')
