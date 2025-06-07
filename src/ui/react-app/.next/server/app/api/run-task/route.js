"use strict";(()=>{var e={};e.id=907,e.ids=[907],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},629:e=>{e.exports=require("fs/promises")},5315:e=>{e.exports=require("path")},5845:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>k,requestAsyncStorage:()=>f,routeModule:()=>$,serverHooks:()=>w,staticGenerationAsyncStorage:()=>g});var s={};r.r(s),r.d(s,{POST:()=>x});var a=r(9303),i=r(8716),n=r(3131),o=r(7070),u=r(629),p=r.n(u),l=r(5315),c=r.n(l);async function d(e,t){let r=await p().readFile(e,"utf-8"),s="## \uD83E\uDDFE Execution Log",a=r.indexOf(s);if(-1!==a){let e=r.indexOf("\n##",a+1)||r.length,s=r.substring(0,e),i=r.substring(e);r=`${s.trim()}
${t}

${i.trim()}`}else r=`${r.trim()}

${s}

${t}`;await p().writeFile(e,r,"utf-8")}async function m(e,t){let r=await p().readFile(e,"utf-8"),s="## \uD83E\uDDE0 Memory Trace";r=r.includes(s)?r.replace(s,`${s}

${t}`):`${r.trim()}

${s}

${t}`,await p().writeFile(e,r,"utf-8")}async function x(e){try{let{loopId:t,taskDescription:r,loopTitle:s}=await e.json();if(!t||!r||!s)return o.NextResponse.json({message:"Missing loopId, taskDescription, or loopTitle"},{status:400});let a=`Simulated reasoning for task "${r}" in loop "${s}". The plan is to execute the following steps...`,i=c().resolve(process.cwd(),"..","..","..","runtime","loops",`${t}.md`),n=new Date().toISOString(),u=`- ${n}: Task “${r}” run via UI. Reasoning: ${a}`;await d(i,u);let p=`\`\`\`json:memory
{
  "description": "${r}",
  "timestamp": "${n}",
  "status": "executed",
  "executor": "system",
  "output": "${a}"
}
\`\`\``;return await m(i,p),o.NextResponse.json({result:a})}catch(t){console.error("Failed to run task:",t);let e=t instanceof Error?t.message:"Internal Server Error";return o.NextResponse.json({message:"Failed to run task",error:e},{status:500})}}let $=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/run-task/route",pathname:"/api/run-task",filename:"route",bundlePath:"app/api/run-task/route"},resolvedPagePath:"/Users/air/Projects/ora-system/src/ui/react-app/app/api/run-task/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:f,staticGenerationAsyncStorage:g,serverHooks:w}=$,h="/api/run-task/route";function k(){return(0,n.patchFetch)({serverHooks:w,staticGenerationAsyncStorage:g})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[276,972],()=>r(5845));module.exports=s})();