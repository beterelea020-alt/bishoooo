function storageKey(clientId) {
  return `gym_progress_${clientId}`;
}

function loadRecord(clientId) {
  const key = storageKey(clientId);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const migrated = migrate(JSON.parse(raw));
      if (migrated) {
        migrated.clientId = clientId;
        saveRecord(migrated);
        return migrated;
      }
    } catch (_) {
      // Keep the raw entry intact and continue to legacy import paths.
    }
  }

  const imported = importLegacyIfPresent(clientId);
  if (imported) {
    imported.clientId = clientId;
    saveRecord(imported);
    return imported;
  }

  return freshRecord(clientId);
}

function saveRecord(record) {
  record.schemaVersion = CURRENT_SCHEMA_VERSION;
  localStorage.setItem(storageKey(record.clientId), JSON.stringify(record));
  localStorage.setItem(`${storageKey(record.clientId)}_lastSave`, new Date().toISOString());
}

function getSet(record, exerciseId, setIndex) {
  return record.currentProgress?.[exerciseId]?.[setIndex] || { weight: "", reps: "", done: false };
}

function setSet(record, exerciseId, setIndex, field, value) {
  record.currentProgress[exerciseId] ||= {};
  record.currentProgress[exerciseId][setIndex] ||= { weight: "", reps: "", done: false };
  record.currentProgress[exerciseId][setIndex][field] = value;
  saveRecord(record);
}
