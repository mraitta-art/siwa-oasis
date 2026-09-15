const mysql = require('./node_modules/mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com', port: 4000,
    user: '3iv5fPeLo2ze3jn.root', password: 'Dj2teUVtQyMYghF3',
    database: 'siwa_oasis', ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });
  const [types] = await conn.query("SELECT id, name, parent_id, own_sections, sections, is_parent FROM business_types ORDER BY is_parent DESC, parent_id, name");
  console.log('ALL BUSINESS TYPES:');
  types.forEach(function(t){
    var own=[]; try{own=JSON.parse(t.own_sections||'[]');}catch(e){}
    var inh=[]; try{inh=JSON.parse(t.sections||'[]');}catch(e){}
    console.log('['+(t.is_parent?'PARENT':'child ')+'] id='+t.id+' name='+t.name+' parent='+t.parent_id);
    if(own.length) console.log('  own_sections: '+own.join(', '));
    if(inh.length) console.log('  sections: '+inh.join(', '));
  });
  const [secs] = await conn.query("SELECT id, name FROM sections ORDER BY name");
  console.log('\nALL SECTIONS ('+secs.length+'):');
  secs.forEach(function(s){ console.log('  '+s.id+' -> '+s.name); });
  await conn.end();
}
main().catch(function(e){console.error(e.message);});
