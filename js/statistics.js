// â•â•â•â• STATISTICS â•â•â•â•
function getStatItems(){
  const mode=document.getElementById('statStatusFilter')?.value||'active';
  if(mode==='retired') return items.filter(i=>i.status==='retired');
  if(mode==='all') return items;
  return items.filter(i=>i.status!=='retired');
}
function destroyChart(id){if(_charts[id]){_charts[id].destroy();delete _charts[id];}}
function setCountMode(mode,btn){countMode=mode;setTabActive(btn);buildCountYearChart(getStatItems());}
function setCatMode(mode,btn){catMode=mode;setTabActive(btn);buildCatChart(getStatItems());}
function setSpendMode(mode,btn){spendMode=mode;setTabActive(btn);buildSpendYearChart(getStatItems());}
function setSpendCatMode(mode,btn){spendCatMode=mode;setTabActive(btn);buildSpendCatChart(getStatItems());}
function setTabActive(btn){btn.closest('.chart-tabs').querySelectorAll('.chart-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}

function renderStatistics(){
  const data=getStatItems();
  const withPrice=data.filter(i=>parseFloat(i.price)>0);
  const totalValue=withPrice.reduce((s,i)=>s+parseFloat(i.price||0),0);
  const avgPrice=withPrice.length?totalValue/withPrice.length:0;
  const mostExpensive=[...data].sort((a,b)=>parseFloat(b.price||0)-parseFloat(a.price||0))[0];
  const counts={};
  data.forEach(i=>counts[i.category]=(counts[i.category]||0)+1);
  const topCat=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('statsKpi').innerHTML=`
    <div class="kpi-card kpi-green"><div class="kpi-value">${data.length}</div><div class="kpi-label">Total Items</div><div class="kpi-sub">${items.filter(i=>i.status==='retired').length} retired</div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-value">${fmtPrice(totalValue)}</div><div class="kpi-label">Total Value</div><div class="kpi-sub">${withPrice.length} items with price</div></div>
    <div class="kpi-card kpi-amber"><div class="kpi-value">${fmtPrice(avgPrice)}</div><div class="kpi-label">Avg Item Price</div><div class="kpi-sub">per priced item</div></div>
    <div class="kpi-card kpi-purple"><div class="kpi-value">${mostExpensive?fmtPrice(parseFloat(mostExpensive.price||0)):'â€”'}</div><div class="kpi-label">Most Expensive</div><div class="kpi-sub">${mostExpensive?esc(mostExpensive.name).substring(0,22):'â€”'}</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-value">${topCat?topCat[1]:0}</div><div class="kpi-label">Top Category</div><div class="kpi-sub">${topCat?topCat[0]:'â€”'}</div></div>`;
  const withWeight=data.filter(i=>i.weight_g);
  const totalWg=withWeight.reduce((s,i)=>s+(parseFloat(i.weight_g)||0),0);
  const avgWg=withWeight.length?Math.round(totalWg/withWeight.length):0;
  document.getElementById('statsKpi').innerHTML+=`
    <div class="kpi-card" style="border-top:3px solid #6b9e7a"><div class="kpi-value" style="color:#3d7a2e">${totalWg?fmtWeight(totalWg):'â€”'}</div><div class="kpi-label">Total Kit Weight</div><div class="kpi-sub">${withWeight.length} items with weight</div></div>
    <div class="kpi-card" style="border-top:3px solid #6b9e7a"><div class="kpi-value" style="color:#3d7a2e">${avgWg?fmtWeight(avgWg):'â€”'}</div><div class="kpi-label">Avg Item Weight</div><div class="kpi-sub">per item with weight</div></div>`;
  buildCountYearChart(data);
  buildCatChart(data);
  buildSpendYearChart(data);
  buildSpendCatChart(data);
  buildBreakdownTables(data);
  buildWeightCharts(data);
}

function getYears(data){
  return [...new Set(data.map(i=>i.date_purchased?i.date_purchased.substring(0,4):null).filter(Boolean))].sort();
}

function buildCountYearChart(data){
  destroyChart('cy');
  const years=getYears(data); if(!years.length) return;
  const isLine=countMode==='line';
  const datasets=CATS.map(cat=>({
    label:cat,
    data:years.map(y=>data.filter(i=>i.category===cat&&(i.date_purchased||'').startsWith(y)).length),
    backgroundColor:getCatColor(cat).bg,borderColor:getCatColor(cat).border,
    borderWidth:1,borderRadius:isLine?0:4,fill:false,tension:0.3
  }));
  _charts.cy=new Chart(document.getElementById('chartCountYear').getContext('2d'),{
    type:isLine?'line':'bar',data:{labels:years,datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}}},
      scales:{x:{stacked:!isLine&&countMode==='stacked',grid:{display:false},ticks:{font:{size:11}}},y:{stacked:!isLine&&countMode==='stacked',beginAtZero:true,ticks:{stepSize:1,font:{size:11}},grid:{color:'rgba(0,0,0,.05)'}}}}
  });
}

function buildCatChart(data){
  let groups={};
  if(catMode==='category') CATS.forEach(c=>groups[c]=data.filter(i=>i.category===c).length);
  else if(catMode==='type') data.forEach(i=>{if(i.type) groups[i.type]=(groups[i.type]||0)+1;});
  else if(catMode==='subtype') data.forEach(i=>{if(i.subtype) groups[i.subtype]=(groups[i.subtype]||0)+1;});
  else data.forEach(i=>{if(i.brand) groups[i.brand]=(groups[i.brand]||0)+1;});
  const sorted=Object.entries(groups).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,15);
  const total=sorted.reduce((s,e)=>s+e[1],0)||1;
  const el=document.getElementById('chartCatBreakdown');
  if(!sorted.length){el.innerHTML='<div style="color:var(--muted);font-size:12px;padding:16px 0">No data</div>';return;}
  el.innerHTML=`<div class="hbar-chart">${sorted.map((e,i)=>{
    const pct=Math.round(e[1]/total*100);
    const color=catMode==='category'?getCatColor(e[0]).border:PALETTE[i%PALETTE.length];
    return `<div class="hbar-row">
      <div class="hbar-label" title="${esc(e[0])}">${esc(e[0])}</div>
      <div class="hbar-val">${e[1]} <span>(${pct}%)</span></div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }).join('')}</div>`;
}

function buildSpendYearChart(data){
  destroyChart('sy');
  const years=getYears(data); if(!years.length) return;
  const isLine=spendMode==='line';
  const datasets=CATS.map(cat=>({
    label:cat,
    data:years.map(y=>Math.round(data.filter(i=>i.category===cat&&(i.date_purchased||'').startsWith(y)).reduce((s,i)=>s+parseFloat(i.price||0),0))),
    backgroundColor:getCatColor(cat).bg,borderColor:getCatColor(cat).border,
    borderWidth:1,borderRadius:isLine?0:4,fill:false,tension:0.3
  }));
  _charts.sy=new Chart(document.getElementById('chartSpendYear').getContext('2d'),{
    type:isLine?'line':'bar',data:{labels:years,datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}}},
      scales:{x:{stacked:!isLine&&spendMode==='stacked',grid:{display:false},ticks:{font:{size:11}}},y:{stacked:!isLine&&spendMode==='stacked',beginAtZero:true,ticks:{font:{size:11},callback:v=>'â‚¬'+v},grid:{color:'rgba(0,0,0,.05)'}}}}
  });
}

function buildSpendCatChart(data){
  let groups={};
  if(spendCatMode==='category') CATS.forEach(c=>groups[c]=Math.round(data.filter(i=>i.category===c).reduce((s,i)=>s+parseFloat(i.price||0),0)));
  else if(spendCatMode==='type') data.forEach(i=>{if(i.type) groups[i.type]=Math.round((groups[i.type]||0)+parseFloat(i.price||0));});
  else if(spendCatMode==='subtype') data.forEach(i=>{if(i.subtype) groups[i.subtype]=Math.round((groups[i.subtype]||0)+parseFloat(i.price||0));});
  else data.forEach(i=>{if(i.brand) groups[i.brand]=Math.round((groups[i.brand]||0)+parseFloat(i.price||0));});
  const sorted=Object.entries(groups).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,15);
  const total=sorted.reduce((s,e)=>s+e[1],0)||1;
  const el=document.getElementById('chartSpendCat');
  if(!sorted.length){el.innerHTML='<div style="color:var(--muted);font-size:12px;padding:16px 0">No data</div>';return;}
  el.innerHTML=`<div class="hbar-chart">${sorted.map((e,i)=>{
    const pct=Math.round(e[1]/total*100);
    const color=spendCatMode==='category'?getCatColor(e[0]).border:PALETTE[i%PALETTE.length];
    return `<div class="hbar-row">
      <div class="hbar-label" title="${esc(e[0])}">${esc(e[0])}</div>
      <div class="hbar-val">â‚¬${e[1].toLocaleString()} <span>(${pct}%)</span></div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }).join('')}</div>`;
}

function buildBreakdownTables(data){
  const catRows=CATS.map(cat=>{
    const ci=data.filter(i=>i.category===cat);
    return{label:cat,count:ci.length,value:Math.round(ci.reduce((s,i)=>s+parseFloat(i.price||0),0))};
  }).sort((a,b)=>b.count-a.count);
  const maxC=Math.max(...catRows.map(r=>r.count),1);
  document.getElementById('tableByCategory').innerHTML=`<table class="breakdown-table"><thead><tr><th>Category</th><th>Items</th><th>Value</th><th style="width:120px">Share</th></tr></thead><tbody>${catRows.map(r=>`<tr><td><span class="tag tag-${r.label.toLowerCase()}">${CAT_EMOJI[r.label]||''} ${r.label}</span></td><td><strong>${r.count}</strong></td><td>${r.value?'â‚¬'+r.value:'â€”'}</td><td><div class="mini-bar-bg"><div class="mini-bar-fill" style="width:${Math.round(r.count/maxC*100)}%;background:${getCatColor(r.label).border}"></div></div></td></tr>`).join('')}</tbody></table>`;
  const bm={};
  data.forEach(i=>{if(!i.brand) return; if(!bm[i.brand]) bm[i.brand]={count:0,value:0}; bm[i.brand].count++; bm[i.brand].value+=parseFloat(i.price||0);});
  const brandRows=Object.entries(bm).map(([b,v])=>({label:b,count:v.count,value:Math.round(v.value)})).sort((a,b)=>b.count-a.count).slice(0,10);
  const maxB=Math.max(...brandRows.map(r=>r.count),1);
  document.getElementById('tableByBrand').innerHTML=`<table class="breakdown-table"><thead><tr><th>Brand</th><th>Items</th><th>Value</th><th style="width:120px">Share</th></tr></thead><tbody>${brandRows.map((r,i)=>`<tr><td>${esc(r.label)}</td><td><strong>${r.count}</strong></td><td>${r.value?'â‚¬'+r.value:'â€”'}</td><td><div class="mini-bar-bg"><div class="mini-bar-fill" style="width:${Math.round(r.count/maxB*100)}%;background:${PALETTE[i%PALETTE.length]}"></div></div></td></tr>`).join('')}</tbody></table>`;
}

function buildWeightCharts(data){
  destroyChart('wc');
  const withW=data.filter(i=>i.weight_g);
  // Weight by category bar chart
  const catWeights=CATS.map(cat=>{
    const total=withW.filter(i=>i.category===cat).reduce((s,i)=>s+(parseFloat(i.weight_g)||0),0);
    return{cat,total};
  }).filter(r=>r.total>0);
  if(catWeights.length){
    _charts.wc=new Chart(document.getElementById('chartWeightCat').getContext('2d'),{
      type:'bar',
      data:{
        labels:catWeights.map(r=>r.cat),
        datasets:[{
          data:catWeights.map(r=>Math.round(r.total)),
          backgroundColor:catWeights.map(r=>getCatColor(r.cat).bg),
          borderColor:catWeights.map(r=>getCatColor(r.cat).border),
          borderWidth:1,borderRadius:4
        }]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},
        tooltip:{callbacks:{label:ctx=>` ${fmtWeight(ctx.raw)}`}}},
        scales:{x:{grid:{display:false},ticks:{font:{size:11}}},
          y:{beginAtZero:true,ticks:{font:{size:11},callback:v=>fmtWeight(v)},grid:{color:'rgba(0,0,0,.05)'}}}}
    });
  }
  // Top 10 heaviest table
  const heaviest=[...withW].sort((a,b)=>(parseFloat(b.weight_g)||0)-(parseFloat(a.weight_g)||0)).slice(0,10);
  const maxW=parseFloat(heaviest[0]?.weight_g)||1;
  document.getElementById('tableHeaviest').innerHTML=`<table class="breakdown-table"><thead><tr><th>Item</th><th>Weight</th><th style="width:120px">Bar</th></tr></thead><tbody>${
    heaviest.map(i=>`<tr><td><strong>${esc(i.name)}</strong><small style="display:block;color:var(--muted);font-size:10px">${esc(i.brand||'')}${i.subtype?' Â· '+esc(i.subtype):''}</small></td><td><strong>${fmtWeight(parseFloat(i.weight_g))}</strong></td><td><div class="mini-bar-bg"><div class="mini-bar-fill" style="width:${Math.round(parseFloat(i.weight_g)/maxW*100)}%;background:${getCatColor(i.category).border}"></div></div></td></tr>`).join('')
  }</tbody></table>`;
}

