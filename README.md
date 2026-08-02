# Laws of Exponents Interactive Lesson

A static, JSON-driven webpage for the **Foundational Fluency** component of *Innovative Precalculus*.

## Project structure

```text
laws-of-exponents-site/
├── index.html
├── styles.css
├── app.js
├── lesson.json
├── netlify.toml
└── README.md
```

## How it works

- `lesson.json` contains the lesson content, examples, questions, answers, hints, and feedback.
- `app.js` reads the JSON and builds the webpage.
- `styles.css` controls the appearance.
- `index.html` supplies the page structure.
- MathJax renders the LaTeX stored in the JSON.

## Test locally

Because the page loads `lesson.json` with `fetch`, do not open `index.html` directly from your file system.

From the project folder, run one of these:

### Python

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

### VS Code

Install the Live Server extension, right-click `index.html`, and choose **Open with Live Server**.

## Deploy with GitHub and Netlify

1. Create a new GitHub repository.
2. Upload all files in this folder to the repository root.
3. In Netlify, choose **Add new site → Import an existing project**.
4. Connect GitHub and select the repository.
5. Netlify should detect the settings automatically from `netlify.toml`.
6. Deploy the site.

No build command or framework is required.

## Editing the lesson

Most lesson changes can be made in `lesson.json`.

Use LaTeX between dollar signs:

```json
{
  "prompt": "Simplify $(x^3)^4$.",
  "answer": "$x^{12}$"
}
```

When adding JSON text:

- escape a backslash as `\\`
- separate objects with commas
- keep quotation marks around every key and string

## Adding more lessons

The simplest approach is to copy this folder for each lesson and replace `lesson.json`.

A later version could use one shared webpage and load different JSON files through a URL parameter such as:

```text
index.html?lesson=similar-triangles
```


## Version 2: Calculus Before Calculus

This version preserves the complete original Laws of Exponents lesson and adds:

- an interactive derivative Power Rule preview;
- an interactive difference-quotient preview;
- a scaling model comparing length, area, and volume;
- progressive calculus-connection reveals;
- connection checks and retrieval practice.

Replace the files in your existing GitHub repository with the contents of this package.
Netlify will redeploy automatically after the GitHub commit.

## Version 2.0.1 Fix

This package adds the missing `formatNumber()` helper required by the
Calculus Before Calculus interactive controls.

## Version 2.1 Calculus Before Calculus Correction

This package preserves the complete lesson and corrects the Calculus Before Calculus section:

- the Power Rule explorer now includes positive, zero, negative, and fractional exponents with exact equivalent forms and domain notes;
- the difference-quotient explorer now plots two points on $f(u)=u^2$ and shows the true secant line approaching the tangent at $x=2$;
- the CBC cards, metrics, formulas, and SVGs remain within the page at common desktop widths;
- MathJax updates are queued so rapid interactive changes render reliably.
