const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const tick = () => new Promise(resolve => setImmediate(resolve));
async function setup(admin, failSave=false) {
 const dom = new JSDOM(fs.readFileSync('admin.html','utf8'), {runScripts:'outside-only',url:'https://example.com/admin.html'});
 const w=dom.window; let saved;
 w.EmployeeStore={getAdmin:async()=>admin,list:async()=>[{id:'1',name:'<img src=x onerror=alert(1)>',title:'Developer',department:'Engineering',skills:[],email:'test@example.com',image:''}],onAuthChange(){},save:async input=>{if(failSave)throw Error('Connection failed');saved=input;return {...input,id:'2'};},removePhotoIfUnused:async()=>{}};
 w.eval(fs.readFileSync('admin.js','utf8')); await tick();
 return {w,getSaved:()=>saved};
}
test('anonymous visitors cannot see management form',async()=>{const {w}=await setup(null);assert.equal(w.document.getElementById('manager-panel').hidden,true);assert.equal(w.document.getElementById('login-panel').hidden,false);w.close();});
test('employee names render as text, and approved admins can save',async()=>{const {w,getSaved}=await setup({id:'admin',email:'owner@example.com'});const d=w.document;assert.equal(d.querySelector('#admin-employees img'),null);assert.match(d.querySelector('#admin-employees').textContent,/<img src=x/);for(const [key,value] of Object.entries({name:'New Person',title:'Tester',department:'QA',email:'new@example.com'}))d.getElementById('employee-'+key).value=value;d.getElementById('employee-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(getSaved().name,'New Person');assert.equal(d.getElementById('employee-name').value,'');w.close();});
test('failed save preserves draft and restores controls',async()=>{const {w}=await setup({id:'admin',email:'owner@example.com'},true);const d=w.document;for(const [key,value] of Object.entries({name:'Draft Person',title:'Tester',department:'QA',email:'new@example.com'}))d.getElementById('employee-'+key).value=value;d.getElementById('employee-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(d.getElementById('employee-name').value,'Draft Person');assert.equal(d.getElementById('employee-fields').disabled,false);assert.match(d.getElementById('admin-status').textContent,/Connection failed/);w.close();});
