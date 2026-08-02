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
