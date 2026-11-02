const categories = [
  { id: "protein", name: "Protéines", emoji: "🥚", style: "protein" },
  { id: "fruit", name: "Fruits", emoji: "🍎", style: "fruit" },
  { id: "vegetable", name: "Légumes", emoji: "🥕", style: "vegetable" },
  { id: "starch", name: "Féculents", emoji: "🍞", style: "starch" }
];
const defaultGoals = { protein: 4, fruit: 2, vegetable: 3, starch: 3 };
const STORAGE_KEY = "mes-portions-v1";
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.day === todayKey()) return saved;
    return { day: todayKey(), goals: saved?.goals || defaultGoals, remaining: { ...(saved?.goals || defaultGoals) } };
  } catch {
    return { day: todayKey(), goals: { ...defaultGoals }, remaining: { ...defaultGoals } };
  }
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function checkNewDay() {
  if (state.day !== todayKey()) {
    state = { day: todayKey(), goals: state.goals, remaining: { ...state.goals } };
    persist();
  }
}
function render() {
  checkNewDay();
  document.getElementById("today").textContent = new Intl.DateTimeFormat("fr-CA", {
    weekday: "long", day: "numeric", month: "long"
  }).format(new Date());
  const grid = document.getElementById("counterGrid");
  grid.innerHTML = "";
  categories.forEach(cat => {
    const n = state.remaining[cat.id] ?? 0;
    const tile = document.createElement("button");
    tile.className = `tile ${cat.style} ${n === 0 ? "done" : ""}`;
    tile.setAttribute("aria-label", `${cat.name}, ${n} portions restantes. Toucher pour diminuer.`);
    tile.innerHTML = `<div class="topline"><span class="emoji">${cat.emoji}</span><span class="status">${n === 0 ? "Objectif atteint" : "Restant"}</span></div>
      <span class="name">${cat.name}</span><span class="number">${n}</span><span class="tap">Toucher pour −1 portion</span>`;
    tile.addEventListener("click", () => {
      if (state.remaining[cat.id] > 0) {
        state.remaining[cat.id]--;
        persist(); render();
      }
    });
    grid.appendChild(tile);
  });
}
function openSettings() {
  const fields = document.getElementById("settingsFields");
  fields.innerHTML = "";
  categories.forEach(cat => {
    const row = document.createElement("div");
    row.className = "field";
    row.innerHTML = `<label for="goal-${cat.id}">${cat.emoji} ${cat.name}</label>
      <input id="goal-${cat.id}" type="number" min="0" max="30" step="1" value="${state.goals[cat.id]}">`;
    fields.appendChild(row);
  });
  document.getElementById("settingsDialog").showModal();
}
document.getElementById("settingsButton").addEventListener("click", openSettings);
document.getElementById("settingsForm").addEventListener("submit", e => {
  if (e.submitter?.value !== "save") return;
  e.preventDefault();
  categories.forEach(cat => {
    const value = Number(document.getElementById(`goal-${cat.id}`).value);
    state.goals[cat.id] = Math.max(0, Math.min(30, Number.isFinite(value) ? value : 0));
  });
  state.remaining = { ...state.goals };
  state.day = todayKey();
  persist(); render();
  document.getElementById("settingsDialog").close();
});
document.getElementById("resetButton").addEventListener("click", () => {
  if (confirm("Remettre tous les compteurs à leurs objectifs du jour?")) {
    state.remaining = { ...state.goals }; state.day = todayKey(); persist(); render();
  }
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();