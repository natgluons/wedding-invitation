const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('main.js', 'utf8');
const context = vm.createContext({TextEncoder, Date, URL, URLSearchParams,
  config:{calendarLocation:'Magnolia Ballroom, Jakarta', calendarTimeZone:'Asia/Jakarta', calendarDefaultMinutes:120},
  t:key=>({'details.calendarTitle':'Richard & Natasha — {event}','details.holy':'Holy Matrimony','details.reception':'Reception'}[key]),
  format:(text,values)=>text.replace('{event}',values.event)});
vm.runInContext(source.slice(source.indexOf('  function calendarTimestamp('),source.indexOf('  function renderCalendarTimes(')),context);
context.events = [{id:'ceremony',label:'details.holy',start:'2027-01-17T11:00:00+07:00'},
  {id:'reception',label:'details.reception',start:'2027-01-17T18:00:00+07:00'}];
const build = () => vm.runInContext('buildCalendar(events)',context);
const calendar = build();
assert.equal((calendar.match(/BEGIN:VEVENT/g)||[]).length,2);
assert.match(calendar,/DTSTART:20270117T040000Z/);
assert.match(calendar,/DTSTART:20270117T110000Z/);
assert.match(calendar,/LOCATION:Magnolia Ballroom\\, Jakarta/);
// End times keep the event valid; the invitation still says "until finish", so
// the estimate comes from calendarDefaultMinutes rather than a fixed promise.
assert.doesNotMatch(calendar,/ATTENDEE|booking_id|code=/);
assert.equal((calendar.match(/DTEND:20270117T060000Z/g)||[]).length,1);
assert.equal((calendar.match(/DTEND:20270117T130000Z/g)||[]).length,1);
assert.equal(calendar.split('\r\n').every(line=>Buffer.byteLength(line)<=75),true);const long = '囍'.repeat(80);
context.long=long;
const folded=vm.runInContext('calendarFold(long)',context);
assert.equal(folded.replace(/\r\n /g,''),long);
assert.equal(folded.split('\r\n').every(line=>Buffer.byteLength(line)<=75),true);
context.events=context.events.slice(0,1);
assert.equal((build().match(/BEGIN:VEVENT/g)||[]).length,1);
console.log('Calendar checks passed: correct Jakarta-to-UTC times, separate event records, escaped locations, UTF-8 folding, and no guest data.');

const google = new URL(vm.runInContext('googleCalendarLink(events[0])', context));
// The entry host matters: `www.google.com/calendar/render` answers with a 302
// that keeps the query string on the calendar host, which is what lets the
// Android Calendar app pick the link up. `/r/eventedit` redirects to sign-in.
assert.equal(google.origin, 'https://www.google.com');
assert.equal(google.pathname, '/calendar/render');
assert.equal(google.searchParams.get('action'), 'TEMPLATE');
// A zero-length range (start === end) is what made Google reject the event.
assert.equal(google.searchParams.get('dates'), '20270117T040000Z/20270117T060000Z');
assert.notEqual(...google.searchParams.get('dates').split('/'));
assert.equal(google.searchParams.get('stz'), 'Asia/Jakarta');
assert.equal(google.searchParams.get('etz'), 'Asia/Jakarta');
// `ctz` is for local (non-Z) times and must not accompany UTC timestamps.
assert.equal(google.searchParams.has('ctz'), false);
assert.equal(google.searchParams.get('location'), 'Magnolia Ballroom, Jakarta');
assert.equal(google.searchParams.get('text'), 'Richard & Natasha — Holy Matrimony');
console.log('Google Calendar links passed: non-empty UTC range, stz/etz zones, no ctz conflict, and encoded title/location.');
