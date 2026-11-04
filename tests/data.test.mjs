import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
// Exercise the same validation and restoration functions used by the application.
const source=fs.readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8').split('function App(){')[0].replace(/^import .*;$/gm,'');
function setup(storage={}){const context={localStorage:{getItem:k=>storage[k]??null},Date,Set,JSON,Number};vm.createContext(context);vm.runInContext(ts.transpile(source,{target:ts.ScriptTarget.ES2022}),context);return context;}
const task={id:'a',title:'测试',priority:'高',date:'2026-11-04',status:0};
test('backup accepts valid tasks and rejects corrupt fields and duplicate IDs',()=>{const c=setup();assert.equal(c.validBackup({tasks:[task],sessions:2}),true);for(const data of [{tasks:[task,task],sessions:0},{tasks:[{...task,priority:'bad'}],sessions:0},{tasks:[null],sessions:0},{tasks:[{...task,title:' '}],sessions:0},{tasks:[{...task,date:123}],sessions:0},{tasks:[],sessions:-1}])assert.equal(c.validBackup(data),false);});
test('timer restores deadline and paused state; malformed storage falls back',()=>{const timer={seconds:900,rest:false,deadline:Date.now()+900000};assert.equal(setup({'shiguang-timer-v1':JSON.stringify(timer)}).readTimer().deadline,timer.deadline);assert.equal(setup({'shiguang-timer-v1':'broken'}).readTimer().seconds,1500);assert.equal(setup({'shiguang-timer-v1':JSON.stringify({...timer,seconds:-10})}).readTimer().deadline,null);});
test('local calendar date uses sortable year-month-day format',()=>{assert.match(setup().today(),/^\d{4}-\d{2}-\d{2}$/);});
