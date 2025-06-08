"use strict";(()=>{var e={};e.id=707,e.ids=[707],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},2048:e=>{e.exports=require("fs")},629:e=>{e.exports=require("fs/promises")},5315:e=>{e.exports=require("path")},7241:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>w,patchFetch:()=>y,requestAsyncStorage:()=>h,routeModule:()=>f,serverHooks:()=>x,staticGenerationAsyncStorage:()=>k});var r={};s.r(r),s.d(r,{POST:()=>m});var a=s(9303),o=s(8716),n=s(3131),i=s(7070),u=s(629),p=s.n(u),l=s(5315),c=s.n(l),d=s(3673),g=s.n(d);async function m(e){let{loopId:t}=await e.json();if(!t)return i.NextResponse.json({message:"Missing loopId"},{status:400});try{let e=c().resolve(process.cwd(),"..","..","..","runtime","workstreams","roadmap","workstream_plan.md"),s=await p().readFile(e,"utf-8"),r=function(e){let t;let s=[],r=/-\s\[\s\]\s(.*?)\n\s+`added_by:/g;for(;null!==(t=r.exec(e));)s.push(t[1].trim());return s}(s),a=c().resolve(process.cwd(),"..","..","..","runtime","loops",`${t}.md`),o=await p().readFile(a,"utf-8"),{data:n,content:u}=g()(o),l=`
            Given the following context from a system loop and the list of open tasks from the master workstream plan, suggest the next task.

            **Loop Context:**
            - Title: ${n.title}
            - Summary: ${n.summary}
            
            **Existing Open Tasks in Plan:**
            ${r.map(e=>`- ${e}`).join("\n")}

            **Instructions:**
            1.  Review the loop context and the list of open tasks.
            2.  Do not suggest a task that is already on the list.
            3.  If your suggestion is a refinement or sub-task of an existing task, state which one it relates to.
            4.  If it is a new task, it must be justified by the loop context. Provide a one-sentence justification in a 'context' field.
            5.  The suggestion should be a single, actionable task.

            Provide your output in JSON format with the following structure:
            {
                "type": "new" | "refinement",
                "task_description": "The suggested task.",
                "parent_task": "The parent task if type is refinement, otherwise null.",
                "context": "Justification for a new task, otherwise null."
            }
        `;return console.log("Generated Prompt:",l),i.NextResponse.json({type:"new",task_description:"Create a visual representation of the roadmap lineage in the System View",parent_task:null,context:"The System View currently lacks a clear visual guide for phase progression, which is a key objective."})}catch(t){console.error("Failed to get plan suggestion:",t);let e=t instanceof Error?t.message:"Internal Server Error";return i.NextResponse.json({message:"Failed to get plan suggestion",error:e},{status:500})}}let f=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/suggest-plan-task/route",pathname:"/api/suggest-plan-task",filename:"route",bundlePath:"app/api/suggest-plan-task/route"},resolvedPagePath:"/Users/air/Projects/ora-system/src/ui/react-app/app/api/suggest-plan-task/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:h,staticGenerationAsyncStorage:k,serverHooks:x}=f,w="/api/suggest-plan-task/route";function y(){return(0,n.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:k})}}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[276,972,673],()=>s(7241));module.exports=r})();