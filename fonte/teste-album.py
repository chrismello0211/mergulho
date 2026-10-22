# Álbum: série 3 (Brilhantes) só abre depois das séries 1 e 2, com chance menor; enigma com 3 estrelas dá figurinha garantida;
# o bônus de completar as séries 1 e 2 continua igual.
from playwright.sync_api import sync_playwright
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-99';prog.leve=false;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,esponja:1,ressaca:1,portal:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<16;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
falhou=[]
def ok(nome,cond,extra=''):
    print(('OK   ' if cond else 'FALHA'),nome,extra)
    if not cond: falhou.append(nome)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    erros=[]; pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///home/claude/mergulho/repo/index.html'); pg.wait_for_timeout(1300); pg.evaluate(INIT)
    r=pg.evaluate("()=>{prog.album=['c0','c1','c2'];prog.albumCompleto=false;return {serie:proximaSerie(),D:chanceFig('D'),L:chanceFig('L'),garantia:garantiaFig(),sorteada:ganhaFigurinha(null),total:ALBUM_TOTAL(),base:TOTAL_BASE()};}")
    ok('no meio da série 1: 30%/60%, garantia em 12, sai figurinha da série 1',r['serie']==1 and r['D']==.3 and r['L']==.6 and r['garantia']==12 and r['sorteada'][0]=='c',r)
    r=pg.evaluate("()=>{prog.album=ALBUM.map((_,k)=>'c'+k).concat(ALBUM2.map((_,k)=>'d'+k),MESTRES.slice(0,-1).map((_,k)=>'m'+k));prog.albumCompleto=false;prog.brilhoCompleto=false;prog.moedas=1000;"+
        "const s=proximaSerie(),D=chanceFig('D'),L=chanceFig('L'),g=garantiaFig(),f=ganhaFigurinha(null);return {serie:s,D,L,garantia:g,sorteada:f,nome:nomeFigurinha(f),desenhoBrilha:desenhoFigurinha(f).includes('fig-brilho'),moedas:prog.moedas,bonusBase:prog.albumCompleto};}")
    ok('como a sua esposa (séries 1 e 2 completas, falta 1 lendária): abre a série 3, 12%/25%, garantia em 25, figurinha brilhante',r['serie']==3 and r['D']==.12 and r['L']==.25 and r['garantia']==25 and r['sorteada'][0]=='b' and r['desenhoBrilha'] and r['nome'].endswith('✨'),r)
    ok('  ...e o bônus das séries 1 e 2 ainda não veio (falta a lendária)',r['bonusBase'] is False and r['moedas']==1000,r)
    r=pg.evaluate("()=>{const m0=prog.moedas;ganhaFigurinha(MESTRES.length-1);const depoisLend=prog.moedas-m0;let n=0;while(proximaSerie()===3&&n<60){ganhaFigurinha(null);n++;}return {bonusBase:depoisLend,bonusBrilho:prog.moedas-m0-depoisLend,completo:prog.brilhoCompleto,total:prog.album.length,ALBUM_TOTAL:ALBUM_TOTAL(),serie:proximaSerie()};}")
    ok('completar a base ainda dá 2.000; completar as Brilhantes dá 5.000; nada mais sai depois',r['bonusBase']==2000 and r['bonusBrilho']==5000 and r['completo'] and r['total']==r['ALBUM_TOTAL'] and r['serie']==0,r)
    # texto antes da fase
    pg.evaluate("()=>{prog.album=ALBUM.map((_,k)=>'c'+k).concat(ALBUM2.map((_,k)=>'d'+k));prog.brilhoCompleto=false;salvaProg();}")
    iD=pg.evaluate("()=>{for(let i=300;i<900;i++){const f=fase(i);if(classeDaFase(i)==='D'&&!f.enigma&&f.obj.tipo!=='chefe'&&!(prog.estrelas[i]>=3))return i;}}")
    iE=pg.evaluate("()=>{for(let i=44;i<900;i++){if(fase(i).enigma&&!(prog.estrelas[i]>=3))return i;}}")
    for i,esp in ((iD,'brilhante pro álbum (12% de chance)'),(iE,'figurinha garantida')):
        pg.evaluate("(i)=>{fechaCartao();limpaPartida();abreFase(i,true);}",i); pg.wait_for_timeout(700)
        txt=pg.evaluate("()=>(document.querySelector('#cartao .pre-fig')||{}).textContent||''")
        ok('cartão antes da fase %d diz "%s"'%(i+1,esp),esp in txt,txt)
    # vitória de verdade num enigma com 3 estrelas: figurinha garantida
    for _ in range(4):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"): pg.evaluate("()=>{const b=document.querySelector('#cartao [data-ac=\"comeca\"]')||document.querySelector('#cartao .bt');if(b)b.click();}"); pg.wait_for_timeout(450)
    r=pg.evaluate("""async()=>{const n0=prog.album.length;prog.estrelas[J.fase]=0;J.pontos=faseAtual().marcas[2]+50;J.mov=0;await confere();
      const t0=performance.now();while(performance.now()-t0<15000&&!(prog.estrelas[J.fase]>0))await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,800));
      return {fim:J.fim,estrelas:prog.estrelas[J.fase],figurinha:J.figurinhaNova,ganhou:prog.album.length-n0};}""")
    ok('enigma vencido com 3 estrelas pela 1ª vez dá figurinha (brilhante, aqui)',r['ganhou']==1 and r['figurinha'] and r['figurinha'][0]=='b',r)
    # foto do álbum na série 3
    pg.evaluate("()=>{fechaCartao();prog.album=ALBUM.map((_,k)=>'c'+k).concat(ALBUM2.map((_,k)=>'d'+k),['m0','m1','bc0','bc5','bd3','bd11']);salvaProg();mostraAlbum();}"); pg.wait_for_timeout(800)
    pg.evaluate("()=>{const g=[...document.querySelectorAll('.album-serie')].find(e=>e.textContent.includes('Brilhantes'));if(g)g.scrollIntoView();}"); pg.wait_for_timeout(1700)
    pg.screenshot(path='/home/claude/mergulho/shots/F96-brilhantes.png')
    ok('o álbum mostra a série 3',pg.evaluate("()=>[...document.querySelectorAll('.album-serie')].map(e=>e.textContent).join(' | ')").count('Brilhantes')==1, pg.evaluate("()=>[...document.querySelectorAll('.album-serie')].map(e=>e.textContent).join(' | ')"))
    ok('erros de página',not erros,erros[:2])
    b.close()
print('\nRESULTADO:','TUDO CERTO' if not falhou else 'FALHOU: '+'; '.join(falhou))
