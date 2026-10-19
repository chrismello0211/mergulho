# O destravador: só dispara se o jogo ficar ocupado SEM nenhuma mudança de estado por 30 s (aqui encurtado pra 4 s só no teste).
from playwright.sync_api import sync_playwright
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-12';prog.leve=false;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,esponja:1,ressaca:1,portal:1};for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
falhou=[]
def ok(nome,cond,extra=''):
    print(('OK   ' if cond else 'FALHA'),nome,extra)
    if not cond: falhou.append(nome)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    erros=[]; pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///home/claude/mergulho/repo/index.html'); pg.wait_for_timeout(1300); pg.evaluate(INIT)
    pg.evaluate("()=>{limpaPartida();abreFase(45,true);}"); pg.wait_for_timeout(900)
    for _ in range(4):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"): pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}"); pg.wait_for_timeout(450)
    pg.wait_for_timeout(600)
    r=pg.evaluate("""async()=>{window.faltaObjetivo=()=>99;J.mov=999;let n=0;for(let m=0;m<25&&!J.fim;m++){const j=achaJogada();if(!j)break;await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});n++;}return {jogadas:n,destravou:window.__destravou||0};}""")
    ok('25 jogadas seguidas com animação real (a situação que disparava à toa): não destrava',r['destravou']==0,r)
    pg.wait_for_timeout(1600); pg.evaluate("()=>{window.__limiteTravado=4000;}")
    # A) ocupado, mas com atividade (o estado muda a cada segundo): não pode destravar, mesmo passando do limite
    pg.evaluate("()=>{J.ocupado=true;window.__vivo=setInterval(()=>{J.pontos+=10;},1000);}"); pg.wait_for_timeout(9500)
    r=pg.evaluate("()=>({ocupado:J.ocupado,destravou:window.__destravou||0})")
    ok('ocupado com atividade por 9,5 s (mais que o dobro do limite): não destrava',r['ocupado'] and r['destravou']==0,r)
    # A2) ocupado, parado e com um CARTÃO ABERTO por mais que o limite: é o jogo esperando a pessoa, não pode destravar
    pg.evaluate("()=>{clearInterval(window.__vivo);cartao('<p>cartão de teste</p><div class=\"bts\"><button class=\"bt\" data-ac=\"fecha\">ok</button></div>', true);J.ocupado=true;}"); pg.wait_for_timeout(7000)
    r=pg.evaluate("()=>({ocupado:J.ocupado,destravou:window.__destravou||0,cartaoAberto:document.getElementById('veu').classList.contains('aberto')})")
    ok('cartão aberto por 7 s (limite 4 s): não destrava',r['ocupado'] and r['destravou']==0 and r['cartaoAberto'],r)
    pg.evaluate("()=>{fechaCartao();J.ocupado=true;}")
    # B) ocupado e parado de verdade
    pg.wait_for_timeout(3000)
    r=pg.evaluate("()=>({ocupado:J.ocupado,destravou:window.__destravou||0})")
    ok('3 s depois de parar ainda não destrava (limite 4 s)',r['ocupado'] and r['destravou']==0,r)
    pg.wait_for_timeout(4200)
    r=pg.evaluate("()=>({ocupado:J.ocupado,destravou:window.__destravou||0,aviso:document.getElementById('faixa')?.textContent||''})")
    ok('parado de verdade por mais que o limite: destrava e avisa',(not r['ocupado']) and r['destravou']==1,r)
    r=pg.evaluate("""async()=>{const j=achaJogada();const m0=J.mov;await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,10));return {gastou:m0-J.mov,ocupado:J.ocupado};}""")
    ok('depois de destravar dá pra jogar',r['gastou']==1 and not r['ocupado'],r)
    ok('erros de página',not erros,erros[:2])
    b.close()
print('\nRESULTADO:','TUDO CERTO' if not falhou else 'FALHOU: '+', '.join(falhou))
