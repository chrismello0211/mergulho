/* bot guloso de 1 jogada, seguindo a regra real de fim de fase:
   pontos joga até a última; juntar/limpar encerra no objetivo e
   converte as jogadas que sobram em 250 pontos cada.            */
function snap(){return {g:grid.map(l=>l.map(p=>p?{id:p.id,t:p.t,sp:p.sp}:null)),p:papel.map(l=>l.slice()),pt:J.pontos,co:J.coletado.slice(),pf:J.papelFeito};}
function volta(s){grid=s.g.map(l=>l.map(p=>p?{id:p.id,t:p.t,sp:p.sp}:null));papel=s.p.map(l=>l.slice());J.pontos=s.pt;J.coletado=s.co.slice();J.papelFeito=s.pf;}
function todas(){const out=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++){const p=grid[r][c];if(!p)continue;
  if(c<W-1){const q=grid[r][c+1];if(q&&(p.sp===ARCO||q.sp===ARCO||(p.sp&&q.sp)||criaCombo(r,c,r,c+1)))out.push([r,c,r,c+1]);}
  if(r<H-1){const q=grid[r+1][c];if(q&&(p.sp===ARCO||q.sp===ARCO||(p.sp&&q.sp)||criaCombo(r,c,r+1,c)))out.push([r,c,r+1,c]);}}return out;}
function aplica(j){const [r1,c1,r2,c2]=j;const a=grid[r1][c1],b=grid[r2][c2];
  const esp=(a.sp===ARCO||b.sp===ARCO)||(a.sp&&b.sp);grid[r1][c1]=b;grid[r2][c2]=a;
  resolvePts(esp?comboTroca(r2,c2,r1,c1):null,[chave(r2,c2),chave(r1,c1)]);}
function resolvePts(conjInicial,pref){
  J.cascata=1;let conj=conjInicial||null,v=0;
  while(v++<60){let gs=[];
    if(!conj){const co=acharCorridas();if(!co.length)break;gs=fazGrupos(co);conj=new Set();for(const g of gs)for(const k of g.cells)conj.add(k);expandir(conj,null);}
    const novos=[];for(const g of gs){const sp=especialDoGrupo(g);if(sp)novos.push({k:posEspecial(g,pref||[]),sp});}
    for(const n of novos)conj.delete(n.k);
    const vivas=[...conj].filter(k=>grid[linha(k)][coluna(k)]);let ganho=0;
    for(const k of vivas){const r=linha(k),c=coluna(k),p=grid[r][c];J.coletado[p.t]++;ganho+=60*Math.min(J.cascata,8);
      if(papel[r][c]>0){papel[r][c]--;J.papelFeito++;}grid[r][c]=null;}
    if(vivas.length>=6)ganho+=(vivas.length-5)*90;J.pontos+=ganho;
    for(const n of novos){const p=grid[linha(n.k)][coluna(n.k)];if(p)p.sp=n.sp;}
    gravidade();conj=null;pref=null;J.cascata++;}
  if(!temJogada())embaralhaModelo();
}
function feitoAgora(f){
  if(f.obj.tipo==='coletar')return f.obj.itens.every(it=>J.coletado[it[0]]>=it[1]);
  if(f.obj.tipo==='papel')return J.papelFeito>=J.papelTotal;
  return false;
}
function joga(f,n){
  let ok=0;const pts=[];
  for(let i=0;i<n;i++){
    J={fase:0,mov:f.mov,pontos:0,coletado:[0,0,0,0,0,0],papelTotal:0,papelFeito:0,cascata:1};
    papel=f.obj.tipo==='papel'?fazPapel(f.obj.padrao,f.obj.camadas):Array.from({length:H},()=>Array(W).fill(0));
    J.papelTotal=contaPapel(papel);montaTabuleiro();
    let fechou=false;
    while(J.mov>0){
      const lista=todas();if(!lista.length){embaralhaModelo();continue;}
      let melhor=null,nota=-1;
      for(const j of lista){
        const s=snap();const antes=J.papelFeito,ap=J.pontos;aplica(j);let v;
        if(f.obj.tipo==='papel')v=(J.papelFeito-antes)*100+(J.pontos-ap)/50;
        else if(f.obj.tipo==='coletar')v=f.obj.itens.reduce((x,it)=>x+Math.min(J.coletado[it[0]],it[1])-Math.min(s.co[it[0]],it[1]),0)*100+(J.pontos-ap)/50;
        else v=J.pontos-ap;
        volta(s);if(v>nota){nota=v;melhor=j;}
      }
      J.mov--;aplica(melhor);
      if(f.obj.tipo!=='pontos'&&feitoAgora(f)){J.pontos+=250*J.mov;J.mov=0;fechou=true;}
    }
    if(f.obj.tipo==='pontos'){pts.push(J.pontos);}
    else{pts.push(J.pontos);if(fechou)ok++;}
  }
  pts.sort((a,b)=>a-b);
  return {taxa:ok/n,pts};
}
const pct=(a,q)=>a[Math.max(0,Math.min(a.length-1,Math.floor(q*a.length)))];
const r100=x=>Math.round(x/100)*100;

/* sucesso-alvo do bot, fase a fase: começa folgado e aperta devagar */
const ALVO=[1,1,.97,.97,.95,.95, .95,.93,.93,.92,.91,.9, .92,.9,.9,.89,.88,.88, .9,.88,.88,.87,.86,.85, .88,.87,.86,.85,.84,.83];

const alvoMundo=+process.argv[2];
const saida=[];
FASES.forEach((f0,i)=>{
  if(!isNaN(alvoMundo)&&f0.m!==alvoMundo)return;
  const f=JSON.parse(JSON.stringify(f0));
  const alvo=ALVO[i];let res;
  if(f.obj.tipo!=='pontos'&&process.argv[3]!=='fixo'){
    for(let it=0;it<6;it++){
      res=joga(f,40);
      if(res.taxa>alvo+.07&&f.mov>18){f.mov-=res.taxa>alvo+.15?2:1;continue;}
      if(res.taxa<alvo-.06){f.mov+=res.taxa<alvo-.15?2:1;continue;}
      break;
    }
  }
  res=joga(f,80);
  const p50=pct(res.pts,.5);
  let m0;
  let marcas;
  if(f.obj.tipo==='pontos'){
    const frac=[.40,.52,.56,.60,.62][f.m];
    m0=Math.min(Math.floor(pct(res.pts,1-alvo)/100)*100, r100(frac*p50));
    res.taxa=res.pts.filter(x=>x>=m0).length/res.pts.length;
    const m2=r100(p50); marcas=[m0, r100((m0+m2)/2), m2];
  } else { m0=r100(.42*p50); marcas=[m0, r100(.72*p50), r100(p50)]; }
  saida.push({i,nome:f.nome,mov:f.mov,taxa:Math.round(res.taxa*100),p50,marcas});
  console.log(JSON.stringify(saida[saida.length-1]));
});
