import fs from "node:fs";
const c = JSON.parse(fs.readFileSync("src/data/alternatives.json","utf8"));
const banned = ["seamless","effortless","game-changer","game changer","unlock","unleash","delve","tapestry","landscape","embark","elevate","dive into","comprehensive","robust","cutting-edge","world-class"];
let hits=[];
for(const p of c.pairings){
  if(!p.editorial) continue;
  for(const para of p.editorial){
    for(const w of banned){
      if(para.body.toLowerCase().includes(w)){
        hits.push(p.paidTool.slug + ': ' + w);
      }
    }
  }
}
console.log(hits.length ? hits.join("\n") : "SLOP check: CLEAN");
