async function test() {
  const res = await fetch('http://localhost:3000/api/jana/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test_child',
      name: 'Test Child',
      icon: 'fas fa-building',
      icon_color: '#8b5cf6',
      description: '',
      is_parent: false,
      parent_id: 'food',
      sections: [],
      own_sections: [],
      active: true
    })
  });
  
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", text);
}

test();
