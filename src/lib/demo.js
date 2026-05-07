import { createEmptyCustomFields, DEFAULT_PERSON_FIELDS, normalizePersonFields } from "./personFields";
import { createId } from "./storage";

export function buildDemoStore(personFields = DEFAULT_PERSON_FIELDS) {
  const normalizedFields = normalizePersonFields(personFields);
  const customFields = createEmptyCustomFields(normalizedFields);

  const people = [
    { id: createId("person"), name: "张三", stage: "高中", groupName: "A组", initialScore: 60, note: "执行稳定" },
    { id: createId("person"), name: "李四", stage: "高中", groupName: "B组", initialScore: 58, note: "需要提升提交率" },
    { id: createId("person"), name: "王五", stage: "初中", groupName: "A组", initialScore: 55, note: "课堂表现积极" },
    { id: createId("person"), name: "赵六", stage: "初中", groupName: "B组", initialScore: 57, note: "表现波动较大" },
    { id: createId("person"), name: "陈晨", stage: "本科", groupName: "研修组", initialScore: 64, note: "项目能力强" },
  ].map((person) => ({
    ...person,
    customFields: { ...customFields },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const tasks = [
    { id: createId("task"), title: "第三周作业提交", date: "2026-05-07", category: "作业", defaultScore: 5, description: "检查本周作业提交情况" },
    { id: createId("task"), title: "课堂互动表现", date: "2026-05-05", category: "课堂", defaultScore: 3, description: "课堂发言与协作表现" },
    { id: createId("task"), title: "项目汇报", date: "2026-05-02", category: "项目", defaultScore: 8, description: "小组项目阶段汇报" },
  ].map((task) => ({
    ...task,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const scoreEntries = [
    [0, 0, 5, "按时提交"],
    [1, 0, -2, "未提交"],
    [2, 0, 3, "部分完成"],
    [3, 0, 5, "按时提交"],
    [4, 0, 5, "质量优秀"],
    [0, 1, 4, "带动讨论"],
    [1, 1, 2, "有参与"],
    [2, 1, 5, "表现突出"],
    [3, 1, -1, "注意力不集中"],
    [4, 1, 3, "表达清晰"],
    [0, 2, 8, "结构完整"],
    [1, 2, 6, "内容基本达标"],
    [2, 2, 4, "展示略紧张"],
    [4, 2, 9, "超预期完成"],
  ];

  const scoreRecords = scoreEntries.map(([personIndex, taskIndex, scoreDelta, note]) => ({
    id: createId("record"),
    personId: people[personIndex].id,
    taskId: tasks[taskIndex].id,
    scoreDelta,
    note,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    people,
    tasks,
    scoreRecords,
    personFields: normalizedFields,
    savedAt: new Date().toISOString(),
  };
}
