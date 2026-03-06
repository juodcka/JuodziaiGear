// â•â•â•â• VIEW/SORT/SECTION â•â•â•â•
function setView(v){
  curView=v;
  document.getElementById('vCard').classList.toggle('active',v==='card');
  document.getElementById('vTable').classList.toggle('active',v==='table');
  renderAll();
}
function sortBy(col){
  if(sortCol===col) sortAsc=!sortAsc; else{sortCol=col;sortAsc=true;}
  document.querySelectorAll('.sort-arrow').forEach(el=>el.textContent='');
  const el=document.getElementById('sa-'+col);
  if(el) el.textContent=sortAsc?'â–²':'â–¼';
  syncSortSelect();
  renderAll();
}
function syncSortSelect(){
  const sel=document.getElementById('sortSelect');
  if(!sel) return;
  const val=sortCol+'|'+(sortAsc?1:0);
  if([...sel.options].some(o=>o.value===val)) sel.value=val;
}
function onSortSelect(){
  const sel=document.getElementById('sortSelect');
  if(!sel) return;
  const [col,asc]=sel.value.split('|');
  sortCol=col; sortAsc=asc==='1';
  document.querySelectorAll('.sort-arrow').forEach(el=>el.textContent='');
  const el=document.getElementById('sa-'+sortCol);
  if(el) el.textContent=sortAsc?'â–²':'â–¼';
  renderAll();
}
function applySorted(arr){
  return [...arr].sort((a,b)=>{
    const va=(a[sortCol]||'').toString().toLowerCase();
    const vb=(b[sortCol]||'').toString().toLowerCase();
    const primary=sortAsc?va.localeCompare(vb):vb.localeCompare(va);
    if(primary!==0||sortCol==='name') return primary;
    return (a.name||'').toLowerCase().localeCompare((b.name||'').toLowerCase());
  });
}
function showSec(name){
  curSection=name;
  document.querySelectorAll('[id^="sec-"]').forEach(el=>el.classList.toggle('sec-hidden',el.id!=='sec-'+name));
  document.querySelectorAll('.sidebar-item').forEach((el,i)=>el.classList.toggle('active',SECTIONS[i]===name));
  document.querySelectorAll('.mnav-item').forEach(el=>el.classList.toggle('active',el.dataset.sec===name));
  if(window.innerWidth<=900) closeSidebar();
  if(name==='settings'){renderLookupUI();const cb=document.getElementById('stickyColsToggle');if(cb) cb.checked=document.body.classList.contains('sticky-cols');}
  else if(name==='statistics') renderStatistics();
  else if(name==='inspection') renderInspection();
  else if(name==='trips'){ updateTripStatuses(); renderTrips(); }
  else renderAll();
  const fab=document.getElementById('fab');
  if(fab){
    const fabSecs={'all':['openAddModal','Add Gear'],'lent':['openNewLending','New Lending'],'trips':['openAddTrip','New Trip']};
    const fc=fabSecs[name];
    if(fc&&window.innerWidth<=720){fab.onclick=new Function(fc[0]+'()');fab.title=fc[1];fab.style.display='flex';}
    else{fab.style.display='none';}
  }
}

