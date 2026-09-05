const { randomUUID } = require("node:crypto");
const validId = (value) => typeof value === "string" && /^[\w-]{1,100}$/.test(value) && !["__proto__", "constructor", "prototype", "all", "ungrouped"].includes(value);

function normalizeSiteLibrary(value) {
  const input = value && typeof value === "object" ? value : {};
  const groups = [];
  const ids = new Set();
  for (const group of Array.isArray(input.groups) ? input.groups.slice(0, 100) : []) {
    const name = typeof group?.name === "string" ? group.name.trim().slice(0, 40) : "";
    if (!validId(group?.id) || !name || ids.has(group.id)) continue;
    ids.add(group.id);
    groups.push({ id: group.id, name });
  }
  return {
    groups,
    assignments: Object.fromEntries(Object.entries(input.assignments || {}).filter(([id, groupId]) => validId(id) && ids.has(groupId)).slice(0, 10000)),
    collapsed: Array.isArray(input.collapsed) ? [...new Set(input.collapsed.filter((id) => ids.has(id) || id === "ungrouped"))] : [],
    view: input.view === "list" ? "list" : "grid",
  };
}

function changeSiteLibrary(state, input, idFactory = randomUUID) {
  const library = normalizeSiteLibrary(state.uiSettings?.siteLibrary);
  const action = input?.action;
  const group = library.groups.find((item) => item.id === input?.groupId);
  if (["rename", "delete"].includes(action) && !group) throw new Error("找不到这个分组");
  if (["create", "rename"].includes(action)) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 40) throw new Error("分组名称须为 1–40 个字符");
    if (library.groups.some((item) => item !== group && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error("已有同名分组");
    if (action === "rename") group.name = name;
    else {
      if (library.groups.length >= 100) throw new Error("最多创建 100 个分组");
      const id = idFactory();
      if (!validId(id) || library.groups.some((item) => item.id === id)) throw new Error("无法生成分组编号");
      library.groups.push({ id, name });
    }
  } else if (action === "delete") {
    library.groups = library.groups.filter((item) => item.id !== group.id);
    library.assignments = Object.fromEntries(Object.entries(library.assignments).filter(([, id]) => id !== group.id));
    library.collapsed = library.collapsed.filter((id) => id !== group.id);
  } else if (action === "assign") {
    if (!state.sites.some((site) => site.id === input.siteId)) throw new Error("找不到这个站点");
    if (input.groupId && !group) throw new Error("找不到目标分组");
    if (group) library.assignments[input.siteId] = group.id;
    else delete library.assignments[input.siteId];
  } else if (action === "collapse") {
    if (!group && input.groupId !== "ungrouped") throw new Error("找不到这个分组");
    library.collapsed = library.collapsed.includes(input.groupId) ? library.collapsed.filter((id) => id !== input.groupId) : [...library.collapsed, input.groupId];
  } else if (action === "view") {
    if (!["grid", "list"].includes(input.view)) throw new Error("无效的布局");
    library.view = input.view;
  } else throw new Error("不支持的分组操作");
  return library;
}

module.exports = { normalizeSiteLibrary, changeSiteLibrary };
