let CONFIG = null;
let PROGRAM = null;
let RECORD = null;
let activeDayId = null;

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

function safePath(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function applyBranding(config) {
  document.title = config.pageTitle || config.programTitle || "برنامج التمرين";
  document.documentElement.style.setProperty("--primary", config.primaryColor || "#2563eb");
  document.documentElement.style.setProperty("--primary-light", config.secondaryColor || "#60a5fa");

  const logoEl = document.getElementById("logo");
  const logo = safePath(config.logo);
  if (logo) {
    logoEl.innerHTML = `<img src="${escapeHtml(logo)}" alt="" loading="lazy" onerror="this.parentElement.textContent='GY'">`;
  }
  const profile = safePath(config.profileImage);
  const profileEl = document.getElementById("profileImage");
  if (profileEl && profile) {
    profileEl.innerHTML = `<img src="${escapeHtml(profile)}" alt="" loading="lazy" onerror="this.parentElement.textContent='GY'">`;
    profileEl.classList.remove("is-empty");
  }

  document.getElementById("brandTitle").textContent = config.programTitle || "برنامج التمرين";
  document.getElementById("brandSubtitle").textContent = config.welcomeText || "متابعة التمرين اليومية";
  const athlete = document.getElementById("athleteName");
  if (athlete) athlete.textContent = config.athleteName || "";
  const updated = document.getElementById("lastUpdated");
  if (updated && config.lastUpdated) updated.textContent = "آخر تحديث: " + config.lastUpdated;
}

function currentDay() {
  return PROGRAM.days.find(d => d.dayId === activeDayId) || PROGRAM.days[0];
}

function media(ex) {
  const image = safePath(ex.image);
  const video = safePath(ex.video);
  const imageHtml = image
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(ex.name)}" loading="lazy" onerror="this.style.display='none';this.closest('.media').querySelector('.placeholder').style.display='block'">`
    : "";
  const videoHtml = video
    ? `<video src="${escapeHtml(video)}" controls playsinline preload="metadata"${image ? "" : ""}></video>`
    : "";
  return `${imageHtml}<div class="placeholder" style="display:${image ? "none" : "block"}">لا توجد صورة لهذا التمرين</div>${videoHtml}`;
}

function renderDays() {
  document.getElementById("days").innerHTML = PROGRAM.days
    .slice().sort((a, b) => a.sortOrder - b.sortOrder)
    .map(d => `<button class="day ${d.dayId === activeDayId ? "active" : ""}" onclick="selectDay('${escapeHtml(d.dayId)}')">
      <strong>${escapeHtml(d.title)}</strong><small>${d.exercises.length} تمارين</small>
    </button>`).join("");
}

function selectDay(dayId) { activeDayId = dayId; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

function render() {
  const day = currentDay();
  if (!day) return;
  document.getElementById("date").textContent = new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("dayTitle").textContent = day.title;
  document.getElementById("daySubtitle").textContent = day.subtitle || "";
  document.getElementById("sectionTitle").textContent = "تمارين " + day.title;
  renderDays();

  document.getElementById("list").innerHTML = day.exercises.slice().sort((a,b) => a.sortOrder - b.sortOrder).map(ex => {
    const rows = Array.from({ length: ex.sets }, (_, i) => {
      const s = getSet(RECORD, ex.exerciseId, i);
      return `<div class="row">
        <div class="n">${i + 1}</div>
        <input class="input" inputmode="decimal" autocomplete="off" placeholder="الوزن kg" value="${escapeHtml(s.weight)}" oninput="onLog('${escapeHtml(ex.exerciseId)}',${i},'weight',this.value)">
        <input class="input" inputmode="numeric" autocomplete="off" placeholder="العدات" value="${escapeHtml(s.reps)}" oninput="onLog('${escapeHtml(ex.exerciseId)}',${i},'reps',this.value)">
        <button class="done ${s.done ? "checked" : ""}" onclick="onToggle('${escapeHtml(ex.exerciseId)}',${i})" aria-label="إتمام المجموعة">${s.done ? "✓" : "○"}</button>
      </div>`;
    }).join("");

    const complete = ex.sets > 0 && Array.from({ length: ex.sets }, (_, i) => getSet(RECORD, ex.exerciseId, i).done).every(Boolean);
    const prevLabel = formatLastPerformance(lastPerformance(RECORD, ex.exerciseId));

    return `<article class="card">
      <div class="media">${media(ex)}</div>
      <div class="info">
        <div><h3>${escapeHtml(ex.name)}</h3>${ex.muscle ? `<span class="tag">${escapeHtml(ex.muscle)}</span>` : ""}</div>
        <span class="status ${complete ? "complete" : ""}">${complete ? "✓ مكتمل" : "غير مكتمل"}</span>
      </div>
      ${ex.description ? `<p class="desc">${escapeHtml(ex.description)}</p>` : ""}
      <div class="meta"><span>🎯 ${escapeHtml(ex.targetReps || "—")} عدة</span><span>⏱ ${escapeHtml(ex.restTime || "—")}</span><span>📋 ${ex.sets} Sets</span></div>
      ${prevLabel ? `<div class="prev">${escapeHtml(prevLabel)}</div>` : ""}
      <div class="sets"><div class="set-title"><strong>تسجيل الأداء</strong><span class="${complete ? "saved" : ""}">${complete ? "محفوظ ✓" : "الحفظ تلقائي"}</span></div>${rows}</div>
    </article>`;
  }).join("");

  updateProgress();
}

function onLog(exerciseId, setIndex, field, value) {
  setSet(RECORD, exerciseId, setIndex, field, value);
  updateProgress();
}

function onToggle(exerciseId, setIndex) {
  const s = getSet(RECORD, exerciseId, setIndex);
  setSet(RECORD, exerciseId, setIndex, "done", !s.done);
  render();
}

function updateProgress() {
  const day = currentDay();
  let total = 0, done = 0;
  day.exercises.forEach(ex => { for (let i = 0; i < ex.sets; i++) { total++; if (getSet(RECORD, ex.exerciseId, i).done) done++; } });
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("pct").textContent = pct + "%";
  document.getElementById("bar").style.width = pct + "%";
}

async function boot() {
  try {
    const [config, program] = await Promise.all([
      fetch("data/config.json", { cache: "no-store" }).then(r => { if (!r.ok) throw new Error("config"); return r.json(); }),
      fetch("data/program.json", { cache: "no-store" }).then(r => { if (!r.ok) throw new Error("program"); return r.json(); })
    ]);
    CONFIG = config;
    PROGRAM = program;
    RECORD = loadRecord(config.clientId);
    activeDayId = PROGRAM.days[0]?.dayId || null;
    applyBranding(config);
    render();
    document.getElementById("whatsappBtn").addEventListener("click", () => openWhatsApp(CONFIG, currentDay(), RECORD));
    document.getElementById("resetBtn").addEventListener("click", () => {
      if (!confirm("حفظ بيانات اليوم في السجل وبدء جلسة جديدة؟")) return;
      archiveDay(RECORD, currentDay());
      render();
    });
  } catch (error) {
    console.error(error);
    document.body.innerHTML = `<div style="padding:40px;text-align:center;font-family:Arial;color:#334155"><h2>تعذر تحميل البرنامج</h2><p>تأكد أن ملفات الموقع كاملة وأنك تفتح نسخة الـexport كما هي.</p></div>`;
  }
}

boot();
