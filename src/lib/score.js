export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function byDateDesc(left, right) {
  return new Date(right).getTime() - new Date(left).getTime();
}

export function startOfWeek(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isDateInRange(dateText, startDate, endDate) {
  if (!dateText) {
    return false;
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (date < start) {
      return false;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (date > end) {
      return false;
    }
  }

  return true;
}

export function createComputedData(store) {
  const taskMap = new Map(store.tasks.map((task) => [task.id, task]));
  const personMap = new Map(store.people.map((person) => [person.id, person]));

  const recordsWithContext = store.scoreRecords
    .map((record) => ({
      ...record,
      task: taskMap.get(record.taskId),
      person: personMap.get(record.personId),
    }))
    .filter((record) => record.task && record.person)
    .sort((left, right) => byDateDesc(left.task.date || left.createdAt, right.task.date || right.createdAt));

  const personStats = store.people.map((person) => {
    const records = recordsWithContext.filter((record) => record.personId === person.id);
    const currentScore = person.initialScore + records.reduce((sum, record) => sum + toNumber(record.scoreDelta), 0);
    const recentRecord = records[0];

    return {
      ...person,
      records,
      currentScore,
      recentDelta: recentRecord ? toNumber(recentRecord.scoreDelta) : 0,
      bonusCount: records.filter((record) => toNumber(record.scoreDelta) > 0).length,
      penaltyCount: records.filter((record) => toNumber(record.scoreDelta) < 0).length,
    };
  });

  const taskStats = store.tasks
    .map((task) => {
      const records = recordsWithContext.filter((record) => record.taskId === task.id);
      return {
        ...task,
        records,
        scoredCount: records.length,
        totalDelta: records.reduce((sum, record) => sum + toNumber(record.scoreDelta), 0),
      };
    })
    .sort((left, right) => byDateDesc(left.date, right.date));

  return {
    taskMap,
    personMap,
    personStats,
    taskStats,
    recordsWithContext,
  };
}

export function getDashboardMetrics(store, computed) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const todayText = now.toISOString().slice(0, 10);

  const todayRecords = computed.recordsWithContext.filter(
    (record) => (record.task?.date || "").slice(0, 10) === todayText,
  );

  const weekRecords = computed.recordsWithContext.filter((record) => {
    const date = new Date(record.task?.date || record.createdAt);
    return date >= weekStart;
  });

  const totalScore = computed.personStats.reduce((sum, person) => sum + person.currentScore, 0);
  const groupMap = new Map();

  computed.personStats.forEach((person) => {
    const current = groupMap.get(person.groupName) || {
      groupName: person.groupName || "未分组",
      memberCount: 0,
      averageScore: 0,
      totalScore: 0,
    };

    current.memberCount += 1;
    current.totalScore += person.currentScore;
    current.averageScore = current.totalScore / current.memberCount;
    groupMap.set(person.groupName, current);
  });

  const thisWeekTop = buildRanking(store, {
    startDate: weekStart.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
    sortBy: "rangeScore",
    order: "desc",
  }).slice(0, 5);

  return {
    totalPeople: store.people.length,
    totalTasks: store.tasks.length,
    todayRecords: todayRecords.length,
    weekRecords: weekRecords.length,
    averageScore: store.people.length ? totalScore / store.people.length : 0,
    currentTop: [...computed.personStats]
      .sort((left, right) => right.currentScore - left.currentScore)
      .slice(0, 5),
    weekTop: thisWeekTop,
    groups: [...groupMap.values()].sort((left, right) => right.averageScore - left.averageScore),
    recentRecords: computed.recordsWithContext.slice(0, 8),
  };
}

export function buildRanking(store, filters = {}) {
  const computed = createComputedData(store);
  const {
    startDate = "",
    endDate = "",
    stage = "",
    groupName = "",
    name = "",
    category = "",
    scoreView = "all",
    sortBy = "rangeScore",
    order = "desc",
  } = filters;

  const nameText = name.trim().toLowerCase();

  const people = computed.personStats.filter((person) => {
    if (stage && person.stage !== stage) {
      return false;
    }
    if (groupName && person.groupName !== groupName) {
      return false;
    }
    if (nameText && !person.name.toLowerCase().includes(nameText)) {
      return false;
    }
    return true;
  });

  const rows = people.map((person) => {
    const rangeRecords = person.records.filter((record) => {
      if (!isDateInRange(record.task?.date, startDate, endDate)) {
        return false;
      }
      if (category && record.task?.category !== category) {
        return false;
      }
      if (scoreView === "bonus" && toNumber(record.scoreDelta) <= 0) {
        return false;
      }
      if (scoreView === "penalty" && toNumber(record.scoreDelta) >= 0) {
        return false;
      }
      return true;
    });

    const rangeScore = rangeRecords.reduce((sum, record) => sum + toNumber(record.scoreDelta), 0);
    const taskCount = rangeRecords.length;
    const bonusCount = rangeRecords.filter((record) => toNumber(record.scoreDelta) > 0).length;
    const penaltyCount = rangeRecords.filter((record) => toNumber(record.scoreDelta) < 0).length;

    return {
      personId: person.id,
      name: person.name,
      stage: person.stage,
      groupName: person.groupName,
      initialScore: person.initialScore,
      currentScore: person.currentScore,
      rangeScore,
      taskCount,
      bonusCount,
      penaltyCount,
    };
  });

  rows.sort((left, right) => {
    const direction = order === "asc" ? 1 : -1;
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * direction;
    }

    return String(leftValue).localeCompare(String(rightValue), "zh-CN") * direction;
  });

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
