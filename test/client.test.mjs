import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
const require = createRequire(import.meta.url);
const browser = new Window({ url: 'http://localhost/' });
Object.assign(globalThis, { window: browser, document: browser.document, localStorage: browser.localStorage, HTMLElement: browser.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
const text = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8');
let client;
browser.__ModuleLoader__ = { load: ({ id, factory }) => { assert.equal(id, 'dsh-codex-style'); client = factory(require); } };
vm.runInThisContext(text);
const ID = 'dsh-codex-style';
const SETTINGS_ID = 'myspace-dsh-codex-style';
function mockContext() {
  const registrations = [], effects = [];
  return {
    registrations,
    effect(fn) { const dispose = fn(); effects.push(dispose); return dispose; },
    slots: {
      inject(name, fn) { const dispose = fn(); effects.push(dispose); return dispose; },
      register(options, component) { const entry = { options, component, active: true }; registrations.push(entry); return () => { entry.active = false; }; },
    },
    dispose() { for (const dispose of effects.reverse()) dispose?.(); },
  };
}
function render(element) { const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container); act(() => root.render(element)); return { container, close() { act(() => root.unmount()); container.remove(); } }; }

test('registers only process header and settings, leaving native changes/delivery slots alone', () => {
  localStorage.clear(); const ctx = mockContext(); client.apply(ctx);
  assert.deepEqual(ctx.registrations.map(entry => entry.options.name).sort(), ['conversation.chat.node', 'settings.general.item']);
  const process = ctx.registrations.find(entry => entry.options.key === 'turn-process');
  assert.ok(process.active); assert.equal(process.options.priority, -20);
  assert.equal(ctx.registrations.some(entry => entry.options.name.includes('turnTail') || entry.options.key === 'turn-tail'), false);
  assert.equal(client.Tail, undefined); assert.equal(client.ChangeCard, undefined);
  const css = document.querySelector('style[data-codex-style]').textContent;
  assert.doesNotMatch(css, /data-changed-files|data-codex-changes|cx-card|turnTail/);
  ctx.dispose();
});
test('DSH materialization of another module cannot claim or remove our stylesheet', () => {
  localStorage.clear();
  const insert = document.head.appendChild.bind(document.head);
  document.head.appendChild = (node) => {
    if (node.dataset?.codexStyle === ID) {
      assert.equal(node.dataset.plugin, ID, 'ownership must exist BEFORE DOM insertion');
      assert.equal(node.dataset.pluginCss, `${ID}/style`);
    }
    return insert(node);
  };
  const ctx = mockContext();
  try { client.apply(ctx); } finally { document.head.appendChild = insert; }
  // Model DSH client-modules claimStyles/removeOwnedStyles, including late loads.
  for (const tag of document.querySelectorAll('style:not([data-plugin])')) tag.dataset.plugin = 'unrelated-plugin';
  for (const tag of document.querySelectorAll('style[data-plugin="unrelated-plugin"]')) tag.remove();
  assert.equal(document.querySelectorAll(`style[data-plugin="${ID}"]`).length, 1);
  ctx.dispose(); assert.equal(document.querySelector('style[data-codex-style]'), null);
});
test('repeated toggle and unload restore native UI without touching native cards/styles', () => {
  localStorage.clear();
  const native = document.createElement('section'); native.setAttribute('data-changed-files', ''); document.body.append(native);
  const nativeStyle = document.createElement('style'); nativeStyle.dataset.plugin = 'native-deliverables'; document.head.append(nativeStyle);
  const ctx = mockContext(); client.apply(ctx);
  const settings = ctx.registrations.find(entry => entry.options.name === 'settings.general.item');
  const view = render(React.createElement(settings.component));
  assert.match(view.container.textContent, /原生卡/);
  for (let i = 0; i < 3; i++) {
    act(() => view.container.querySelector('[role=switch]').click());
    assert.equal(document.querySelector('style[data-codex-style]'), null);
    assert.equal(document.documentElement.hasAttribute('data-codex-style'), false);
    act(() => view.container.querySelector('[role=switch]').click());
    assert.equal(document.querySelectorAll('style[data-codex-style]').length, 1);
    assert.equal(document.querySelector('style[data-codex-style]').dataset.plugin, ID);
  }
  view.close(); ctx.dispose();
  assert.equal(ctx.registrations.some(entry => entry.active), false);
  assert.equal(document.querySelector('style[data-codex-style]'), null);
  assert.equal(native.isConnected, true); assert.equal(nativeStyle.isConnected, true);
  native.remove(); nativeStyle.remove();
});
test('stored off preference leaves renderers untouched but setting reachable', () => {
  localStorage.setItem(`${SETTINGS_ID}.enabled`, 'false'); const ctx = mockContext(); client.apply(ctx);
  assert.equal(ctx.registrations[0].options.id, SETTINGS_ID);
  assert.equal(ctx.registrations.length, 1); assert.equal(ctx.registrations[0].options.name, 'settings.general.item'); ctx.dispose(); localStorage.clear();
});
test('error and abort header cannot collapse and retains failure announcement', () => {
  for (const reason of ['error', 'aborted']) {
    const view = render(React.createElement(client.TurnProcess, { node: { data: { turn: 1 }, location: { turn: { status: 'closed', end: { data: { reason: { kind: reason } } } } } }, turnProcess: { foldable: true, hasContent: true, open: false, setOpen() { throw Error('must not collapse'); } } }));
    assert.equal(view.container.querySelector('button').disabled, true); assert.equal(view.container.querySelector('button').getAttribute('aria-expanded'), 'true');
    assert.match(view.container.querySelector('[role=status]').textContent, reason === 'error' ? /失败/ : /停止/); view.close();
  }
});
test('remaining process SVG has intrinsic and inline size even without stylesheet', () => {
  const opened = [];
  const view = render(React.createElement(client.TurnProcess, { node: { data: { turn: 1 }, location: { turn: { status: 'closed', start: { time: 1000 }, end: { time: 168000, data: { reason: { kind: 'completed' } } } } } }, turnProcess: { foldable: true, hasContent: true, open: false, setOpen(value) { opened.push(value); } } }));
  const svg = view.container.querySelector('svg');
  assert.equal(svg.getAttribute('width'), '14'); assert.equal(svg.getAttribute('height'), '14');
  assert.equal(svg.style.width, '14px'); assert.equal(svg.style.height, '14px');
  act(() => view.container.querySelector('button').click()); assert.deepEqual(opened, [true]);
  assert.match(view.container.textContent, /2分钟 47秒/); view.close();
});
