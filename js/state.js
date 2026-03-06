// â•â•â•â• STATE â•â•â•â•
let items=[], lends=[], lookups={brands:[],hierarchy:{}}, trips=[];
let editingId=null, curSection='all', curView='table', sortCol='brand', sortAsc=true;
let editingTripId=null, currentTripId=null;
let _packingMode=false, _packingChecked={};
let _dupGearIds=null;
const _charts={};
let countMode='stacked', catMode='category', spendMode='stacked', spendCatMode='category';

const CAT_EMOJI={};
const CAT_COLORS={
  'Camping':{bg:'rgba(61,122,46,0.8)',border:'#3d7a2e',tagBg:'#e4f2df',tagColor:'#3d7a2e'},
  'Mountaineering & Climbing':{bg:'rgba(26,107,138,0.75)',border:'#1a6b8a',tagBg:'#ddf0f7',tagColor:'#1a6b8a'},
  'Skiing & Snowboarding':{bg:'rgba(90,58,181,0.75)',border:'#5a3ab5',tagBg:'#ede8fb',tagColor:'#5a3ab5'},
  'Helmets':{bg:'rgba(180,80,40,0.75)',border:'#b45028',tagBg:'#f7e4dc',tagColor:'#b45028'},
  'Footwear':{bg:'rgba(140,100,40,0.75)',border:'#8c6428',tagBg:'#f2ecdf',tagColor:'#8c6428'},
  'Carry':{bg:'rgba(40,120,80,0.75)',border:'#287850',tagBg:'#dcf0e7',tagColor:'#287850'},
  'Lighting':{bg:'rgba(180,140,0,0.75)',border:'#b48c00',tagBg:'#f5edcc',tagColor:'#8c6a00'},
  'Apparel':{bg:'rgba(80,60,160,0.75)',border:'#503ca0',tagBg:'#e5e0f7',tagColor:'#503ca0'},
  'EDC':{bg:'rgba(120,60,60,0.75)',border:'#783c3c',tagBg:'#f2e0e0',tagColor:'#783c3c'},
  'Electronics':{bg:'rgba(30,100,160,0.75)',border:'#1e64a0',tagBg:'#d8eaf7',tagColor:'#1e64a0'},
};
// Fallback colors for user-added categories
const EXTRA_COLORS=[
  {bg:'rgba(180,60,60,0.75)',border:'#b43c3c',tagBg:'#f7dede',tagColor:'#b43c3c'},
  {bg:'rgba(60,140,140,0.75)',border:'#3c8c8c',tagBg:'#dcf1f1',tagColor:'#3c8c8c'},
  {bg:'rgba(140,100,40,0.75)',border:'#8c6428',tagBg:'#f2ecdf',tagColor:'#8c6428'},
  {bg:'rgba(80,60,160,0.75)',border:'#503ca0',tagBg:'#e5e0f7',tagColor:'#503ca0'},
  {bg:'rgba(40,120,80,0.75)',border:'#287850',tagBg:'#dcf0e7',tagColor:'#287850'},
];
function getCatColor(cat){
  if(CAT_COLORS[cat]) return CAT_COLORS[cat];
  const idx=Object.keys(lookups.hierarchy||{}).sort().indexOf(cat);
  return EXTRA_COLORS[idx%EXTRA_COLORS.length]||{bg:'rgba(120,120,120,0.6)',border:'#888',tagBg:'var(--surface2)',tagColor:'var(--muted)'};
}
function getCatTagStyle(cat){const c=getCatColor(cat);return `background:${c.tagBg};color:${c.tagColor}`;}
const PALETTE=['#3a7d44','#1a6b8a','#5a3ab5','#e07b00','#d63031','#2aa0c8','#5cb85c','#8a6be0','#f5a623','#ff6b6b'];
let CATS=[]; // dynamically updated from lookups.hierarchy
const SECTIONS=['all','lent','trips','retired','inspection','statistics','settings'];

// â•â•â•â• HIERARCHY DEFINITION â•â•â•â•
const NEW_HIERARCHY={
  "Camping":{"Shelters":["Tents","Tarps","Bivys"],"Sleeping Systems":["Sleeping Bags","Sleeping Pads"],"Camp Kitchen":["Stoves","Cookware","Water Filters","Dinnerware"]},
  "Mountaineering & Climbing":{"Harnesses":["Sport Climbing Harnesses","Mountaineering Harnesses","Trad Climbing Harnesses"],"Ropes":["Single Ropes","Double Ropes","Twin Ropes","Accessory Cords"],"Carabiners":["Non-Locking","Screw-Lock","Twist-Lock","Triple-Lock"],"Quickdraws":["Sport Quickdraws","Alpine Quickdraws","Trad Quickdraws"],"Slings":["Sewn Slings","Daisy Chains","PAS","Via Ferrata Lanyards"],"Protection":["Cams","Nuts","Hexes","Tricams","Ice Screws"],"Belay & Descend":["Tube Style / Plaquette","Assisted-Braking"],"Ascenders":["Handled Ascenders","Micro Ascenders"],"Pulleys":["Compact Pulleys","High-Efficiency Pulleys","Pulley-Carabiners","Progress-Capture Pulleys"],"Ice Axes":["Walking Ice Axes","Technical Ice Axes"],"Ice Axe Accessories":["Ice Axe Leashes","Abalakov Hooks","Caritools"],"Crampons":["Walking Crampons","Technical Crampons"]},
  "Skiing & Snowboarding":{"Skis":["XC Skis","Ski-Touring Skis"],"Snowboards":[],"Bindings":["Ski Bindings","Snowboard Bindings"]},
  "Helmets":{"Climbing Helmets":[],"Ski Helmets":[]},
  "Footwear":{"Mountaineering Boots":[],"Climbing Shoes":[],"Snowboard Softboots":[],"Snowboard Hardboots":[],"XC Boots":[]},
  "Carry":{"Backpacks":["Climbing Packs","Ski Touring Packs","Hiking Packs","Summit Packs"],"Dry Bags":[]},
  "Lighting":{"Headlamps":[],"Lanterns":[]},
  "Apparel":{"Gloves":[]},
  "EDC":{"Knives":[],"Multitools":[]},
  "Electronics":{"GPS":[],"Watches":[],"Power Banks":[],"Satellite Communicators":[]}
};

