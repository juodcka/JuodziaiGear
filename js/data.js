// â•â•â•â• DATA HELPERS â•â•â•â•
function getFiltered(){
  const s=(document.getElementById('searchInput')?.value||'').toLowerCase();
  const cat=document.getElementById('fCat')?.value||'';
  const typ=document.getElementById('filterType')?.value||'';
  const sub=document.getElementById('filterSubtype')?.value||'';
  const brand=document.getElementById('filterBrand')?.value||'';
  const prodYear=document.getElementById('fProdYear')?.value||'';
  const st=document.getElementById('fSt')?.value||'';
  const tagFilter=document.getElementById('filterTag')?.value||'';
  const activeCount=[cat,typ,sub,brand,prodYear,st,tagFilter].filter(Boolean).length;
  const cb=document.getElementById('clearFiltersBtn');
  if(cb) cb.style.display=activeCount?'':'none';
  const fc=document.getElementById('filterCount');
  if(fc){fc.textContent=activeCount;fc.style.display=activeCount?'':'none';}
  return items.filter(i=>{
    if(s&&!`${i.name} ${i.brand} ${i.type} ${i.subtype} ${i.model} ${(i.tags||[]).join(' ')}`.toLowerCase().includes(s)) return false;
    if(tagFilter&&!(i.tags||[]).includes(tagFilter)) return false;
    if(cat&&i.category.toLowerCase()!==cat.toLowerCase()) return false;
    if(typ&&(i.type||'')!==typ) return false;
    if(sub&&(i.subtype||'')!==sub) return false;
    if(brand&&(i.brand||'')!==brand) return false;
    if(prodYear&&(i.date_produced||'').substring(0,4)!==prodYear) return false;
    if(st==='active') return i.status==='active'&&!activeTrip(i.gear_id);
    if(st==='in_trip') return !!activeTrip(i.gear_id);
    if(st==='lent') return i.status==='lent';
    if(st==='retired') return i.status==='retired';
    if(st==='all') return true;
    return i.status!=='retired';
  });
}
function toggleFilters(){
  const panel=document.getElementById('filtersRow');
  const btn=document.getElementById('filterToggleBtn');
  const open=panel.style.display!=='none';
  panel.style.display=open?'none':'';
  btn.classList.toggle('open',!open);
}
function onFilterCatChange(){
  const cat=document.getElementById('fCat').value;
  const ts=document.getElementById('filterType');
  const ss=document.getElementById('filterSubtype');
  ts.innerHTML='<option value="">All Types</option>';
  ss.innerHTML='<option value="">All Subtypes</option>';
  if(cat&&lookups.hierarchy[cat]){
    Object.keys(lookups.hierarchy[cat]).forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;ts.appendChild(o);});
  } else {
    const allTypes=[...new Set(items.map(i=>i.type).filter(Boolean))].sort();
    allTypes.forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;ts.appendChild(o);});
  }
  renderAll();
}
function onFilterTypeChange(){
  const cat=document.getElementById('fCat').value;
  const typ=document.getElementById('filterType').value;
  const ss=document.getElementById('filterSubtype');
  ss.innerHTML='<option value="">All Subtypes</option>';
  let subs=[];
  if(cat&&typ&&lookups.hierarchy[cat]&&lookups.hierarchy[cat][typ]){
    subs=lookups.hierarchy[cat][typ];
  } else if(typ){
    subs=[...new Set(items.filter(i=>i.type===typ).map(i=>i.subtype).filter(Boolean))].sort();
  } else {
    subs=[...new Set(items.map(i=>i.subtype).filter(Boolean))].sort();
  }
  subs.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;ss.appendChild(o);});
  renderAll();
}
function openGlobalSearch(){
  const el=document.getElementById('globalSearchOverlay');
  el.classList.add('open');
  const inp=document.getElementById('globalSearchInput');
  inp.value='';
  document.getElementById('globalSearchResults').innerHTML='<div class="gsearch-empty">Start typing to searchâ€¦</div>';
  setTimeout(()=>inp.focus(),50);
}
function closeGlobalSearch(){
  document.getElementById('globalSearchOverlay').classList.remove('open');
}
function runGlobalSearch(){
  const q=(document.getElementById('globalSearchInput').value||'').toLowerCase().trim();
  const res=document.getElementById('globalSearchResults');
  if(!q){res.innerHTML='<div class="gsearch-empty">Start typing to searchâ€¦</div>';return;}
  let html='';
  // Gear
  const gearHits=items.filter(i=>`${i.name} ${i.brand} ${i.type} ${i.subtype} ${i.model}`.toLowerCase().includes(q)).slice(0,8);
  if(gearHits.length){
    html+=`<div class="gsearch-section"><div class="gsearch-section-label">Gear</div>${gearHits.map(i=>`<div class="gsearch-row" onclick="closeGlobalSearch();openDetail('${esc(i.gear_id)}')"><span style="font-size:20px">${CAT_EMOJI[i.category]||'ðŸŽ’'}</span><span class="gsearch-row-main">${esc(i.name)}</span><span class="gsearch-row-sub">${esc(i.brand||'')}${i.subtype?' Â· '+esc(i.subtype):''}</span></div>`).join('')}</div>`;
  }
  // Trips
  const tripHits=trips.filter(t=>(t.name||'').toLowerCase().includes(q)||(t.notes||'').toLowerCase().includes(q)).slice(0,4);
  if(tripHits.length){
    const statusLabel={planned:'Planned',in_progress:'In Progress',ended:'Ended'};
    html+=`<div class="gsearch-section"><div class="gsearch-section-label">Trips</div>${tripHits.map(t=>`<div class="gsearch-row" onclick="closeGlobalSearch();showSec('trips');openTripDetail('${esc(t.trip_id)}')">${IC.pin}<span class="gsearch-row-main">${esc(t.name)}</span><span class="gsearch-row-sub">${statusLabel[t.status]||t.status} Â· ${t.gear_ids.length} items</span></div>`).join('')}</div>`;
  }
  // Lent â€” active lends by borrower name or item name
  const lentHits=lends.filter(l=>!l.date_returned&&(`${l.lent_to} ${l.gear_name}`.toLowerCase().includes(q))).slice(0,4);
  if(lentHits.length){
    html+=`<div class="gsearch-section"><div class="gsearch-section-label">Lent Out</div>${lentHits.map(l=>`<div class="gsearch-row" onclick="closeGlobalSearch();showSec('lent')">${IC.send}<span class="gsearch-row-main">${esc(l.gear_name||'')}</span><span class="gsearch-row-sub">â†’ ${esc(l.lent_to)}${l.date_due?' Â· due '+esc(l.date_due):''}</span></div>`).join('')}</div>`;
  }
  if(!html) html='<div class="gsearch-empty">No results for "'+esc(q)+'"</div>';
  res.innerHTML=html;
}
function clearFilters(){
  ['fCat','filterType','filterSubtype','filterBrand','fProdYear','fSt','filterTag'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('searchInput').value='';
  onFilterCatChange();
  renderAll();
}
function populateFilterDropdowns(){
  populateCategoryDropdowns();
  const fb=document.getElementById('filterBrand'); if(!fb) return;
  const curBrand=fb.value;
  fb.innerHTML='<option value="">All Brands</option>';
  [...new Set(items.map(i=>i.brand).filter(Boolean))].sort().forEach(b=>{const o=document.createElement('option');o.value=b;o.textContent=b;if(b===curBrand)o.selected=true;fb.appendChild(o);});
  const fy=document.getElementById('fProdYear');
  const curYear=fy.value;
  fy.innerHTML='<option value="">All Prod. Years</option>';
  [...new Set(items.map(i=>i.date_produced?String(i.date_produced).substring(0,4):null).filter(Boolean))].sort().reverse().forEach(y=>{const o=document.createElement('option');o.value=y;o.textContent=y;if(y===curYear)o.selected=true;fy.appendChild(o);});
  const ft=document.getElementById('filterType');
  const curType=ft.value;
  const cat=document.getElementById('fCat').value;
  ft.innerHTML='<option value="">All Types</option>';
  ft.disabled=false;
  const types=cat&&lookups.hierarchy[cat]?Object.keys(lookups.hierarchy[cat]):[...new Set(items.map(i=>i.type).filter(Boolean))];
  types.sort().forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;if(t===curType)o.selected=true;ft.appendChild(o);});
  const fs=document.getElementById('filterSubtype');
  const curSub=fs.value;
  fs.innerHTML='<option value="">All Subtypes</option>';
  fs.disabled=false;
  let subs=[];
  if(cat&&curType&&lookups.hierarchy[cat]&&lookups.hierarchy[cat][curType]){subs=lookups.hierarchy[cat][curType];}
  else if(curType){subs=[...new Set(items.filter(i=>i.type===curType).map(i=>i.subtype).filter(Boolean))].sort();}
  else if(cat){subs=[...new Set(items.filter(i=>i.category===cat).map(i=>i.subtype).filter(Boolean))].sort();}
  else{subs=[...new Set(items.map(i=>i.subtype).filter(Boolean))].sort();}
  subs.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;if(s===curSub)o.selected=true;fs.appendChild(o);});
  const ftag=document.getElementById('filterTag');
  if(ftag){
    const curTag=ftag.value;
    ftag.innerHTML='<option value="">All Tags</option>';
    (lookups.tags||[]).sort().forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;if(t===curTag)o.selected=true;ftag.appendChild(o);});
  }
}
function currentLend(gear_id){return lends.find(l=>l.gear_id===gear_id&&!l.date_returned);}

