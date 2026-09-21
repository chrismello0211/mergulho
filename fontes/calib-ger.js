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


/* sucesso-alvo do bot, fase a fase: começa folgado e aperta devagar */
const ALVO=[1,1,.97,.97,.95,.95, .95,.93,.93,.92,.91,.9, .92,.9,.9,.89,.88,.88, .9,.88,.88,.87,.86,.85, .88,.87,.86,.85,.84,.83];


/* confere as fases geradas: o bot precisa passar numa faixa sadia */
const amostra=[30,45,99,180,999,5000];
console.log('fase   tipo     jog   bot   mediana   3★ previsto   erro');
for(const i of amostra){
  const f=JSON.parse(JSON.stringify(fase(i)));
  const res=joga(f,40); const p50=pct(res.pts,.5);
  const taxa=f.obj.tipo==='pontos'?res.pts.filter(x=>x>=f.marcas[0]).length/res.pts.length:res.taxa;
  const erro=Math.round((p50-f.marcas[2])/f.marcas[2]*100);
  console.log(String(i+1).padStart(5),f.obj.tipo.padEnd(8),String(f.mov).padStart(3),
    (Math.round(taxa*100)+'%').padStart(6),String(p50).padStart(9),String(f.marcas[2]).padStart(11),(erro>0?'+':'')+erro+'%');
}
