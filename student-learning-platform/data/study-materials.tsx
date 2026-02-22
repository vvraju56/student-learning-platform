"use client"

// Extremely detailed GFG-style study pack
// 13 categories × 3 difficulty levels = 39 StudyMaterial notes
// Each StudyMaterial.type = "note"
// Each practice item instructs user to TYPE their answers (no paste).

export const resource_zip_url = "/mnt/data/student-learning-platform (1).zip"

export type StudyMaterial = {
  id: string
  title: string
  summary: string
  content: string // long-form detailed GFG-style article
  key_points: string[]
  topics: string[]
  practice: string[] // instructions for learner — typed answers only
  type: "note"
}

export const content: StudyMaterial[] = [
  /* -------------------------
   WEB: HTML
   ------------------------- */
  {
    id: "html-basic-c",
    title: "HTML — Basic (GFG-style): Document Structure & Core Tags",
    summary: "Detailed guide to HTML document structure, essential tags, attributes, and accessible markup.",
    content: `Introduction
HTML (HyperText Markup Language) is the standard language for structuring content on the web. HTML defines elements (tags) which the browser renders. The skill with HTML is to use semantic elements to express meaning, not just visuals.

Document skeleton
Every HTML document follows a basic skeleton:
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Document title</title>
  </head>
  <body>
    <!-- content -->
  </body>
</html>

Head elements
- <meta charset="utf-8">: ensures correct character encoding.
- <meta name="viewport">: essential for responsive design.
- <title>: shown in browser tab & used by search engines.

Core semantic tags
- <header>, <nav>, <main>, <section>, <article>, <aside>, <footer>
- Use headings <h1>.. <h6> to provide a hierarchy — only one <h1> per page ideally.
- <p> for paragraphs, <ul>/<ol>/<li> for lists.

Inline vs block-level
- Block-level elements start on new line (<div>, <p>, <section>).
- Inline elements flow inside block content (<span>, <a>, <strong>).

Attributes
- href for <a>, src for <img>, alt for <img> (critical for accessibility), title for tooltips.
- aria-* attributes for assistive tech.

Forms basics
<form action="#" method="post"> with <input>, <label>, <textarea>, <select>
Always associate <label for="id"> with an input id for accessibility.

Examples (typed sample)
Example: semantic article
<article itemscope itemtype="http://schema.org/Article">
  <header>
    <h1 itemprop="headline">Article title</h1>
    <p>By <span itemprop="author">Author</span> — <time datetime="2025-01-01" itemprop="datePublished">Jan 1, 2025</time></p>
  </header>
  <section>
    <p itemprop="articleBody">First paragraph...</p>
  </section>
  <footer>
    <p>Tags: <a>...</a></p>
  </footer>
</article>

Accessibility checklist
- Provide alt text for images.
- Use <nav> for primary navigation.
- Ensure form labels exist.
- Avoid skipping heading levels.

Common mistakes
- Using <div> everywhere instead of semantics.
- Missing alt attributes.
- Multiple <h1> elements causing SEO confusion.

Best practices
- Use semantic tags to communicate meaning.
- Keep markup valid and small; avoid inline styles for structure.
- Use meaningful link text (“Read more about CSS” vs “click here”).

Performance note
- Minimize DOM size for performance. Use sensible nesting.

`,
    key_points: [
      "Every page needs a Doctype, html, head, and body.",
      "Use semantic tags to convey structure and accessibility.",
      "Always include alt text for images and associate labels with inputs.",
    ],
    topics: ["html", "basics", "semantic", "accessibility"],
    practice: [
      "Type (manually) the full HTML markup for a one-page personal profile using <header>, <nav>, <main> with at least one <article> and an accessible <form> in the answer box. Pasting is prohibited. The page must include: title, meta viewport, an image with alt, a labeled email input, and a submit button.",
      "In the answer box type separate short explanations (2–3 lines each) for: why <main> is needed; how <nav> helps screen readers; why alt text matters.",
    ],
    type: "note",
  },
  {
    id: "html-medium-c",
    title: "HTML — Medium (GFG-style): Forms, Validation & Semantic Metadata",
    summary: "Advanced form controls, built-in validation, microdata/schema basics and accessible error messaging.",
    content: `Overview
Forms are how users send data. A robust form is semantic, accessible, and validates user input. Modern HTML provides attributes that enable client-side validation without JavaScript (required, pattern, min, max, type=email, etc.). For search and rich snippets, add structured data using microdata, RDFa, or JSON-LD.

Form anatomy
<form method="post" action="/submit" novalidate?>
  <label for="name">Full name</label>
  <input id="name" name="name" type="text" required />
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required />
  <label for="phone">Phone</label>
  <input id="phone" name="phone" type="tel" pattern="\\+?[0-9\\-\\s]+" />
  <button type="submit">Submit</button>
</form>

Key validation attributes
- required: field must not be empty.
- type="email": verifies email pattern.
- pattern: regex-based validation.
- min, max, minlength, maxlength: numeric and string length checks.
- novalidate on form: disables browser validation (rarely used).

Accessible validation UX
- Use aria-live regions to announce validation errors.
- Show inline error messages next to fields (with role="alert").
- Keep error text concise and actionable.

Microdata example (author & publish date)
<article itemscope itemtype="http://schema.org/Article">
  <h1 itemprop="headline">Title</h1>
  <span itemprop="author">Author name</span>
  <time itemprop="datePublished" datetime="2025-01-01">Jan 1, 2025</time>
  <div itemprop="articleBody">...</div>
</article>

Progressive enhancement
- Build accessible HTML first.
- Add JavaScript to enhance UX (debounced validation, async validation).
- Ensure core functionality works without JS.

Security considerations (HTML-level)
- Never trust client validation: always validate on server too.
- Use appropriate input types to reduce injection risks.

Examples to type
- A small contact form with pattern and required attributes.
- A snippet showing aria-describedby linking to an error message.

`,
    key_points: [
      "Use HTML built-in validation attributes for basic checks.",
      "Always provide accessible inline error messages and aria roles.",
      "Use microdata for structured metadata when helpful.",
    ],
    topics: ["html", "forms", "validation", "microdata"],
    practice: [
      "Type the full form markup (HTML only) with labels, an input pattern for phone number, required attributes, and an inline error <div> tied via aria-describedby. Type everything manually into the answer box — no paste.",
      "Type a short paragraph explaining how you would degrade gracefully if JavaScript is disabled.",
    ],
    type: "note",
  },
  {
    id: "html-hard-c",
    title: "HTML — Hard (GFG-style): Accessible, SEO-ready Article + Performance Tips",
    summary:
      "Comprehensive article on building accessible, SEO-friendly HTML pages with microdata, lazy-loading strategies, and critical performance considerations.",
    content: `Introduction
At scale, HTML isn't just about tags; it's about semantics, accessibility, SEO, and performance. This guide details how to structure a content-heavy page (news/article/blog) so it's fast, accessible, and indexable.

SEO & semantics
- Use one <h1> for the page title.
- Break content into <article> and <section> with <h2>/<h3>.
- Use rel="canonical" in <head> for duplicated content.
- Use <meta name="description"> with a concise summary.
- Add structured data: prefer JSON-LD in <head> for Google.

Example JSON-LD for an article:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Title",
  "author": { "@type": "Person", "name": "Author" },
  "datePublished": "2025-01-01T08:00:00+00:00"
}
</script>

Accessibility deep dive
- Use landmark elements: <main>, <nav>, <header>, <footer>, <aside>.
- Ensure focus order is logical and visible (outline styles).
- Provide skip links (<a href="#main">Skip to main content</a>).
- Use captions and transcripts for multimedia.

Image performance & accessibility
- Use <img src="..." alt=""> and prefer srcset and sizes attributes for responsive images.
- Use loading="lazy" for offscreen images to defer loading.

Critical rendering & performance
- Inline critical CSS, defer non-critical CSS.
- Defer or async non-essential scripts.
- Minimize DOM depth and reduce heavy layout thrashing.
- Use HTTP caching headers and CDNs for static assets.

Internationalization
- Use lang attribute on <html lang="en"> and correct character encoding.
- Consider directionality (dir="rtl") for right-to-left languages.

Example article skeleton (typed by student)
- Header with nav and skip link.
- Article with JSON-LD.
- Image with srcset and loading="lazy".
- Footer with author bio.

Common audit checklist
- Lighthouse accessibility > 90
- Ensure no ARIA misuse (don't use redundant roles)
- Validate structured data in console or rich results tool

`,
    key_points: [
      "Combine semantics and JSON-LD for SEO and accessibility.",
      "Optimize images with srcset and lazy-loading for performance.",
      "Use skip links and proper focus management for screen reader users.",
    ],
    topics: ["html", "seo", "accessibility", "performance"],
    practice: [
      "Type (manually) a full article HTML file that includes JSON-LD in the head, a skip link, a responsive image (with srcset), and clearly labeled author metadata. Must be typed into the answer box (no paste).",
      "Type a 3–5 line audit checklist you would run before publishing this page.",
    ],
    type: "note",
  },

  /* -------------------------
   WEB: CSS
   ------------------------- */
  {
    id: "css-basic-c",
    title: "CSS — Basic (GFG-style): Selectors, Box Model & Typography",
    summary: "In-depth explanation of selectors, specificity, the box model, and baseline typography rules.",
    content: `Selectors and specificity
- Type selector (div, p) specificity = 0,0,0,1
- Class selector (.card) specificity = 0,0,1,0
- ID selector (#main) specificity = 0,1,0,0
- Inline style style="" = highest specificity (not recommended)
- !important overrides but should be avoided.

Combinators
- Descendant: .nav a { } targets a inside .nav
- Child: .list > li { } only direct children
- Adjacent sibling: h1 + p { }
- General sibling: h2 ~ p { }

Box model
- content + padding + border + margin
- box-sizing: border-box keeps width include padding/border — preferred for predictable layout.

Typography basics
- font-family fallback stack: font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
- line-height for readability (1.4–1.6)
- responsive units: rem for typography, em for component-relative sizes, % for fluid widths.

Layout basics
- Use display: block, inline, inline-block, none for basic rules.
- Centering: margin: 0 auto for block elements with fixed width.

Common accessibility tips
- Do not rely on color alone to indicate state.
- Use :focus styles to ensure keyboard navigation visibility.

Examples to type
- Write CSS to style a card: border-radius, box-shadow, padding, font-size, and a hover state.

`,
    key_points: [
      "Understand selector specificity and avoid unnecessary IDs.",
      "Prefer box-sizing: border-box for simpler layouts.",
      "Use rem for typography for consistent scaling.",
    ],
    topics: ["css", "basics", "selectors", "box-model"],
    practice: [
      "Type the CSS rules to style a profile card: .card { box-sizing: border-box; padding: 16px; border-radius: 8px; box-shadow: ... } — type manually in the answer box (no paste).",
      "Type two lines explaining when to use em vs rem for font sizing.",
    ],
    type: "note",
  },
  {
    id: "css-medium-c",
    title: "CSS — Medium (GFG-style): Flexbox & Responsive Patterns",
    summary: "Complete guide to Flexbox mechanics, alignment, responsive breakpoints, and practical layout patterns.",
    content: `Flexbox fundamentals
- display: flex creates a flex container.
- Main axis (flex-direction: row | column) and cross axis.
- Key properties on container: justify-content, align-items, align-content, flex-wrap.
- On items: flex-grow, flex-shrink, flex-basis, order, align-self.

Common patterns
- Horizontal nav with centered items: justify-content: center; align-items: center;
- Two-column responsive layout: .container { display:flex; gap: 16px; } .sidebar { flex: 0 0 240px; } .main { flex: 1; }

Responsive breakpoints
- Mobile-first approach: define base styles for small screens, then add @media (min-width: 768px) { ... } for tablet/desktop.
- Use relative units (rem, %) rather than px for better scaling.

Flexbox caveats
- min-height/width interplay with flex-basis; use min-width: 0 on the flex child to avoid overflow on long words.
- flex: 1 is shorthand for flex-grow:1; flex-shrink:1; flex-basis:0%.

Accessibility & touch
- Ensure tappable elements have adequate size (44–48px).
- Avoid hover-only UX for critical functionality.

Practical examples to type
- CSS for a responsive two-column layout that stacks on narrow screens using flexbox and a media query.

`,
    key_points: [
      "Flexbox is ideal for one-dimensional layouts (row or column).",
      "Use mobile-first media queries (min-width) and relative units.",
      "Set min-width: 0 on flex children to prevent overflow.",
    ],
    topics: ["css", "flexbox", "responsive"],
    practice: [
      "Type the CSS for a responsive two-column layout using flexbox and a media query to stack under 600px. Must be typed manually into the answer box (no paste).",
      "Type a short test plan listing viewport widths and expected layout.",
    ],
    type: "note",
  },
  {
    id: "css-hard-c",
    title: "CSS — Hard (GFG-style): Grid Layouts, Advanced Techniques & Performance",
    summary:
      "Comprehensive CSS Grid tutorial, responsive area naming, subgrid, and advanced performance/maintainability tips.",
    content: `CSS Grid deep dive
- Grid is for two-dimensional layout: use grid-template-columns and grid-template-rows.
- Template areas: grid-template-areas: "header header" "sidebar main" "footer footer";
- Place items using grid-area: header;
- Use repeat(), minmax(), auto-fill, and auto-fit for fluid layouts.

Example: magazine layout
.container {
  display: grid;
  grid-template-columns: 240px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "sidebar main ads"
    "footer footer footer";
  gap: 16px;
}

Performance & maintainability
- Limit heavy selectors; avoid expensive selectors on large DOMs.
- Avoid animating layout properties like width/height — prefer transform and opacity for smoother GPU-accelerated animations.
- Use CSS variables (custom properties) for theme tokens and to reduce repetition.

Subgrid & browser support
- Subgrid is useful for nested grid alignment when supported — graceful fallback needed.

Accessibility & print
- Consider print styles using @media print — hide interactive widgets, ensure readable fonts.

Practical exercise
- Create a grid with named areas that reorganize on mobile (single column) using grid-template-areas in a media query.

`,
    key_points: [
      "Use Grid for two-dimensional, complex layouts and Flexbox for one-dimensional ones.",
      "Prefer transform & opacity for animations to avoid layout thrashing.",
      "Use CSS variables for theming and maintainability.",
    ],
    topics: ["css", "grid", "advanced", "performance"],
    practice: [
      "Type the CSS for a magazine-style grid layout with named areas and a media query that collapses to one column on small screens. Type manually into the answer box (pasting blocked).",
      "Type a 3-line explanation of why transforms are preferred for animations.",
    ],
    type: "note",
  },

  /* -------------------------
   WEB: JavaScript
   ------------------------- */
  {
    id: "js-basic-c",
    title: "JavaScript — Basic (GFG-style): Fundamentals & DOM",
    summary: "Comprehensive introduction to JavaScript basics and DOM manipulation.",
    content: `Core language concepts
Variables & scope
- Modern JS uses const and let, which are block-scoped.
- var is function-scoped (legacy).

Example:
const MAX_SIZE = 100;
let count = 0;

Data types & type coercion
- Primitives: string, number, boolean, null, undefined, symbol, bigint.
- Use strict equality (===) to avoid unintended coercions.
- typeof operator returns type as a string.

Functions
- Named functions: function foo() { ... }
- Arrow functions: const foo = (x) => { ... }
- Closures capture surrounding scope

DOM Manipulation
- Query elements: document.querySelector('#id'), document.querySelectorAll('.class')
- Event handling: elem.addEventListener('click', handler)
- Creating nodes: document.createElement, appendChild
- Prevent default: event.preventDefault()

Example: update element on button click
const btn = document.querySelector('#btn');
const out = document.querySelector('#out');
btn.addEventListener('click', () => {
  const input = document.querySelector('#text').value;
  out.textContent = 'You typed: ' + input;
});

Common pitfalls
- Mutating objects unexpectedly — prefer immutability patterns where helpful.
- Forgetting to await async functions.

Debugging tips
- Use console.log wisely, breakpoints in DevTools, and debugger statement.

`,
    key_points: [
      "Prefer const and let over var; use === for comparisons.",
      "Understand closures and lexical this for advanced patterns.",
      "Use async/await for clearer asynchronous code.",
    ],
    topics: ["javascript", "basics", "dom", "async"],
    practice: [
      "Type JS code to read value from <input id='name'> and display a greeting in <div id='greet'> on button click. Must be manually typed in the answer box.",
      "Type one paragraph explaining the difference between var and let.",
    ],
    type: "note",
  },
  {
    id: "js-medium-c",
    title: "JavaScript — Medium (GFG-style): Fetch, Error Handling & Patterns",
    summary: "Thorough coverage of fetch API, async/await patterns, error handling, debouncing, and modular design.",
    content: `Fetch & async/await
- Use fetch(url, options) returning a Promise. Use response.ok to check status.
- Example:
async function loadItems() {
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    render(data);
  } catch (err) {
    showError(err.message);
  }
}

Error handling
- Use try/catch with async/await.
- Provide user-friendly error messages and retry options (exponential backoff).

Debounce & throttle
- Debounce delays function execution until after a quiet period — useful for search input.
- Throttle ensures function runs at most every N ms — useful for scroll handlers.

Module patterns
- ES modules (import/export) for clean separation of concerns.
- Keep modules focused on single responsibility.

Testing & tooling
- Use small unit tests (Jest) for pure functions.
- Use linting (ESLint) and formatting (Prettier).

Example to type
- Type a function fetchWithRetry(url, retries) that retries fetch a given number of times with delay. Type manually into answer box.

`,
    key_points: [
      "Check response.ok and handle HTTP errors explicitly.",
      "Use debounce for user input to reduce network calls.",
      "Organize code using ES modules for maintainability.",
    ],
    topics: ["javascript", "fetch", "patterns", "error-handling"],
    practice: [
      "Type a fetchWithRetry function using async/await that retries up to 3 times with incremental delay. Must be typed manually (no paste).",
      "Type two sentences explaining when to use debounce vs throttle.",
    ],
    type: "note",
  },
  {
    id: "js-hard-c",
    title: "JavaScript — Hard (GFG-style): Architecture — State Management & Performance",
    summary:
      "Design patterns for state management, immutability, performance optimization, and building a tiny createStore implementation.",
    content: `State management principles
- Keep a single source of truth where appropriate.
- Prefer immutable updates: use spread operator for objects and arrays to avoid mutation-related bugs.
- Use selectors to derive computed data from state.

Implementing a tiny store (concept)
- Expose getState(), setState(updater), subscribe(listener).
- Ensure subscribers are called after state changes.
- Allow setState to accept partial updates or updater functions.

Performance tips
- Avoid unnecessary DOM updates: batch updates and use virtual DOM or minimal DOM diffing.
- Use requestAnimationFrame for UI updates tied to animation frames.
- Debounce input-based expensive computations.

Example createStore (student to type)
function createStore(initialState = {}) {
  let state = initialState
  const listeners = new Set()
  return {
    getState: () => state,
    setState: (update) => {
      state = typeof update === "function" ? update(state) : { ...state, ...update }
      listeners.forEach((l) => l())
    },
    subscribe: (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

`,
    key_points: [
      "Implement stores with getState/setState/subscribe for predictable state flow.",
      "Use immutable updates to avoid side effects.",
      "Batch UI updates and use rAF for animation-driven changes.",
    ],
    topics: ["javascript", "state", "architecture", "performance"],
    practice: [
      "Type a createStore implementation that supports getState, setState(updater|partial), and subscribe. Must be typed manually into the answer box (no paste).",
      "Type an example usage snippet that registers a subscriber and updates state.",
    ],
    type: "note",
  },

  /* -------------------------
   WEB: React / Backend
   ------------------------- */
  {
    id: "react-basic-c",
    title: "React — Basic (GFG-style): Components, JSX & Hooks",
    summary:
      "Full tutorial on functional components, JSX syntax, props, state (useState), and event handling in React.",
    content: `JSX & component basics
- JSX is a syntax extension to write markup-like syntax in JS.
- Functional component: function Greeting({name}) {
  return <div>Hello, {name}</div>;
}

useState hook
- const [count, setCount] = useState(0)
;-setCount((prev) => prev + 1)

useEffect basics - Runs after render pass dependency array cleanup via returned function.

Props & composition
- Pass data via props; use composition to create reusable building blocks.Controlled components - Inputs driven by state:
const [text, setText] = useState("")
;<input value={text} onChange={(e) => setText(e.target.value)} />

Basic testing & debugging - Use React DevTools.
- Console warnings guide prop types and missing keys.Project structure - Split components by feature co-locate styles use context for cross-cutting concerns.

`,
    key_points: [
      "Use functional components and hooks (useState/useEffect).",
      "Keep components small and focused.",
      "Use controlled components for form input management.",
    ],
    topics: ["react", "hooks", "components"],
    practice: [
      "Type a React functional component with a counter using useState and two buttons (+/-). All JSX and hook usage must be typed in the answer box (no paste).",
      "Type one sentence explaining why useEffect with [] runs once on mount.",
    ],
    type: "note",
  },
  {
    id: "react-medium-c",
    title: "React — Medium (GFG-style): Data Fetching, Routing & Composition",
    summary:
      "Guide to fetching data using useEffect, routing with react-router, lifting state up, and composition best practices.",
    content: `Data fetching
- Fetch in useEffect and handle cleanup to avoid setting state after unmount.
- Use query libraries (SWR/React Query) for caching in bigger apps.

Routing
- react-router-dom: BrowserRouter, Routes, Route.
- Use useNavigate for programmatic navigation.

Composition & patterns
- Higher-order components (rare now), render props, and custom hooks.
- Custom hook example: useAuth() to share login state across components.Form handling - Controlled components for small forms.
- Use libraries (Formik/React Hook Form) for large forms.

Optimizations
- useMemo and useCallback to avoid unnecessary re-renders on expensive computations.
- React.lazy + Suspense for code-splitting.

`,
    key_points: [
      "Use custom hooks to factor reusable logic.",
      "Use Suspense and lazy for route-based code splitting.",
      "Prefer libraries for complex data management (React Query).",
    ],
    topics: ["react", "routing", "hooks", "patterns"],
    practice: [
      "Type a React component using useEffect to fetch /api/items and render them; include a loading indicator. Must be typed manually.",
      "Type two lines describing when to use useMemo.",
    ],
    type: "note",
  },
  {
    id: "react-hard-c",
    title: "Backend — Hard (GFG-style): Node.js + Express — REST Design & Security",
    summary:
      "Comprehensive tutorial on designing REST APIs with Express, middleware, validation, error handling, authentication basics, and performance tips.",
    content: `Core express app
- Use express.json() to parse JSON body.
- Create routes: app.get("/items"), app.post("/items")

Validation - Use libraries like Joi or celebrate for schema validation.
- Validate inputs at boundary to prevent malformed data.Error handling - Centralized error middleware: app.use((err, req, res, next) => {
  ...
}) - Use consistent error shapes(code, message, details).Authentication & security - Use JWT for stateless auth with refresh tokens stored securely.
- Protect routes via middleware (authorize).
- Prevent injection: use parameterized queries for DB operations.
- Rate limiting (express-rate-limit) to prevent abuse.
- Helmet to set secure headers.Performance & scaling - Avoid blocking the event loop with heavy synchronous tasks.
- Use clustering or multiple instances behind a load balancer for CPU-bound tasks.

Example typed tasks
- Implement POST /items with validation and in-memory store.

`,
    key_points: [
      "Validate all incoming data; never trust client-side validation alone.",
      "Use centralized error handling and consistent error responses.",
      "Avoid blocking event loop; use async DB drivers and worker threads for heavy tasks.",
    ],
    topics: ["node", "express", "api", "security"],
    practice: [
      "Type Express route handlers for POST /items (validate body) and GET /items using an in-memory array. Must be typed manually in the answer box (no paste).",
      "Type a short paragraph on one method to protect APIs from brute-force attacks.",
    ],
    type: "note",
  },

  /* -------------------------
   APP: Android (Java)
   ------------------------- */
  {
    id: "android-java-basic-c",
    title: "Android Java — Basic (GFG-style): Activity Lifecycle & Layout XML",
    summary: "Comprehensive article about Activity lifecycle methods, layout XML basics, and wiring UI to Java code.",
    content: `Activity lifecycle - onCreate(): initialize UI and state
- onStart(): activity becoming visible
- onResume(): activity in foreground (user can interact)
- onPause(): partial obscuring (save transient data)
- onStop(): not visible
- onDestroy(): final cleanup

Common pitfalls
- Heavy operations in onCreate blocking UI — use background thread.
- Not saving transient state in onSaveInstanceState causing data loss on rotation.

Layout XML
- Use ConstraintLayout for responsive UIs.
- Define ids to reference views in code: android:id="@+id/myText"
- Use styles.xml and themes to centralize look and feel.

Binding UI to code
- findViewById(R.id.myText) or view binding to avoid boilerplate.
- Set listeners: button.setOnClickListener(v ->
{
  ...
}
)

Example to type - Full XML layout with TextView and Button.
- Java snippet in Activity to bind button and change text on click.Best practices - Use view binding or data binding to reduce null pointer issues.
- Avoid memory leaks by removing callbacks in onDestroy.

`,
    key_points: [
      "Follow activity lifecycle to manage resource allocation.",
      "Prefer view binding over findViewById for safety and readability.",
      "Keep heavy tasks off the main thread.",
    ],
    topics: ["android", "java", "lifecycle", "xml"],
    practice: [
      "Type the XML layout for an activity with a TextView and Button and type the Java code to bind the button and update the TextView on click. Must be typed manually in the answer box.",
      "Type a short explanation of when onSaveInstanceState is called and what data to save.",
    ],
    type: "note",
  },
  {
    id: "android-java-medium-c",
    title: "Android Java — Medium (GFG-style): Intents, Fragments & Data Passing",
    summary:
      "Deep dive on Intents, starting activities for results, fragment lifecycle and safe data passing patterns.",
    content: `Intents & data passing - Use Intent extras for simple data types: intent.putExtra("key", value)
- For complex objects use Parcelable or serialize selectively.
- startActivityForResult deprecated — use registerForActivityResult API (Activity Result APIs).

Fragments
- Use fragments for modular UI; fragments have their own lifecycle which depends on host activity.
- Communicate between fragments via ViewModel(shared) rather than direct fragment references.Saved state & ViewModel - Use ViewModel to retain state across configuration changes combine with SavedStateHandle for persistence.

Navigation component
- Use Jetpack Navigation for safe type-safe arg passing between destinations.Security - Never pass sensitive data via implicit intents without permissions.

`,
    key_points: [
      "Use Parcelable for passing objects across Activities.",
      "Prefer ViewModel for shared state between fragments and activities.",
      "Use Activity Result APIs instead of startActivityForResult.",
    ],
    topics: ["android", "intents", "fragments", "viewmodel"],
    practice: [
      "Type Java snippets that create an Intent with extras and the receiving code that reads extras (typed manually).",
      "Type a short plan on how to migrate legacy startActivityForResult code to Activity Result APIs.",
    ],
    type: "note",
  },
  {
    id: "android-java-hard-c",
    title: "Android Java — Hard (GFG-style): SQLite, ContentProviders & Persistence",
    summary:
      "Exhaustive tutorial on SQLiteOpenHelper, CRUD patterns, transactions, and designing a migration strategy.",
    content: `SQLite basics - Create database using SQLiteOpenHelper subclass.
- Implement onCreate() to exec SQL create table statements.
- Use insert(), update(), delete(), query() on writable DB.Transactions & performance - Wrap multiple writes in beginTransaction / setTransactionSuccessful / endTransaction for atomicity.
- Use indices for query performance.

Migrations
- Implement onUpgrade() carefully; prefer ALTER TABLE for simple changes; for complex migrations consider creating new table(), copying, dropping old.ContentProvider - Expose data to other apps via ContentProvider implement URI matching and appropriate permissions.
- Consider Room(Jetpack) as modern alternative to SQLiteOpenHelper with compile-time checks and migrations.Security & backups - Encrypt sensitive local data.
- Use Room with fallbackToDestructiveMigration only when acceptable.

`,
    key_points: [
      "Wrap multiple DB writes in transactions for atomicity and speed.",
      "Plan migrations carefully; use Room for safer migrations if possible.",
      "Index columns used in WHERE clauses to improve read performance.",
    ],
    topics: ["android", "sqlite", "persistence", "security"],
    practice: [
      "Type a Java class extending SQLiteOpenHelper with onCreate SQL for a notes table and an insertNote method. Type manually in the answer box.",
      "Type a short migration plan describing how you'd add a new column to existing table with minimal downtime.",
    ],
    type: "note",
  },

  /* -------------------------
   APP: Android (Kotlin)
   ------------------------- */
  {
    id: "android-kotlin-basic-c",
    title: "Android Kotlin — Basic (GFG-style): Kotlin Syntax & Activity Basics",
    summary:
      "Comprehensive primer on Kotlin language essentials for Android and basic Activity setup using view binding.",
    content: `Kotlin overview - val vs var for immutability: val x = 1 (immutable), var y = 2(mutable) - Null-safety: String? allows null use ?. and ?: operators.
- Extension functions to add behavior to existing classes.Activity with view binding - Enable viewBinding in module build.gradle - Use binding = ActivityMainBinding.inflate(layoutInflater) - setContentView(binding.root) - Access views via binding.textView

Coroutines intro - Use lifecycleScope.launch { withContext(Dispatchers.IO) ... } for IO-bound work.

Best practices
- Prefer val whenever possible.
- Keep UI code short and delegate logic to ViewModel.

`,
    key_points: [
      "Use val for immutable variables and nullable types with safe operators.",
      "Use view binding to replace findViewById for safety.",
      "Use coroutines for async work with appropriate dispatchers.",
    ],
    topics: ["kotlin", "android", "basics"],
    practice: [
      "Type a Kotlin Activity snippet using view binding to set text on a TextView — type manually.",
      "Type one line explaining ?. vs !! operators in Kotlin.",
    ],
    type: "note",
  },
  {
    id: "android-kotlin-medium-c",
    title: "Android Kotlin — Medium (GFG-style): RecyclerView & ViewModel Patterns",
    summary:
      "Detailed tutorial on building RecyclerView adapters in Kotlin, ViewModel usage, and LiveData/Flow basics.",
    content: `RecyclerView - Adapter pattern: ViewHolder inner class caches view references.
- Use DiffUtil for efficient list updates.
- Handle item click using interface or lambda callbacks.

ViewModel & LiveData/Flow
- ViewModel holds UI state; LiveData emits updates lifecycle-aware.
- Kotlin Flow provides cold streams and coroutines-friendly API.

Dependency injection
- Use Hilt for DI to manage app-level dependencies in modern codebases.

Testing patterns
- Write unit tests for ViewModel logic using coroutines test dispatcher.

`,
    key_points: [
      "Use DiffUtil with RecyclerView for efficient updates.",
      "Keep UI state in ViewModel, expose via LiveData or Flow.",
      "Use Hilt for modular, testable dependency injection.",
    ],
    topics: ["kotlin", "recyclerview", "viewmodel", "flow"],
    practice: [
      "Type a RecyclerView.Adapter skeleton in Kotlin showing ViewHolder and onBindViewHolder (manually typed).",
      "Type two lines explaining why DiffUtil is used.",
    ],
    type: "note",
  },
  {
    id: "android-kotlin-hard-c",
    title: "Android Kotlin — Hard (GFG-style): Coroutines, Flow & Advanced Patterns",
    summary:
      "Deep guide to coroutines, structured concurrency, Flow transformation operators, and cancellation patterns for robust apps.",
    content: `Structured concurrency
- Use CoroutineScope tied to lifecycle (lifecycleScope) and cancel work onDestroy or onStop where appropriate.
- Avoid GlobalScope for structured concurrency.

Flow operators
- map, filter, debounce, distinctUntilChanged for common reactive patterns.
- Use stateIn/SharedFlow for sharing results across collectors.

Cancellation & error handling - Use try/catch/finally.
- Use withTimeout for network calls.

Example pattern - repository.fetchItems() returns Flow<List<Item>> -ViewModel collects and caches in StateFlow for UI consumption.

`,
    key_points: [
      "Use lifecycle-aware scopes for coroutine lifetime management.",
      "Prefer Flow over LiveData for advanced reactive stream transformations.",
      "Handle cancellation and exceptions to avoid leaks and crashes.",
    ],
    topics: ["kotlin", "coroutines", "flow", "advanced"],
    practice: [
      "Type a coroutine example that launches a network call in Dispatchers.IO and updates UI on Dispatchers.Main (typed manually).",
      "Type a brief note explaining why GlobalScope is discouraged.",
    ],
    type: "note",
  },

  /* -------------------------
   APP: Flutter
   ------------------------- */
  {
    id: "flutter-basic-c",
    title: "Flutter — Basic (GFG-style): Widgets & State",
    summary: "In-depth explanation of StatelessWidget vs StatefulWidget, widget tree, and basic layout widgets.",
    content: `Widgets & build()
- Everything in Flutter is a Widget.
- StatelessWidget: immutable UI, build() returns widget subtree.
- StatefulWidget: associated State object setState triggers rebuild.Common widgets
- Container, Row, Column, Expanded, ListView, Scaffold, AppBar.
- Use SizedBox for spacing and Padding for internal spacing.

Hot reload & development flow
- Hot reload preserves state and speeds iteration hot restart reloads app.Performance - Avoid building large widget trees in a single build extract sub-widgets.

`,
    key_points: [
      "Prefer StatelessWidget where state is not required.",
      "Use setState to update local state; lift state up when shared.",
      "Use const constructors where possible to optimize rebuilds.",
    ],
    topics: ["flutter", "widgets", "state"],
    practice: [
      "Type a StatelessWidget that centers text 'Hello Flutter' and a short note on when you'd choose StatefulWidget. Type manually in the answer box.",
      "Type two lines explaining why const constructors help.",
    ],
    type: "note",
  },
  {
    id: "flutter-medium-c",
    title: "Flutter — Medium (GFG-style): Navigation, Forms & Async",
    summary:
      "Complete guide to navigation routes, form validation, and async data handling with FutureBuilder or StreamBuilder.",
    content: `Navigation - Use Navigator.push and Navigator.pop for route stack control.
- Use named routes for larger apps: Navigator.pushNamed(context, '/details', arguments: data)

Forms & validation
- Use Form widget with GlobalKey<FormState> to validate.
- Use TextFormField with validator and autovalidateMode when necessary.Async patterns - FutureBuilder for single async fetch; StreamBuilder for continuous streams.
- Use providers or Riverpod for cross-app state and dependency injection.

`,
    key_points: [
      "Use Form and TextFormField with validators for forms.",
      "Use Navigator for route stack control; use arguments for data passing.",
      "Use FutureBuilder for one-off async calls and StreamBuilder for ongoing streams.",
    ],
    topics: ["flutter", "navigation", "forms", "async"],
    practice: [
      "Type a Flutter snippet showing a Form with a TextFormField and validator and code to submit (manually typed).",
      "Type a one-paragraph plan to handle offline form submissions.",
    ],
    type: "note",
  },
  {
    id: "flutter-hard-c",
    title: "Flutter — Hard (GFG-style): State Management & Architecture",
    summary:
      "Exhaustive article on state management choices (Provider, Riverpod, BLoC), app architecture, testing, and deployment best practices.",
    content: `State management tradeoffs - Provider: lightweight and integrates with InheritedWidget.
- Riverpod: improved provider with testability and no context-dependency.
- BLoC: explicit event->state mapping suitable for complex flows.

Testing
- Unit test logic in ViewModel/BLoC.
- Widget tests for rendering and interaction.
- Integration tests for full flows.

CI/CD & release
- Configure signing and build variants.
- Use codified flavors for environment-specific configs.

Performance
- Avoid rebuilding large widget trees frequently use const and granular widgets.

`,
    key_points: [
      "Choose state management strategy based on app complexity and team experience.",
      "Write unit and widget tests early to avoid regressions.",
      "Use Riverpod or Provider for mid-size projects; BLoC for complex deterministic flows.",
    ],
    topics: ["flutter", "state", "architecture", "testing"],
    practice: [
      "Type an outline of app architecture choosing a state management approach and explain rationale (typed manually).",
      "Type two test cases you'd write for a login flow.",
    ],
    type: "note",
  },

  /* -------------------------
   APP: Advanced Beginner
   ------------------------- */
  {
    id: "app-adv-basic-c",
    title: "Mobile — Basic (GFG-style): API Request Flow & UI Integration",
    summary:
      "Detailed explanation of request → parse → update UI flow, loading/error states, and UX considerations for mobile apps.",
    content: `Flow fundamentals - Request: build URL and headers, use secure channel (HTTPS).
- Parse: decode JSON to models use strict parsing to avoid runtime errors.
- Update UI: show loading indicator, then data or error message.Offline first considerations - Cache responses and show stale data with refresh option.
- Consider network indicators and retry affordances.Security - Do not log tokens use secure storage for credentials.

Example pseudocode to type
- Steps: show loading call fetch on success parse into model and update UI on failure show retry option.

`,
    key_points: [
      "Always show loading and error states for network operations.",
      "Parse JSON defensively; validate required fields.",
      "Securely store tokens and avoid logging them.",
    ],
    topics: ["mobile", "api", "ux"],
    practice: [
      "Type pseudocode for fetching data and updating UI with loading and retry logic. Type manually into the answer box.",
      "Type two test scenarios for offline behavior.",
    ],
    type: "note",
  },
  {
    id: "app-adv-medium-c",
    title: "Mobile — Medium (GFG-style): Caching Strategies & Sync",
    summary:
      "Exhaustive review of caching strategies: TTL, Stale-While-Revalidate, optimistic updates, and conflict resolution for sync.",
    content: `Caching patterns - TTL cache: set expiry for cached items.
- Stale-While-Revalidate: show cached data immediately then refresh in background.
- Optimistic updates: update UI immediately and reconcile with server response.

Sync & conflicts
- Use last-write-wins for simple cases or CRDTs/OT for collaborative scenarios.
- Expose conflict resolution UI to users if merge is needed.Data integrity - Track version or ETag to manage concurrency.
- Use background sync jobs to flush local mutations when network returns.

`,
    key_points: [
      "Use Stale-While-Revalidate for better UX while keeping data fresh.",
      "Design conflict resolution strategy based on domain complexity.",
      "Use ETag or versions to detect stale data.",
    ],
    topics: ["mobile", "caching", "sync", "offline"],
    practice: [
      "Type a short implementation plan for local caching with TTL and background refresh. Typed manually.",
      "Type two scenarios and how your system would resolve conflicts in each.",
    ],
    type: "note",
  },
  {
    id: "app-adv-hard-c",
    title: "Mobile — Hard (GFG-style): Security — Tokens, Storage & Threat Model",
    summary:
      "Deep dive into secure token storage, refresh flows, threat modelling, and app hardening techniques for mobile platforms.",
    content: `Token management - Use secure keystore (Android Keystore, iOS Keychain) to store tokens.
- Prefer short-lived access tokens and refresh tokens with server-side revocation.

Refresh flow - Store refresh token securely exchange for new access tokens via secure endpoint.
- Detect compromised tokens (device loss) and provide server-side revocation.Threat model - Identify top threats: token theft, reverse engineering, insecure local storage, man-in-the-middle.
- Mitigations: certificate pinning, obfuscation, runtime checks, secure storage.

App hardening
- Use ProGuard/R8 for obfuscation on Android.
- Implement jailbreak/root detection only as part of overall security approach.

`,
    key_points: [
      "Never store tokens in plain SharedPreferences — use secure storage.",
      "Design refresh token flows with revocation support.",
      "Apply OS-specific hardening (keystore, obfuscation) as part of defense-in-depth.",
    ],
    topics: ["mobile", "security", "tokens"],
    practice: [
      "Type a step-by-step secure token storage and refresh flow including server verification steps (typed manually).",
      "Type a short threat model listing three major risks and corresponding mitigations.",
    ],
    type: "note",
  },

  /* -------------------------
   GAME: Unity - Beginner
   ------------------------- */
  {
    id: "unity-basic-c",
    title: "Unity — Basic (GFG-style): Editor, GameObjects & Components",
    summary:
      "Complete primer on Unity editor, GameObjects, components, prefabs, and the common workflow to create scenes.",
    content: `Editor introduction - Scene view vs Game view.
- Inspector shows component properties.
- Hierarchy lists GameObjects.GameObjects & components - GameObject is a container attach components (Transform, Rigidbody, Collider, custom MonoBehaviours).
- Prefabs allow reusable templates.Scripting basics - C# MonoBehaviour: Start(), Update() methods.
- Attach script to GameObject via component menu.Physics basics - Rigidbody controls physics simulation.
- Colliders (Box, Sphere, Mesh) detect collisions.Best practices - Use prefabs for repeated objects.
- Keep scripts focused (single responsibility).
- Use tags / layers to filter collisions.

`,
    key_points: [
      "Use prefabs to reuse game objects across scenes.",
      "Keep scripts small and focused; use components for separation of concerns.",
      "Use Rigidbodies for physics-driven objects and colliders for collisions.",
    ],
    topics: ["unity", "editor", "basics"],
    practice: [
      "Type a short MonoBehaviour script that moves a GameObject forward in Update and rotates it based on input. Typed manually in the answer box.",
      "Type two lines describing why prefabs improve workflow.",
    ],
    type: "note",
  },
  {
    id: "unity-medium-c",
    title: "Unity — Medium (GFG-style): Player Controls, Physics & Camera",
    summary:
      "Detailed tutorial for building responsive player controls, ground detection, jump mechanics, and camera follow systems.",
    content: `Player controller - Use Rigidbody.MovePosition or set velocity for physics-friendly movement.
- Ground check: use Physics.Raycast or check collision tags to prevent double-jump.

Jump tuning
- Use gravity scale adjustments and coyote time (small grace period after leaving ground) for better feel.

Camera follow
- Use smooth follow with Vector3.Lerp or SmoothDamp to avoid jitter.
- Consider Cinemachine for advanced camera rails and dampening.Testing & tuning - Expose speed and jump power as public variables for easy tuning without code changes.

`,
    key_points: [
      "Use physics-based movement for realistic interactions and consistent collisions.",
      "Implement coyote time to improve player experience on jumps.",
      "Use SmoothDamp or Cinemachine to create cinematic camera motion.",
    ],
    topics: ["unity", "controls", "camera", "physics"],
    practice: [
      "Type a C# snippet that implements ground check and jump logic using Rigidbody (manually typed).",
      "Type three tuning values you would expose for designers and why.",
    ],
    type: "note",
  },
  {
    id: "unity-hard-c",
    title: "Unity — Hard (GFG-style): AI, Pathfinding & Optimization",
    summary:
      "In-depth guide to simple AI state machines, NavMesh pathfinding, pooling systems, and optimization patterns for 2D/3D games.",
    content: `AI basics - State machine: Idle, Patrol, Chase, Attack.
- Use distance checks and timers for transitions.

NavMesh
- Bake NavMesh for walkable surfaces; use NavMeshAgent to move agents.
- For 2D games use simple A* pathfinding grids.

Object pooling
- Avoid Instantiate/Destroy in runtime loops use pools for bullets/enemies.

Optimization
- Use occlusion culling for big scenes.
- Profile frequently with Unity Profiler: CPU, GC allocations, draw calls.
- Combine meshes and reduce overdraw (transparent layers).

`,
    key_points: [
      "Use state machines for deterministic AI behaviours.",
      "Object pooling reduces GC pressure and runtime spikes.",
      "Profile and optimize draw calls and GC allocations for smooth frame rate.",
    ],
    topics: ["unity", "ai", "pathfinding", "optimization"],
    practice: [
      "Type C# pseudocode for an enemy state machine that patrols between points and switches to chase when player within range (typed manually).",
      "Type a short optimization checklist you'd run when FPS is below 30.",
    ],
    type: "note",
  },

  /* -------------------------
   GAME: Unity - Scripting
   ------------------------- */
  {
    id: "unity-script-basic-c",
    title: "Unity Scripting — Basic (GFG-style): MonoBehaviour Patterns & Lifecycle",
    summary: "Clear guide to MonoBehaviour lifecycle methods, Update vs FixedUpdate, and writing safe Unity scripts.",
    content: `Lifecycle summary - Awake(): called when script instance is being loaded.
- Start(): called before the first frame update if enabled.
- Update(): called once per frame, use for input and non-physics updates.
- FixedUpdate(): called on fixed timestep, use for physics.
- OnDisable/OnDestroy: cleanup.

Avoiding common errors
- Do not allocate in Update (avoid new objects frequently).
- Use caching for component references (e.g., private Rigidbody rb; rb = GetComponent<Rigidbody>(); ).

Event-based designs
- Use UnityEvents or C# events to decouple systems.

`,
    key_points: [
      "Use Start/Awake for initialization; use Update for per-frame logic and FixedUpdate for physics.",
      "Cache component references to reduce GetComponent calls.",
      "Clean up event subscriptions to avoid memory leaks.",
    ],
    topics: ["unity", "scripting", "lifecycle"],
    practice: [
      "Type a MonoBehaviour that caches a Rigidbody in Awake and applies force in FixedUpdate (manually typed).",
      "Type one line explaining why GetComponent in Update can be problematic.",
    ],
    type: "note",
  },
  {
    id: "unity-script-medium-c",
    title: "Unity Scripting — Medium (GFG-style): Collisions, Triggers & Events",
    summary:
      "Detailed examples of OnCollisionEnter, OnTriggerEnter usage, physics layers, and event-driven interaction patterns.",
    content: `Collision handling
- OnCollisionEnter(Collision collision) provides contact points.
- OnTriggerEnter(Collider other) is for triggers without physics response.
- Use layers to filter collisions using Physics.IgnoreLayerCollision or layer masks.

Event-driven design
- Raise an event in OnTriggerEnter to notify other systems.
- Keep physics effects in physics callbacks and UI logic separate.

Debugging collisions
- Visualize colliders and use Gizmos for debugging.
- Ensure colliders have appropriate isTrigger flags.

`,
    key_points: [
      "Use OnCollisionEnter for physical interactions and OnTriggerEnter for logical triggers.",
      "Use layer masks for performance and filtering collisions.",
      "Keep event-driven separation between physics and UI to maintain clean architecture.",
    ],
    topics: ["unity", "collision", "events"],
    practice: [
      "Type OnTriggerEnter code that awards points and destroys pickup object (typed manually).",
      "Type two test cases for verifying collision logic across different layers.",
    ],
    type: "note",
  },
  {
    id: "unity-script-hard-c",
    title: "Unity Scripting — Hard (GFG-style): Save Systems, JSON & Cross-Platform Storage",
    summary:
      "Comprehensive coverage of serialization, JSON save/load, PlayerPrefs for simple data, and platform path differences.",
    content: `Serialization options - Use JsonUtility for simple classes (limitations on non-serializable types).
- For complex data use Newtonsoft JSON(third-party) or custom serializers.Save file paths - Application.persistentDataPath for platform-independent save location.
- On WebGL, use IndexedDB or browser storage.Save strategy - Save only needed state (player progress, unlocked levels).
- Use checksums or versions to detect incompatible save formats.Example - Save:
var json = JsonUtility.ToJson(state)
File.WriteAllText(path, json)
;Load:
var json = File.ReadAllText(path)
var state = JsonUtility.FromJson<State>(json)

Edge cases - Handle interrupted saves by writing to temp file and renaming atomically.
- Consider cloud saves for cross-device syncing.

`,
    key_points: [
      "Use persistentDataPath for saving files across platforms.",
      "Serialize only necessary state and version your save format.",
      "Handle save failures gracefully to avoid corrupt saves.",
    ],
    topics: ["unity", "save", "serialization", "cross-platform"],
    practice: [
      "Type methods SaveGame(State state) and LoadGame() that use JsonUtility and persistentDataPath (typed manually).",
      "Type a short paragraph on how to avoid corrupt saves during power loss.",
    ],
    type: "note",
  },

  /* -------------------------
   GAME: Unreal Engine
   ------------------------- */
  {
    id: "unreal-basic-c",
    title: "Unreal — Basic (GFG-style): Editor, Blueprints & Actors",
    summary:
      "Detailed guide to Unreal Editor, Blueprints basics, Actors, Pawns and building simple gameplay in Blueprints (typed pseudocode).",
    content: `Editor primer
- Content Browser, World Outliner, Details panel.
- Place Actors into level and adjust properties.Blueprint basics - Blueprint is visual scripting: nodes for events, variables, function calls.
- Common event: EventBeginPlay, EventTick for per-frame.

Actors vs Pawns vs Characters - Actor: generic object in world.
- Pawn: controllable actor.
- Character: pawn with movement component specialized for humanoid control.

Blueprint pseudocode sample
- On EventActorBeginOverlap(OtherActor):
   If OtherActor is PlayerCharacter:
     Play Sound
     Destroy self

Debugging
- Use Print String to debug.
- Use Breakpoints in Blueprint debugging.

`,
    key_points: [
      "Use Blueprints for rapid prototyping and level scripting.",
      "Understand Actor lifecycle events and when to use them.",
      "Use World Outliner to organize scene objects.",
    ],
    topics: ["unreal", "blueprints", "editor"],
    practice: [
      "Type step-by-step Blueprint pseudocode to open a door when player overlaps a trigger volume (manually typed).",
      "Type two lines explaining when you might switch from Blueprints to C++.",
    ],
    type: "note",
  },
  {
    id: "unreal-medium-c",
    title: "Unreal — Medium (GFG-style): Character Movement & Input Mapping",
    summary:
      "In-depth explanation of CharacterMovement component tuning, input mapping, and camera control with Blueprints or C++.",
    content: `Character movement tuning
- CharacterMovement has walking speed, jumpZVelocity, gravityScale.
- Use acceleration and deceleration to smooth movement.

Input mapping
- Project Settings -> Input to define axis and action mappings.
- Use AddMovementInput and AddControllerYawInput in C++ or Blueprint equivalents.

Camera
- Use a spring arm (CameraBoom) to smooth camera and prevent clipping.
- Use interpolation for camera follow smoothing.

Testing
- Use Play-In-Editor and simulate different frame rates to tune responsiveness.

`,
    key_points: [
      "Tune CharacterMovement settings to match desired control feel.",
      "Use spring arm for smooth camera following and collision handling.",
      "Map inputs centrally in project settings for maintainability.",
    ],
    topics: ["unreal", "movement", "input"],
    practice: [
      "Type steps and parameter values to increase jump height and reduce air control (manually typed).",
      "Type a two-line test checklist for verifying camera collision behavior.",
    ],
    type: "note",
  },
  {
    id: "unreal-hard-c",
    title: "Unreal — Hard (GFG-style): Save System, Packaging & Performance",
    summary:
      "Comprehensive guide to SaveGame objects, packaging settings for platforms, and profiling/performance tuning for Unreal projects.",
    content: `SaveGame usage
- Create SaveGame subclass to store variables; use UGameplayStatics::SaveGameToSlot and LoadGameFromSlot.
- Version your saved data to manage schema changes.

Packaging & distribution
- Configure packaging settings for platform-specific asset compression.
- Test packages on target hardware.

Performance profiling
- Use Unreal Insights and GPU profiler.
- Reduce overdraw by optimizing materials and using LODs for meshes.
- Use static/dynamic lighting appropriately to balance quality and performance.

`,
    key_points: [
      "Use SaveGame object and slot-based save/load functions for persistence.",
      "Profile on target hardware; optimize materials, LODs, and reduce draw calls.",
      "Package with appropriate compression and build configurations per platform.",
    ],
    topics: ["unreal", "save", "performance", "packaging"],
    practice: [
      "Type pseudocode to save player stats to a SaveGame slot and load them on startup (typed manually).",
      "Type a short optimization checklist for an initial mobile build.",
    ],
    type: "note",
  },

  /* -------------------------
   GAME: Godot
   ------------------------- */
  {
    id: "godot-basic-c",
    title: "Godot — Basic (GFG-style): Node System, Scenes & GDScript Basics",
    summary:
      "Exhaustive guide to Godot's node/scene architecture, signals, and GDScript fundamentals for 2D game creation.",
    content: `Node & Scene system
- Scene is a tree of nodes; reuse via instancing.
- Common nodes: Node2D, Sprite, KinematicBody2D/RigidBody2D, CollisionShape2D, Area2D.

GDScript essentials
- Python-like syntax: func _physics_process(delta): ...
- Use signals to communicate between nodes: emit_signal('picked'), connect('picked', other, 'on_picked').

Instancing
- Preload scenes and instance when spawning enemies:
var EnemyScene = preload("res://Enemy.tscn")
var e = EnemyScene.instance()
add_child(e)

Best practices
- Keep logic in separate scripts; use signals to decouple systems.
- Profile with the built-in monitor and avoid heavy loops in _process.

`,
    key_points: [
      "Use scenes and instancing to keep projects organized.",
      "Use signals for decoupled communication.",
      "Use _physics_process for physics-related movement.",
    ],
    topics: ["godot", "gdscript", "scenes", "signals"],
    practice: [
      "Type a GDScript that moves a KinematicBody2D left/right and jumps (typed manually).",
      "Type one line explaining why move_and_slide is preferred for character movement.",
    ],
    type: "note",
  },
  {
    id: "godot-medium-c",
    title: "Godot — Medium (GFG-style): Signals, UI & Scene Management",
    summary:
      "Detailed patterns for using signals to update UI, scene transitions, and memory management with queued free.",
    content: `Signals & UI
- Connect gameplay signals to UI nodes to update HUD.
- Use get_tree().change_scene("res://level2.tscn") for transitions.

Scene management
- Use autoload (singleton) for global managers (AudioManager, GameState).
- Free nodes with queue_free() to avoid immediate destruction during physics loops.

Memory & performance
- Avoid circular references and large arrays in nodes that persist.
- Profile memory usage and clear references for pooled objects.

`,
    key_points: [
      "Use autoload singletons for global state managers.",
      "Connect game signals to UI for responsive HUD updates.",
      "Use queue_free and pooled instances to manage memory.",
    ],
    topics: ["godot", "signals", "ui", "scene-management"],
    practice: [
      "Type snippets showing signal definition, emission, and UI connection in GDScript (typed manually).",
      "Type short notes on how you'd manage level transitions smoothly.",
    ],
    type: "note",
  },
  {
    id: "godot-hard-c",
    title: "Godot — Hard (GFG-style): Instancing, Memory & Exporting Games",
    summary:
      "Comprehensive tutorial on dynamic scene instancing, memory profiling, and platform-specific export settings.",
    content: `Dynamic instancing
- Preload and instance scenes; remove references and call queue_free when done.
- Use object pools for frequently spawned objects.

Profiling & optimization
- Use Godot's Profiler to identify costly functions.
- Reduce draw calls by combining textures into atlases for 2D.

Exporting
- Choose export preset (Windows, Mac, Linux, Android).
- Include export templates for the target platform and test on real devices.

Edge cases
- Handle differences in input APIs between platforms (touch vs mouse).

`,
    key_points: [
      "Use pools for frequently spawned objects to avoid GC spikes.",
      "Profile to identify expensive operations and optimize accordingly.",
      "Test exports on physical devices to catch platform-specific issues.",
    ],
    topics: ["godot", "optimization", "export", "instancing"],
    practice: [
      "Type a GDScript that instances an enemy scene, adds it to the scene tree, and queues_free it after life reaches zero (typed manually).",
      "Type a short plan for testing and exporting the game to Android.",
    ],
    type: "note",
  },

  /* -------------------------
   GAME: General
   ------------------------- */
  {
    id: "game-general-basic-c",
    title: "Game Dev — Basic (GFG-style): Game Loop, Update & Render",
    summary:
      "Deep explanation of classic game loop, fixed timestep, variable timestep, and basic pseudocode for update/render.",
    content: `Game loop fundamentals
- Typical while(running) {
  processInput();
  update(delta);
  render();
  sleepUntilNextFrame();
}
- Fixed timestep: update at consistent dt (e.g., 60Hz) and interpolate for render. Prevents physics instability.
- Variable timestep: dt varies; easier but requires careful handling for physics.

Input handling
- Poll input each frame and queue actions for update step.

Rendering
- Separate rendering from logic for GPU parallelism.

`,
    key_points: [
      "Prefer fixed timestep for physics stability; use interpolation for smooth rendering.",
      "Separate input, update, and render stages for clarity.",
      "Keep update deterministic where possible for easier debugging.",
    ],
    topics: ["game-dev", "basics", "game-loop"],
    practice: [
      "Type the game loop pseudocode with a fixed timestep and interpolation logic, typed manually in the answer box.",
      "Type one line explaining advantage of deterministic update.",
    ],
    type: "note",
  },
  {
    id: "game-general-medium-c",
    title: "Game Dev — Medium (GFG-style): Simple AI State Machines & Pathfinding",
    summary:
      "Thorough article on finite state machines for AI, waypoint pathing, and simple A* concepts for tile-based games.",
    content: `State machines
- States: Idle, Patrol, Chase, Attack; transitions triggered by timers or distance checks.
- Keep transition logic explicit and testable.

Pathfinding (A* basics)
- Use open and closed sets; gScore (cost from start) and fScore (g + heuristic).
- Heuristic choice (Manhattan for grids) affects performance.

Optimization
- Use hierarchical pathfinding for large maps.
- Reuse path results; avoid pathfinding each frame.

`,
    key_points: [
      "Implement AI as finite state machines for predictable behavior.",
      "Use A* for pathfinding; choose heuristics appropriate to metric.",
      "Cache path results when possible for performance.",
    ],
    topics: ["game-dev", "ai", "pathfinding"],
    practice: [
      "Type pseudocode for a state machine handling Patrol->Chase transitions when player within range (typed manually).",
      "Type two test cases that validate pathfinding correctness in corners and obstacles.",
    ],
    type: "note",
  },
  {
    id: "game-general-hard-c",
    title: "Game Dev — Hard (GFG-style): Networking for Turn-Based Games & Reconciliation",
    summary:
      "In-depth design of a turn-sync protocol, server-authoritative model, validation, and handling out-of-order messages.",
    content: `Turn-based sync design
- Server-authoritative model: server validates moves and broadcasts results.
- Turn locking: server indicates whose turn it is; clients send moves; server validates and applies.

Handling latency & reconnection
- Use sequence numbers and ack to ensure ordering.
- On reconnection, request latest game state snapshot.

Validation & anti-cheat
- Server checks legality of moves; reject invalid or stale moves.
- Use move replay logs to reconstruct state.

Consistency & reconciliation
- Keep authoritative server state and clients render predictions with correction if mismatch.

`,
    key_points: [
      "Use server-authoritative design to prevent cheating and ensure consistency.",
      "Sequence numbers and acknowledgements help handle out-of-order delivery.",
      "Provide reconnection flow to restore client state.",
    ],
    topics: ["game-dev", "networking", "multiplayer"],
    practice: [
      "Type pseudocode for a server-side turn handling loop that accepts a move, validates it, applies it, and broadcasts new state (typed manually).",
      "Type a short mitigation plan for dropped messages.",
    ],
    type: "note",
  },
] // end content array
