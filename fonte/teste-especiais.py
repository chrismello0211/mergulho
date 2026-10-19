# Quantos especiais cada tipo de fase começa tendo, ciclo e teto dos especiais das regiões, e estresse de invariantes nessas fases.
from playwright.sync_api import sync_playwright
def espera_e_fecha(pg):
    ocioso=0
    for _ in range(14):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"):
            ocioso=0
            pg.evaluate("""()=>{const b=document.querySelector('#cartao [data-ac="comeca"]')||document.querySelector('#cartao .bt');if(b)b.click();}""")
        else:
            ocioso+=1
            if ocioso>=3: break
        pg.wait_for_timeout(350)
src=open('/home/claude/mergulho/repo/index.html',encoding='utf-8').read()
A='const espera = ms => new Promise(r => setTimeout(r, ms));'; assert A in src
open('/tmp/ba/rapido_esp.html','w',encoding='utf-8').write(src.replace(A,'const espera = ms => new Promise(r => setTimeout(r, Math.min(ms, 3)));'))
INIT="()=>{fechaCartao();filaCartoes.length=0;prog.max=900;prog.dia=hoje();prog.vidas=5;prog.viuNovidades='lote-12';prog.leve=false;prog.leveEscolhido=true;aplicaLeve();prog.vistos={tempo:1,quadrado:1,enigma:1,bau:1,cresce2:1,presos:1,bolhas:1,corrente:1,mancha2:1,ninho2:1,perolas2:1,coral2:1,lixo2:1,esponja:1,ressaca:1,portal:1};for(const k of ['raizes','gelo','eco','cinza','tesouro','cardume','abismo','emaranhado','canto','janelas','ferrao','cristais','neon','geiser','aurora'])prog.vistos['regiao-'+k]=1;for(let r=0;r<8;r++)for(let q=0;q<5;q++)prog.vistos['r'+r+'b'+q]=1;salvaProg();}"
INV="""const inv=()=>{const p=[];const ids=new Set();for(let r=0;r<H;r++)for(let c=0;c<W;c++){const q=grid[r][c];
  if(temCasa(r,c)&&!q)p.push('vazio '+r+','+c);if(!q)continue;if(ids.has(q.id))p.push('id repetido');ids.add(q.id);
  const el=els.get(q.id);if(!el){p.push('sem elemento '+r+','+c);continue;}
  const m=/translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(el.style.transform);
  if(!m||Math.abs(+m[1]-c*CEL)>1||Math.abs(+m[2]-r*CEL)>1)p.push('fora do lugar '+r+','+c);}return p;};"""
CICLO_JS = """async(per)=>{window.faltaObjetivo=()=>99;J.mov=9999;J.jogadasRegiao=0;const hist=[];const e0=contaEspeciais();
  for(let i=1;i<=per;i++){passoRegiao();hist.push(contaEspeciais());}
  const nasceuNaHoraCerta=hist[per-1]-e0===1&&hist.slice(0,per-1).every(x=>x===e0);
  for(let a=H-1;a>=0&&contaEspeciais()<2;a--)for(let c=0;c<W&&contaEspeciais()<2;c++){const q=grid[a][c];if(q&&!q.sp&&!q.bau&&!q.lixo&&!q.gaiola){q.sp=LH;atualizaEl(q);}}
  const comDoisNaTela=contaEspeciais();J.jogadasRegiao=0;for(let i=1;i<=per;i++)passoRegiao();
  return {antes:e0,nasceuNaHoraCerta:nasceuNaHoraCerta,comDoisNaTela:comDoisNaTela,depoisDeUmCiclo:contaEspeciais()};}"""
falhou=[]; erros=[]
def ok(nome,cond,extra=''):
    print(('OK   ' if cond else 'FALHA'),nome,extra)
    if not cond: falhou.append(nome)
def abre(pg,i):
    pg.evaluate("(i)=>{fechaCartao();limpaPartida();abreFase(i,true);}",i);pg.wait_for_timeout(450)
    for _ in range(5):
        if pg.evaluate("!!document.querySelector('#veu.aberto')"):pg.evaluate("()=>{const b=document.querySelector('[data-ac=\"comeca\"]')||document.querySelector('[data-ac=\"fecha\"]');if(b)b.click();}");pg.wait_for_timeout(250)
    pg.wait_for_timeout(300)
    espera_e_fecha(pg)
STRESS="async()=>{"+INV+"""window.faltaObjetivo=()=>99;J.mov=9999;if(J.tempoModo)J.tempoRestante=99999;const falhas=[];let maxEsp=0;
  for(let m=1;m<=40&&!J.fim;m++){for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));const j=achaJogada();if(!j)break;
    await tentaTroca({r:j[0],c:j[1]},{r:j[2],c:j[3]});for(let k=0;k<300&&J.ocupado;k++)await new Promise(r=>setTimeout(r,8));
    const pr=inv();if(pr.length)falhas.push('jogada '+m+': '+pr[0]);}
  return {falhas:falhas.slice(0,2)};}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':393,'height':852},has_touch=True,is_mobile=True)
    pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto('file:///tmp/ba/rapido_esp.html');pg.wait_for_timeout(1200);pg.evaluate(INIT)
    L=pg.evaluate("""()=>{const ok=i=>['pontos','coletar','papel','especiais'].includes(fase(i).obj.tipo);const o={};
      for(let i=40;i<900;i++){if((i+1)%100===0)continue;const f=fase(i),r=regraDa(i),id=r&&r.id;
        if(!o.brinde&&condicaoDa(i)==='brinde'&&!f.enigma&&id!=='cardume'&&ok(i))o.brinde=i;
        if(!o.enigma&&f.enigma)o.enigma=i;if(!o.enigma2&&o.enigma&&f.enigma&&i>o.enigma+60)o.enigma2=i;
        if(!o.canto&&id==='canto'&&ok(i)&&!f.enigma)o.canto=i;if(!o.geiser&&id==='geiser'&&ok(i)&&!f.enigma)o.geiser=i;}return o;}""")
    print('fases de teste:',{k:v+1 for k,v in L.items()})
    # 1) começo das fases
    abre(pg,L['brinde']); r=pg.evaluate("()=>({qtd:contaEspeciais(),tipos:(()=>{const t=[];for(let a=0;a<H;a++)for(let c=0;c<W;c++)if(grid[a][c]&&grid[a][c].sp)t.push(grid[a][c].sp);return t;})(),cond:J.cond})")
    ok('Presente do fundo começa com 1 especial',r['qtd']==1 and r['cond']=='brinde',r)
    print('     estresse:',pg.evaluate(STRESS)); 
    pares=[]
    for k in ('enigma','enigma2'):
        abre(pg,L[k]); r=pg.evaluate("()=>({qtd:contaEspeciais(),jogadas:J.mov,marcas:faseAtual().marcas,tipos:(()=>{const t=[];for(let a=0;a<H;a++)for(let c=0;c<W;c++)if(grid[a][c]&&grid[a][c].sp)t.push(grid[a][c].sp);return t.sort();})()})")
        ok('Enigma (fase %d) começa com 2 especiais, 6 a 8 jogadas'%(L[k]+1),r['qtd']==2 and 6<=r['jogadas']<=8,r); pares.append(r['tipos'])
        print('     estresse:',pg.evaluate(STRESS))
    # 2) ciclo e teto das regiões
    for k,per in (('canto',10),('geiser',11)):
        abre(pg,L[k])
        r=pg.evaluate(CICLO_JS,per)
        ok('%s: 1 especial a cada %d jogadas, e nenhum com 2 na tela'%(k,per),r['nasceuNaHoraCerta'] and r['depoisDeUmCiclo']==r['comDoisNaTela'],r)
        abre(pg,L[k]); print('     estresse:',pg.evaluate(STRESS))
    ok('sem erro de página',not erros,erros[:2])
    b.close()
print('\nRESULTADO:','TUDO CERTO' if not falhou else 'FALHOU: '+', '.join(falhou))
