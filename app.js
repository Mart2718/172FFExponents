let lessonData;
const completed = new Set();
const totalMilestones = 12;
let mathJaxQueue = Promise.resolve();

const powerRuleStates = [
  {
    value: -4,
    label: "−4",
    kind: "Negative exponent",
    functionTex: "x^{-4}",
    derivativeTex: "-4x^{-5}",
    rewrittenTex: "-\\frac{4}{x^5}",
    newExponent: "−5",
    note: "The new negative exponent can be rewritten with a positive exponent in the denominator."
  },
  {
    value: -3,
    label: "−3",
    kind: "Negative exponent",
    functionTex: "x^{-3}",
    derivativeTex: "-3x^{-4}",
    rewrittenTex: "-\\frac{3}{x^4}",
    newExponent: "−4",
    note: "Both the original function and its derivative require x ≠ 0."
  },
  {
    value: -2,
    label: "−2",
    kind: "Negative exponent",
    functionTex: "x^{-2}",
    derivativeTex: "-2x^{-3}",
    rewrittenTex: "-\\frac{2}{x^3}",
    newExponent: "−3",
    note: "A negative exponent indicates a reciprocal; it does not make the function negative."
  },
  {
    value: -1,
    label: "−1",
    kind: "Negative exponent",
    functionTex: "x^{-1}",
    derivativeTex: "-x^{-2}",
    rewrittenTex: "-\\frac{1}{x^2}",
    newExponent: "−2",
    note: "The coefficient −1 is normally written as a leading minus sign."
  },
  {
    value: 0,
    label: "0",
    kind: "Zero exponent",
    functionTex: "x^0=1\\;(x\\ne0)",
    derivativeTex: "0",
    rewrittenTex: "0",
    newExponent: "not needed",
    note: "The coefficient is 0, so the derivative is 0 everywhere the original function is defined. We do not retain an x⁻¹ factor."
  },
  {
    value: 0.5,
    label: "1/2",
    kind: "Fractional exponent",
    functionTex: "x^{1/2}=\\sqrt{x}",
    derivativeTex: "\\frac12x^{-1/2}",
    rewrittenTex: "\\frac{1}{2\\sqrt{x}}",
    newExponent: "−1/2",
    note: "For real-valued functions, this derivative formula applies for x > 0."
  },
  {
    value: 2 / 3,
    label: "2/3",
    kind: "Fractional exponent",
    functionTex: "x^{2/3}=\\sqrt[3]{x^2}",
    derivativeTex: "\\frac23x^{-1/3}",
    rewrittenTex: "\\frac{2}{3\\sqrt[3]{x}}",
    newExponent: "−1/3",
    note: "The function is defined at x = 0, but this derivative formula is not; the graph has a cusp there."
  },
  {
    value: 1,
    label: "1",
    kind: "Positive exponent",
    functionTex: "x",
    derivativeTex: "1\\cdot x^0",
    rewrittenTex: "1",
    newExponent: "0",
    note: "Because x⁰ = 1, the derivative of x is 1."
  },
  {
    value: 2,
    label: "2",
    kind: "Positive exponent",
    functionTex: "x^2",
    derivativeTex: "2x",
    rewrittenTex: "2x",
    newExponent: "1",
    note: "The exponent becomes the coefficient, then the exponent decreases by 1."
  },
  {
    value: 3,
    label: "3",
    kind: "Positive exponent",
    functionTex: "x^3",
    derivativeTex: "3x^2",
    rewrittenTex: "3x^2",
    newExponent: "2",
    note: "The result is another power function."
  },
  {
    value: 5,
    label: "5",
    kind: "Positive exponent",
    functionTex: "x^5",
    derivativeTex: "5x^4",
    rewrittenTex: "5x^4",
    newExponent: "4",
    note: "The result is another power function."
  },
  {
    value: 8,
    label: "8",
    kind: "Positive exponent",
    functionTex: "x^8",
    derivativeTex: "8x^7",
    rewrittenTex: "8x^7",
    newExponent: "7",
    note: "The result is another power function."
  }
];

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
        <div class="cbc-control-heading">
          <label for="power-n"><strong>Exponent n:</strong> <span id="power-n-value">2</span></label>
          <span id="power-kind" class="cbc-kind">Positive exponent</span>
        </div>
        <input id="power-n" class="cbc-slider" data-situation="power-rule"
          type="range" min="0" max="${powerRuleStates.length - 1}" step="1" value="8"
          aria-describedby="power-slider-help power-note">
        <div id="power-slider-help" class="cbc-slider-scale" aria-hidden="true">
          <span>negative</span><span>zero</span><span>fractional</span><span>positive</span>
        </div>
        <div class="cbc-metrics">
          <div class="cbc-metric"><span>Original exponent</span><strong id="metric-original-n">2</strong></div>
          <div class="cbc-metric"><span>Multiplier</span><strong id="metric-coefficient">2</strong></div>
          <div class="cbc-metric"><span>New exponent</span><strong id="metric-new-n">1</strong></div>
        </div>
        <p id="power-note" class="cbc-note"></p>
      </div>`;
  }

  if (situation.id === "difference-quotient") {
    return `
      <div class="cbc-control-panel">
        <label for="dq-h"><strong>Positive change h:</strong> <span id="dq-h-value">1.5</span></label>
        <input id="dq-h" class="cbc-slider" data-situation="difference-quotient"
          type="range" min=".05" max="2.5" step=".05" value="1.5"
          aria-describedby="dq-help">
        <div class="cbc-slider-scale" aria-hidden="true"><span>h → 0</span><span>h = 2.5</span></div>
        <p id="dq-help" class="muted">The points are on $f(u)=u^2$ at $u=x$ and $u=x+h$, with $x=2$. Move left to make the secant approach the tangent.</p>
        <div class="cbc-metrics">
          <div class="cbc-metric"><span>h</span><strong id="metric-h">1.5</strong></div>
          <div class="cbc-metric"><span>Secant slope 2x + h</span><strong id="metric-dq">5.5</strong></div>
          <div class="cbc-metric"><span>Tangent slope 2x</span><strong>4</strong></div>
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
    const stateIndex = Number(document.getElementById("power-n")?.value || 8);
    const state = powerRuleStates[stateIndex];
    setText("power-n-value", state.label);
    setText("power-kind", state.kind);
    setText("metric-original-n", state.label);
    setText("metric-coefficient", state.label);
    setText("metric-new-n", state.newExponent);
    setText("power-note", state.note);

    const visual = document.getElementById("cbc-visual-power-rule");
    clearTypeset(visual);
    visual.innerHTML = `
      <div class="cbc-power-display">
        <div class="cbc-formula-row"><span>Function</span><strong>$f(x)=${state.functionTex}$</strong></div>
        <div class="cbc-rule-arrow" aria-hidden="true">apply $\\frac{d}{dx}(x^n)=nx^{n-1}$</div>
        <div class="cbc-formula-row"><span>Power Rule result</span><strong>$f'(x)=${state.derivativeTex}$</strong></div>
        <div class="cbc-formula-row cbc-final-form"><span>Simplified form</span><strong>$f'(x)=${state.rewrittenTex}$</strong></div>
      </div>`;
    typeset(visual);
    return;
  }

  if (id === "difference-quotient") {
    const h = Number(document.getElementById("dq-h")?.value || 1.5);
    const x = 2;
    const value = 2 * x + h;
    setText("dq-h-value", formatNumber(h));
    setText("metric-h", formatNumber(h));
    setText("metric-dq", formatNumber(value));
    const plot = { left: 62, right: 642, top: 28, bottom: 330, xMax: 5, yMax: 25 };
    const mapX = value => plot.left + (value / plot.xMax) * (plot.right - plot.left);
    const mapY = value => plot.bottom - (value / plot.yMax) * (plot.bottom - plot.top);
    const px = mapX(x);
    const py = mapY(x ** 2);
    const qx = mapX(x + h);
    const qy = mapY((x + h) ** 2);
    const tangentStartX = 0.9;
    const tangentEndX = 4.1;
    const tangentY = u => x ** 2 + 2 * x * (u - x);
    const curvePoints = Array.from({ length: 51 }, (_, index) => {
      const u = index / 10;
      return `${mapX(u).toFixed(1)},${mapY(u ** 2).toFixed(1)}`;
    }).join(" ");

    document.getElementById("cbc-visual-difference-quotient").innerHTML = `
      <div class="cbc-dq-visual">
        <svg viewBox="0 0 700 390" role="img" aria-labelledby="dq-svg-title dq-svg-desc">
          <title id="dq-svg-title">Secant line approaching the tangent line on f of u equals u squared</title>
          <desc id="dq-svg-desc">Point P is fixed at x equals 2. Point Q is at x plus h. As h decreases, Q moves toward P and the blue secant line approaches the dashed tangent line.</desc>
          <defs>
            <marker id="dq-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#667085"/>
            </marker>
          </defs>
          <line x1="${plot.left}" y1="${plot.bottom}" x2="660" y2="${plot.bottom}" class="dq-axis" marker-end="url(#dq-arrow)"/>
          <line x1="${plot.left}" y1="${plot.bottom}" x2="${plot.left}" y2="16" class="dq-axis" marker-end="url(#dq-arrow)"/>
          <text x="663" y="350" class="dq-axis-label">u</text>
          <text x="38" y="20" class="dq-axis-label">f(u)</text>
          <polyline points="${curvePoints}" class="dq-curve"/>
          <line x1="${mapX(tangentStartX)}" y1="${mapY(tangentY(tangentStartX))}" x2="${mapX(tangentEndX)}" y2="${mapY(tangentY(tangentEndX))}" class="dq-tangent"/>
          <line x1="${px}" y1="${py}" x2="${qx}" y2="${qy}" class="dq-secant"/>
          <line x1="${px}" y1="${py}" x2="${qx}" y2="${py}" class="dq-rise-run"/>
          <line x1="${qx}" y1="${py}" x2="${qx}" y2="${qy}" class="dq-rise-run"/>
          <circle cx="${px}" cy="${py}" r="7" class="dq-point-p"/>
          <circle cx="${qx}" cy="${qy}" r="7" class="dq-point-q"/>
          <text x="${px - 30}" y="${py - 12}" class="dq-point-label">P: x</text>
          <text x="${Math.min(qx + 10, 610)}" y="${Math.max(qy - 10, 35)}" class="dq-point-label">Q: x+h</text>
          <text x="${(px + qx) / 2 - 6}" y="${py + 23}" class="dq-measure-label">h</text>
          <text x="405" y="308" class="dq-tangent-label">tangent slope = 2x = 4</text>
          <text x="430" y="72" class="dq-secant-label">secant slope = 2x+h = ${formatNumber(value)}</text>
        </svg>
        <div class="cbc-dq-equation">$\\dfrac{(x+h)^2-x^2}{h}=2x+h=${formatNumber(value)}$</div>
      </div>`;
    typeset(document.getElementById("cbc-visual-difference-quotient"));
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


function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  if (Number.isInteger(number)) {
    return String(number);
  }

  return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function typeset(element = document.body) {
  if (window.MathJax?.typesetPromise) {
    mathJaxQueue = mathJaxQueue
      .then(() => window.MathJax.typesetPromise([element]))
      .catch(error => console.error("MathJax typesetting failed:", error));
  }
}

function clearTypeset(element) {
  if (window.MathJax?.typesetClear) {
    window.MathJax.typesetClear([element]);
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
