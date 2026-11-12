const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = 'K7ZM3PQ8X2';
const other = 'b'.repeat(32);
const guests = [['Name','Max guests','Revoke','Code','Invitation link'], ['Alice',2,'',code,''], ['Alice',1,false,other,'']];
const records = [['Submitted at','Name','Attendance','Guests','Message','Invited as','Page','Events','Guest code']];
function sheet(rows) {
  return {
    getLastRow: () => rows.length, getLastColumn: () => rows[0].length,
    getDataRange: () => ({getValues: () => rows}),
    getRange: (r,c,h=1,w=1) => ({
      getValues: () => rows.slice(r-1,r-1+h).map(row=>row.slice(c-1,c-1+w)),
      setValues: values => values.forEach((row,i)=>row.forEach((v,j)=>{ rows[r-1+i] ||= []; rows[r-1+i][c-1+j]=v; }))
    }), appendRow: row=>rows.push(row)
  };
}
const wishes = [['Submitted at','Name','Message','Hide'], ['2026-11-12','A','Visible',''], ['2026-11-12','B','Hidden',true], ['2026-11-12','C','Visible too',false], ['2026-11-12','D','Hidden too','TRUE']];
const sheets = {Guests:sheet(guests), RSVP:sheet(records), Wishes:sheet(wishes)};
const context = vm.createContext({
  SpreadsheetApp:{openById:()=>({getSheetByName:name=>sheets[name]})},
  Utilities:{formatDate:()=> '2026-11-12'},
  ContentService:{createTextOutput: text=>({text,setMimeType(){return this;}}),MimeType:{JSON:'json',JAVASCRIPT:'js'}}
});
vm.runInContext(fs.readFileSync('rsvp-backend/Code.gs','utf8'),context);
const run = expression => vm.runInContext(expression,context);
context.data = {name:'Alice',attendance:'attending',guests:2,events:'both',code,page:'https://example.com/?code=secret'};
assert.equal(run('saveRsvp_(data).ok'),true);
assert.equal(records.length,2);
assert.equal(records[1][6],'https://example.com/');
for (const n of [0,3,1.5,'nope']) {
  context.data.guests=n;
  assert.throws(()=>run('saveRsvp_(data)'),/Party size/);
}
context.data.guests=1; context.data.name='Changed name';
assert.equal(run('saveRsvp_(data).updated'),true);
assert.equal(records.length,2);
assert.equal(records[1][1],'Alice');
context.data.code=other;
assert.equal(run('saveRsvp_(data).updated'),false);
assert.equal(records.length,3);
context.data.code=code; guests[1][2]=true;
assert.throws(()=>run('saveRsvp_(data)'),/revoked/);
guests[1][2]='';
context.data.code='invalid';
assert.throws(()=>run('saveRsvp_(data)'),/Invalid invitation/);
context.data.code=code;context.data.attendance='not-attending';context.data.guests=99;
assert.equal(run('saveRsvp_(data).ok'),true);
assert.equal(records[1][3],0);
context.data.attendance='attending';context.data.guests=1;context.data.events='fake';
assert.throws(()=>run('saveRsvp_(data)'),/Invalid event/);
guests.push(['Duplicate',2,true,code,'']);
assert.throws(()=>run('findGuest_(data.code)'),/Duplicate invitation/);
console.log('Whitelist checks passed: max counts, invalid/revoked/duplicate codes, separate same-name guests, resubmission, decline, events, private URLs.');

assert.equal(run('readWishes_().length'),2);
assert.equal(run('readWishes_().some(wish => wish.name === \'B\' || wish.name === \'D\')'),false);
console.log('Wishes Hide checks passed.');

guests.pop(); // Remove the deliberate duplicate before testing custom columns.
guests.forEach((row,index) => row.splice(2,0,index === 0 ? 'Private notes' : 'Extra information'));
assert.equal(run('findGuest_(data.code).name'),'Alice');
assert.equal(run('findGuest_(data.code).maxGuests'),2);
guests[1][3]=true;
assert.throws(()=>run('findGuest_(data.code)'),/revoked/);
console.log('Inserted guest column checks passed.');
