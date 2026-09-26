function buildWhatsAppText(config, day, record) {
  const lines = [
    "🏋️ متابعة التمرين",
    `المتدرب: ${config.athleteName || "-"}`,
    `اليوم: ${day.title}`,
    `التاريخ: ${new Date().toLocaleDateString("ar-EG")}`,
    ""
  ];

  day.exercises.forEach(ex => {
    const logged = [];
    for (let i = 0; i < ex.sets; i++) {
      const s = getSet(record, ex.exerciseId, i);
      if (s.weight || s.reps || s.done) {
        logged.push(`Set ${i + 1}: ${s.weight || "-"} kg × ${s.reps || "-"} ${s.done ? "✓" : ""}`);
      }
    }
    if (logged.length) {
      lines.push(ex.name, ...logged, "");
    }
  });

  return lines.join("\n").trim();
}

function openWhatsApp(config, day, record) {
  const message = encodeURIComponent(buildWhatsAppText(config, day, record));
  const number = String(config.trainerWhatsApp || "").replace(/\D/g, "");
  const url = number ? `https://wa.me/${number}?text=${message}` : `https://wa.me/?text=${message}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
