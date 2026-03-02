// Study practice content (no videos, no links).
// General coding questions for all tracks (same style everywhere).
// Each StudyMaterial.type = "note" and practice instructions require typing answers (no paste).

export type Question = {
  id: string
  text: string
  options?: string[]
  correctAnswer?: number
}

export type ContentItem = {
  id: string
  title: string
  description?: string
  category?: string
  content?: string
  questions?: Question[]
}

export type StudyMaterial = {
  id: string
  title: string
  summary: string
  key_points: string[]
  topics: string[]
  practice: string[] // instructions for the learner — answer must be typed in the site (no paste)
  type: "video" | "article" | "note"
}

export type LearningTrack = {
  track: string
  category: string
  materials: StudyMaterial[]
}

// Local uploaded project zip (use this path when referencing the uploaded file)
export const source_zip = "/mnt/data/student-learning-platform (1).zip"

export const content: LearningTrack[] = [
  // Web Development - HTML
  {
    track: "Web Development",
    category: "HTML",
    materials: [
      {
        id: "html-basic-1",
        title: "HTML — Basic: Create a Semantic Profile Page",
        summary: "Create a single HTML page using semantic elements to represent a personal profile.",
        key_points: [
          "Use semantic tags: header, nav, main, section, article, footer",
          "Use accessible attributes (alt, title) for media",
          "Simple form structure (no backend required)",
        ],
        topics: ["html", "basic", "semantic"],
        practice: [
          "Build the page and type the full HTML markup into the answer box on the site. DO NOT paste from any external source — the platform will reject pasted content. Include header, main with an article and aside, and a footer.",
          "Explain (in the answer box) why you chose each semantic tag (one sentence each). Type your answers.",
        ],
        type: "note",
      },
      {
        id: "html-medium-1",
        title: "HTML — Medium: Accessible Contact Form",
        summary: "Design an accessible contact form with validation attributes and labels.",
        key_points: [
          "Properly associate labels with inputs",
          "Use input types and validation attributes (required, pattern)",
          "Provide meaningful placeholder and aria attributes",
        ],
        topics: ["html", "forms", "accessibility"],
        practice: [
          "Type a complete form markup (HTML only) into the answer box that includes name, email, phone (pattern), and a message textarea. Do not paste — type directly.",
          "In the answer box, write two short notes (max 2 sentences each) describing how you ensured accessibility (typed).",
        ],
        type: "note",
      },
      {
        id: "html-hard-1",
        title: "HTML — Hard: Multi-section Article with Microdata",
        summary:
          "Create a multi-section HTML article page and add simple microdata (schema) for author and publish date.",
        key_points: [
          "Structure long-form content into sections and articles",
          "Add semantic metadata using microdata attributes",
          "Use figure/figcaption for images with captions",
        ],
        topics: ["html", "microdata", "seo"],
        practice: [
          "Type full HTML markup for an article with at least 3 sections, one figure, and microdata for author and date. All markup must be typed into the answer box (no copy/paste).",
          "Type a one-paragraph justification explaining the microdata choices.",
        ],
        type: "note",
      },
    ],
  },

  // Web Development - CSS
  {
    track: "Web Development",
    category: "CSS",
    materials: [
      {
        id: "css-basic-1",
        title: "CSS — Basic: Style a Profile Card",
        summary: "Write CSS to style a profile card with a photo, name, and short bio using basic selectors.",
        key_points: [
          "Understand selectors, classes, and element styling",
          "Use box-model properties (margin, padding, border)",
          "Apply basic typography and spacing",
        ],
        topics: ["css", "basic", "selectors"],
        practice: [
          "You will be presented with the HTML in the practice UI. Type the CSS rules into the answer box to style the card (no pasting). Include class selectors and set padding, border-radius, and font-size.",
          "Type a one-line explanation for each CSS rule group you wrote.",
        ],
        type: "note",
      },
      {
        id: "css-medium-1",
        title: "CSS — Medium: Responsive Two-Column Layout (Flexbox)",
        summary: "Create responsive CSS using Flexbox that becomes a single column on narrow screens.",
        key_points: [
          "Use display:flex, flex-direction, and wrap",
          "Create responsive breakpoints using media queries",
          "Manage spacing and alignment with gap/justify-content",
        ],
        topics: ["css", "flexbox", "responsive"],
        practice: [
          "Type the CSS (including a media query) required to switch from two columns to one column under 600px. Type into the answer box — pasting is disabled.",
          "In the answer box, type a short test plan describing three viewport widths to verify responsiveness.",
        ],
        type: "note",
      },
      {
        id: "css-hard-1",
        title: "CSS — Hard: Grid-based Magazine Layout",
        summary:
          "Build a CSS Grid layout with named areas for a magazine-style page with header, sidebar, main, and footer.",
        key_points: [
          "Define grid-template-areas and named lines",
          "Combine fractional units (fr) and minmax for flexible tracks",
          "Place items across multiple rows/columns",
        ],
        topics: ["css", "grid", "advanced"],
        practice: [
          "Type the complete CSS that declares a 3-row, 3-column grid with named areas and places main content spanning columns. Must be typed into the answer box (no paste).",
          "Type a brief explanation (2–3 lines) of why you used minmax/fr units.",
        ],
        type: "note",
      },
    ],
  },

  // Web Development - JavaScript
  {
    track: "Web Development",
    category: "JavaScript",
    materials: [
      {
        id: "js-basic-1",
        title: "JavaScript — Basic: DOM Interaction",
        summary: "Write vanilla JS that reads an input value and displays it in a <div> when a button is clicked.",
        key_points: [
          "Use querySelector and addEventListener",
          "Read and set textContent or innerText",
          "Prevent default form submission if necessary",
        ],
        topics: ["javascript", "dom", "basic"],
        practice: [
          "Type the JavaScript code into the answer box that selects an input, listens for a button click, and updates output text. No pasting allowed.",
          "Type one line explaining event delegation vs direct listeners.",
        ],
        type: "note",
      },
      {
        id: "js-medium-1",
        title: "JavaScript — Medium: Fetch & Render JSON",
        summary: "Fetch a JSON array from a given endpoint and render items into a list dynamically.",
        key_points: [
          "Use fetch API and async/await",
          "Handle loading and error states",
          "Create DOM nodes programmatically",
        ],
        topics: ["javascript", "fetch", "async"],
        practice: [
          "Type the JS function that fetches from /api/items, parses JSON, and appends list items to a container. Type directly into the answer box.",
          "Type two sentences about how you would handle network errors.",
        ],
        type: "note",
      },
      {
        id: "js-hard-1",
        title: "JavaScript — Hard: Build a Small State Manager",
        summary: "Implement a tiny state container with subscribe, getState, and setState APIs (no libraries).",
        key_points: [
          "Understand closures and higher-order functions",
          "Implement observer pattern for state updates",
          "Expose minimal API to components",
        ],
        topics: ["javascript", "architecture", "advanced"],
        practice: [
          "Type the complete JS code for createStore() that returns { getState, setState, subscribe }. All code must be typed into the answer box (no paste).",
          "Type an example usage showing a subscriber callback being registered and triggered.",
        ],
        type: "note",
      },
    ],
  },

  // Web Development - React / Backend
  {
    track: "Web Development",
    category: "React / Backend",
    materials: [
      {
        id: "react-basic-1",
        title: "React — Basic: Counter Component",
        summary:
          "Create a React functional component that shows a counter with increment and decrement buttons using useState.",
        key_points: [
          "Use functional components and hooks",
          "Manage local state with useState",
          "Handle button click events",
        ],
        topics: ["react", "basic", "hooks"],
        practice: [
          "Type the React component (JSX + useState) into the answer box. Do not paste code.",
          "Type one sentence describing why useState is appropriate here.",
        ],
        type: "note",
      },
      {
        id: "react-medium-1",
        title: "React — Medium: Data Fetching with useEffect",
        summary: "Build a component that fetches data on mount and displays a loading indicator.",
        key_points: [
          "useEffect with empty dependency array for componentDidMount",
          "Cleanup patterns and dependency considerations",
          "Conditional rendering for loading/error states",
        ],
        topics: ["react", "useeffect", "data"],
        practice: [
          "Type the component code using useEffect and fetch to load items and render them. Type into the answer box.",
          "Type two lines explaining how you would avoid memory leaks in long-running fetches.",
        ],
        type: "note",
      },
      {
        id: "react-hard-1",
        title: "Backend — Hard: Small Express CRUD Endpoint",
        summary: "Write a small Express.js route handler for creating and retrieving items (in-memory store).",
        key_points: [
          "Use express.json() middleware",
          "Implement RESTful endpoints (POST /items, GET /items)",
          "Validate incoming payloads",
        ],
        topics: ["node", "express", "backend"],
        practice: [
          "Type the Express route handlers (app.post('/items') and app.get('/items')) into the answer box. No pasting.",
          "Type a brief note on how you would persist data to a real database instead of memory.",
        ],
        type: "note",
      },
    ],
  },

  // App Development - Android (Java)
  {
    track: "App Development",
    category: "Android (Java)",
    materials: [
      {
        id: "android-java-basic-1",
        title: "Android Java — Basic: Simple Activity Layout",
        summary: "Describe and type the XML layout for an Activity that contains a TextView and a Button.",
        key_points: [
          "Understand XML layout structure",
          "Use ids to reference views in Java code",
          "Set basic layout attributes (width/height/margin)",
        ],
        topics: ["android", "java", "xml"],
        practice: [
          "Type the XML layout markup into the answer box. Pasting is disabled — type manually.",
          "Type one line explaining how to bind the Button in the Activity (Java) to handle clicks.",
        ],
        type: "note",
      },
      {
        id: "android-java-medium-1",
        title: "Android Java — Medium: Intent Data Passing",
        summary:
          "Using Java, show how to start a second Activity and pass a string extra, then retrieve it in the destination Activity.",
        key_points: [
          "Create and use Intent extras",
          "Use getIntent() and getStringExtra() in the receiving Activity",
          "Handle null checks for extras",
        ],
        topics: ["android", "intents", "java"],
        practice: [
          "Type the Java code snippet for creating the Intent and retrieving the extra in the other Activity into the answer box.",
          "Type a short explanation (1–2 lines) about intent flags if any are needed.",
        ],
        type: "note",
      },
      {
        id: "android-java-hard-1",
        title: "Android Java — Hard: Simple SQLite Helper",
        summary: "Design a small SQLiteOpenHelper subclass that creates a notes table and includes an insert method.",
        key_points: [
          "Implement onCreate and onUpgrade",
          "Use SQLiteDatabase insert() method",
          "Manage schema versioning",
        ],
        topics: ["android", "sqlite", "persistence"],
        practice: [
          "Type the Java class (extends SQLiteOpenHelper) with onCreate SQL and an insertNote method into the answer box. No paste allowed.",
          "Type a one-paragraph rationale about schema changes and migrations.",
        ],
        type: "note",
      },
    ],
  },

  // App Development - Android (Kotlin)
  {
    track: "App Development",
    category: "Android (Kotlin)",
    materials: [
      {
        id: "android-kotlin-basic-1",
        title: "Android Kotlin — Basic: Kotlin Activity Snippet",
        summary:
          "Write a small Kotlin snippet showing how to setContentView and findViewById (or view binding) to update a TextView.",
        key_points: ["Kotlin concise syntax", "Null-safety checks", "View binding basics"],
        topics: ["kotlin", "android"],
        practice: [
          "Type the Kotlin code snippet that sets text on a TextView in an Activity into the answer box (type only).",
          "Type a short note on null-safety features used.",
        ],
        type: "note",
      },
      {
        id: "android-kotlin-medium-1",
        title: "Android Kotlin — Medium: RecyclerView Adapter",
        summary: "Implement a basic RecyclerView.Adapter in Kotlin that binds a list of strings to item views.",
        key_points: ["Implement ViewHolder pattern", "Override necessary adapter methods", "Handle item clicks"],
        topics: ["kotlin", "recyclerview"],
        practice: [
          "Type the Kotlin Adapter class skeleton (ViewHolder inner class, onCreateViewHolder, onBindViewHolder, getItemCount) into the answer box.",
          "Type one line describing how DiffUtil could improve this adapter.",
        ],
        type: "note",
      },
      {
        id: "android-kotlin-hard-1",
        title: "Android Kotlin — Hard: Coroutine Example",
        summary: "Write a coroutine snippet to perform background work and update the UI on the main thread.",
        key_points: [
          "Use lifecycleScope or GlobalScope appropriately",
          "Dispatchers.IO for background work",
          "Switch back to Dispatchers.Main for UI updates",
        ],
        topics: ["kotlin", "coroutines", "async"],
        practice: [
          "Type the complete Kotlin coroutine example showing a network call stub and UI update into the answer box (no paste).",
          "Type a short safety note about coroutine cancellation.",
        ],
        type: "note",
      },
    ],
  },

  // App Development - Flutter
  {
    track: "App Development",
    category: "Flutter",
    materials: [
      {
        id: "flutter-basic-1",
        title: "Flutter — Basic: Stateless Widget Example",
        summary: "Type a simple StatelessWidget that renders a centered text.",
        key_points: [
          "Understand StatelessWidget vs StatefulWidget",
          "Widget tree basics",
          "Use of MaterialApp and Scaffold",
        ],
        topics: ["flutter", "dart"],
        practice: [
          "Type the Dart code for a StatelessWidget showing 'Hello Flutter' centered on screen into the answer box.",
          "Type one sentence explaining when you'd use StatefulWidget instead.",
        ],
        type: "note",
      },
      {
        id: "flutter-medium-1",
        title: "Flutter — Medium: Stateful Counter",
        summary: "Create a StatefulWidget that increments a counter and displays it on screen.",
        key_points: ["Use setState to update UI", "Widget lifecycle basics", "Structure build() method clearly"],
        topics: ["flutter", "state"],
        practice: [
          "Type the StatefulWidget code (counter) into the answer box. Typing only — no paste.",
          "Type one line explaining what setState does internally.",
        ],
        type: "note",
      },
      {
        id: "flutter-hard-1",
        title: "Flutter — Hard: Async Data & FutureBuilder",
        summary: "Use FutureBuilder to fetch async data and display loading/error/data states.",
        key_points: [
          "Asynchronous programming in Dart",
          "Use FutureBuilder for async UI",
          "Handle snapshot states properly",
        ],
        topics: ["flutter", "async"],
        practice: [
          "Type a Flutter widget using FutureBuilder that simulates fetching data and renders accordingly. Type into the answer box (no paste).",
          "Type a short note on how to test this widget.",
        ],
        type: "note",
      },
    ],
  },

  // App Development - Advanced Beginner
  {
    track: "App Development",
    category: "Advanced Beginner",
    materials: [
      {
        id: "app-adv-basic-1",
        title: "Mobile — Basic: API Request Pseudocode",
        summary: "Write pseudocode showing a mobile app fetching JSON and updating UI components.",
        key_points: ["Sequence: request → parse → update UI", "Error handling and retries", "Show loading indicators"],
        topics: ["mobile", "api"],
        practice: [
          "Type the pseudocode steps into the answer box. Must be typed by you (no paste).",
          "Type a one-paragraph explanation of retry strategy.",
        ],
        type: "note",
      },
      {
        id: "app-adv-medium-1",
        title: "Mobile — Medium: Local Persistence Strategy",
        summary: "Describe and type an approach for caching API responses locally and invalidation policy.",
        key_points: [
          "Cache lifetime and invalidation",
          "Choosing between SQLite, key-value, or file storage",
          "Sync strategy with server",
        ],
        topics: ["mobile", "persistence"],
        practice: [
          "Type a short implementation plan into the answer box describing storage choice, cache TTL, and sync flow (typed only).",
          "Type two short test cases to validate the cache behavior.",
        ],
        type: "note",
      },
      {
        id: "app-adv-hard-1",
        title: "Mobile — Hard: Securely Store Tokens",
        summary: "Design steps (typed) to store authentication tokens securely on mobile and refresh them.",
        key_points: [
          "Use secure storage (Keychain/Keystore)",
          "Implement refresh token flow",
          "Avoid storing tokens in plain preferences",
        ],
        topics: ["security", "auth"],
        practice: [
          "Type a step-by-step secure token storage and refresh flow into the answer box (typed).",
          "Type a short note on threat model and mitigations.",
        ],
        type: "note",
      },
    ],
  },

  // Game Development - Unity Beginner
  {
    track: "Game Development",
    category: "Unity - Beginner",
    materials: [
      {
        id: "unity-basic-1",
        title: "Unity — Basic: Player Movement Script (Pseudo/C#)",
        summary: "Provide typed C# code or pseudocode to move a player horizontally and jump.",
        key_points: [
          "Read input, apply velocity or transform",
          "Ground check for jumping",
          "Adjustable speed and jump power variables",
        ],
        topics: ["unity", "movement"],
        practice: [
          "Type a C# MonoBehaviour script (or clear pseudocode) that moves a player left/right and allows jump. Must be typed in the answer box.",
          "Type two lines describing how you would test movement responsiveness.",
        ],
        type: "note",
      },
      {
        id: "unity-medium-1",
        title: "Unity — Medium: Simple Health System",
        summary: "Type C# code for a health component that reduces health and triggers death event.",
        key_points: [
          "Encapsulate health in a component",
          "Expose damage and heal methods",
          "Invoke events or callbacks on health zero",
        ],
        topics: ["unity", "health"],
        practice: [
          "Type the C# class for HealthComponent with methods TakeDamage and Heal into the answer box (no paste).",
          "Type one paragraph about how to persist high score or health state between scenes.",
        ],
        type: "note",
      },
      {
        id: "unity-hard-1",
        title: "Unity — Hard: Enemy Patrol & Chase Logic",
        summary:
          "Type a C# snippet implementing enemy patrol between points and switching to chase when player in range.",
        key_points: [
          "Use waypoints for patrol",
          "Distance checks for switching behaviors",
          "Use coroutines or simple state machine",
        ],
        topics: ["unity", "ai"],
        practice: [
          "Type the full C# logic for patrol and chase into the answer box (typed only).",
          "Type a brief test plan to verify state transitions.",
        ],
        type: "note",
      },
    ],
  },

  // Game Development - Unity Scripting
  {
    track: "Game Development",
    category: "Unity - Scripting",
    materials: [
      {
        id: "unity-script-basic-1",
        title: "Unity Scripting — Basic: Start/Update Example",
        summary: "Type a small MonoBehaviour showing Start and Update usage and logging.",
        key_points: [
          "MonoBehaviour lifecycle methods",
          "Use Update for per-frame logic",
          "Use FixedUpdate for physics",
        ],
        topics: ["unity", "csharp"],
        practice: [
          "Type the script into the answer box showing Start/Update and a simple transform change (no paste).",
          "Type one line explaining when to use FixedUpdate vs Update.",
        ],
        type: "note",
      },
      {
        id: "unity-script-medium-1",
        title: "Unity Scripting — Medium: Collision Handling",
        summary: "Type code that responds to OnCollisionEnter and reduces player health.",
        key_points: [
          "Distinguish colliders and triggers",
          "Use layers to filter collisions",
          "Apply damage on collision",
        ],
        topics: ["unity", "collision"],
        practice: [
          "Type the OnCollisionEnter handler into the answer box and show how it reduces health (typed).",
          "Type one test case for collision with a moving object.",
        ],
        type: "note",
      },
      {
        id: "unity-script-hard-1",
        title: "Unity Scripting — Hard: Save/Load JSON Data",
        summary: "Type a C# example that serializes game state to JSON and writes it to disk, and reads it back.",
        key_points: [
          "Use JsonUtility or a JSON library",
          "Handle file paths and permissions",
          "Serialize only necessary state",
        ],
        topics: ["unity", "save"],
        practice: [
          "Type the serialization and deserialization methods into the answer box (no paste).",
          "Type a one-paragraph note about cross-platform file locations.",
        ],
        type: "note",
      },
    ],
  },

  // Game Development - Unreal Engine
  {
    track: "Game Development",
    category: "Unreal Engine",
    materials: [
      {
        id: "unreal-basic-1",
        title: "Unreal — Basic: Blueprint Logic Pseudocode",
        summary: "Describe (typed) blueprint node sequence to open a door when player overlaps trigger.",
        key_points: ["Use overlap events", "Toggle actor visibility or play animation", "Use variables to track state"],
        topics: ["unreal", "blueprints"],
        practice: [
          "Type the step-by-step blueprint pseudocode into the answer box (no paste).",
          "Type a short explanation on how to debug blueprint logic.",
        ],
        type: "note",
      },
      {
        id: "unreal-medium-1",
        title: "Unreal — Medium: Character Movement Tuning",
        summary: "Type parameters and short code/blueprint steps to adjust movement speed, jump, and air control.",
        key_points: [
          "Adjust CharacterMovement component settings",
          "Tune acceleration and deceleration",
          "Balance jump and gravity scale",
        ],
        topics: ["unreal", "movement"],
        practice: [
          "Type the parameter values and brief steps to change them in the answer box (typed).",
          "Type a two-line testing checklist for movement feel.",
        ],
        type: "note",
      },
      {
        id: "unreal-hard-1",
        title: "Unreal — Hard: Save Game Flow",
        summary: "Describe typed steps and pseudo-code for using SaveGame objects to persist player progress.",
        key_points: [
          "Create SaveGame class with variables",
          "Serialize and write to slot",
          "Load and apply state on startup",
        ],
        topics: ["unreal", "save"],
        practice: [
          "Type the SaveGame usage pseudocode into the answer box (no paste).",
          "Type a short paragraph on versioning saved data.",
        ],
        type: "note",
      },
    ],
  },

  // Game Development - Godot
  {
    track: "Game Development",
    category: "Godot",
    materials: [
      {
        id: "godot-basic-1",
        title: "Godot — Basic: GDScript Player Movement",
        summary: "Type a GDScript snippet that moves a 2D player left/right and jumps.",
        key_points: [
          "Use _physics_process for physics movement",
          "Use Input.is_action_pressed for controls",
          "Apply velocity and move_and_slide",
        ],
        topics: ["godot", "gdscript"],
        practice: [
          "Type the GDScript code into the answer box (no paste).",
          "Type one line explaining why move_and_slide is used.",
        ],
        type: "note",
      },
      {
        id: "godot-medium-1",
        title: "Godot — Medium: Signals for UI",
        summary: "Type code showing how to emit a custom signal and connect it to update the UI.",
        key_points: [
          "Define and emit signals",
          "Connect signals in code or via editor",
          "Use signals to decouple logic",
        ],
        topics: ["godot", "signals"],
        practice: [
          "Type signal definition, emission, and connection snippets into the answer box.",
          "Type a short note on one advantage of signals.",
        ],
        type: "note",
      },
      {
        id: "godot-hard-1",
        title: "Godot — Hard: Scene Instancing & Cleanup",
        summary: "Write typed GDScript showing how to instance scenes at runtime and properly free them.",
        key_points: [
          "Use preload/instance for scene instancing",
          "Manage node ownership and free() when done",
          "Avoid memory leaks by removing references",
        ],
        topics: ["godot", "scenes"],
        practice: [
          "Type full GDScript example that instances an enemy scene and queues_free it after death into the answer box.",
          "Type two lines describing how to profile memory usage.",
        ],
        type: "note",
      },
    ],
  },

  // Game Development - General
  {
    track: "Game Development",
    category: "Game Dev General",
    materials: [
      {
        id: "game-general-basic-1",
        title: "Game Dev — Basic: Design a Simple Game Loop",
        summary: "Type the steps of a classic game loop and simple pseudocode for update/render sequence.",
        key_points: [
          "Separation of update and render",
          "Fixed timestep vs variable timestep",
          "Handle input, update, render, sleep",
        ],
        topics: ["game-dev", "basics"],
        practice: [
          "Type the game loop pseudocode into the answer box (typed).",
          "Type a one-line note on why a fixed timestep can be useful.",
        ],
        type: "note",
      },
      {
        id: "game-general-medium-1",
        title: "Game Dev — Medium: Basic AI State Machine",
        summary: "Type a small state machine pseudocode for enemy states: Idle, Patrol, Chase, Attack.",
        key_points: [
          "Define states and transitions",
          "Use timers or distance checks for transitions",
          "Keep state logic simple and testable",
        ],
        topics: ["game-dev", "ai"],
        practice: [
          "Type the state machine pseudocode into the answer box (no paste).",
          "Type two test scenarios showing transitions.",
        ],
        type: "note",
      },
      {
        id: "game-general-hard-1",
        title: "Game Dev — Hard: Networking Basics (Turn-based Sync)",
        summary: "Type a short design and pseudocode for synchronizing turns in a simple multiplayer turn-based game.",
        key_points: [
          "Client-server authority model",
          "Turn locking and validation",
          "Latency and reconnection handling",
        ],
        topics: ["game-dev", "networking"],
        practice: [
          "Type the turn-sync pseudocode and sequence diagram steps into the answer box (typed only).",
          "Type a brief mitigation plan for out-of-order messages.",
        ],
        type: "note",
      },
    ],
  },
]

export const dummyContent: ContentItem[] = []
