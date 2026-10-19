import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, processView } from '../src/model.mjs';
import { apply, STYLE_PROMPT } from '../src/prompt.mjs';
import { readFileSync } from 'node:fs';

test('DSH compatibility is exact without requiring another host', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const range = '0.2.0-rc.2 || 0.2.1-rc.2';
  assert.equal(pkg.engines.dsh, range);
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh-app-boot'], range);
  assert.equal(pkg.peerDependenciesMeta['@deepseek-ai/dsh-app-boot'].optional, true);
});

test('duration uses recorded time and handles hours and missing timing', () => {
  assert.equal(formatDuration(167000), '2分钟 47秒');
  assert.equal(formatDuration(3600000), '1小时 0秒');
  assert.equal(formatDuration(0), '1秒');
  assert.equal(formatDuration(NaN), '');
});
const node = (reason = 'completed') => ({ location: { kind: 'turn', turn: { status: 'closed', start: { time: 1000 }, end: { time: 168000, data: { reason: { kind: reason } } } } } });
const state = { foldable: true, open: false, hasContent: true };
test('completed process follows native owner and errors/aborts cannot collapse', () => {
  assert.deepEqual(processView(node(), state), { open: false, canCollapse: true, reason: 'completed', elapsed: 167000 });
  for (const reason of ['error', 'aborted']) { const view = processView(node(reason), state); assert.equal(view.open, true); assert.equal(view.canCollapse, false); }
  assert.equal(processView(node(), { ...state, foldable: false }).canCollapse, false);
});
test('running, absent owner and invalid timing do not produce fake duration', () => {
  const value = node(); value.location.turn.status = 'open'; assert.equal(processView(value, state), null);
  assert.equal(processView(node(), undefined), null);
  delete value.location.turn.start; value.location.turn.status = 'closed'; assert.equal(processView(value, state).elapsed, undefined);
});
test('prompt is additive, removable, does not replace system prompt or restrict tools', () => {
  let section, disposed = false, dispose;
  apply({ effect(fn) { dispose = fn(); }, systemPrompt: { section(value) { section = value; return () => { disposed = true; }; } } });
  assert.equal(section.text, STYLE_PROMPT); assert.equal(section.complete, undefined); assert.equal(section.interpolate, false);
  assert.match(STYLE_PROMPT, /未执行/); assert.match(STYLE_PROMPT, /不改变权限/); dispose(); assert.equal(disposed, true);
});
