function archiveDay(record, day) {
  const entries = {};
  let hasAny = false;

  day.exercises.forEach(ex => {
    const sets = [];
    for (let i = 0; i < ex.sets; i++) {
      const s = getSet(record, ex.exerciseId, i);
      if (s.weight || s.reps || s.done) hasAny = true;
      sets.push({ weight: s.weight || "", reps: s.reps || "", done: !!s.done });
    }
    entries[ex.exerciseId] = sets;
  });

  if (hasAny) {
    record.history.push({
      date: new Date().toISOString(),
      dayId: day.dayId,
      dayTitle: day.title,
      entries
    });
  }

  day.exercises.forEach(ex => { delete record.currentProgress[ex.exerciseId]; });
  saveRecord(record);
  return hasAny;
}

function lastPerformance(record, exerciseId) {
  for (let i = record.history.length - 1; i >= 0; i--) {
    const entry = record.history[i];
    const sets = entry.entries?.[exerciseId];
    if (Array.isArray(sets) && sets.some(s => s?.weight || s?.reps)) {
      const best = sets.find(s => s?.weight || s?.reps) || {};
      return { date: entry.date, weight: best.weight, reps: best.reps };
    }
  }
  return null;
}

function formatLastPerformance(perf) {
  if (!perf) return null;
  const d = new Date(perf.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
  return `آخر مرة (${d}): ${perf.weight || "-"} kg × ${perf.reps || "-"}`;
}
