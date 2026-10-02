import { readFileSync } from "fs";
import { complianceIssues, hardIssues } from "../src/lib/workout/smarty-compliance";
const lib = JSON.parse(readFileSync("/tmp/a/exfull.json","utf8")); const sw = JSON.parse(readFileSync("/tmp/a/sw.json","utf8"));
const m = new Map(lib.map((e:any)=>[e.id,e]));
const f = sw.filter((w:any)=>hardIssues(complianceIssues(w,lib,m as any)).length);
console.log("total",sw.length,"fail",f.length,"hidden",sw.filter((w:any)=>!w.is_visible).length);
