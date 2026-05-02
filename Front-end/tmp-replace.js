const fs = require('fs');
const file = 'c:/Users/tahaw/Projects/CocoRoot/Front-end/js/dashboard.js';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split('\r\n'); // Windows

// Lines 1 to 138
let top = lines.slice(0, 138);

// Remove renderEmpty from top (lines 30 to 33 in 1-indexed)
// that means index 29 to 32.
top.splice(29, 4);

// Imports to inject
const imports = [
    "    const { weatherCodeToText, weatherCodeToIcon, fetchWeatherFromOpenMeteo, fetchWeather, resolveBestWeather, resolveAllWeather } = window.CocoRootDashWeather;",
    "    const { buildAlertKey, generateAlerts, getAlertCategory, getAlertLevel, getAlertText, getAlertTitle, getCultivoProfile, getUserLocalAlerts, mergeAlerts, readAlertsStore, writeAlertsStore, alertsStorageKey } = window.CocoRootDashAlerts;",
    "    const { addDays, buildTaskId, classifyTasks, endOfDay, generateTasksForParcela, getCultivoLabel, getParcelaId, getParcelaLabel, getTaskDueDate, getUserTasks, isTaskDone, mergeGeneratedTasks, normalizeText, pickCultivoCategory, readTasksStore, setUserTasks, startOfDay, writeTasksStore } = window.CocoRootDashTasks;",
    "    const { createMonitorMetric, createTaskRowMarkup, formatTaskSectionTitle, formatArea, formatShortDateTime, formatWeekdayShort, pickFirstFinite, pickFirstText, renderAlertsCard, renderClima, renderEmpty, renderMonitorizacao, renderTasks } = window.CocoRootDashUI;",
    ""
];

// Bottom part: line 1175 onwards (1-indexed is index 1174)
// Let me verify line 1175 is really what I want.
const bottom = lines.slice(1174);

const newLines = [...top, ...imports, ...bottom];
fs.writeFileSync(file, newLines.join('\r\n'));
console.log("Done replacing dashboard.js");
