const TYPE_LABELS = Object.freeze({
  achievement: "成就",
  turningPoint: "重大转折",
  responsibility: "职责变化",
  projectMilestone: "项目里程碑",
  decision: "重要决定",
  growth: "成长经历",
  personalEvent: "个人事件",
  other: "其他",
});
const IMPORTANCE_LABELS = Object.freeze({ normal: "普通", important: "重要", major: "重大" });

function cleanText(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/<[^>]*>/g, "");
}

function timelineDateLabel(event) {
  const start = cleanText(event.startDate);
  const end = cleanText(event.endDate);
  const unit = event.datePrecision === "year" ? "年" : event.datePrecision === "month" ? "月" : "日";
  if (event.ongoing) return `${start} 至今（${unit}精度）`;
  if (end) return `${start} 至 ${end}（${unit}精度）`;
  return `${start}（${unit}精度）`;
}

function buildAnnualReview(year, tracks, events) {
  const activeEvents = events.filter((event) => !event.deletedAt);
  const byTrack = new Map(tracks.map((track) => [track.id, []]));
  for (const event of activeEvents) {
    if (!byTrack.has(event.trackId)) byTrack.set(event.trackId, []);
    byTrack.get(event.trackId).push(event);
  }
  const months = Array.from({ length: 12 }, (_unused, index) => ({
    month: index + 1,
    events: activeEvents.filter((event) => Number(String(event.startDate).slice(5, 7)) === index + 1),
  }));
  const stats = {
    total: activeEvents.length,
    work: byTrack.get("work")?.length || 0,
    personal: byTrack.get("personal")?.length || 0,
    achievements: activeEvents.filter((event) => event.type === "achievement").length,
    turningPoints: activeEvents.filter((event) => event.type === "turningPoint").length,
    major: activeEvents.filter((event) => event.importance === "major").length,
  };
  const lines = [
    `${year} 年时间轴回顾`,
    `全年记录 ${stats.total} 件：工作线 ${stats.work} 件，个人线 ${stats.personal} 件。`,
    `其中成就 ${stats.achievements} 件、重大转折 ${stats.turningPoints} 件、重大事件 ${stats.major} 件。`,
  ];
  for (const track of tracks) {
    const list = byTrack.get(track.id) || [];
    lines.push("", `${track.name}摘要：`);
    if (!list.length) lines.push("- 暂无记录");
    else list.slice().sort((left, right) => left.startDate.localeCompare(right.startDate))
      .forEach((event) => lines.push(`- ${event.startDate} · ${event.title}`));
  }
  return { year, stats, months, byTrack, text: lines.join("\n") };
}

function eventForExport(event, tracksById) {
  const track = tracksById.get(event.trackId);
  return {
    id: event.id,
    track: track ? { id: track.id, name: track.name, type: track.type } : { id: event.trackId },
    type: event.type,
    title: cleanText(event.title),
    summary: cleanText(event.summary),
    background: cleanText(event.background),
    action: cleanText(event.action),
    result: cleanText(event.result),
    impact: cleanText(event.impact),
    evidence: cleanText(event.evidence),
    startDate: event.startDate,
    endDate: event.endDate,
    datePrecision: event.datePrecision,
    ongoing: event.ongoing,
    importance: event.importance,
    tags: (event.tags || []).map(cleanText),
    source: {
      type: event.sourceType,
      id: event.sourceId,
      title: cleanText(event.sourceTitle),
      url: event.sourceUrl,
      hostname: event.sourceHostname,
      relatedTaskIds: [...(event.relatedTaskIds || [])],
    },
    presentation: {
      iconKey: event.iconKey,
      accentKey: event.accentKey,
      emphasis: event.importance,
    },
  };
}

function buildTimelineJsonExport(options = {}) {
  const tracks = Array.isArray(options.tracks) ? options.tracks : [];
  const events = Array.isArray(options.events) ? options.events.filter((event) => !event.deletedAt) : [];
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  return {
    exportVersion: "timeline-export-v1",
    exportedAt: options.exportedAt || new Date().toISOString(),
    appVersion: String(options.appVersion || ""),
    schemaVersion: Number(options.schemaVersion) || 0,
    year: Number(options.year),
    tracks: tracks.map((track) => ({
      id: track.id,
      name: cleanText(track.name),
      type: track.type,
      iconKey: track.iconKey,
      sortOrder: track.sortOrder,
    })),
    events: events.map((event) => eventForExport(event, tracksById)),
  };
}

function buildTimelineMarkdown(options = {}) {
  const tracks = Array.isArray(options.tracks) ? options.tracks : [];
  const events = Array.isArray(options.events) ? options.events.filter((event) => !event.deletedAt) : [];
  const review = buildAnnualReview(options.year, tracks, events);
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  const lines = [
    `# ${options.year} 年时间轴`,
    "",
    `> 导出时间：${options.exportedAt || new Date().toISOString()}`,
    "",
    "## 年度回顾",
    "",
    review.text,
    "",
    "## 事件",
  ];
  for (const event of events.slice().sort((left, right) => left.startDate.localeCompare(right.startDate))) {
    const track = tracksById.get(event.trackId);
    lines.push(
      "",
      `### ${cleanText(event.title)}`,
      "",
      `- 日期：${timelineDateLabel(event)}`,
      `- 轨道：${cleanText(track?.name || event.trackId)}`,
      `- 类型：${TYPE_LABELS[event.type] || "其他"}`,
      `- 重要程度：${IMPORTANCE_LABELS[event.importance] || "普通"}`,
    );
    if (event.tags?.length) lines.push(`- 标签：${event.tags.map(cleanText).join("、")}`);
    if (event.summary) lines.push("", cleanText(event.summary));
    for (const [label, value] of [
      ["背景", event.background],
      ["行动", event.action],
      ["结果", event.result],
      ["影响", event.impact],
      ["证据", event.evidence],
    ]) {
      if (value) lines.push("", `**${label}**`, "", cleanText(value));
    }
    if (event.sourceUrl) lines.push("", `来源：[${cleanText(event.sourceTitle || event.sourceHostname || "网页")}](${event.sourceUrl})`);
  }
  return lines.join("\n");
}

module.exports = {
  buildAnnualReview,
  buildTimelineJsonExport,
  buildTimelineMarkdown,
  cleanText,
  timelineDateLabel,
};
