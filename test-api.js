const http = require('http');

async function get() {
  const res = await fetch('http://localhost:3010/api/catalog/projects?pageSize=100');
  const data = await res.json();
  console.log(data.meta);
}
get();
