"use strict";(()=>{var e={};e.id=100,e.ids=[100],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},629:e=>{e.exports=require("fs/promises")},5315:e=>{e.exports=require("path")},8940:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>k,patchFetch:()=>w,requestAsyncStorage:()=>$,routeModule:()=>x,serverHooks:()=>h,staticGenerationAsyncStorage:()=>f});var s={};r.r(s),r.d(s,{POST:()=>g});var o=r(9303),a=r(8716),i=r(3131),n=r(7070),p=r(629),u=r.n(p),c=r(5315),l=r.n(c);let d=require("child_process");async function m(e,t){let r=await u().readFile(e,"utf-8"),s="## \uD83E\uDDE0 Memory Trace";r.includes(s)?r=r.replace(s,`${s}

${t}`):r+=`

${s}

${t}`,await u().writeFile(e,r,"utf-8")}async function g(e){try{let{loopId:t,taskDescription:r}=await e.json();if(!t||!r)return n.NextResponse.json({message:"Missing loopId or taskDescription"},{status:400});let s=l().resolve(process.cwd(),"..","..","..","runtime","loops",`${t}.md`),o=await u().readFile(s,"utf-8"),a=RegExp(`(- \\[ \\]) (${r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"g");if(!a.test(o))return n.NextResponse.json({message:"Task not found in a checklist"},{status:404});o=o.replace(a,"- [x] $2");let i=new Date().toISOString(),p=`- ${i}: Task “${r}” marked complete via UI`,c="## \uD83E\uDDFE Execution Log",g=o.indexOf(c);if(-1!==g){let e=o.indexOf("##",g+c.length),t=-1!==e?e:o.length,r=o.substring(0,t),s=o.substring(t);o=`${r.trim()}

${p}

${s.trim()}`}else o+=`

${c}

${p}`;await u().writeFile(s,o,"utf-8");let x=`\`\`\`json:memory
{
  "description": "${r}",
  "timestamp": "${i}",
  "status": "completed",
  "executor": "user"
}
\`\`\``;return await m(s,x),new Promise((e,t)=>{let r=l().join(process.cwd(),"..","..","scripts","update_qdrant_embeddings.py"),s=`python ${r}`;(0,d.exec)(s,(r,s,o)=>{if(r)return console.error(`exec error: ${r}`),t(Error(`Failed to execute embedding script: ${o}`));console.log(`stdout: ${s}`),e()})}).catch(e=>{console.error("Failed to update Qdrant embeddings:",e)}),n.NextResponse.json({message:"Task marked as complete"})}catch(t){console.error(t);let e=t instanceof Error?t.message:"Internal Server Error";return n.NextResponse.json({message:"Failed to complete task",error:e},{status:500})}}let x=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/complete-task/route",pathname:"/api/complete-task",filename:"route",bundlePath:"app/api/complete-task/route"},resolvedPagePath:"/Users/air/Projects/ora-system/src/ui/react-app/app/api/complete-task/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:$,staticGenerationAsyncStorage:f,serverHooks:h}=x,k="/api/complete-task/route";function w(){return(0,i.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:f})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[276,972],()=>r(8940));module.exports=s})();