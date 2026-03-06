// â•â•â•â• LOCAL STORAGE â•â•â•â•
function loadLocal(){
  items=JSON.parse(localStorage.getItem('sg_items')||'[]');
  lends=JSON.parse(localStorage.getItem('sg_lends')||'[]');
  trips=JSON.parse(localStorage.getItem('sg_trips')||'[]');
  const _defaultLookups=localStorage.getItem('sg_lookups');
  lookups=_defaultLookups?JSON.parse(_defaultLookups):{brands:["Black Diamond","Petzl","MSR","Osprey","Salomon","Arc'teryx","Mammut","La Sportiva","Scarpa","Camp"],tags:["mountaineering","rock-climbing","ski-touring","snowboarding","cross-country","camping","hiking","via-ferrata"],hierarchy:JSON.parse(JSON.stringify(NEW_HIERARCHY))};
  if(!lookups.tags) lookups.tags=["mountaineering","rock-climbing","ski-touring","snowboarding","cross-country","camping","hiking","via-ferrata"];
  // Replace old hierarchy in-place so the UI gets new categories immediately
  if(Object.keys(lookups.hierarchy||{}).some(k=>['Mountaineering','Skiing'].includes(k))){
    lookups.hierarchy=JSON.parse(JSON.stringify(NEW_HIERARCHY));
    localStorage.setItem('sg_lookups',JSON.stringify(lookups));
  }
  if(!items.length){
    items=[
      {gear_id:'GEAR-001',name:'Black Diamond Half Dome',brand:'Black Diamond',category:'Helmets',type:'Climbing Helmets',subtype:'',model:'Half Dome',date_purchased:'2022-04-10',price:89,weight_g:395,size_color:'M/L',serial_cert:'CE EN12492',status:'active',photo_url:'',notes:'Minor scuff right side.',tags:['rock-climbing','mountaineering']},
      {gear_id:'GEAR-002',name:'MSR Hubba Hubba NX2',brand:'MSR',category:'Camping',type:'Shelters',subtype:'Tents',model:'Hubba Hubba NX',date_purchased:'2021-06-15',price:450,weight_g:1720,size_color:'2P',serial_cert:'',status:'active',photo_url:'',notes:'Seams need resealing.',tags:['camping','hiking']},
      {gear_id:'GEAR-003',name:'Salomon Shift Pro 130 AT',brand:'Salomon',category:'Footwear',type:'Snowboard Hardboots',subtype:'',model:'Shift Pro 130',date_purchased:'2020-11-01',price:699,weight_g:1980,size_color:'27.5',serial_cert:'',status:'lent',photo_url:'',notes:'AT bindings compatible.',tags:['ski-touring']},
      {gear_id:'GEAR-004',name:'Petzl Grigri+',brand:'Petzl',category:'Mountaineering & Climbing',type:'Belay & Descend',subtype:'Assisted-Braking',model:'Grigri+',date_purchased:'2023-01-20',price:110,weight_g:175,size_color:'',serial_cert:'CE EN15151',status:'active',photo_url:'',notes:'',tags:['rock-climbing']},
      {gear_id:'GEAR-005',name:'Osprey Mutant 38',brand:'Osprey',category:'Carry',type:'Backpacks',subtype:'Climbing Packs',model:'Mutant 38',date_purchased:'2021-03-05',price:220,weight_g:1150,size_color:'S/M',serial_cert:'',status:'active',photo_url:'',notes:'',tags:['mountaineering','rock-climbing']},
      {gear_id:'GEAR-006',name:'MSR PocketRocket 2',brand:'MSR',category:'Camping',type:'Camp Kitchen',subtype:'Stoves',model:'PocketRocket 2',date_purchased:'2022-08-18',price:55,weight_g:73,size_color:'',serial_cert:'',status:'active',photo_url:'',notes:'',tags:['camping','hiking']},
      {gear_id:'GEAR-007',name:'Salomon S/Pro 120',brand:'Salomon',category:'Footwear',type:'Snowboard Hardboots',subtype:'',model:'S/Pro 120',date_purchased:'2023-10-12',price:549,weight_g:1800,size_color:'28.5',serial_cert:'',status:'active',photo_url:'',notes:'',tags:['ski-touring']},
      {gear_id:'GEAR-008',name:'Black Diamond Raven Ice Axe',brand:'Black Diamond',category:'Mountaineering & Climbing',type:'Ice Axes',subtype:'Walking Ice Axes',model:'Raven',date_purchased:'2020-02-14',price:75,weight_g:385,size_color:'60cm',serial_cert:'CE EN13089',status:'active',photo_url:'',notes:'',tags:['mountaineering']},
      {gear_id:'GEAR-009',name:'Mammut Barryvox S',brand:'Mammut',category:'Electronics',type:'GPS',subtype:'',model:'Barryvox S',date_purchased:'2022-11-20',price:380,weight_g:255,size_color:'',serial_cert:'',status:'active',photo_url:'',notes:'',tags:['ski-touring']},
      {gear_id:'GEAR-010',name:'Therm-a-Rest NeoAir XLite',brand:'Osprey',category:'Camping',type:'Sleeping Systems',subtype:'Sleeping Pads',model:'NeoAir XLite',date_purchased:'2019-07-01',price:199,weight_g:340,size_color:'R',serial_cert:'',status:'retired',photo_url:'',notes:'Punctured beyond repair.',tags:['camping','hiking']},
    ];
    lends=[{lend_id:'LEND-001',gear_id:'GEAR-003',gear_name:'Salomon Shift Pro 130 AT',lent_to:'Marek K.',date_lent:'2026-02-01',date_due:'2026-03-15',date_returned:'',condition_on_return:'',notes:''}];
    saveLocal();
  }
}
function saveLocal(){
  localStorage.setItem('sg_items',JSON.stringify(items));
  localStorage.setItem('sg_lends',JSON.stringify(lends));
  localStorage.setItem('sg_trips',JSON.stringify(trips));
  localStorage.setItem('sg_lookups',JSON.stringify(lookups));
  localStorage.setItem('sg_fetched_at',Date.now().toString());
}
function invalidateCache(){localStorage.removeItem('sg_fetched_at');}
function cacheAgeMs(){return Date.now()-(parseInt(localStorage.getItem('sg_fetched_at')||'0'));}
const CACHE_TTL_MS=10*60*1000; // 10 minutes

