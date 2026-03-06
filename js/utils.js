// ════ UTILS ════
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function safeUrl(u){const s=(u||'').trim();return/^https?:\/\//i.test(s)?s:null;}
function fmtPrice(v){return '€'+Math.round(v).toLocaleString();}
function fmtWeight(g){return g>=1000?(g/1000).toFixed(2).replace(/\.?0+$/,'')+'kg':g+'g';}
function fmtTripDate(d){if(!d) return '—';const [y,m,day]=d.split('-');const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return parseInt(day)+' '+mo[parseInt(m)-1]+' '+y;}
function fmtDate(v){
  if(!v) return '';
  // Handle Google Sheets serial number (days since 1899-12-30)
  if(typeof v==='number'){
    // Use UTC date to avoid timezone shifts
    const d=new Date(Math.round((v-25569)*86400000));
    return d.toISOString().slice(0,10);
  }
  const s=String(v);
  // Already YYYY-MM-DD — return as-is to avoid timezone shift
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  // ISO with time component — extract date part without conversion
  if(/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0,10);
  // Try local parse for other formats (e.g. "April 10, 2022")
  const parts=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if(parts) return parts[3]+'-'+parts[2].padStart(2,'0')+'-'+parts[1].padStart(2,'0');
  const d=new Date(s);
  if(!isNaN(d.getTime())){
    // Use local date parts to avoid UTC shift
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  return s;
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
['addOverlay','detailOverlay','returnOverlay','lendOverlay','addTripOverlay','tripItemPickerOverlay','newLendingOverlay'].forEach(id=>{document.getElementById(id).addEventListener('click',e=>{if(e.target===e.currentTarget) closeModal(id);});});
let toastTimer;
let _undoFn=null;
function toast(msg,dur=2500){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  document.getElementById('toastUndo').style.display='none';
  _undoFn=null;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),dur);
}
function toastWithUndo(msg,undoFn,dur=5000){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  const undoBtn=document.getElementById('toastUndo');
  undoBtn.style.display='';
  _undoFn=undoFn;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{t.classList.remove('show');_undoFn=null;},dur);
}
function toastUndoClick(){
  clearTimeout(toastTimer);
  document.getElementById('toast').classList.remove('show');
  if(_undoFn){_undoFn();_undoFn=null;}
}
async function loadAll(){document.getElementById('spin-all').style.display='';try{await connectAndLoad({force:true});}catch(e){}document.getElementById('spin-all').style.display='none';}
function toggleSidebar(){const sb=document.getElementById('sidebar');const ov=document.getElementById('sidebarOverlay');const o=sb.classList.contains('open');if(o){sb.classList.remove('open');ov.classList.remove('open');}else{sb.classList.add('open');ov.classList.add('open');}}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');}

// ════ EXPORT ════
function _download(filename,content,mime){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type:mime}));
  a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function exportJSON(){
  const payload={exported_at:new Date().toISOString(),items,lends,trips,lookups};
  _download('juodziai-gear-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(payload,null,2),'application/json');
  toast('JSON export downloaded');
}
function exportCSV(){
  const cols=['gear_id','name','brand','category','type','subtype','model','date_purchased','date_produced','price','weight_g','serial_cert','status','notes','custom_fields'];
  const esc2=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const rows=[cols.join(','),...items.map(i=>cols.map(c=>esc2(i[c])).join(','))];
  _download('juodziai-gear-'+new Date().toISOString().slice(0,10)+'.csv',rows.join('\n'),'text/csv');
  toast('CSV export downloaded');
}
