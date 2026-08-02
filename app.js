let lessonData;
const completed = new Set();
const totalMilestones = 12;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const response = await fetch("lesson.json");
    if (!response.ok) throw new Error(`Could not load lesson.json (${response.status})`);
    lessonData = await response.json();
    renderLesson(lessonData);
    wireGlobalControls();
    typeset();
  } catch (error) {
    document.querySelector("main").innerHTML = `
      <div class="notice">
        <strong>The lesson could not load.</strong>
        <p>${escapeHtml(error.message)}</p>
        <p>When testing locally, run a small web server instead of opening index.html directly.</p>
      </div>`;
  }
}

function renderLesson(data) {
  document.title = `${data.meta.title} | ${data.meta.course}`;
  setText("course-label", `${data.meta.course} · ${data.meta.strand} ${data.meta.lessonNumber}`);
  setText("lesson-title", data.meta.title);
  setText("lesson-subtitle", data.meta.subtitle);
  setText("why-it-matters", data.whyItMatters);

  document.getElementById("learning-goals").innerHTML =
    data.learningGoals.map(goal => `<li>${escapeHtml(goal)}</li>`).join("");

  document.getElementById("warmup-list").innerHTML =
    data.warmup.map((item, index) => `
      <label>
        <strong>${index + 1}. ${item.prompt}</strong>
        <input type="text" aria-label="Warm-up question ${index + 1}">
      </label>`).join("");

  document.getElementById("warmup-answers").innerHTML =
    `<ol>${data.warmup.map(item => `<li>${item.answer}</li>`).join("")}</ol>`;

  document.getElementById("rules-grid").innerHTML =
    data.rules.map(rule => `
      <article class="card">
        <h3>${escapeHtml(rule.name)}</h3>
        <div class="rule-formula">${rule.formula}</div>
        <p>${escapeHtml(rule.explanation)}</p>
      </article>`).join("");

  document.getElementById("examples-list").innerHTML =
    data.examples.map((example, exampleIndex) => `
      <article class="example-card">
        <p class="eyebrow">${escapeHtml(example.label)}</p>
        <h3>${example.prompt}</h3>
        <div class="think-box">
          <strong>Think first</strong>
          <ul>${example.think.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
        <div class="button-row">
          <button class="step-button secondary" data-example="${exampleIndex}" data-step="0">
            Reveal Step 1
          </button>
        </div>
        <div id="example-${exampleIndex}-steps"></div>
      </article>`).join("");

  document.getElementById("guided-practice").innerHTML =
    data.guidedPractice.map((item, index) => `
      <article class="practice-card">
        <h3>${index + 1}. ${item.prompt}</h3>
        <label>
          Your answer
          <input type="text">
        </label>
        <div class="button-row">
          <button class="secondary reveal-content" data-target="hint-${index}">Show hint</button>
          <button class="secondary reveal-content" data-target="solution-${index}">Show solution</button>
        </div>
        <div id="hint-${index}" class="reveal" hidden>${escapeHtml(item.hint)}</div>
        <div id="solution-${index}" class="reveal" hidden>${item.solution}</div>
      </article>`).join("");

  document.getElementById("misconceptions").innerHTML =
    data.misconceptions.map(item => `
      <article class="card">
        <h3>${item.incorrect}</h3>
        <p>${item.explanation}</p>
      </article>`).join("");

  document.getElementById("check-it-list").innerHTML =
    data.checkIt.map((item, index) => `
      <article class="quiz-card" id="quiz-card-${index}">
        <label for="check-${index}">
          <strong>${index + 1}. ${item.prompt}</strong>
        </label>
        <input id="check-${index}" type="text" autocomplete="off">
        <p id="feedback-${index}" class="feedback" aria-live="polite"></p>
      </article>`).join("");

  document.getElementById("score-chip").textContent = `0 / ${data.checkIt.length}`;

  document.getElementById("retrieval-list").innerHTML =
    data.retrievalPractice.map((item, index) => `
      <article class="practice-card">
        <label for="retrieval-${index}">
          <strong>${index + 1}. ${item.prompt}</strong>
        </label>
        <textarea id="retrieval-${index}" rows="2"></textarea>
      </article>`).join("");

  document.getElementById("retrieval-answers").innerHTML =
    `<ol>${data.retrievalPractice.map(item => `<li>${item.answer}</li>`).join("")}</ol>`;

  renderCalculusBeforeCalculus(data.calculusBeforeCalculus);

  document.getElementById("reflection-options").innerHTML =
    data.reflectionOptions.map((option, index) => `
      <label class="reflection-option">
        <input type="radio" name="reflection" value="${escapeHtml(option)}">
        <span>${escapeHtml(option)}</span>
      </label>`).join("");

  document.querySelectorAll(".step-button").forEach(button => {
    button.addEventListener("click", revealNextStep);
  });

  document.querySelectorAll(".reveal-content").forEach(button => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      target.hidden = false;
      markComplete(button.dataset.target);
      typeset(target);
    });
  });

  document.querySelectorAll('input[name="reflection"]').forEach(input => {
    input.addEventListener("change", () => {
      setText("reflection-result", `Focus area selected: ${input.value}.`);
      markComplete("reflection");
    });
  });
}

function wireGlobalControls() {
  document.querySelectorAll("[data-scroll]").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.scroll).scrollIntoView({ behavior: "smooth" });
    });
  });

  document.getElementById("reveal-warmup").addEventListener("click", () => {
    const answers = document.getElementById("warmup-answers");
    answers.hidden = false;
    markComplete("warmup");
    typeset(answers);
  });

  document.getElementById("reveal-retrieval").addEventListener("click", () => {
    const answers = document.getElementById("retrieval-answers");
    answers.hidden = false;
    markComplete("retrieval");
    typeset(answers);
  });

  document.getElementById("reveal-cbc-retrieval").addEventListener("click", () => {
    const answers = document.getElementById("cbc-retrieval-answers");
    answers.hidden = false;
    markComplete("cbc-retrieval");
    typeset(answers);
  });

  document.getElementById("check-answers").addEventListener("click", checkAnswers);
  document.getElementById("reset-check-it").addEventListener("click", resetCheckIt);
}

function revealNextStep(event) {
  const button = event.currentTarget;
  const exampleIndex = Number(button.dataset.example);
  const stepIndex = Number(button.dataset.step);
  const example = lessonData.examples[exampleIndex];
  const step = example.steps[stepIndex];
  const container = document.getElementById(`example-${exampleIndex}-steps`);

  const block = document.createElement("div");
  block.className = "step";
  block.innerHTML = `
    <div class="step-title">${escapeHtml(step.title)}</div>
    <div>${step.content}</div>`;
  container.appendChild(block);

  markComplete(`example-${exampleIndex}-${stepIndex}`);
  typeset(block);

  const nextIndex = stepIndex + 1;
  if (nextIndex < example.steps.length) {
    button.dataset.step = String(nextIndex);
    button.textContent = nextIndex === example.steps.length - 1
      ? "Reveal Final Answer"
      : `Reveal Step ${nextIndex + 1}`;
  } else {
    button.disabled = true;
    button.textContent = "Example complete";
  }
}


function renderCalculusBeforeCalculus(section) {
  if (!section) return;

  setText("cbc-title", section.title);
  setText("cbc-intro", section.intro);
  setText("cbc-big-idea", section.bigIdea);

  document.getElementById("cbc-situations").innerHTML =
    section.situations.map((situation, index) => `
      <article class="cbc-card">
        <span class="cbc-badge">${escapeHtml(situation.tag)}</span>
        <h3>${escapeHtml(situation.title)}</h3>
        <p>${escapeHtml(situation.summary)}</p>
        <div class="cbc-layout">
          <div>
            <div id="cbc-visual-${situation.id}" class="cbc-visual"></div>
            ${renderCbcControls(situation)}
          </div>
          <div>
            <div class="think-box">
              <strong>Explore first</strong>
              <p>${escapeHtml(situation.prompt)}</p>
            </div>
            <div class="button-row">
              <button class="secondary cbc-step-button" data-cbc="${index}" data-step="0">Reveal Step 1</button>
            </div>
            <div id="cbc-steps-${index}"></div>
            <div class="cbc-question">
              <strong>Check the connection</strong>
              <p>${situation.checkPrompt}</p>
              <button class="secondary cbc-answer-button" data-answer="cbc-answer-${index}">Reveal answer</button>
              <div id="cbc-answer-${index}" class="reveal" hidden>${situation.checkAnswer}</div>
            </div>
          </div>
        </div>
      </article>`).join("");

  document.getElementById("cbc-retrieval-list").innerHTML =
    section.retrieval.map((item, index) => `
      <label for="cbc-retrieval-${index}">
        <strong>${index + 1}. ${item.prompt}</strong>
        <textarea id="cbc-retrieval-${index}" rows="2"></textarea>
      </label>`).join("");

  document.getElementById("cbc-retrieval-answers").innerHTML =
    `<ol>${section.retrieval.map(item => `<li>${item.answer}</li>`).join("")}</ol>`;

  section.situations.forEach(situation => updateCbcVisual(situation.id));

  document.querySelectorAll(".cbc-step-button").forEach(button =>
    button.addEventListener("click", revealCbcStep));

  document.querySelectorAll(".cbc-answer-button").forEach(button => {
    button.addEventListener("click", () => {
      const answer = document.getElementById(button.dataset.answer);
      answer.hidden = false;
      button.disabled = true;
      markComplete(button.dataset.answer);
      typeset(answer);
    });
  });

  document.querySelectorAll(".cbc-slider").forEach(slider => {
    slider.addEventListener("input", event => {
      updateCbcVisual(event.target.dataset.situation);
      markComplete(`cbc-${event.target.dataset.situation}-explore`);
    });
  });
}

function renderCbcControls(situation) {
  if (situation.id === "power-rule") {
    return `
      <div class="cbc-control-panel">
        <label for="power-n"><strong>Exponent n:</strong> <span id="power-n-value">5</span></label>
        <input id="power-n" class="cbc-slider" data-situation="power-rule"
          type="range" min="-4" max="10" step="1" value="5">
        <div class="cbc-metrics">
          <div class="cbc-metric"><span>Original exponent</span><strong id="metric-original-n">5</strong></div>
          <div class="cbc-metric"><span>Multiplier</span><strong id="metric-coefficient">5</strong></div>
          <div class="cbc-metric"><span>New exponent</span><strong id="metric-new-n">4</strong></div>
        </div>
      </div>`;
  }

  if (situation.id === "difference-quotient") {
    return `
      <div class="cbc-control-panel">
        <label for="dq-h"><strong>Value of h:</strong> <span id="dq-h-value">2</span></label>
        <input id="dq-h" class="cbc-slider" data-situation="difference-quotient"
          type="range" min=".1" max="5" step=".1" value="2">
        <p class="muted">Use x = 3 and watch 2x + h approach 2x as h approaches 0.</p>
        <div class="cbc-metrics">
          <div class="cbc-metric"><span>x</span><strong>3</strong></div>
          <div class="cbc-metric"><span>2x + h</span><strong id="metric-dq">8</strong></div>
          <div class="cbc-metric"><span>Target 2x</span><strong>6</strong></div>
        </div>
      </div>`;
  }

  return `
    <div class="cbc-control-panel">
      <label for="scale-k"><strong>Scale factor k:</strong> <span id="scale-k-value">2</span></label>
      <input id="scale-k" class="cbc-slider" data-situation="scaling"
        type="range" min=".5" max="4" step=".5" value="2">
      <div class="cbc-metrics">
        <div class="cbc-metric"><span>Length factor</span><strong id="metric-length">2</strong></div>
        <div class="cbc-metric"><span>Area factor</span><strong id="metric-area">4</strong></div>
        <div class="cbc-metric"><span>Volume factor</span><strong id="metric-volume">8</strong></div>
      </div>
    </div>`;
}

function updateCbcVisual(id) {
  if (id === "power-rule") {
    const n = Number(document.getElementById("power-n")?.value || 5);
    setText("power-n-value", n);
    setText("metric-original-n", n);
    setText("metric-coefficient", n);
    setText("metric-new-n", n - 1);

    const original = n === 0 ? "1" : `x^${n}`;
    const derivative = n === 0 ? "0" : `${n}x^${n - 1}`;
    document.getElementById("cbc-visual-power-rule").innerHTML =
      `<div class="cbc-power-display">$f(x)=${original}$<br>$f'(x)=${derivative}$</div>`;
    typeset(document.getElementById("cbc-visual-power-rule"));
    return;
  }

  if (id === "difference-quotient") {
    const h = Number(document.getElementById("dq-h")?.value || 2);
    const value = 6 + h;
    setText("dq-h-value", formatNumber(h));
    setText("metric-dq", formatNumber(value));
    document.getElementById("cbc-visual-difference-quotient").innerHTML = `
      <svg viewBox="0 0 640 240" role="img" aria-label="Difference quotient approaching a derivative">
        <line x1="65" y1="190" x2="585" y2="190" stroke="#88979b" stroke-width="3"/>
        <line x1="90" y1="30" x2="90" y2="205" stroke="#88979b" stroke-width="3"/>
        <path d="M 100 180 Q 260 150 340 90 Q 440 20 560 45"
          fill="none" stroke="#6f3cc3" stroke-width="5"/>
        <circle cx="330" cy="98" r="7" fill="#147a82"/>
        <circle cx="${330 + h * 35}" cy="${98 - h * 18}" r="7" fill="#315efb"/>
        <line x1="330" y1="98" x2="${330 + h * 35}" y2="${98 - h * 18}"
          stroke="#315efb" stroke-width="3"/>
        <text x="295" y="125" class="diagram-side">x</text>
        <text x="${345 + h * 35}" y="${90 - h * 18}" class="diagram-side">x+h</text>
      </svg>`;
    return;
  }

  const k = Number(document.getElementById("scale-k")?.value || 2);
  setText("scale-k-value", formatNumber(k));
  setText("metric-length", formatNumber(k));
  setText("metric-area", formatNumber(k ** 2));
  setText("metric-volume", formatNumber(k ** 3));

  const small = 55;
  const large = Math.min(145, small * k / 2);
  document.getElementById("cbc-visual-scaling").innerHTML = `
    <svg viewBox="0 0 640 250" role="img" aria-label="Squares and cubes scaling with k">
      <rect x="75" y="${170-small}" width="${small}" height="${small}"
        fill="rgba(111,60,195,.12)" stroke="#6f3cc3" stroke-width="4"/>
      <rect x="260" y="${170-large}" width="${large}" height="${large}"
        fill="rgba(20,122,130,.14)" stroke="#147a82" stroke-width="4"/>
      <text x="72" y="205" class="diagram-side">Original</text>
      <text x="260" y="205" class="diagram-side">Scaled by k = ${formatNumber(k)}</text>
      <text x="455" y="75" class="diagram-side">Length: k</text>
      <text x="455" y="115" class="diagram-side">Area: k²</text>
      <text x="455" y="155" class="diagram-side">Volume: k³</text>
    </svg>`;
}

function revealCbcStep(event) {
  const button = event.currentTarget;
  const situationIndex = Number(button.dataset.cbc);
  const stepIndex = Number(button.dataset.step);
  const situation = lessonData.calculusBeforeCalculus.situations[situationIndex];
  const step = situation.steps[stepIndex];
  const container = document.getElementById(`cbc-steps-${situationIndex}`);

  const block = document.createElement("div");
  block.className = "cbc-step";
  block.innerHTML = `<strong>${escapeHtml(step.title)}</strong><div>${step.content}</div>`;
  container.appendChild(block);
  typeset(block);
  markComplete(`cbc-${situationIndex}-${stepIndex}`);

  const nextIndex = stepIndex + 1;
  if (nextIndex < situation.steps.length) {
    button.dataset.step = String(nextIndex);
    button.textContent = nextIndex === situation.steps.length - 1
      ? "Reveal Calculus Connection"
      : `Reveal Step ${nextIndex + 1}`;
  } else {
    button.disabled = true;
    button.textContent = "Connection complete";
  }
}


function checkAnswers() {
  let score = 0;

  lessonData.checkIt.forEach((item, index) => {
    const input = document.getElementById(`check-${index}`);
    const card = document.getElementById(`quiz-card-${index}`);
    const feedback = document.getElementById(`feedback-${index}`);
    const value = normalize(input.value);
    const accepted = item.acceptedAnswers.map(normalize);

    card.classList.remove("correct", "incorrect");

    if (accepted.includes(value)) {
      score += 1;
      card.classList.add("correct");
      feedback.textContent = "Correct.";
      return;
    }

    card.classList.add("incorrect");
    const targeted = Object.entries(item.feedback || {})
      .find(([wrong]) => normalize(wrong) === value);

    feedback.innerHTML = targeted
      ? targeted[1]
      : `Not yet. Review the structure and choose the matching exponent rule. Correct answer: ${item.displayAnswer}`;
  });

  setText("score-chip", `${score} / ${lessonData.checkIt.length}`);
  const summary = document.getElementById("check-it-summary");
  summary.textContent = score === lessonData.checkIt.length
    ? "Fluency check complete. You answered every question correctly."
    : `${score} of ${lessonData.checkIt.length} correct. Revise your answers using the feedback and check again.`;

  markComplete("check-it");
  typeset(document.getElementById("check-it"));
}

function resetCheckIt() {
  lessonData.checkIt.forEach((_, index) => {
    document.getElementById(`check-${index}`).value = "";
    document.getElementById(`feedback-${index}`).textContent = "";
    document.getElementById(`quiz-card-${index}`).classList.remove("correct", "incorrect");
  });

  setText("score-chip", `0 / ${lessonData.checkIt.length}`);
  setText("check-it-summary", "");
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[·*]/g, "")
    .replace(/[{}]/g, "")
    .replace(/\^\(([^)]+)\)/g, "^$1");
}

function markComplete(key) {
  completed.add(key);
  const percent = Math.min(100, Math.round((completed.size / totalMilestones) * 100));
  document.getElementById("progress-bar").style.width = `${percent}%`;
  setText("progress-label", `${percent}%`);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function typeset(element = document.body) {
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([element]).catch(console.error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
