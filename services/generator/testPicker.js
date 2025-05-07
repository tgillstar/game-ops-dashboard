const { pickEventType } = require('./index.js');
const counts = {};
for (let i=0; i<10000; i++) {
  const t = pickEventType();
  counts[t] = (counts[t]||0) + 1;
}
console.log(counts);
