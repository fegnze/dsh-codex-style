export function processView(node, state) {
  const turn = node?.location?.turn;
  if (turn?.status !== 'closed' || !state) return null;
  const reason = turn.end?.data?.reason?.kind;
  const unsafe = reason === 'aborted' || reason === 'error';
  const elapsed = turn.start && turn.end ? turn.end.time - turn.start.time : undefined;
  return {
    open: unsafe || !state.foldable || state.open,
    canCollapse: !unsafe && state.foldable && state.hasContent,
    reason,
    elapsed: Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : undefined,
  };
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '';
  const seconds = Math.max(1, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours ? `${hours}小时 ` : ''}${minutes ? `${minutes}分钟 ` : ''}${seconds % 60}秒`;
}
