const fs = require('fs');
const mysql = require('mysql2/promise');
(async ()=>{
  try{
    const env = fs.readFileSync('.env.production','utf8');
    const get = k => { const m = env.match(new RegExp('^'+k+'=(.*)$','m')); return m ? m[1].trim() : undefined };
    const host = get('DB_HOST') || '127.0.0.1';
    const port = Number(get('DB_PORT') || 3306);
    const user = get('DB_USER') || 'root';
    const password = get('DB_PASSWORD') || '';
    const database = get('DB_NAME') || 'siwa_oasis';
    const ssl = (get('DB_SSL')||'false').toLowerCase() === 'true';

    const conn = await mysql.createConnection({host, port, user, password, database, ssl: ssl ? {rejectUnauthorized:false} : false, connectTimeout:10000});
    const [rows] = await conn.query("SELECT id, config, updated_at FROM website_configs WHERE type='hero_carousel' ORDER BY updated_at DESC LIMIT 5");
    if(!rows || rows.length === 0){
      console.log('NO_ROWS');
      process.exit(0);
    }
    for(const r of rows){
      let cfg = r.config;
      try{ cfg = typeof cfg === 'string' ? JSON.parse(cfg) : cfg }catch(e){}
      console.log('ROW', r.id, 'updated_at', r.updated_at);
      if(cfg && Array.isArray(cfg.slides)){
        console.log('slides_count', cfg.slides.length);
        cfg.slides.slice(0,10).forEach((s,i)=>{
          console.log(' -', i+1, s.id || s.title || '<no-id>', s.title?'-"'+s.title+'"':'');
        })
      } else {
        console.log('config keys', Object.keys(cfg||{}));
      }
    }
    await conn.end();
  }catch(e){
    console.error('ERR', e.message);
    process.exit(1);
  }
})();