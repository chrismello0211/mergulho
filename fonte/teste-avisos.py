# Notificações do lado do jogo: com Firebase, permissão e service worker simulados, confere tudo o que o aparelho grava no banco.
from playwright.sync_api import sync_playwright
FALSO="""
window.__getToken=null;window.__cfgFirebase=null;
window.firebase={apps:[],initializeApp(c){this.apps.push(c);window.__cfgFirebase=c;},messaging(){return {getToken:async o=>{window.__getToken=o;return 'TOKEN-ABC-123';}};}};
window.__permissao='granted';
window.Notification=function(){};Object.defineProperty(window.Notification,'permission',{get:()=>window.__estadoPerm||'default'});
window.Notification.requestPermission=async()=>{window.__estadoPerm=window.__permissao;return window.__permissao;};
window.PushManager=window.PushManager||function(){};
Object.defineProperty(Navigator.prototype,'serviceWorker',{get:()=>({ready:Promise.resolve({scope:'teste'}),register:async()=>({}),addEventListener(){},controller:null})});
"""
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-99';prog.leveEscolhido=true;prog.cardume='PEIX';prog.apelido='Laís';salvaProg();Conta.sessao={uid:'u-teste',email:'lais@x',refresh:'r',id:'tok',expira:Date.now()+1e8};}"
CONFIG="()=>{Object.assign(Conta.cfg,{projeto:'mergulho-c6230',remetente:'123456',app:'1:123456:web:abc',vapid:'BTESTE'});}"
falhou=[]
def ok(nome,cond,extra=''):
    print(('OK   ' if cond else 'FALHA'),nome,extra if not cond else '')
    if not cond: falhou.append(nome)
PW=sync_playwright().start()
def roda(ua=None):
    b=PW.chromium.launch(); ctx=b.new_context(viewport={'width':393,'height':852},user_agent=ua) if ua else b.new_context(viewport={'width':393,'height':852})
    pg=ctx.new_page(); erros=[]; pg.on('pageerror',lambda e:erros.append(str(e)))
    gravou=[]
    def rota(route):
        r=route.request; gravou.append((r.method,r.url.split('.firebaseio.com')[1].split('.json')[0],r.post_data)); route.fulfill(status=200,body='null',content_type='application/json')
    pg.route('https://mergulho-c6230-default-rtdb.firebaseio.com/**',rota)
    pg.add_init_script(FALSO)
    pg.goto('file:///home/claude/mergulho/repo/index.html'); pg.wait_for_timeout(1300); pg.evaluate(INIT)
    return b,pg,gravou,erros
import json,time
# ── 1) aparelho Android/computador
b,pg,gravou,erros=roda()
pg.evaluate("()=>mostraAjustes()"); pg.wait_for_timeout(300)
ok('sem configuração, o botão de Notificações nem aparece',not pg.evaluate("()=>[...document.querySelectorAll('#cartao .ajuste b')].some(e=>e.textContent==='Notificações')"))
ok('e a novidade 🔔 também não',not pg.evaluate("()=>NOVIDADES_LOTES[0].itens.some(i=>i[1]==='Notificações')"))
pg.evaluate(CONFIG); pg.evaluate("()=>{fechaCartao();mostraAjustes();}"); pg.wait_for_timeout(300)
ok('com configuração, aparece nos Ajustes',pg.evaluate("()=>[...document.querySelectorAll('#cartao .ajuste b')].some(e=>e.textContent==='Notificações')"))
pg.click('#cartao [data-ac="avisos"]'); pg.wait_for_timeout(300)
pg.click('#cartao [data-ac="liga-avisos"]'); pg.wait_for_timeout(1500)
msg=pg.evaluate("()=>(document.querySelector('#cartao .aviso-msg')||{}).textContent||''")
ok('ligou: mensagem de pronto',msg.startswith('Pronto!'),msg)
cfg=pg.evaluate("()=>window.__cfgFirebase"); opt=pg.evaluate("()=>({vapid:(window.__getToken||{}).vapidKey,temRegistro:!!(window.__getToken||{}).serviceWorkerRegistration})")
ok('Firebase iniciado com o projeto, remetente e app',cfg and cfg['projectId']=='mergulho-c6230' and cfg['messagingSenderId']=='123456' and cfg['appId']=='1:123456:web:abc',cfg)
ok('endereço pedido com a chave VAPID e o service worker do jogo',opt['vapid']=='BTESTE' and opt['temRegistro'],opt)
cam=lambda c:[(m,json.loads(d) if d else None) for (m,u,d) in gravou if u.endswith(c)]
apar=[x for x in gravou if '/aparelhos/' in x[1]]
ok('gravou o endereço deste aparelho',len(apar)==1 and json.loads(apar[0][2])['token']=='TOKEN-ABC-123' and apar[0][1].startswith('/mergulho/avisos/u-teste/aparelhos/a'),apar)
per=cam('/perfil')
ok('gravou o perfil: nome, cardume e todos os avisos ligados',per and per[-1][1]=={'nome':'Laís','cardume':'PEIX','tipos':{'pedidos':True,'recebida':True,'vidas':True,'bau':True,'evento':True}},per)
ok('vidas cheias agora: hora das vidas = 0',cam('/vidasCheiasEm') and cam('/vidasCheiasEm')[-1][1]==0,cam('/vidasCheiasEm'))
pg.click('#cartao [data-ac="tipo-aviso"][data-k="vidas"]'); pg.wait_for_timeout(600)
ok('desligar "Vidas cheias" regrava o perfil',cam('/perfil')[-1][1]['tipos']['vidas'] is False)
n0=len(cam('/perfil')); pg.evaluate("()=>Avisos.publicaPerfil()"); pg.wait_for_timeout(300)
ok('perfil igual não regrava à toa',len(cam('/perfil'))==n0)
t0=pg.evaluate("()=>Date.now()"); pg.evaluate("()=>gastaVida()"); pg.wait_for_timeout(400)
v=cam('/vidasCheiasEm')[-1][1]
ok('gastou 1 vida: vidas cheias daqui a 15 min',abs(v-(t0+15*60000))<5000,(v-t0)/60000)
pg.evaluate("()=>gastaVida()"); pg.wait_for_timeout(400)
v=cam('/vidasCheiasEm')[-1][1]
ok('gastou mais 1: daqui a 30 min',abs(v-(t0+30*60000))<5000,(v-t0)/60000)
pg.evaluate("()=>{prog.dia=ontem();pegaBau();}"); pg.wait_for_timeout(400)
ok('pegou o baú: grava o dia de hoje',cam('/bauDia') and cam('/bauDia')[-1][1]==pg.evaluate("()=>hoje()"),cam('/bauDia'))
pg.evaluate("()=>{fechaCartao();mostraAvisos();}"); pg.wait_for_timeout(300)
pg.screenshot(path='/home/claude/mergulho/shots/F97-avisos.png')
pg.click('#cartao [data-ac="desliga-avisos"]'); pg.wait_for_timeout(600)
apar=[x for x in gravou if '/aparelhos/' in x[1]]
ok('desligar apaga o endereço deste aparelho',apar[-1][2]=='null' and not pg.evaluate("()=>Avisos.ligado"),apar[-1])
ok('sem erros de página',not erros,erros[:2])
b.close()
# ── 2) permissão negada, sem conta
b,pg,gravou,erros=roda()
pg.evaluate(CONFIG); pg.evaluate("()=>{window.__permissao='denied';}")
r=pg.evaluate("()=>Avisos.liga()"); ok('permissão negada: explica como liberar e não grava nada',r=='negado' and not [x for x in gravou if '/aparelhos/' in x[1]],r)
pg.evaluate("()=>{window.__estadoPerm='default';window.__permissao='granted';Conta.sessao=null;}")
r=pg.evaluate("()=>Avisos.liga()"); ok('sem conta: pede pra guardar o progresso antes',r=='conta',r)
b.close()
# ── 3) iPhone fora da tela de início
b,pg,gravou,erros=roda('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
pg.evaluate(CONFIG)
r=pg.evaluate("()=>Avisos.liga()"); pg.evaluate("()=>mostraAvisos()"); pg.wait_for_timeout(300)
txt=pg.evaluate("()=>document.getElementById('cartao').textContent")
ok('iPhone sem instalar: ensina a pôr na tela de início',r=='instalar' and 'Adicionar à Tela de Início' in txt,r)
b.close()
PW.stop()
print('\nRESULTADO:','TUDO CERTO' if not falhou else 'FALHOU: '+'; '.join(falhou))
