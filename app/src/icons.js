// One quiet, consistent stroke style across desktop controls and mobile tools.
const paths={
 orbit:'<path d="M9 3H3v6m0-6 7 7M15 21h6v-6m0 6-7-7M15 3h6v6m0-6-7 7M9 21H3v-6m0 6 7-7"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 entrance:'<path d="M4 21h16M6 21V3h12v18M6 3l9 3v15m-4-8h.01"/>',
 return:'<path d="m8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12h-3"/>',
 plan:'<path d="M3 3h18v18H3V3Zm0 7h8V3m0 7v6h10M6 21v-5h5"/>',
 spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
 edit:'<path d="m15 5 4 4M4 20l4-1L21 6l-4-4L4 15v5Z"/>',
 palette:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18h1a2 2 0 0 0 0-4 2 2 0 0 1 0-4h4a4 4 0 0 0 4-4"/><path d="M7 9h.01M10 6h.01M7 14h.01"/>',
 person:'<circle cx="12" cy="5" r="2.5"/><path d="M8 21v-5l-2-3 2-4h8l2 4-2 3v5M9 13l3 3 3-3M12 16v5"/>',
 shoes:'<path d="M4 5h5l1 6 9 3 2 3v3H3v-9l1-6Z"/><path d="M3 17h18M12 12l-1 3m4-2-1 3"/>',
 clothes:'<path d="m8 3 4 2 4-2 6 5-4 4-2-2v11H8V10l-2 2-4-4 6-5Z"/><path d="M8 3a4 4 0 0 0 8 0"/>',
 sit:'<path d="M6 3v12h13M6 10h13v5M8 15v6m9-6v6"/>',
 walk:'<circle cx="14" cy="4" r="2"/><path d="m11 8 4 2 3 4m-7-6-3 5H5m6-5-1 8 5 5m-5-5-4 5"/>',
 stop:'<path d="M6 6h12v12H6z"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 save:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 reset:'<path d="M3 4v6h6M3 10a9 9 0 1 1 1 8"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
 play:'<path d="m9 5 11 7-11 7V5Z"/>',
};
export function icon(name){return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.arrow}</svg>`;}
export function mountIcons(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
