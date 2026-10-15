import React, { useSyncExternalStore } from 'react';
import { formatDuration, processView } from './model.mjs';
import css from './style.css';

export const inject = ['slots'];
const ID = 'dsh-codex-style';
// Preserve the existing settings component identity and saved preference.
const SETTINGS_ID = 'myspace-dsh-codex-style';
const PREF = `${SETTINGS_ID}.enabled`;

export function TurnProcess({ node, turnProcess }) {
  const view = processView(node, turnProcess);
  if (!view) return null;
  const label = view.reason === 'error' ? '执行失败' : view.reason === 'aborted' ? '已停止' : view.elapsed === undefined ? '执行过程' : `用时 ${formatDuration(view.elapsed)}`;
  return <><span className="cx-sr-only" role="status" aria-live="polite" aria-atomic="true">{view.reason === 'error' ? '执行失败' : view.reason === 'aborted' ? '已停止' : '执行结束'}</span>
    <button type="button" className="cx-process" data-turn-process={node.data.turn} disabled={!view.canCollapse}
      data-turn-process-messages={node.data.messageCount} data-turn-process-tool-calls={node.data.toolCallCount} data-turn-process-subagents={node.data.subagentCount}
      aria-expanded={turnProcess.hasContent ? view.open : undefined} onClick={(event) => { event.currentTarget.focus(); turnProcess.setOpen(!view.open); }}>
      <span>{label}</span>{view.canCollapse && <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" style={{ width: 14, height: 14, flex: 'none' }} className={view.open ? 'cx-chevron cx-open' : 'cx-chevron'}><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>}
    </button></>;
}

export function apply(ctx) {
  let enabled = true;
  try { enabled = localStorage.getItem(PREF) !== 'false'; } catch { /* private storage */ }
  const listeners = new Set();
  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const getEnabled = () => enabled;
  let release;
  const mount = () => {
    if (release || !enabled) return;
    const tag = document.createElement('style');
    // DSH claims unowned style tags for the next materializing Client module.
    // Stamp ownership BEFORE insertion so another module's unload cannot remove it.
    tag.dataset.plugin = ID;
    tag.dataset.pluginCss = `${ID}/style`;
    tag.dataset.codexStyle = ID;
    tag.textContent = css;
    document.head.appendChild(tag);
    document.documentElement.setAttribute('data-codex-style', '');
    let dispose;
    try {
      dispose = ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
        name: 'conversation.chat.node', key: 'turn-process', priority: -20,
      }, TurnProcess));
    } catch (error) {
      tag.remove(); document.documentElement.removeAttribute('data-codex-style');
      throw error;
    }
    release = () => {
      dispose();
      tag.remove(); document.documentElement.removeAttribute('data-codex-style'); release = undefined;
    };
  };
  const setEnabled = (value) => {
    enabled = value;
    try { localStorage.setItem(PREF, String(value)); } catch { /* session-local fallback */ }
    if (enabled) mount(); else release?.();
    for (const fn of listeners) fn();
  };
  function Settings() {
    const active = useSyncExternalStore(subscribe, getEnabled);
    return <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 0', borderBottom: '0.5px solid var(--dsw-alias-border-l2)' }}>
      <div style={{ flex: 1 }}><div>Codex 风格</div><div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', marginTop: 4 }}>简洁正文与真实用时；文件变更完整沿用原生卡。提示词可在插件管理中单独关闭，过程详略沿用原设置。</div></div>
      <button type="button" role="switch" aria-label="Codex 界面风格" aria-checked={active} onClick={() => setEnabled(!active)} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', color: 'inherit' }}>{active ? '已开启' : '已关闭'}</button>
    </div>;
  }
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({ name: 'settings.general.item', id: SETTINGS_ID, order: 13 }, Settings));
  mount();
  ctx.effect(() => () => { release?.(); listeners.clear(); });
}
