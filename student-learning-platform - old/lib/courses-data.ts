export interface Video {
  id: string
  title: string
  url: string
  duration: number // in seconds
  summary?: string
  keyPoints?: string[]
  topics?: string[]
  practice?: string[]
}

export interface Quiz {
  moduleNumber: number
  mcqQuestions: MCQQuestion[]
  codingQuestions?: CodingQuestion[]
}

export interface MCQQuestion {
  question: string
  options: string[]
  correctAnswer: number
}

export interface CodingQuestion {
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  marks: number
}

export interface CourseModule {
  moduleNumber: number
  title: string
  videos: Video[]
  quiz: Quiz
}

export interface Course {
  id: string
  title: string
  description: string
  category: string
  modules: CourseModule[]
}

export const courses: Course[] = [
  {
    id: "web-development",
    title: "Web Development",
    description: "Master web development with HTML, CSS, and JavaScript from scratch",
    category: "Web Development",
    modules: [
      {
        moduleNumber: 1,
        title: "Complete Web Development Course",
        videos: [
          {
            id: "web-dev-1",
            title: "HTML Basics – Structure of Web Pages",
            url: "https://drive.google.com/file/d/1jrsEnM39CJnNyBJsoOs9Cl7bJnCGusfx/preview",
            duration: 1800,
            summary: "Learn HTML fundamentals and how to structure web pages",
            keyPoints: ["HTML elements", "Document structure", "Basic tags"],
            topics: ["html", "basics", "structure"]
          },
          {
            id: "web-dev-2",
            title: "HTML Forms & Inputs",
            url: "https://drive.google.com/file/d/1Oj48qdQCoLV8Ej9iWZt4fEf8Xqf8Ts-u/preview",
            duration: 1800,
            summary: "Master HTML forms and various input types",
            keyPoints: ["Form elements", "Input validation", "User interaction"],
            topics: ["html", "forms", "inputs"]
          },
          {
            id: "web-dev-3",
            title: "CSS Basics – Styling the Web",
            url: "https://drive.google.com/file/d/111qGjGyaSVoUrQ9PmR0kwSpqfgD7YgtZ/preview",
            duration: 1800,
            summary: "Complete CSS styling fundamentals",
            keyPoints: ["CSS fundamentals", "Styling techniques", "Selectors"],
            topics: ["css", "styling", "crash-course"]
          },
          {
            id: "web-dev-4",
            title: "CSS Flexbox Layout",
            url: "https://drive.google.com/file/d/1Gaarm9_cx5BLS3UCYZNllYTVZVXiiPbA/preview",
            duration: 1800,
            summary: "Learn CSS Flexbox for modern layouts",
            keyPoints: ["Flexbox concepts", "Layout techniques", "Responsive design"],
            topics: ["css", "flexbox", "layout"]
          },
          {
            id: "web-dev-5",
            title: "CSS Grid Layout",
            url: "https://drive.google.com/file/d/1Akq6dnnKdjHP1sov_pKYGUUMxpvnRgEB/preview",
            duration: 1800,
            summary: "Master CSS Grid for complex layouts",
            keyPoints: ["Grid concepts", "Layout techniques", "Responsive design"],
            topics: ["css", "grid", "layout"]
          },
          {
            id: "web-dev-6",
            title: "JavaScript Basics",
            url: "https://drive.google.com/file/d/1uOXdRIw06DCu3o57UjIS_kFS85qRBJCO/preview",
            duration: 1800,
            summary: "Complete JavaScript programming basics",
            keyPoints: ["JS fundamentals", "Programming concepts", "Modern JavaScript"],
            topics: ["javascript", "programming", "introduction"]
          },
          {
            id: "web-dev-7",
            title: "JavaScript DOM Manipulation",
            url: "https://drive.google.com/file/d/1VwGLyOUVIl_obbAsRFobiqiuDV_dVTF2/preview",
            duration: 1800,
            summary: "Manipulate HTML elements with JavaScript DOM",
            keyPoints: ["DOM concepts", "Element manipulation", "Event handling"],
            topics: ["javascript", "dom", "manipulation"]
          },
          {
            id: "web-dev-8",
            title: "Responsive Web Design",
            url: "https://drive.google.com/file/d/1ipIRwRnJaYUVCvKSVOPL9JtCS3i7JzYA/preview",
            duration: 1800,
            summary: "Create responsive websites that work on all devices",
            keyPoints: ["Media queries", "Mobile-first", "Responsive techniques"],
            topics: ["css", "responsive", "mobile"]
          },
          {
            id: "web-dev-9",
            title: "Build a Simple Website (HTML + CSS)",
            url: "https://drive.google.com/file/d/1FqViIsmNZRtYnVIMLQ2PM1vnOIDO0tk-/preview",
            duration: 1800,
            summary: "Build a complete website using HTML and CSS",
            keyPoints: ["Project structure", "HTML and CSS integration", "Deployment"],
            topics: ["html", "css", "project"]
          },
          {
            id: "web-dev-10",
            title: "Hosting a Website (GitHub Pages & Netlify)",
            url: "https://drive.google.com/file/d/13oRYtP1qhmSeQS9est4QdB1xNR-ZRD8a/preview",
            duration: 1800,
            summary: "Deploy your website to the internet for free",
            keyPoints: ["GitHub Pages", "Netlify deployment", "Custom domains"],
            topics: ["hosting", "github", "netlify"]
          }
        ],
        quiz: {
          moduleNumber: 1,
          mcqQuestions: [
            { question: "HTML stands for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"], correctAnswer: 0 },
            { question: "CSS is used for?", options: ["Database", "Styling", "Server-side programming"], correctAnswer: 1 },
            { question: "JavaScript is a?", options: ["Markup language", "Programming language", "Database"], correctAnswer: 1 },
            { question: "Which tag is used for largest heading?", options: ["h6", "h1", "head"], correctAnswer: 1 },
            { question: "CSS stands for?", options: ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets"], correctAnswer: 1 },
            { question: "Which is correct CSS syntax?", options: ["body:color=green;", "body {color: green;}", "{body;color:green;}"], correctAnswer: 1 },
            { question: "How do you select an element with id 'demo'?", options: [".demo", "#demo", "demo"], correctAnswer: 1 },
            { question: "Which is correct for JavaScript array?", options: ["var arr = (1,2,3)", "var arr = [1,2,3]", "var arr = {1,2,3}"], correctAnswer: 1 }
          ]
        }
      }
    ]
  },
  {
    id: "app-development",
    title: "App Development",
    description: "Learn Android app development with Kotlin and Android Studio",
    category: "App Development",
    modules: [
      {
        moduleNumber: 1,
        title: "Complete Android Development Course",
        videos: [
          {
            id: "app-dev-1",
            title: "Introduction to Android App Development",
            url: "https://drive.google.com/file/d/1OYVl8Mq1kcLrujEVjTr4jOgHnWpvj5hj/preview",
            duration: 1800,
            summary: "Introduction to app development concepts and overview",
            keyPoints: ["App development basics", "Mobile development", "Platform overview"],
            topics: ["app-development", "introduction", "basics"]
          },
          {
            id: "app-dev-2",
            title: "Installing Android Studio & SDK",
            url: "https://drive.google.com/file/d/19SpNWH2TrptwkyKyDu8llGq15iqSF2ad/preview",
            duration: 1800,
            summary: "Install and configure Android Studio development environment",
            keyPoints: ["Android Studio setup", "SDK configuration", "Emulator setup"],
            topics: ["android-studio", "installation", "setup"]
          },
          {
            id: "app-dev-3",
            title: "Creating Your First Android App",
            url: "https://drive.google.com/file/d/1QxVnjX1QGtPWjTRPichg2RMivNXIxwo0/preview",
            duration: 1800,
            summary: "Learn Kotlin programming fundamentals for Android",
            keyPoints: ["Kotlin syntax", "Programming concepts", "Android development"],
            topics: ["kotlin", "programming", "basics"]
          },
          {
            id: "app-dev-4",
            title: "Understanding Activities & Layouts",
            url: "https://drive.google.com/file/d/10t10Q0DHse4Ptk63JI5WwCXg29Gcr99l/preview",
            duration: 1800,
            summary: "Master Android UI layouts and XML design",
            keyPoints: ["Layout types", "XML design", "UI components"],
            topics: ["android", "ui-layouts", "xml"]
          },
          {
            id: "app-dev-5",
            title: "Buttons, TextView & User Input",
            url: "https://drive.google.com/file/d/1ERNa-yeSnZ0YtrPqmw-2aInVTLysRrpx/preview",
            duration: 1800,
            summary: "Handle user input with buttons and text fields",
            keyPoints: ["Button handling", "Input validation", "Event listeners"],
            topics: ["android", "buttons", "input"]
          },
          {
            id: "app-dev-6",
            title: "Intents & Intent Filters",
            url: "https://drive.google.com/file/d/1u6KiSSm15drEkyqABZPFg-YD0dW0WeoV/preview",
            duration: 1800,
            summary: "Learn Android navigation between screens",
            keyPoints: ["Navigation concepts", "Intent system", "Screen transitions"],
            topics: ["android", "navigation", "intents"]
          },
          {
            id: "app-dev-7",
            title: "RecyclerView & Lists",
            url: "https://drive.google.com/file/d/1Z1yrdn-oBhMEK67FQUndSkWiynSBUnaq/preview",
            duration: 1800,
            summary: "Master Android activities and intent system",
            keyPoints: ["Activity lifecycle", "Intent types", "Component communication"],
            topics: ["android", "activities", "intents"]
          },
          {
            id: "app-dev-8",
            title: "Simple Calculator App (Project)",
            url: "https://drive.google.com/file/d/1PpPFDKbAUZ-VFf6zx7h8XEKdJdV6-9xi/preview",
            duration: 1800,
            summary: "Build a complete calculator application",
            keyPoints: ["App architecture", "Button logic", "Display management"],
            topics: ["project", "calculator", "complete-app"]
          },
          {
            id: "app-dev-9",
            title: "Android App UI Design Basics",
            url: "https://drive.google.com/file/d/16zxv8kU_Kn0Xq18ew26UpInn2PMDGKLx/preview",
            duration: 1800,
            summary: "Learn data storage options in Android",
            keyPoints: ["SharedPreferences", "Database basics", "File storage"],
            topics: ["android", "data-storage", "persistence"]
          },
          {
            id: "app-dev-10",
            title: "Build APK & Run on Mobile Device",
            url: "https://drive.google.com/file/d/1iG87OiC11gt2wyID9Aa8diQpKsEw5qcc/preview",
            duration: 1800,
            summary: "Build a complete beginner Android project",
            keyPoints: ["Project planning", "Implementation", "Real-world app"],
            topics: ["project", "android", "complete"]
          }
        ],
        quiz: {
          moduleNumber: 1,
          mcqQuestions: [
            { question: "Android Studio is:", options: ["A game engine", "An IDE", "A browser"], correctAnswer: 1 },
            { question: "Kotlin is developed by:", options: ["Google", "Apple", "Microsoft"], correctAnswer: 0 },
            { question: "Activities in Android are:", options: ["UI components", "Screens", "Database tables"], correctAnswer: 1 },
            { question: "Intent is used for:", options: ["Show short messages", "Component communication", "Create buttons"], correctAnswer: 1 },
            { question: "XML is used in Android for:", options: ["Programming logic", "UI layouts", "Database queries"], correctAnswer: 1 },
            { question: "SharedPreferences stores:", options: ["Large files", "Key-value pairs", "Images"], correctAnswer: 1 },
            { question: "Manifest file contains:", options: ["App configuration", "Source code", "UI design"], correctAnswer: 0 },
            { question: "Gradle is used for:", options: ["Building apps", "Designing UI", "Testing"], correctAnswer: 0 }
          ],
          codingQuestions: [
            {
              title: "Create a simple login screen",
              description: "Create an Android login screen with email and password input fields, login button, and basic validation.",
              difficulty: "Easy",
              marks: 10
            }
          ]
        }
      }
    ]
  },
  {
    id: "game-development",
    title: "Game Development",
    description: "Learn game development with Unity and C#",
    category: "Game Development",
    modules: [
      {
        moduleNumber: 1,
        title: "Complete Game Development Course",
        videos: [
          {
            id: "game-dev-1",
            title: "Introduction to Game Development",
            url: "https://drive.google.com/file/d/1WoVHpf9q2NK7eTwfrMy7fs-3ABX94fA_/preview",
            duration: 9030,
            summary: "Introduction to game development concepts and principles",
            keyPoints: ["Game development fundamentals", "Industry overview", "Development pipeline"],
            topics: ["game-development", "introduction", "basics"]
          },
          {
            id: "game-dev-2",
            title: "Learn Unity - The Most Basic Tutorial",
            url: "https://drive.google.com/file/d/1Unnk9HNibPAhY91b0kTU4D4W5ueV8QTa/preview",
            duration: 7500,
            summary: "Overview of popular game engines and their features",
            keyPoints: ["Engine comparison", "Features overview", "Selection criteria"],
            topics: ["game-engines", "overview", "comparison"]
          },
          {
            id: "game-dev-3",
            title: "Unity Installation",
            url: "https://www.youtube.com/embed/IlKaB1etrik",
            duration: 716,
            summary: "Install and configure Unity development environment",
            keyPoints: ["Unity Hub setup", "Editor installation", "Project configuration"],
            topics: ["unity", "installation", "setup"]
          },
          {
            id: "game-dev-4",
            title: "C# Basics for Unity",
            url: "https://www.youtube.com/embed/GhQdlIFylQ8",
            duration: 12538,
            summary: "Learn C# programming fundamentals for Unity",
            keyPoints: ["C# syntax", "Programming concepts", "Unity scripting"],
            topics: ["csharp", "programming", "unity"]
          },
          {
            id: "game-dev-5",
            title: "Game Objects & Scenes",
            url: "https://www.youtube.com/embed/YdO-DzF_1R0",
            duration: 651,
            summary: "Understanding GameObjects and Scenes in Unity",
            keyPoints: ["GameObjects", "Scenes", "Hierarchy management"],
            topics: ["unity", "game-objects", "scenes"]
          },
          {
            id: "game-dev-6",
            title: "Player Movement",
            url: "https://www.youtube.com/embed/dwcT-Dch0bA",
            duration: 739,
            summary: "Create player movement with C# scripting",
            keyPoints: ["Player controller", "Input handling", "Movement mechanics"],
            topics: ["unity", "player-movement", "scripting"]
          },
          {
            id: "game-dev-7",
            title: "Collision Detection",
            url: "https://www.youtube.com/embed/QbqnDbexrCw",
            duration: 405,
            summary: "Implement physics and collision detection in Unity",
            keyPoints: ["Collision detection", "Physics system", "Trigger events"],
            topics: ["unity", "physics", "collisions"]
          },
          {
            id: "game-dev-8",
            title: "Game UI & Scoring",
            url: "https://www.youtube.com/embed/TAGZxRMloyU",
            duration: 731,
            summary: "Create user interfaces and scoring systems",
            keyPoints: ["Canvas UI", "Score tracking", "Game interface"],
            topics: ["unity", "ui", "scoring"]
          },
          {
            id: "game-dev-9",
            title: "2D Game Logic",
            url: "https://www.youtube.com/embed/on9nwbZngyw",
            duration: 898,
            summary: "Implement 2D game mechanics and logic",
            keyPoints: ["2D mechanics", "Game logic", "State management"],
            topics: ["unity", "2d-game", "logic"]
          },
          {
            id: "game-dev-10",
            title: "Beginner 2D Game Project",
            url: "https://www.youtube.com/embed/OR0e-1UBEOU",
            duration: 832,
            summary: "Build a complete 2D game project",
            keyPoints: ["Project planning", "Complete implementation", "Game polish"],
            topics: ["project", "2d-game", "complete"]
          }
        ],
        quiz: {
          moduleNumber: 1,
          mcqQuestions: [
            { question: "Unity primarily uses which language?", options: ["Python", "C#", "JavaScript"], correctAnswer: 1 },
            { question: "GameObject in Unity is:", options: ["A script", "A basic entity", "A physics component"], correctAnswer: 1 },
            { question: "Transform component controls:", options: ["Audio", "Position/Rotation/Scale", "Animations"], correctAnswer: 1 },
            { question: "Rigidbody adds:", options: ["Physics", "Graphics", "Audio"], correctAnswer: 0 },
            { question: "Collider is used for:", options: ["Collision detection", "Visual effects", "Audio playback"], correctAnswer: 0 },
            { question: "Canvas in Unity is for:", options: ["3D modeling", "UI elements", "Physics simulation"], correctAnswer: 1 },
            { question: "Update() method runs:", options: ["Once per frame", "Once per second", "On collision"], correctAnswer: 0 },
            { question: "Prefab in Unity is:", options: ["A template object", "A texture", "A sound effect"], correctAnswer: 0 }
          ],
          codingQuestions: [
            {
              title: "Create player movement script",
              description: "Write a C# script that moves player with arrow keys and includes jump functionality.",
              difficulty: "Easy",
              marks: 10
            }
          ]
        }
      }
    ]
  }
]