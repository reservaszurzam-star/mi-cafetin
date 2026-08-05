const fs = require('fs');
const data = fs.readFileSync('src/hooks/useStore.ts', 'utf8');

let curly = 0, paren = 0, bracket = 0, line = 1;
for(let i=0; i<data.length; i++) {
  const c = data[i];
  if(c === '\n') line++;
  if(c === '{') curly++;
  if(c === '}') curly--;
  if(c === '(') paren++;
  if(c === ')') paren--;
  if(c === '[') bracket++;
  if(c === ']') bracket--;
  
  if (curly < 0) { console.log('Extra } at line ' + line); curly=0; }
  if (paren < 0) { console.log('Extra ) at line ' + line); paren=0; }
  if (bracket < 0) { console.log('Extra ] at line ' + line); bracket=0; }
}
console.log('Final -> {:', curly, '(:', paren, '[:', bracket);
