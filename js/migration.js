/*
  Local athlete storage is intentionally independent from the Builder database.
  The stable key is based on clientId, never on exercise position or exercise name.
*/
const CURRENT_SCHEMA_VERSION = 2;

const STORAGE_PREFIX = "gym_progress_";
const LEGACY_KEYS = clientId => [
  `${STORAGE_PREFIX}${clientId}`,
  `gym_data_v1_${clientId}`,
  `gym_data_v2_${clientId}`,
  "gym_progress_v2"
];

const MIGRATIONS = {
  1: record => ({
    schemaVersion: 2,
    clientId: record.clientId,
    currentProgress: record.currentProgress && typeof record.currentProgress === "object" ? record.currentProgress : {},
    history: Array.isArray(record.history) ? record.history : []
  })
};

function freshRecord(clientId) {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    clientId,
    currentProgress: {},
    history: []
  };
}

function migrate(record) {
  if (!record || typeof record !== "object") return null;
  let current = { ...record };
  while (Number(current.schemaVersion || 1) < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[current.schemaVersion || 1];
    if (!step) break;
    current = step(current);
  }
  current.schemaVersion = CURRENT_SCHEMA_VERSION;
  current.clientId = current.clientId || "";
  current.currentProgress = current.currentProgress && typeof current.currentProgress === "object" ? current.currentProgress : {};
  current.history = Array.isArray(current.history) ? current.history : [];
  return current;
}

function importLegacyIfPresent(clientId) {
  for (const key of LEGACY_KEYS(clientId)) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      // Old single-file shape: { [exerciseId]: { [setIndex]: { ... } } }
      if (!parsed.schemaVersion && !parsed.currentProgress) {
        const record = freshRecord(clientId);
        record.currentProgress = parsed || {};
        return record;
      }

      const migrated = migrate(parsed);
      if (migrated) {
        migrated.clientId = clientId;
        return migrated;
      }
    } catch (_) {
      // Never delete a legacy entry just because it could not be parsed.
    }
  }
  return null;
}
