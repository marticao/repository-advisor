/* ============================================================
   Data is provided by repositories.js and questions.js
   (generated from the CSV files). No fetch / server required.
   ============================================================ */

// repositories and questions are defined in the two data files
// that are loaded before this script.

let step = -1;
let answers = {};
const main = document.getElementById("main");
const side = document.getElementById("side");
let DEBUG_parameter = 0;   // it's just for debug

// One-off execution: first page
function welcome() {
  step = -1;
  answers = {};
  main.innerHTML = `
  <h1>Repository Advisor</h1>
  <p><em>This tool helps researchers identify suitable repositories for sharing and preserving research data.</em></p>
  <p>Complete a short consultation to receive repository recommendations tailored to your research discipline, data characteristics, repository requirements, and sharing preferences.</p>
  <div class="kpis">
    <div class="kpi">🧭 Guided consultation</div>
    <div class="kpi">⏱ About 2 minutes</div>
    <div class="kpi">📦 Multiple recommendations</div>
  </div>
  <div class="warning">
    <b>Important:</b> Repository recommendations are provided as decision support. Repository policies and requirements may change over time and should always be verified before depositing research data.
    <br><br>
    <b>Disclaimer: </b>The repository recommendations provided in this table are based on the specified requirements and on information about repository characteristics available on their respective websites. The final selection of an appropriate data repository remains at the researcher's discretion.</div>
  <div class="actions"><button class="button" onclick="next()">Start Consultation</button></div>
`;
  side.innerHTML = `
  <h3>About Repository Selection</h3>
  <p class="small">Choosing an appropriate repository helps improve the discoverability, accessibility, and long-term preservation of research data. It can also help satisfy funder, journal, and institutional requirements.</p>
  <h3 style="margin-top:22px">Repository Overview</h3>
  <p class="small">Recommendations may include institutional, generalist, and subject-specific repositories depending on your responses.</p>
  ${repositories.slice(0, 6).map(r => `
    <div class="repo-card">
      <strong>${r.short}</strong>
      <div class="small">${r.type}</div>
      <span class="tag">${r.Q04_doi ? "DOI" : "No DOI"}</span>
      <span class="tag">${r.Q04_embargo ? "Embargo" : "No embargo"}</span>
      <span class="tag">${r.maxDatasetGB === 999999 ? "Large/Unlimited" : r.maxDatasetGB === null ? "Size unknown" : r.maxDatasetGB + " GB"}</span>
    </div>`).join("")}
`;
}

// Recurring execution: next page button
function next() {
  if (step >= 0) {
    const q = questions[step];
    if (q.required && (!answers[q.id] || answers[q.id].length === 0)) {
      alert("Please choose an answer first.");
      return;
    }
  }
  step++;
  if (step >= questions.length) { results(); return; }
  renderQuestion();
}

// Recurring execution: back page button
function back() {
  if (step <= 0) { welcome(); return; }
  delete answers[questions[step].id];
  step--;

  renderQuestion();
}

// Recurring execution: single choice
function selectSingle(id, value) {
  answers[id] = [value];
  renderQuestion();
}

// Recurring execution: multiple choice
function toggleMulti(id, value) {
  if (!answers[id]) answers[id] = [];
  if (answers[id].includes(value)) {
    answers[id] = answers[id].filter(x => x !== value);
  } else {
    answers[id].push(value);
  }
  renderQuestion();
}

function renderQuestion() {
  const q = questions[step];
  const pct = Math.round(((step + 1) / questions.length) * 100);
  let opts = "";
  if (q.type === "single") {
    opts = q.options.map(o => `
    <button class="option ${(answers[q.id] || []).includes(o) ? 'selected' : ''}" onclick="selectSingle('${q.id}', \`${o}\`)">${o}</button>
  `).join("");
  } else {
    const selected = answers[q.id] || [];
    opts = `<div class="checkbox-grid">` + q.options.map(o => `
    <button class="option ${selected.includes(o) ? 'selected' : ''}" onclick="toggleMulti('${q.id}', \`${o}\`)">${o}</button>
  `).join("") + `</div>`;
  }
  main.innerHTML = `
  <div class="progress-wrap"><div class="progress" style="width:${pct}%"></div></div>
  <p class="small">Question ${step + 1} of ${questions.length}</p>
  <h2>${q.title}</h2>
  ${q.subtitle ? `<p>${q.subtitle}</p>` : ""}
  ${opts}
  <div class="actions">
    <button class="button secondary" onclick="back()">← Back</button>
    <button class="button" onclick="next()">${step === questions.length - 1 ? "See Recommendation" : "Next →"}</button>
  </div>
`;
  renderDynamicSide();
}

function renderDynamicSide() {
  const top = calculateScores().slice(0, 4);
  side.innerHTML = `
  <h3>Live Shortlist</h3>
  <p class="small">Updates dynamically based on your active selections.</p>
  ${top.map((r, i) => `
    <div class="rankrow">
      <div><b>${i + 1}. ${r.short}</b><br><span class="small">${r.best}</span></div>
    </div>
  `).join("")}
`;
  // removed <span class="pill">${r.calculatedScore}</span>
  // from <div><b>${i + 1}. ${r.short}</b><br><span class="small">${r.best}</span></div>
}

function calculateScores() {
  return repositories.map(r => {
    let score = 0;
    let eligible = true;
    let reasons = { discipline: "General/Other multidisciplinary coverage.", compatibility: "Supports your dataset size configuration.", features: [], requirements: "Compatible with default mandate selections.", licence: "Supports standard licensing frameworks." };

    // Q01 [30]
    const sub = answers.Q01 ? answers.Q01[0] : "";
    const isGeneralist = r.subjects.includes("Other / General");

    if (!isGeneralist && !r.subjects.includes(sub)) {
      eligible = false;
    }
    if (sub && r.subjects.includes(sub)) { score += 30; reasons.discipline = "Subject-specific repository for your field."; }
    else if (sub === "Software / Code" && r.code) { score += 30; reasons.discipline = "Optimized layout environment for version control."; }

    // Q02 [15, 10]
    const datasetSize = answers.Q02 ? answers.Q02[0] : "";
    const requiredDatasetSize = {
      "<100 MB": 0.01,
      "100 MB–5 GB": 5,
      "5–20 GB": 20,
      "20–50 GB": 50,
      "50–100 GB": 100,
      "100–1000 GB": 1000,
      ">1000 GB": 1000
    };
    const requiredDatasetSizeStringKey = {
      "<100 MB": "Q02_100mb_down",
      "100 MB–5 GB": "Q02_100mbto5gb",
      "5–20 GB": "Q02_5to20gb",
      "20–50 GB": "Q02_20to50gb",
      "50–100 GB": "Q02_50to100gb",
      "100–1000 GB": "Q02_100to1000gb",
      ">1000 GB": "Q02_1000gb_up"
    }

    if (requiredDatasetSize[datasetSize] !== undefined) {
      if (r.maxDatasetGB >= requiredDatasetSize[datasetSize]) {
        // score += 15;
        score += r[requiredDatasetSizeStringKey[answers.Q02]];
        reasons.compatibility = "Supports your dataset size.";
      } else {
        eligible = false;
        reasons.compatibility = "Repository capacity is below your dataset size requirement.";
      }
    }

    // Q03 [15]
    const fileSize = answers.Q03 ? answers.Q03[0] : "";
    const requiredFileSize = {
      "<100 MB": 0.01,
      "100 MB–1 GB": 1,
      "1–5 GB": 5,
      "5–20 GB": 20,
      ">20 GB": 21
    };

    if (requiredFileSize[fileSize] !== undefined) {
      if (r.maxFileGB >= requiredFileSize[fileSize]) {
        score += 15;
        reasons.compatibility = "Supports your file size.";
      } else {
        eligible = false;
        reasons.compatibility = "Repository capacity is below your file size requirement.";
      }
    }

    // Q04 [10, 15]
    const feats = answers.Q04 || [];
    feats.forEach(f => {
      if (f === "DOI" && r.Q04_doi) { score += 15; reasons.features.push("DOI"); }
      if (f === "Embargo" && r.Q04_embargo) { score += 15; reasons.features.push("Embargo"); }
      if (f === "Private sharing" && r.Q04_private) { score += 15; reasons.features.push("Private sharing"); }
      if (f === "Collaborator access" && r.Q04_tiered_access) { score += 10; reasons.features.push("Collaborator access"); }
      if (f === "API access" && r.Q04_api) { score += 10; reasons.features.push("API"); }
    });

    // Q05 [10, 15]
    const Q05_contain_code = answers.Q05 ? answers.Q05[0] : "";
    if (Q05_contain_code !== undefined) {
      if (Q05_contain_code === "Yes, alongside other research data") { score += r.Q05_code_with_data; }
      if (Q05_contain_code === "Yes, software/code is my primary research output") { score += r.Q05_code_as_output; }
    }

    // Q06 [10]
    const Q06_requirements = answers.Q06 || [];
    Q06_requirements.forEach(requirement => {
      if (requirement === "My institution requires an institutional repository." && r.Q06_instituional_repo) { score += 10; }
    });

    // Q07 [10]
    const Q07_license = answers.Q07 ? answers.Q07[0] : "";
    if (Q07_license !== undefined) {
      if (r.Q07_licenses.includes(Q07_license)) { score += 10; }
    }

    if (reasons.features.length === 0) { reasons.features = ["Standard features"]; }

    return {
      ...r,
      eligible,
      calculatedScore: score,
      mappedReasons: reasons
    };
  })
    .filter(r => r.eligible)
    .sort((a, b) => b.calculatedScore - a.calculatedScore);
}

function results() {
  const ranked = calculateScores();
  const top = ranked[0];
  const alts = ranked.slice(1, 4);

  main.innerHTML = `
  <p class="small">Consultation complete!</p>
  <div class="rec-card">
      <div class="rec-header">
          <h2>Recommended Repository</h2>
          <div class="repo-title"><a href="${top.url}">${top.name}</a></div>
      </div>
      <div class="rec-body">
          <div class="rec-section-title">Why this repository?</div>
          <div class="reason-grid">
              <div class="reason-item">
                  <div class="reason-label">Research discipline</div>
                  <div class="reason-value">${top.mappedReasons.discipline}</div>
              </div>
              <div class="reason-item">
                  <div class="reason-label">Dataset compatibility</div>
                  <div class="reason-value">${top.mappedReasons.compatibility}</div>
              </div>
              <div class="reason-item">
                  <div class="reason-label">Repository features</div>
                  <div class="reason-value">
                      <div class="feature-tags">
                          ${top.mappedReasons.features.map(f => `<span class="tag">${f}</span>`).join('')}
                      </div>
                  </div>
              </div>
              <div class="reason-item">
                  <div class="reason-label">Repository requirements</div>
                  <div class="reason-value">Compatible with your selected institutional requirements.</div>
              </div>
              <div class="reason-item">
                  <div class="reason-label">Licence</div>
                  <div class="reason-value">Supports your preferred licence terms.</div>
              </div>
          </div>
      </div>
  </div>

  <div class="warning">
    <b>Check before depositing:</b> Repository requirements and policies can change over time. This prototype gives a recommendation based on the current matrix, not final official advice.
    <br><br>
    <b>Disclaimer: </b>The repository recommendations provided in this table are based on the specified requirements and on information about repository characteristics available on their respective websites. The final selection of an appropriate data repository remains at the researcher's discretion.</div>
  
  <h3>Alternative repositories to consider</h3>
  ${alts.map(a => `
    <div class="rankrow">
      <div><b><a href="${a.url}">${a.short}</a></b><br><span class="small">${a.best}</span></div>
      <span class="pill">Alternative</span>
    </div>`).join("")}
    
  <div class="actions">
    <button class="button secondary" onclick="welcome()">Start Over</button>
    <button class="button" onclick="copySummary()">Copy Summary</button>
  </div>
`;

  side.innerHTML = `
  <h3>Consultation Summary</h3>
  <div class="repo-card">
    <strong>Your parameters</strong>
    <p class="small">
    Discipline: ${answers.Q01 ? answers.Q01[0] : "—"}<br>
    Dataset capacity: ${answers.Q02 ? answers.Q02[0] : "—"}<br>
    File capacity: ${answers.Q03 ? answers.Q03[0] : "—"}<br>
    Features: ${(answers.Q04 || []).join(", ") || "—"}<br>
    Software/code inclusion: ${answers.Q05}<br>
    Data licensing: ${answers.Q07}

    </p>
  </div>
  <h3>Repository details</h3>
  <div class="repo-card">
    <a href="${top.url}"><strong>${top.short}</strong></a>
    <p class="small">${top.notes}</p>
    <span class="tag">${top.type}</span>
  </div>
`;
}

function copySummary() {
  const ranked = calculateScores();
  const top = ranked[0];
  // const text = `Repository Adviser Prototype Summary\nRecommended: ${top.name}\nDiscipline: ${answers.Q01 ? answers.Q01[0] : "—"}\nCapacity: ${answers.Q02 ? answers.Q02[0] : "—"}`;
  const text = `Repository Adviser Prototype Summary\nRecommended: ${top.name}\nDiscipline: ${answers.Q01 ? answers.Q01[0] : "—"}\nDataset capacity: ${answers.Q02 ? answers.Q02[0] : "—"}\nFile capacity: ${answers.Q03 ? answers.Q03[0] : "—"}\nFeatures: ${(answers.Q04 || []).join(", ") || "—"}\nSoftware/code inclusion: ${answers.Q05}\nData licensing: ${answers.Q07}`
  navigator.clipboard.writeText(text).then(() => alert("Summary copied to clipboard!"));
}

/* ---------- Boot ---------- */
welcome();
