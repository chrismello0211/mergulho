# O baú do dia não pode ser pego de novo fechando o app antes da nuvem salvar (relato do Rafael), e a sincronização
# continua certa nos casos legítimos (celular novo, dois aparelhos).
import sys
from playwright.sync_api import sync_playwright
arq=sys.argv[1]
PREP="""()=>{fechaCartao();filaCartoes.length=0;prog.max=300;prog.vidas=5;prog.viuNovidades='lote-99';
  Conta.cfg={chave:'x',banco:'https://exemplo.invalid'};Conta.sessao={uid:'u1',email:'a@b',refresh:'r',id:'t',expira:Date.now()+1e8};
  window.__salvas=0;Conta.salva=async()=>{window.__salvas++;return false;};   /* o app morreu antes de a nuvem gravar */
  window.__meuId=(typeof idAparelho==='function')?idAparelho():null;}"""
RAFAEL="""async()=>{
  prog.dia=ontem();prog.seq=2;prog.semanas=0;prog.moedas=1000;salvaProg();
  const nuvem=JSON.parse(JSON.stringify(prog));                      /* ontem estava tudo sincronizado */
  Conta.puxa=async()=>{const c=JSON.parse(JSON.stringify(nuvem));if(window.__meuId)c.__aparelho=window.__meuId;return c;};
  const ciclos=[];
  for(let k=0;k<3;k++){
    if(!jaPegouHoje()){const d=diaDaSemana();pegaBau();fechaCartao();ciclos.push('pegou o prêmio do dia '+d+' (moedas '+prog.moedas+')');}
    else ciclos.push('baú fechado: já pegou hoje (moedas '+prog.moedas+')');
    await Conta.sincroniza();                                          /* fechou e abriu: puxa a cópia velha */
  }
  return ciclos;}"""
LEGIT="""async()=>{const R={};const limpo=o=>JSON.parse(JSON.stringify(o));
  /* a) celular novo: aqui quase nada, na nuvem o progresso de verdade (de outro aparelho) */
  prog.max=2;prog.moedas=0;prog.album=[];prog.estrelas={'0':1};prog.dia='';prog.seq=0;salvaProg();
  let nuvem={max:640,moedas:5200,poderes:{arpao:4},album:['f1','f2'],estrelas:{'0':3,'5':2},dia:ontem(),seq:4,semanas:2,__aparelho:'outro-celular'};
  aplicaProg(limpo(nuvem));
  R.celularNovo={max:prog.max,moedas:prog.moedas,album:prog.album.length,estrela0:prog.estrelas['0'],seq:prog.seq,semanas:prog.semanas};
  /* b) mesmo aparelho, cópia velha na nuvem, gastou moedas aqui: não pode devolver */
  prog.moedas=200;prog.poderes={arpao:1};salvaProg();
  nuvem=Object.assign(limpo(prog),{moedas:800,poderes:{arpao:4},__aparelho:window.__meuId});
  aplicaProg(nuvem); R.gastouAqui={moedas:prog.moedas,arpao:prog.poderes.arpao};
  /* c) dois aparelhos: o outro avançou mais (vale o dele), mas este pegou o baú hoje: o baú continua pego */
  prog.max=650;prog.moedas=300;prog.dia=hoje();prog.seq=5;salvaProg();
  nuvem={max:700,moedas:900,poderes:{arpao:2},album:['f3'],estrelas:{'9':3},dia:ontem(),seq:4,__aparelho:'outro-celular'};
  aplicaProg(limpo(nuvem));
  R.doisAparelhos={max:prog.max,moedas:prog.moedas,bauPegoHoje:jaPegouHoje(),seq:prog.seq,album:prog.album.length,estrela9:prog.estrelas['9']};
  return R;}"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':393,'height':852})
    erros=[]; pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file://'+arq); pg.wait_for_timeout(1300); pg.evaluate(PREP)
    print('O CASO DO RAFAEL (3 vezes: pega o baú, fecha antes da nuvem salvar, abre de novo):')
    for c in pg.evaluate(RAFAEL): print('   ',c)
    if pg.evaluate("typeof idAparelho==='function'"):
        print('CASOS LEGÍTIMOS:', pg.evaluate(LEGIT))
    print('   erros de página:',erros[:2] or 'nenhum')
    b.close()
