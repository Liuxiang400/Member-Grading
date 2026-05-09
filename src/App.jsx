import { useEffect, useMemo, useState } from "react";
import { buildDemoStore } from "./lib/demo";
import { downloadTextFile, parseCSV, readFileAsText, rowsToObjects, toCSV } from "./lib/csv";
import {
  createCustomFieldKey,
  createPersonDraft,
  DEFAULT_PERSON_FIELDS,
  getDefaultPersonLabel,
  getPersonFieldLabel,
  getPersonFieldValue,
  isSystemPersonField,
  normalizePersonFields,
  syncPersonDraftWithFields,
} from "./lib/personFields";
import { buildRanking, createComputedData, getDashboardMetrics, toNumber } from "./lib/score";
import { createId, emptyStore, loadStore, normalizeStore, saveStore } from "./lib/storage";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", hint: "看全局态势" },
  { key: "people", label: "People", hint: "成员管理" },
  { key: "tasks", label: "Tasks", hint: "任务与评分" },
  { key: "ranking", label: "Ranking", hint: "区间排名" },
  { key: "import", label: "Import / Export", hint: "数据流转" },
];

const SCORE_STATIC_HEADERS = [
  { key: "taskTitle", label: "任务名称" },
  { key: "taskDate", label: "任务日期" },
  { key: "score", label: "得分" },
  { key: "note", label: "备注" },
];

function formatNumber(value) {
  const number = toNumber(value);
  return number > 0 ? `+${number}` : `${number}`;
}

function formatDate(value) {
  if (!value) {
    return "--";
  }
  return String(value).slice(0, 10);
}

function createTaskDraft(task) {
  return {
    id: task?.id || "",
    title: task?.title || "",
    date: task?.date || new Date().toISOString().slice(0, 10),
    category: task?.category || "",
    defaultScore: task?.defaultScore ?? 0,
    description: task?.description || "",
  };
}

function MetricCard({ title, value, hint }) {
  return (
    <article className="metric-card">
      <p>{title}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <section className="section-card">
      <header className="section-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function TableEmpty({ title, description, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

function App() {
  const [store, setStore] = useState(() => loadStore());
  const [view, setView] = useState("dashboard");
  const [personDraft, setPersonDraft] = useState(() => createPersonDraft(undefined, DEFAULT_PERSON_FIELDS));
  const [taskDraft, setTaskDraft] = useState(createTaskDraft());
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [peopleFilters, setPeopleFilters] = useState({ stage: "", groupName: "", keyword: "" });
  const [taskFilters, setTaskFilters] = useState({ category: "", keyword: "" });
  const [scoringFilters, setScoringFilters] = useState({ stage: "", groupName: "", keyword: "" });
  const [taskScores, setTaskScores] = useState({});
  const [status, setStatus] = useState("准备开始录入数据。");
  const [newFieldDraft, setNewFieldDraft] = useState({ label: "", type: "text" });
  const [rankingFilters, setRankingFilters] = useState({
    startDate: "",
    endDate: "",
    stage: "",
    groupName: "",
    name: "",
    category: "",
    scoreView: "all",
    sortBy: "rangeScore",
    order: "desc",
  });

  const computed = useMemo(() => createComputedData(store), [store]);
  const dashboard = useMemo(() => getDashboardMetrics(store, computed), [store, computed]);
  const rankingRows = useMemo(() => buildRanking(store, rankingFilters), [store, rankingFilters]);

  const personFields = store.personFields || DEFAULT_PERSON_FIELDS;
  const customPersonFields = useMemo(
    () => personFields.filter((field) => !field.system),
    [personFields],
  );

  const personFieldMap = useMemo(
    () => new Map(personFields.map((field) => [field.key, field])),
    [personFields],
  );

  const stages = useMemo(
    () => [...new Set(store.people.map((person) => person.stage).filter(Boolean))],
    [store.people],
  );

  const groups = useMemo(
    () => [...new Set(store.people.map((person) => person.groupName).filter(Boolean))],
    [store.people],
  );

  const categories = useMemo(
    () => [...new Set(store.tasks.map((task) => task.category).filter(Boolean))],
    [store.tasks],
  );

  const rankingHeaders = useMemo(
    () => [
      { key: "rank", label: "排名" },
      { key: "name", label: getPersonFieldLabel(personFields, "name") },
      { key: "stage", label: getPersonFieldLabel(personFields, "stage") },
      { key: "groupName", label: getPersonFieldLabel(personFields, "groupName") },
      { key: "rangeScore", label: "区间得分" },
      { key: "currentScore", label: "当前总分" },
      { key: "taskCount", label: "参与任务数" },
      { key: "bonusCount", label: "加分次数" },
      { key: "penaltyCount", label: "扣分次数" },
    ],
    [personFields],
  );

  const peopleCsvHeaders = useMemo(
    () =>
      personFields.map((field) => ({
        key: field.key,
        label: field.label,
      })),
    [personFields],
  );

  const peopleTemplate = useMemo(() => {
    const row = {
      leagueBranch: "第一团支部",
      name: "张三",
      stage: "高中",
      groupName: "A班",
      studentId: "2026001",
      initialScore: 60,
    };

    customPersonFields.forEach((field, index) => {
      row[field.key] = field.type === "number" ? index + 1 : `示例${index + 1}`;
    });

    return toCSV(peopleCsvHeaders, [row]);
  }, [customPersonFields, peopleCsvHeaders]);

  const scoreTemplate = useMemo(() => {
    const nameLabel = getPersonFieldLabel(personFields, "name");
    const stageLabel = getPersonFieldLabel(personFields, "stage");
    const groupLabel = getPersonFieldLabel(personFields, "groupName");

    return toCSV(
      [
        { key: "taskTitle", label: SCORE_STATIC_HEADERS[0].label },
        { key: "taskDate", label: SCORE_STATIC_HEADERS[1].label },
        { key: "name", label: nameLabel },
        { key: "stage", label: stageLabel },
        { key: "groupName", label: groupLabel },
        { key: "score", label: SCORE_STATIC_HEADERS[2].label },
        { key: "note", label: SCORE_STATIC_HEADERS[3].label },
      ],
      [
        {
          taskTitle: "第三周作业提交",
          taskDate: "2026-05-07",
          name: "张三",
          stage: "高中",
          groupName: "A组",
          score: 5,
          note: "按时提交",
        },
      ],
    );
  }, [personFields]);

  useEffect(() => {
    setPersonDraft((current) => syncPersonDraftWithFields(current, personFields));
  }, [personFields]);

  useEffect(() => {
    if (!selectedTaskId && computed.taskStats[0]) {
      setSelectedTaskId(computed.taskStats[0].id);
    }
  }, [computed.taskStats, selectedTaskId]);

  useEffect(() => {
    if (!selectedTaskId) {
      setTaskScores({});
      return;
    }

    const scores = {};
    store.people.forEach((person) => {
      const record = store.scoreRecords.find(
        (item) => item.taskId === selectedTaskId && item.personId === person.id,
      );
      scores[person.id] = {
        scoreDelta: record ? String(record.scoreDelta) : "",
        note: record?.note || "",
      };
    });
    setTaskScores(scores);
  }, [selectedTaskId, store.people, store.scoreRecords]);

  function updateStore(updater, nextStatus) {
    setStore((current) => {
      const draft = typeof updater === "function" ? updater(current) : updater;
      return saveStore(draft);
    });

    if (nextStatus) {
      setStatus(nextStatus);
    }
  }

  function fieldLabel(fieldKey) {
    return getPersonFieldLabel(personFields, fieldKey);
  }

  function getFieldAliases(fieldKey) {
    const aliases = [fieldLabel(fieldKey)];
    const fallback = getDefaultPersonLabel(fieldKey);
    if (fallback && !aliases.includes(fallback)) {
      aliases.push(fallback);
    }
    return aliases;
  }

  function readRowValue(row, aliases) {
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(row, alias)) {
        return row[alias];
      }
    }
    return "";
  }

  function resetPersonDraft() {
    setPersonDraft(createPersonDraft(undefined, personFields));
  }

  function resetTaskDraft() {
    setTaskDraft(createTaskDraft());
  }

  function updatePersonDraftField(fieldKey, value) {
    if (isSystemPersonField(fieldKey)) {
      setPersonDraft((current) => ({ ...current, [fieldKey]: value }));
      return;
    }

    setPersonDraft((current) => ({
      ...current,
      customFields: {
        ...current.customFields,
        [fieldKey]: value,
      },
    }));
  }

  function buildPersonPayload(draft) {
    const customFields = {};

    customPersonFields.forEach((field) => {
      const rawValue = draft.customFields?.[field.key] ?? "";
      customFields[field.key] = field.type === "number" ? toNumber(rawValue) : String(rawValue || "").trim();
    });

    return {
      id: draft.id || createId("person"),
      leagueBranch: String(draft.leagueBranch || "").trim(),
      name: String(draft.name || "").trim(),
      stage: String(draft.stage || "").trim(),
      groupName: String(draft.groupName || "").trim(),
      studentId: String(draft.studentId || "").trim(),
      initialScore: toNumber(draft.initialScore),
      customFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function submitPerson(event) {
    event.preventDefault();

    if (!String(personDraft.name || "").trim()) {
      setStatus(`${fieldLabel("name")}不能为空。`);
      return;
    }

    const payload = buildPersonPayload(personDraft);
    const now = new Date().toISOString();

    updateStore((current) => {
      const exists = current.people.some((person) => person.id === payload.id);
      const nextPeople = exists
        ? current.people.map((person) =>
            person.id === payload.id
              ? {
                  ...person,
                  ...payload,
                  createdAt: person.createdAt,
                  updatedAt: now,
                }
              : person,
          )
        : [...current.people, payload];

      return {
        ...current,
        people: nextPeople.sort((left, right) => left.name.localeCompare(right.name, "zh-CN")),
      };
    }, personDraft.id ? `已更新成员：${payload.name}` : `已新增成员：${payload.name}`);

    resetPersonDraft();
  }

  function editPerson(person) {
    setPersonDraft(createPersonDraft(person, personFields));
    setView("people");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deletePerson(personId) {
    const person = store.people.find((item) => item.id === personId);
    if (!person || !window.confirm(`确认删除成员“${person.name}”？相关评分记录也会一起删除。`)) {
      return;
    }

    updateStore(
      (current) => ({
        ...current,
        people: current.people.filter((item) => item.id !== personId),
        scoreRecords: current.scoreRecords.filter((record) => record.personId !== personId),
      }),
      `已删除成员：${person.name}`,
    );
  }

  function submitTask(event) {
    event.preventDefault();
    if (!taskDraft.title.trim()) {
      setStatus("任务名称不能为空。");
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      id: taskDraft.id || createId("task"),
      title: taskDraft.title.trim(),
      date: taskDraft.date,
      category: taskDraft.category.trim(),
      defaultScore: toNumber(taskDraft.defaultScore),
      description: taskDraft.description.trim(),
      createdAt: now,
      updatedAt: now,
    };

    updateStore((current) => {
      const exists = current.tasks.some((task) => task.id === payload.id);
      const nextTasks = exists
        ? current.tasks.map((task) =>
            task.id === payload.id ? { ...task, ...payload, createdAt: task.createdAt, updatedAt: now } : task,
          )
        : [...current.tasks, payload];

      return {
        ...current,
        tasks: nextTasks.sort((left, right) => (right.date || "").localeCompare(left.date || "")),
      };
    }, taskDraft.id ? `已更新任务：${taskDraft.title}` : `已创建任务：${taskDraft.title}`);

    setSelectedTaskId(payload.id);
    resetTaskDraft();
  }

  function editTask(task) {
    setTaskDraft(createTaskDraft(task));
    setSelectedTaskId(task.id);
    setView("tasks");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteTask(taskId) {
    const task = store.tasks.find((item) => item.id === taskId);
    if (!task || !window.confirm(`确认删除任务“${task.title}”？该任务下评分记录也会一起删除。`)) {
      return;
    }

    updateStore(
      (current) => ({
        ...current,
        tasks: current.tasks.filter((item) => item.id !== taskId),
        scoreRecords: current.scoreRecords.filter((record) => record.taskId !== taskId),
      }),
      `已删除任务：${task.title}`,
    );

    if (selectedTaskId === taskId) {
      setSelectedTaskId("");
    }
  }

  function updateScoreDraft(personId, field, value) {
    setTaskScores((current) => ({
      ...current,
      [personId]: {
        scoreDelta: field === "scoreDelta" ? value : current[personId]?.scoreDelta || "",
        note: field === "note" ? value : current[personId]?.note || "",
      },
    }));
  }

  function applyDefaultScore(mode) {
    const task = store.tasks.find((item) => item.id === selectedTaskId);
    if (!task) {
      return;
    }

    const visiblePeople = filteredScoringPeople;
    const targetValue = String(task.defaultScore ?? 0);

    setTaskScores((current) => {
      const next = { ...current };
      visiblePeople.forEach((person) => {
        if (mode === "clear") {
          next[person.id] = { scoreDelta: "", note: current[person.id]?.note || "" };
        } else {
          next[person.id] = { scoreDelta: targetValue, note: current[person.id]?.note || "" };
        }
      });
      return next;
    });

    setStatus(mode === "clear" ? "已清空当前可见成员的评分草稿。" : "已为当前可见成员应用默认分值。");
  }

  function saveTaskScores() {
    if (!selectedTaskId) {
      setStatus("请先选择一个任务。");
      return;
    }

    updateStore((current) => {
      const retainedRecords = current.scoreRecords.filter((record) => record.taskId !== selectedTaskId);
      const freshRecords = current.people
        .map((person) => {
          const draft = taskScores[person.id];
          if (!draft || draft.scoreDelta === "") {
            return null;
          }

          const existing = current.scoreRecords.find(
            (record) => record.taskId === selectedTaskId && record.personId === person.id,
          );

          return {
            id: existing?.id || createId("record"),
            personId: person.id,
            taskId: selectedTaskId,
            scoreDelta: toNumber(draft.scoreDelta),
            note: draft.note?.trim() || "",
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      return {
        ...current,
        scoreRecords: [...retainedRecords, ...freshRecords],
      };
    }, "已保存当前任务评分。");
  }

  function updatePersonFieldDefinition(fieldKey, patch) {
    const currentField = personFieldMap.get(fieldKey);
    if (!currentField) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(patch, "label")) {
      const label = String(patch.label || "").trim();
      if (!label) {
        setStatus("字段名称不能为空。");
        return;
      }

      const duplicate = personFields.find(
        (field) => field.key !== fieldKey && field.label.trim() === label,
      );
      if (duplicate) {
        setStatus(`字段名称“${label}”已存在，请换一个。`);
        return;
      }
    }

    updateStore((current) => ({
      ...current,
      personFields: current.personFields.map((field) =>
        field.key === fieldKey
          ? {
              ...field,
              ...patch,
              label: Object.prototype.hasOwnProperty.call(patch, "label")
                ? String(patch.label).trim()
                : field.label,
            }
          : field,
      ),
    }), `已更新字段：${String(patch.label || currentField.label).trim()}`);
  }

  function addCustomField() {
    const label = String(newFieldDraft.label || "").trim();
    if (!label) {
      setStatus("请先输入字段名称。");
      return;
    }

    if (personFields.some((field) => field.label.trim() === label)) {
      setStatus(`字段名称“${label}”已存在，请直接修改原字段。`);
      return;
    }

    const nextKey = createCustomFieldKey(
      label,
      personFields.map((field) => field.key),
    );

    updateStore((current) => ({
      ...current,
      personFields: [
        ...current.personFields,
        {
          key: nextKey,
          label,
          type: newFieldDraft.type === "number" ? "number" : "text",
          system: false,
          required: false,
        },
      ],
      people: current.people.map((person) => ({
        ...person,
        customFields: {
          ...(person.customFields || {}),
          [nextKey]: "",
        },
      })),
    }), `已新增字段：${label}`);

    setNewFieldDraft({ label: "", type: "text" });
  }

  function removeCustomField(fieldKey) {
    const field = personFieldMap.get(fieldKey);
    if (!field || field.system) {
      return;
    }

    if (!window.confirm(`确认删除字段“${field.label}”？已有成员该列数据也会删除。`)) {
      return;
    }

    updateStore((current) => ({
      ...current,
      personFields: current.personFields.filter((item) => item.key !== fieldKey),
      people: current.people.map((person) => {
        const nextCustomFields = { ...(person.customFields || {}) };
        delete nextCustomFields[fieldKey];
        return {
          ...person,
          customFields: nextCustomFields,
        };
      }),
    }), `已删除字段：${field.label}`);

    setPersonDraft((current) => {
      const next = { ...(current.customFields || {}) };
      delete next[fieldKey];
      return {
        ...current,
        customFields: next,
      };
    });
  }

  async function importPeople(file) {
    const text = await readFileAsText(file);
    const rows = rowsToObjects(parseCSV(text));

    const imported = rows
      .map((row) => {
        const payload = {
          id: createId("person"),
          leagueBranch: String(readRowValue(row, getFieldAliases("leagueBranch")) || "").trim(),
          name: String(readRowValue(row, getFieldAliases("name")) || "").trim(),
          stage: String(readRowValue(row, getFieldAliases("stage")) || "").trim(),
          groupName: String(readRowValue(row, getFieldAliases("groupName")) || "").trim(),
          studentId: String(readRowValue(row, getFieldAliases("studentId")) || "").trim(),
          initialScore: toNumber(readRowValue(row, getFieldAliases("initialScore"))),
          customFields: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        customPersonFields.forEach((field) => {
          const rawValue = readRowValue(row, [field.label]);
          payload.customFields[field.key] = field.type === "number" ? toNumber(rawValue) : String(rawValue || "").trim();
        });

        return payload;
      })
      .filter((person) => person.name);

    if (!imported.length) {
      setStatus("导入失败：没有解析到有效成员行。");
      return;
    }

    updateStore((current) => ({
      ...current,
      people: [...current.people, ...imported],
    }), `已导入 ${imported.length} 位成员。`);
  }

  async function importScoreCsv(file) {
    const text = await readFileAsText(file);
    const rows = rowsToObjects(parseCSV(text));

    if (!rows.length) {
      setStatus("评分导入失败：文件为空。");
      return;
    }

    updateStore((current) => {
      const people = [...current.people];
      const tasks = [...current.tasks];
      const scoreRecords = [...current.scoreRecords];

      rows.forEach((row) => {
        const taskTitle = String(readRowValue(row, ["任务名称"]) || "").trim();
        const taskDate = String(readRowValue(row, ["任务日期"]) || "").trim();
        const personName = String(readRowValue(row, getFieldAliases("name")) || "").trim();
        const personStage = String(readRowValue(row, getFieldAliases("stage")) || "").trim();
        const personGroup = String(readRowValue(row, getFieldAliases("groupName")) || "").trim();

        if (!taskTitle || !personName) {
          return;
        }

        let person = people.find(
          (item) =>
            item.name === personName &&
            item.stage === personStage &&
            item.groupName === personGroup,
        );

        if (!person) {
          person = {
            id: createId("person"),
            leagueBranch: "",
            name: personName,
            stage: personStage,
            groupName: personGroup,
            studentId: "",
            initialScore: 0,
            customFields: customPersonFields.reduce((result, field) => {
              result[field.key] = "";
              return result;
            }, {}),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          people.push(person);
        }

        let task = tasks.find(
          (item) => item.title === taskTitle && item.date === taskDate,
        );

        if (!task) {
          task = {
            id: createId("task"),
            title: taskTitle,
            date: taskDate || new Date().toISOString().slice(0, 10),
            category: "",
            defaultScore: 0,
            description: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          tasks.push(task);
        }

        const existingIndex = scoreRecords.findIndex(
          (record) => record.personId === person.id && record.taskId === task.id,
        );

        const nextRecord = {
          id: existingIndex >= 0 ? scoreRecords[existingIndex].id : createId("record"),
          personId: person.id,
          taskId: task.id,
          scoreDelta: toNumber(readRowValue(row, ["得分"])),
          note: String(readRowValue(row, ["备注"]) || "").trim(),
          createdAt: existingIndex >= 0 ? scoreRecords[existingIndex].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          scoreRecords[existingIndex] = nextRecord;
        } else {
          scoreRecords.push(nextRecord);
        }
      });

      return {
        ...current,
        people,
        tasks,
        scoreRecords,
      };
    }, `已导入 ${rows.length} 条评分数据。`);
  }

  async function importBackup(file) {
    const text = await readFileAsText(file);
    const parsed = normalizeStore(JSON.parse(text));
    updateStore(parsed, "已导入 JSON 备份。");
  }

  function exportPeople() {
    const csv = toCSV(
      peopleCsvHeaders,
      computed.personStats.map((person) => {
        const row = {};
        personFields.forEach((field) => {
          row[field.key] = getPersonFieldValue(person, field.key);
        });
        return row;
      }),
    );
    downloadTextFile("scoreflow-people.csv", csv, "text/csv;charset=utf-8");
    setStatus("已导出成员 CSV。");
  }

  function exportRanking() {
    const csv = toCSV(rankingHeaders, rankingRows);
    downloadTextFile("scoreflow-ranking.csv", csv, "text/csv;charset=utf-8");
    setStatus("已导出当前排名结果。");
  }

  function exportBackup() {
    downloadTextFile("scoreflow-backup.json", JSON.stringify(store, null, 2), "application/json;charset=utf-8");
    setStatus("已导出 JSON 备份。");
  }

  function loadDemo() {
    updateStore(buildDemoStore(personFields), "已载入示例数据，可以直接体验完整流程。");
  }

  function clearAllData() {
    if (!window.confirm("确认清空当前所有数据吗？此操作不可撤销。")) {
      return;
    }

    updateStore(
      {
        ...emptyStore(),
        personFields: normalizePersonFields(personFields),
      },
      "已清空所有数据，成员字段配置已保留。",
    );

    resetPersonDraft();
    resetTaskDraft();
    setSelectedTaskId("");
  }

  const filteredPeople = computed.personStats.filter((person) => {
    if (peopleFilters.stage && person.stage !== peopleFilters.stage) {
      return false;
    }
    if (peopleFilters.groupName && person.groupName !== peopleFilters.groupName) {
      return false;
    }
    if (
      peopleFilters.keyword &&
      !person.name.toLowerCase().includes(peopleFilters.keyword.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const filteredTasks = computed.taskStats.filter((task) => {
    if (taskFilters.category && task.category !== taskFilters.category) {
      return false;
    }
    if (
      taskFilters.keyword &&
      !task.title.toLowerCase().includes(taskFilters.keyword.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const filteredScoringPeople = computed.personStats.filter((person) => {
    if (scoringFilters.stage && person.stage !== scoringFilters.stage) {
      return false;
    }
    if (scoringFilters.groupName && person.groupName !== scoringFilters.groupName) {
      return false;
    }
    if (
      scoringFilters.keyword &&
      !person.name.toLowerCase().includes(scoringFilters.keyword.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const selectedTask = computed.taskStats.find((task) => task.id === selectedTaskId);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-kicker">Task-driven member grading</span>
          <h1>ScoreFlow</h1>
          <p>把人员、任务、分数变化和区间排名串成一条干净的工作流。</p>
        </div>

        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={view === item.key ? "nav-item active" : "nav-item"}
              onClick={() => setView(item.key)}
            >
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>数据已本地保存</p>
          <strong>{store.savedAt ? formatDate(store.savedAt) : "尚未保存"}</strong>
        </div>
      </aside>

      <main className="main-panel">
        <header className="hero-panel">
          <div>
            <span className="hero-kicker">MVP workflow ready</span>
            <h2>轻量级成员任务评分与排名应用</h2>
            <p>先把最常用的事做顺：维护成员、创建任务、批量录分、按区间看排名。</p>
          </div>
          <div className="hero-actions">
            <button type="button" className="ghost-button" onClick={loadDemo}>
              载入示例数据
            </button>
            <button type="button" className="danger-button" onClick={clearAllData}>
              清空数据
            </button>
          </div>
        </header>

        <div className="status-bar">
          <span>当前状态</span>
          <strong>{status}</strong>
        </div>

        {view === "dashboard" ? (
          <div className="page-grid">
            <div className="metrics-grid">
              <MetricCard title="成员总数" value={dashboard.totalPeople} hint="固定名单规模" />
              <MetricCard title="任务总数" value={dashboard.totalTasks} hint="累计可追溯任务" />
              <MetricCard title="今日评分记录" value={dashboard.todayRecords} hint="当天新增变动" />
              <MetricCard title="本周评分记录" value={dashboard.weekRecords} hint="本周活跃程度" />
              <MetricCard title="人均当前总分" value={dashboard.averageScore.toFixed(1)} hint="整体健康度" />
            </div>

            <div className="two-column-layout">
              <SectionCard title="当前总分 Top 5" subtitle="谁在稳定拉开差距">
                {dashboard.currentTop.length ? (
                  <div className="rank-list">
                    {dashboard.currentTop.map((person, index) => (
                      <div className="rank-row" key={person.id}>
                        <span className="rank-badge">{index + 1}</span>
                        <div>
                          <strong>{person.name}</strong>
                          <p>
                            {person.stage} · {person.groupName}
                          </p>
                        </div>
                        <em>{person.currentScore}</em>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TableEmpty title="还没有排名数据" description="先录入成员或导入示例数据。" />
                )}
              </SectionCard>

              <SectionCard title="本周表现 Top 5" subtitle="聚焦最近一段时间的增量表现">
                {dashboard.weekTop.length ? (
                  <div className="rank-list">
                    {dashboard.weekTop.map((person) => (
                      <div className="rank-row" key={person.personId}>
                        <span className="rank-badge">{person.rank}</span>
                        <div>
                          <strong>{person.name}</strong>
                          <p>
                            {person.stage} · {person.groupName}
                          </p>
                        </div>
                        <em>{formatNumber(person.rangeScore)}</em>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TableEmpty title="本周还没有评分变化" description="创建任务后批量录分即可看到变化。" />
                )}
              </SectionCard>
            </div>

            <div className="two-column-layout">
              <SectionCard title="小组平均分" subtitle="适合快速判断哪一组整体更稳">
                {dashboard.groups.length ? (
                  <div className="group-bars">
                    {dashboard.groups.map((group) => (
                      <div className="group-bar-row" key={group.groupName}>
                        <div className="group-bar-head">
                          <strong>{group.groupName || "未分组"}</strong>
                          <span>
                            {group.memberCount} 人 · {group.averageScore.toFixed(1)} 分
                          </span>
                        </div>
                        <div className="group-bar-track">
                          <div
                            className="group-bar-fill"
                            style={{ width: `${Math.max(10, Math.min(100, group.averageScore))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TableEmpty title="暂无小组数据" description="录入成员后这里会自动形成对比。" />
                )}
              </SectionCard>

              <SectionCard title="最近评分记录" subtitle="每次分数变化都能追溯来源">
                {dashboard.recentRecords.length ? (
                  <div className="record-feed">
                    {dashboard.recentRecords.map((record) => (
                      <div className="record-item" key={record.id}>
                        <div>
                          <strong>{record.person?.name}</strong>
                          <p>
                            {record.task?.title} · {formatDate(record.task?.date)}
                          </p>
                        </div>
                        <div className="record-meta">
                          <em className={record.scoreDelta > 0 ? "score-up" : record.scoreDelta < 0 ? "score-down" : ""}>
                            {formatNumber(record.scoreDelta)}
                          </em>
                          <span>{record.note || "无备注"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TableEmpty title="暂无评分记录" description="评分后这里会形成一条条可回溯日志。" />
                )}
              </SectionCard>
            </div>
          </div>
        ) : null}

        {view === "people" ? (
          <div className="page-grid">
            <SectionCard
              title="成员字段配置"
              subtitle="核心字段保留内部 key 以支撑排名逻辑，但展示名称和额外字段都可自定义。成员 CSV 导入导出会自动按这里的字段名匹配。"
            >
              <div className="field-config-list">
                {personFields.map((field) => (
                  <div className="field-config-row" key={field.key}>
                    <input
                      value={field.label}
                      onChange={(event) => updatePersonFieldDefinition(field.key, { label: event.target.value })}
                    />
                    <select
                      value={field.type}
                      disabled={field.system}
                      onChange={(event) => updatePersonFieldDefinition(field.key, { type: event.target.value })}
                    >
                      <option value="text">文本</option>
                      <option value="number">数字</option>
                    </select>
                    <span className={field.system ? "field-badge system" : "field-badge"}>
                      {field.system ? "系统字段" : "自定义字段"}
                    </span>
                    {!field.system ? (
                      <button type="button" className="link-button danger" onClick={() => removeCustomField(field.key)}>
                        删除
                      </button>
                    ) : (
                      <span className="helper-text">保留内部逻辑</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="field-add-row">
                <input
                  value={newFieldDraft.label}
                  onChange={(event) => setNewFieldDraft((current) => ({ ...current, label: event.target.value }))}
                  placeholder="新增一个字段名称，例如：班主任 / 城市 / 学号"
                />
                <select
                  value={newFieldDraft.type}
                  onChange={(event) => setNewFieldDraft((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="text">文本字段</option>
                  <option value="number">数字字段</option>
                </select>
                <button type="button" className="primary-button" onClick={addCustomField}>
                  添加字段
                </button>
              </div>
            </SectionCard>

            <div className="two-column-layout wide-left">
              <SectionCard
                title={personDraft.id ? "编辑成员" : "新增成员"}
                subtitle="成员表单会根据你当前定义的字段自动生成"
              >
                <form className="form-grid" onSubmit={submitPerson}>
                  {personFields.map((field) => {
                    const value = isSystemPersonField(field.key)
                      ? personDraft[field.key]
                      : personDraft.customFields?.[field.key] ?? "";

                    const isFullSpan = field.key === "note";
                    const fieldClassName = isFullSpan ? "full-span" : "";

                    if (field.key === "note" || (field.type === "text" && String(field.label).includes("备注"))) {
                      return (
                        <label key={field.key} className={fieldClassName}>
                          <span>{field.label}</span>
                          <textarea
                            rows="3"
                            value={value}
                            onChange={(event) => updatePersonDraftField(field.key, event.target.value)}
                            placeholder={`请输入${field.label}`}
                          />
                        </label>
                      );
                    }

                    return (
                      <label key={field.key} className={fieldClassName}>
                        <span>{field.label}</span>
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          value={value}
                          onChange={(event) => updatePersonDraftField(field.key, event.target.value)}
                          placeholder={`请输入${field.label}`}
                        />
                      </label>
                    );
                  })}

                  <div className="form-actions full-span">
                    <button type="submit" className="primary-button">
                      {personDraft.id ? "保存成员" : "新增成员"}
                    </button>
                    <button type="button" className="ghost-button" onClick={resetPersonDraft}>
                      清空表单
                    </button>
                    <button type="button" className="ghost-button" onClick={exportPeople}>
                      导出成员 CSV
                    </button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard title="成员列表" subtitle="成员列会按当前字段配置同步变化">
                <div className="toolbar-grid">
                  <select
                    value={peopleFilters.stage}
                    onChange={(event) => setPeopleFilters((current) => ({ ...current, stage: event.target.value }))}
                  >
                    <option value="">全部{fieldLabel("stage")}</option>
                    {stages.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <select
                    value={peopleFilters.groupName}
                    onChange={(event) => setPeopleFilters((current) => ({ ...current, groupName: event.target.value }))}
                  >
                    <option value="">全部{fieldLabel("groupName")}</option>
                    {groups.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input
                    value={peopleFilters.keyword}
                    onChange={(event) => setPeopleFilters((current) => ({ ...current, keyword: event.target.value }))}
                    placeholder={`搜索${fieldLabel("name")}`}
                  />
                </div>

                {filteredPeople.length ? (
                  <div className="table-shell">
                    <table>
                      <thead>
                        <tr>
                          {personFields.map((field) => (
                            <th key={field.key}>{field.label}</th>
                          ))}
                          <th>当前总分</th>
                          <th>最近得分</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPeople.map((person) => (
                          <tr key={person.id}>
                            {personFields.map((field) => (
                              <td key={field.key}>{String(getPersonFieldValue(person, field.key) ?? "--") || "--"}</td>
                            ))}
                            <td>{person.currentScore}</td>
                            <td className={person.recentDelta > 0 ? "score-up" : person.recentDelta < 0 ? "score-down" : ""}>
                              {formatNumber(person.recentDelta)}
                            </td>
                            <td>
                              <div className="table-actions">
                                <button type="button" className="link-button" onClick={() => editPerson(person)}>
                                  编辑
                                </button>
                                <button type="button" className="link-button danger" onClick={() => deletePerson(person.id)}>
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <TableEmpty title="暂无成员" description="手动新增一位成员，或者到导入页直接导入 CSV。" />
                )}
              </SectionCard>
            </div>
          </div>
        ) : null}

        {view === "tasks" ? (
          <div className="page-grid">
            <div className="two-column-layout">
              <SectionCard title={taskDraft.id ? "编辑任务" : "创建任务"} subtitle="创建后即可进入批量评分表格">
                <form className="form-grid" onSubmit={submitTask}>
                  <label className="full-span">
                    <span>任务名称</span>
                    <input
                      value={taskDraft.title}
                      onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="例如：第三周作业提交情况"
                    />
                  </label>
                  <label>
                    <span>任务日期</span>
                    <input
                      type="date"
                      value={taskDraft.date}
                      onChange={(event) => setTaskDraft((current) => ({ ...current, date: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>分类</span>
                    <input
                      value={taskDraft.category}
                      onChange={(event) => setTaskDraft((current) => ({ ...current, category: event.target.value }))}
                      placeholder="作业 / 课堂 / 项目"
                    />
                  </label>
                  <label>
                    <span>默认分值</span>
                    <input
                      type="number"
                      value={taskDraft.defaultScore}
                      onChange={(event) => setTaskDraft((current) => ({ ...current, defaultScore: event.target.value }))}
                    />
                  </label>
                  <label className="full-span">
                    <span>说明</span>
                    <textarea
                      rows="3"
                      value={taskDraft.description}
                      onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))}
                      placeholder="描述这个任务会如何影响评分"
                    />
                  </label>
                  <div className="form-actions full-span">
                    <button type="submit" className="primary-button">
                      {taskDraft.id ? "保存任务" : "创建任务"}
                    </button>
                    <button type="button" className="ghost-button" onClick={resetTaskDraft}>
                      清空表单
                    </button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard title="任务列表" subtitle="选中任务后，右下方直接进入评分">
                <div className="toolbar-grid">
                  <select
                    value={taskFilters.category}
                    onChange={(event) => setTaskFilters((current) => ({ ...current, category: event.target.value }))}
                  >
                    <option value="">全部分类</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input
                    value={taskFilters.keyword}
                    onChange={(event) => setTaskFilters((current) => ({ ...current, keyword: event.target.value }))}
                    placeholder="搜索任务名称"
                  />
                </div>

                {filteredTasks.length ? (
                  <div className="table-shell">
                    <table>
                      <thead>
                        <tr>
                          <th>任务名称</th>
                          <th>日期</th>
                          <th>分类</th>
                          <th>默认分值</th>
                          <th>已评分人数</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => (
                          <tr key={task.id} className={task.id === selectedTaskId ? "selected-row" : ""}>
                            <td>
                              <button type="button" className="row-select-button" onClick={() => setSelectedTaskId(task.id)}>
                                <strong>{task.title}</strong>
                                <p className="cell-note">{task.description || "无任务说明"}</p>
                              </button>
                            </td>
                            <td>{formatDate(task.date)}</td>
                            <td>{task.category || "--"}</td>
                            <td>{formatNumber(task.defaultScore)}</td>
                            <td>{task.scoredCount}</td>
                            <td>
                              <div className="table-actions">
                                <button type="button" className="link-button" onClick={() => editTask(task)}>
                                  编辑
                                </button>
                                <button type="button" className="link-button danger" onClick={() => deleteTask(task.id)}>
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <TableEmpty title="还没有任务" description="先创建一个任务，再批量录入所有成员的表现。" />
                )}
              </SectionCard>
            </div>

            <SectionCard
              title={selectedTask ? `任务评分：${selectedTask.title}` : "任务评分"}
              subtitle={selectedTask ? `${formatDate(selectedTask.date)} · 默认分值 ${formatNumber(selectedTask.defaultScore)}` : "先从上方列表选择一个任务"}
              action={
                selectedTask ? (
                  <div className="header-actions">
                    <button type="button" className="ghost-button" onClick={() => applyDefaultScore("default")}>
                      一键应用默认分
                    </button>
                    <button type="button" className="ghost-button" onClick={() => applyDefaultScore("clear")}>
                      清空可见草稿
                    </button>
                    <button type="button" className="primary-button" onClick={saveTaskScores}>
                      保存评分
                    </button>
                  </div>
                ) : null
              }
            >
              {selectedTask ? (
                <>
                  <div className="toolbar-grid">
                    <select
                      value={scoringFilters.stage}
                      onChange={(event) => setScoringFilters((current) => ({ ...current, stage: event.target.value }))}
                    >
                      <option value="">全部{fieldLabel("stage")}</option>
                      {stages.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <select
                      value={scoringFilters.groupName}
                      onChange={(event) => setScoringFilters((current) => ({ ...current, groupName: event.target.value }))}
                    >
                      <option value="">全部{fieldLabel("groupName")}</option>
                      {groups.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <input
                      value={scoringFilters.keyword}
                      onChange={(event) => setScoringFilters((current) => ({ ...current, keyword: event.target.value }))}
                      placeholder={`搜索${fieldLabel("name")}`}
                    />
                  </div>

                  <div className="table-shell">
                    <table>
                      <thead>
                        <tr>
                          <th>{fieldLabel("name")}</th>
                          <th>{fieldLabel("stage")}</th>
                          <th>{fieldLabel("groupName")}</th>
                          <th>当前总分</th>
                          <th>本次得分</th>
                          <th>备注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredScoringPeople.map((person) => (
                          <tr key={person.id}>
                            <td>{person.name}</td>
                            <td>{person.stage || "--"}</td>
                            <td>{person.groupName || "--"}</td>
                            <td>{person.currentScore}</td>
                            <td>
                              <input
                                type="number"
                                value={taskScores[person.id]?.scoreDelta ?? ""}
                                onChange={(event) => updateScoreDraft(person.id, "scoreDelta", event.target.value)}
                                className="table-input"
                              />
                            </td>
                            <td>
                              <input
                                value={taskScores[person.id]?.note ?? ""}
                                onChange={(event) => updateScoreDraft(person.id, "note", event.target.value)}
                                placeholder="备注"
                                className="table-input"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <TableEmpty title="还没选中任务" description="从任务列表点击任一任务，就能在这里批量录分。" />
              )}
            </SectionCard>
          </div>
        ) : null}

        {view === "ranking" ? (
          <div className="page-grid">
            <SectionCard
              title="区间排名"
              subtitle="围绕时间范围、学段、小组、姓名和分类筛选，再按不同维度排序"
              action={
                <button type="button" className="primary-button" onClick={exportRanking}>
                  导出当前排名
                </button>
              }
            >
              <div className="toolbar-grid ranking-grid">
                <label>
                  <span>开始日期</span>
                  <input
                    type="date"
                    value={rankingFilters.startDate}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </label>
                <label>
                  <span>结束日期</span>
                  <input
                    type="date"
                    value={rankingFilters.endDate}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, endDate: event.target.value }))}
                  />
                </label>
                <label>
                  <span>{fieldLabel("stage")}</span>
                  <select
                    value={rankingFilters.stage}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, stage: event.target.value }))}
                  >
                    <option value="">全部</option>
                    {stages.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{fieldLabel("groupName")}</span>
                  <select
                    value={rankingFilters.groupName}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, groupName: event.target.value }))}
                  >
                    <option value="">全部</option>
                    {groups.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>任务分类</span>
                  <select
                    value={rankingFilters.category}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, category: event.target.value }))}
                  >
                    <option value="">全部</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>记录类型</span>
                  <select
                    value={rankingFilters.scoreView}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, scoreView: event.target.value }))}
                  >
                    <option value="all">全部记录</option>
                    <option value="bonus">只看加分</option>
                    <option value="penalty">只看扣分</option>
                  </select>
                </label>
                <label>
                  <span>排序字段</span>
                  <select
                    value={rankingFilters.sortBy}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, sortBy: event.target.value }))}
                  >
                    <option value="rangeScore">区间得分</option>
                    <option value="currentScore">当前总分</option>
                    <option value="taskCount">参与任务数</option>
                    <option value="bonusCount">加分次数</option>
                    <option value="penaltyCount">扣分次数</option>
                    <option value="stage">{fieldLabel("stage")}</option>
                    <option value="groupName">{fieldLabel("groupName")}</option>
                    <option value="name">{fieldLabel("name")}</option>
                  </select>
                </label>
                <label>
                  <span>排序方向</span>
                  <select
                    value={rankingFilters.order}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, order: event.target.value }))}
                  >
                    <option value="desc">降序</option>
                    <option value="asc">升序</option>
                  </select>
                </label>
                <label className="wide-input">
                  <span>{fieldLabel("name")}搜索</span>
                  <input
                    value={rankingFilters.name}
                    onChange={(event) => setRankingFilters((current) => ({ ...current, name: event.target.value }))}
                    placeholder={`模糊搜索${fieldLabel("name")}`}
                  />
                </label>
              </div>

              {rankingRows.length ? (
                <div className="table-shell">
                  <table>
                    <thead>
                      <tr>
                        {rankingHeaders.map((header) => (
                          <th key={header.key}>{header.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rankingRows.map((row) => (
                        <tr key={row.personId}>
                          <td>{row.rank}</td>
                          <td>{row.name}</td>
                          <td>{row.stage || "--"}</td>
                          <td>{row.groupName || "--"}</td>
                          <td className={row.rangeScore > 0 ? "score-up" : row.rangeScore < 0 ? "score-down" : ""}>
                            {formatNumber(row.rangeScore)}
                          </td>
                          <td>{row.currentScore}</td>
                          <td>{row.taskCount}</td>
                          <td>{row.bonusCount}</td>
                          <td>{row.penaltyCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <TableEmpty title="当前条件下没有结果" description="调整时间范围或先创建任务并录分。" />
              )}
            </SectionCard>
          </div>
        ) : null}

        {view === "import" ? (
          <div className="page-grid">
            <div className="two-column-layout">
              <SectionCard title="导入数据" subtitle="成员 CSV 会按当前字段名匹配；如果你改了字段名，请先下载最新模板。">
                <div className="pill-list">
                  {personFields.map((field) => (
                    <span key={field.key} className="field-pill">
                      {field.label}
                    </span>
                  ))}
                </div>

                <div className="import-stack">
                  <label className="upload-card">
                    <span>导入成员 CSV</span>
                    <p>表头将按你当前配置的字段名识别，自定义字段也会一并导入。</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          await importPeople(file);
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <label className="upload-card">
                    <span>导入评分 CSV</span>
                    <p>评分表里的成员列会按当前“姓名 / 学段 / 小组名”显示名称识别。</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          await importScoreCsv(file);
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <label className="upload-card">
                    <span>导入 JSON 备份</span>
                    <p>用于整库迁移或恢复本地数据，也会恢复成员字段配置。</p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          await importBackup(file);
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
              </SectionCard>

              <SectionCard title="导出与模板" subtitle="CSV 已加入 UTF-8 BOM，Excel 打开不会再出现中文乱码。">
                <div className="action-stack">
                  <button type="button" className="primary-button" onClick={exportPeople}>
                    导出成员 CSV
                  </button>
                  <button type="button" className="primary-button" onClick={exportRanking}>
                    导出当前排名 CSV
                  </button>
                  <button type="button" className="ghost-button" onClick={exportBackup}>
                    导出 JSON 备份
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => downloadTextFile("people-template.csv", peopleTemplate, "text/csv;charset=utf-8")}
                  >
                    下载成员模板
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => downloadTextFile("score-template.csv", scoreTemplate, "text/csv;charset=utf-8")}
                  >
                    下载评分模板
                  </button>
                </div>
              </SectionCard>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
