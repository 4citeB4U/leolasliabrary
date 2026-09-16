/* REGION: LEOLA.VERIFICATION | TAG: PREVIEW.BROWSER.ADAPTER
WHAT: run the existing browser suite in the authorized Vercel build environment.
WHO: LeeWay; WHY: Desktop offline and GitHub job has no assigned runner.
WHERE: build time only, never a public execution endpoint; WHEN: 2026-09-16.
HOW: packaged Chromium with Playwright. LICENSE: MIT.
A failed test may publish a PREVIEW with evidence; production must fail closed. */
const fs=require('node:fs');const path=require('node:path');
const dir=path.resolve('test-evidence');fs.mkdirSync(dir,{recursive:true});
(async()=>{
try{
 const {default:chrome}=await import('@sparticuz/chromium');
 const {chromium}=require('playwright');const launch=chromium.launch.bind(chromium);
 const executablePath=await chrome.executablePath();
 chromium.launch=opts=>launch({...opts,executablePath,args:[...chrome.args,...(opts?.args||[])]});
 console.log('LEEWAY_BROWSER_RUNTIME_READY '+executablePath);
 require('./browser-release.cjs');
}catch(e){fs.writeFileSync(path.join(dir,'browser-failure.json'),JSON.stringify({at:new Date().toISOString(),stage:'browser-startup',error:e.message,executed:false},null,2));console.error('LEEWAY_BROWSER_STARTUP_FAILED '+e.message);process.exitCode=1;}
})();
process.on('beforeExit',()=>{
const failure=fs.existsSync(path.join(dir,'browser-failure.json'));const success=fs.existsSync(path.join(dir,'browser-results.json'));
const report={commit:process.env.VERCEL_GIT_COMMIT_SHA||null,at:new Date().toISOString(),status:failure?'FAILED':success?'PASSED_BOUNDED_TESTS':'NOT_EXECUTED',deploymentEnvironment:process.env.VERCEL_ENV||'local',fullProductComplete:false};
fs.writeFileSync(path.join(dir,'build-status.json'),JSON.stringify(report,null,2));console.log('LEEWAY_VERIFICATION_RECEIPT '+JSON.stringify(report));
if(process.env.VERCEL_ENV==='preview'&&failure){console.log('PREVIEW_ONLY: failure evidence is preserved; do not promote this build.');process.exitCode=0;}
});
