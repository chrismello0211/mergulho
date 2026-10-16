/* bot guloso de 1 jogada, seguindo a regra real de fim de fase:
   pontos joga até a última; juntar/limpar encerra no objetivo e
   converte as jogadas que sobram em 250 pontos cada.            */
function snap(){return {g:grid.map(l=>l.map(p=>p?{id:p.id,t:p.t,sp:p.sp,bau:p.bau}:null)),p:papel.map(l=>l.slice()),pt:J.pontos,co:J.coletado.slice(),pf:J.papelFeito,bf:J.bauFeito,bn:J.bauNaTela,bp:J.bauPendentes,ptt:J.papelTotal,cr:J.criados};}
function volta(s){grid=s.g.map(l=>l.map(p=>p?{id:p.id,t:p.t,sp:p.sp,bau:p.bau}:null));papel=s.p.map(l=>l.slice());J.pontos=s.pt;J.coletado=s.co.slice();J.papelFeito=s.pf;J.bauFeito=s.bf;J.bauNaTela=s.bn;J.bauPendentes=s.bp;J.papelTotal=s.ptt;J.criados=s.cr;}
function todas(){const out=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++){const p=grid[r][c];if(!p)continue;
  if(c<W-1){const q=grid[r][c+1];if(q&&(p.bau||q.bau||p.sp===ARCO||q.sp===ARCO||(p.sp&&q.sp)||criaCombo(r,c,r,c+1)))out.push([r,c,r,c+1]);}
  if(r<H-1){const q=grid[r+1][c];if(q&&(p.sp===ARCO||q.sp===ARCO||(p.sp&&q.sp)||criaCombo(r,c,r+1,c)))out.push([r,c,r+1,c]);}}return out;}
const somaBau=()=>{let s=0;for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(grid[r][c]&&grid[r][c].bau)s+=r;return s;};
function entregaBot(){let saiu=false;
  for(let c=0;c<W;c++){const p=grid[H-1][c];if(p&&p.bau){grid[H-1][c]=null;J.bauFeito++;J.bauNaTela--;J.pontos+=500;saiu=true;}}
  if(saiu)gravidade();return saiu;}
function aplica(j){const [r1,c1,r2,c2]=j;const a=grid[r1][c1],b=grid[r2][c2];
  const esp=!a.bau&&!b.bau&&((a.sp===ARCO||b.sp===ARCO)||(a.sp&&b.sp));grid[r1][c1]=b;grid[r2][c2]=a;
  resolvePts(esp?comboTroca(r2,c2,r1,c1):null,[chave(r2,c2),chave(r1,c1)]);}
function resolvePts(conjInicial,pref){
  J.cascata=1;let conj=conjInicial||null,v=0;
  while(v++<60){let gs=[];
    if(!conj){const co=acharCorridas();if(!co.length){if(entregaBot())continue;break;}gs=fazGrupos(co);conj=new Set();for(const g of gs)for(const k of g.cells)conj.add(k);expandir(conj,null);}
    const novos=[];for(const g of gs){const sp=especialDoGrupo(g);if(sp)novos.push({k:posEspecial(g,pref||[]),sp});}
    for(const n of novos)conj.delete(n.k);
    const vivas=[...conj].filter(k=>{const p=grid[linha(k)][coluna(k)];return p&&!p.bau;});let ganho=0;
    for(const n of novos){ganho+=VALOR_NASCE[n.sp]||0;J.criados=(J.criados||0)+1;}
    ganho+=bonusEspeciais;bonusEspeciais=0;
    for(const k of vivas){const r=linha(k),c=coluna(k),p=grid[r][c];J.coletado[p.t]++;ganho+=60*Math.min(J.cascata,10);
      if(papel[r][c]>0){papel[r][c]--;J.papelFeito++;}grid[r][c]=null;}
    if(vivas.length>=6)ganho+=(vivas.length-5)*90;J.pontos+=ganho;
    for(const n of novos){const p=grid[linha(n.k)][coluna(n.k)];if(p)p.sp=n.sp;}
    gravidade();conj=null;pref=null;J.cascata++;}
  if(!temJogada())embaralhaModelo();
}
function feitoAgora(f){
  if(f.obj.tipo==='especiais')return (J.criados||0)>=f.obj.n;
  if(f.obj.tipo==='bau')return J.bauFeito>=f.obj.n;
  if(f.obj.tipo==='coletar')return f.obj.itens.every(it=>J.coletado[it[0]]>=it[1]);
  if(f.obj.tipo==='papel')return J.papelFeito>=J.papelTotal;
  return false;
}
function joga(f,n){
  let ok=0;const pts=[];
  for(let i=0;i<n;i++){
    J={fase:0,mov:f.mov,pontos:0,coletado:[0,0,0,0,0,0],papelTotal:0,papelFeito:0,cascata:1,
       bauFeito:0,bauNaTela:0,bauPendentes:f.obj.tipo==='bau'?f.obj.n:0,criados:0,contaCresce:0,alvoCresce:null};
    papel=f.obj.tipo==='papel'?fazPapel(f.obj.padrao,f.obj.camadas):Array.from({length:H},()=>Array(W).fill(0));
    J.papelBase=papel.map(l=>l.slice());J.papelTotal=contaPapel(papel);montaTabuleiro();
    let fechou=false;
    while(J.mov>0){
      const lista=todas();if(!lista.length){embaralhaModelo();continue;}
      let melhor=null,nota=-1;
      for(const j of lista){
        const s=snap();const antes=J.papelFeito,ap=J.pontos,sb=somaBau(),bf=J.bauFeito;aplica(j);let v;
        if(f.obj.tipo==='especiais')v=(J.criados-(s.cr||0))*400+(J.pontos-ap)/50;
        else if(f.obj.tipo==='bau')v=(J.bauFeito-bf)*500+(somaBau()-sb)*60+(J.pontos-ap)/50;
        else if(f.obj.tipo==='papel')v=(J.papelFeito-antes)*100+(J.pontos-ap)/50;
        else if(f.obj.tipo==='coletar')v=f.obj.itens.reduce((x,it)=>x+Math.min(J.coletado[it[0]],it[1])-Math.min(s.co[it[0]],it[1]),0)*100+(J.pontos-ap)/50;
        else v=J.pontos-ap;
        volta(s);if(v>nota){nota=v;melhor=j;}
      }
      J.mov--;aplica(melhor);
      if(f.obj.tipo==='bau'){
        J.contaBau=(J.contaBau||0)+1;
        if(J.contaBau%4===0){
          let af=false;
          for(let r=H-2;r>=0;r--)for(let c2=0;c2<W;c2++){
            const p=grid[r][c2],b2=grid[r+1][c2];
            if(!p||!p.bau||!b2||b2.bau)continue;
            grid[r+1][c2]=p;grid[r][c2]=b2;af=true;
          }
          if(af)resolvePts(null,null);
        }
      }
      if(f.obj.cresce){
        if(J.alvoCresce){const [ar,ac]=J.alvoCresce;J.alvoCresce=null;if(papel[ar][ac]===0){papel[ar][ac]=1;J.papelTotal++;}}
        J.contaCresce++;
        if(J.mov>3&&casasCobertas(papel)>0&&J.contaCresce%f.obj.cresce===0){
          const cand=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(papel[r][c]===0&&J.papelBase[r][c]>0)cand.push([r,c]);
          if(cand.length)J.alvoCresce=cand[sorteia(cand.length)];}
      }
      if(f.obj.tipo!=='pontos'&&feitoAgora(f)){J.pontos+=250*J.mov;J.mov=0;fechou=true;}
    }
    if(f.obj.tipo==='pontos'){pts.push(J.pontos);}
    else{pts.push(J.pontos);if(fechou)ok++;}
  }
  pts.sort((a,b)=>a-b);
  return {taxa:ok/n,pts};
}
const pct=(a,q)=>a[Math.max(0,Math.min(a.length-1,Math.floor(q*a.length)))];

/* sucesso-alvo do bot, fase a fase: começa folgado e aperta devagar */
const ALVO=[1,1,.97,.97,.95,.95, .95,.93,.93,.92,.91,.9, .92,.9,.9,.89,.88,.88, .9,.88,.88,.87,.86,.85, .88,.87,.86,.85,.84,.83];


const alvos=[];let k=0;
for(let i=30;i<900;i++){const f=fase(i);if(f.obj.tipo!=='pontos'||f.enigma||tempoDa(i)||(i+1)%100===0)continue;if(k++%7===0)alvos.push(i);}
const lin=[];
for(const i of alvos.slice(0,9)){const f=JSON.parse(JSON.stringify(fase(i)));TOPO=(f.forma||Array(W).fill(0)).slice();
  const res=joga(f,16);const p=res.pts.slice().sort((a,b)=>a-b);
  lin.push([i+1,Math.round(p[8]/f.marcas[2]*100)/100,Math.round(p[15]/f.marcas[2]*100)/100]);}
console.log('PONTUAR (bot, 16 partidas por fase): fase | mediana/meta3★ | melhor/meta3★');
for(const l of lin)console.log('  ',l[0],'|',l[1]+'x','|',l[2]+'x');
console.log('maior razão vista:',Math.max(...lin.map(l=>l[2]))+'x (o teto é 4x)');
