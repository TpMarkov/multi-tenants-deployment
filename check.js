const fs = require('fs');
const c = fs.readFileSync('client/app/admin/menu/page.jsx', 'utf8');
let inStr = null;
for (let i = 0; i < c.length; i++) {
  if (inStr) {
    if (c[i] === inStr && c[i-1] !== '\\') inStr = null;
  } else {
    if (c[i] === '"' || c[i] === "'") inStr = c[i];
    else if (c[i] === '/' && c[i+1] === '/') {
      while (c[i+1] && c[i+1] !== '\n') i++;
    } else if (c[i] === '/' && c[i+1] === '*') {
      i += 2;
      while (c[i+1] && !(c[i] === '*' && c[i+1] === '/')) i++;
    } else if (c[i] === '/' && c[i+1] !== '/' && c[i+1] !== '*') {
      const rest = c.substring(i);
      const m = rest.match(/^\/[a-zA-Z]+/);
      if (m) {
        console.log('Potential regex at', i, ':', c.substring(i-5, i+20));
      }
    }
  }
}
