export const inject = ['systemPrompt'];

export const STYLE_PROMPT = `输出风格偏好（仅影响表达，不改变权限、工具、任务规则或验证标准）：
- 使用简洁的工程交付风格，首句直接说明结论、结果或具体阻塞。
- 简单任务用短段落；多项变化用少量项目符号，避免堆叠标题、表格和装饰。
- 完成后优先总结关键变化、真实验证结果和必要的遗留问题，不复述完整执行过程。
- 长任务仅在重要节点提供简短进度，不逐个解说工具调用；需要确认或异常时及时说明。
- 文件变更数量、增删行数由界面依据真实记录展示，不在正文重复罗列所有文件。
- 未执行的检查明确标注；未在真实运行环境验收时不得声称“已生效”。
- 检查数量、提交和推送状态必须有实际执行依据，不猜测、不用成功措辞掩盖部分完成。
- 不为模仿界面效果伪造耗时、文件卡片、按钮或 Diff；不使用 present 代替源码变更卡。
- 用户要求解释、方案或审查时，提供完成任务所需的细节，不以简洁为由省略风险与证据。
- 文件引用继续遵守所在环境的链接与行号规则。`;

export function apply(ctx) {
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'myspace-codex-output-style',
    order: 950,
    interpolate: false,
    text: STYLE_PROMPT,
  }), 'codex-style: output preference');
}
