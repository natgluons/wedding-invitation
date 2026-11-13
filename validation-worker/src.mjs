const headers = {
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
  'X-Content-Type-Options':'nosniff'
};
const reply = (body, status=200) => Response.json(body,{status,headers});
export async function sha256(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))), b=>b.toString(16).padStart(2,'0')).join('');
}
export function validateSnapshot(body) {
  if (!body || !Array.isArray(body.guests) || body.guests.length>10000 || !Number.isSafeInteger(body.version)) throw Error('Invalid snapshot');
  const seen=new Set();
  return body.guests.map(row=>{
    if (!row || !/^[a-f0-9]{64}$/.test(row.codeHash) || seen.has(row.codeHash) || typeof row.name!=='string' || !row.name.trim() || row.name.length>100 || !Number.isInteger(row.maxGuests) || row.maxGuests<1 || row.maxGuests>100 || typeof row.revoked!=='boolean') throw Error('Invalid guest row');
    seen.add(row.codeHash);
    return {codeHash:row.codeHash,name:row.name.trim(),maxGuests:row.maxGuests,revoked:row.revoked?1:0};
  });
}
async function authorized(request,secret) {
  if (!secret) return false;
  return await sha256(request.headers.get('Authorization')||'') === await sha256('Bearer '+secret);
}
export default {
  async fetch(request, env) {
    const path=new URL(request.url).pathname;
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
    try {
      if(path==='/health' && request.method==='GET') {
        const state=await env.DB.prepare('SELECT synced_at FROM sync_state WHERE id=1').first();
        return reply({ok:true,ready:Boolean(state),syncedAt:state?new Date(state.synced_at).toISOString():null});
      }
      if(path==='/sync' && request.method==='POST') {
        if(!await authorized(request,env.SYNC_SECRET)) return reply({ok:false,error:'Unauthorized'},401);
        const text=await request.text();
        if(text.length>2000000) return reply({ok:false,error:'Snapshot too large'},413);
        let body,rows;
        try {body=JSON.parse(text);rows=validateSnapshot(body);}catch{return reply({ok:false,error:'Invalid snapshot'},400);}
        const previous=await env.DB.prepare('SELECT source_version FROM sync_state WHERE id=1').first();
        if(previous && body.version<previous.source_version) return reply({ok:false,error:'Stale snapshot'},409);
        // Three statements in a transaction; stale concurrent snapshots cannot replace newer data.
        const condition='NOT EXISTS (SELECT 1 FROM sync_state WHERE id=1 AND source_version>?)';
        await env.DB.batch([
          env.DB.prepare('DELETE FROM guests WHERE '+condition).bind(body.version),
          env.DB.prepare(`INSERT INTO guests(code_hash,name,max_guests,revoked) SELECT json_extract(value,'$.codeHash'),json_extract(value,'$.name'),json_extract(value,'$.maxGuests'),json_extract(value,'$.revoked') FROM json_each(?) WHERE ${condition}`).bind(JSON.stringify(rows),body.version),
          env.DB.prepare('INSERT INTO sync_state(id,synced_at,source_version) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET synced_at=excluded.synced_at,source_version=excluded.source_version WHERE excluded.source_version>=sync_state.source_version').bind(Date.now(),body.version)
        ]);
        return reply({ok:true,count:rows.length});
      }
      if(path==='/validate' && request.method==='POST') {
        const text=await request.text();
        if(text.length>4096) return reply({ok:false,error:'Invalid invitation'},400);
        let code;
        try{code=JSON.parse(text).code;}catch{return reply({ok:false,error:'Invalid invitation'},400);}
        if(typeof code!=='string'||!/^[a-zA-Z0-9]{8,64}$/.test(code)) return reply({ok:false,error:'Invalid invitation'},400);
        const hash=await sha256(code);
        // One indexed query returns readiness and the matching guest only.
        const row=await env.DB.prepare('SELECT s.synced_at,g.name,g.max_guests,g.revoked FROM sync_state s LEFT JOIN guests g ON g.code_hash=? WHERE s.id=1').bind(hash).first();
        if(!row || Date.now()-row.synced_at>Number(env.MAX_SYNC_AGE_SECONDS||900)*1000) return reply({ok:false,unavailable:true},503);
        if(!row.name || row.revoked) return reply({ok:false,error:'Invalid invitation'},403);
        return reply({ok:true,guest:{name:row.name,maxGuests:row.max_guests}});
      }
      return reply({ok:false,error:'Not found'},404);
    }catch{return reply({ok:false,unavailable:true},503);}
  }
};
