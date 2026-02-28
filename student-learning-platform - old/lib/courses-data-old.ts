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
            title: "Introduction to Web Development",
            url: "https://www.youtube.com/embed/Q33KBiDriJY",
            duration: 600,
            summary: "Get started with web development fundamentals",
            keyPoints: ["Web basics", "HTML/CSS/JS overview", "Development environment"],
            topics: ["web-development", "basics", "introduction"]
          },
          {
            id: "web-dev-2",
            title: "HTML Basics",
            url: "https://www.youtube.com/embed/pQN-pnXPaVg",
            duration: 540,
            summary: "Learn HTML structure and fundamental tags",
            keyPoints: ["HTML structure", "Basic tags", "Document structure"],
            topics: ["html", "basics", "structure"]
          },
          {
            id: "web-dev-3",
            title: "HTML Forms & Inputs",
            url: "https://www.youtube.com/embed/fNcJuPIZ2WE",
            duration: 480,
            summary: "Creating HTML forms and input elements",
            keyPoints: ["Form elements", "Input types", "Form validation"],
            topics: ["html", "forms", "inputs"]
          },
          {
            id: "web-dev-4",
            title: "CSS Basics",
            url: "https://www.youtube.com/embed/yfoY53QXEnI",
            duration: 600,
            summary: "Introduction to CSS styling and design",
            keyPoints: ["CSS syntax", "Selectors", "Basic styling"],
            topics: ["css", "styling", "basics"]
          },
          {
            id: "web-dev-5",
            title: "CSS Box Model",
            url: "https://www.youtube.com/embed/rIO5326FgPE",
            duration: 540,
            summary: "Understanding CSS box model and layout",
            keyPoints: ["Box model", "Margin/Padding", "Border properties"],
            topics: ["css", "box-model", "layout"]
          },
          {
            id: "web-dev-6",
            title: "Flexbox Basics",
            url: "https://www.youtube.com/embed/JJSoEo8JSnc",
            duration: 600,
            summary: "Learn CSS Flexbox for modern layouts",
            keyPoints: ["Flexbox container", "Flex properties", "Layout techniques"],
            topics: ["css", "flexbox", "layout"]
          },
          {
            id: "web-dev-7",
            title: "JavaScript Introduction",
            url: "https://www.youtube.com/embed/W6NZfCO5SIk",
            duration: 720,
            summary: "Getting started with JavaScript programming",
            keyPoints: ["JS basics", "Variables", "Functions"],
            topics: ["javascript", "programming", "basics"]
          },
          {
            id: "web-dev-8",
            title: "JavaScript Variables & Functions",
            url: "https://www.youtube.com/embed/Bv_5Zv5c-Ts",
            duration: 660,
            summary: "Deep dive into JavaScript variables and functions",
            keyPoints: ["Variable types", "Functions", "Scope"],
            topics: ["javascript", "variables", "functions"]
          },
          {
            id: "web-dev-9",
            title: "DOM Manipulation",
            url: "https://www.youtube.com/embed/0ik6X4DJKCc",
            duration: 540,
            summary: "Manipulating HTML elements with JavaScript",
            keyPoints: ["DOM selection", "Element manipulation", "Event handling"],
            topics: ["javascript", "dom", "manipulation"]
          },
          {
            id: "web-dev-10",
            title: "Mini Website Project",
            url: "https://www.youtube.com/embed/PlxWf493en4",
            duration: 900,
            summary: "Build a complete website from scratch",
            keyPoints: ["Project structure", "Responsive design", "Deployment"],
            topics: ["project", "website", "complete"]
          }
        ],
            topics: ["html", "basics", "semantic"],
            practice: [
              "Create a simple 1-page site with header, nav, article, and footer.",
              "Add an image, an external link, and a form with name/email fields.",
            ],
          },
          {
            id: "web-html-2",
            title: "HTML for Beginners – FreeCodeCamp",
            url: "https://www.youtube.com/watch?v=UB1O30fR-EE",
            duration: 3000,
            summary:
              "Beginner-focused tutorial covering core HTML tags, attributes, and practical examples to build simple pages.",
            keyPoints: [
              "Tag syntax and nesting rules",
              "Using attributes like src, href, alt",
              "Basic forms and inputs",
            ],
            topics: ["html", "intro", "forms"],
          },
          {
            id: "web-html-3",
            title: "HTML Crash Course – Traversy Media",
            url: "https://www.youtube.com/watch?v=UB1O30fR-EE",
            duration: 2400,
          },
          {
            id: "web-html-4",
            title: "HTML Forms Tutorial – Net Ninja",
            url: "https://www.youtube.com/watch?v=5G3_pn5K0lU",
            duration: 1800,
          },
          {
            id: "web-html-5",
            title: "Semantic HTML – Kevin Powell",
            url: "https://www.youtube.com/watch?v=kX39TtN4pRM",
            duration: 1500,
          },
        ],
        quiz: {
          moduleNumber: 1,
          mcqQuestions: [
            {
              question: "HTML stands for?",
              options: ["Hyper Trainer Marking Language", "Hyper Text Markup Language", "High Markup Language"],
              correctAnswer: 1,
            },
            { question: "Which tag creates a hyperlink?", options: ["<a>", "<p>", "<link>"], correctAnswer: 0 },
            {
              question: "Which tag is used for the largest heading?",
              options: ["<h6>", "<h1>", "<heading>"],
              correctAnswer: 1,
            },
            {
              question: "Which of the following is a semantic tag?",
              options: ["<div>", "<span>", "<article>"],
              correctAnswer: 2,
            },
            { question: "<form> tag is used for?", options: ["Images", "Navigation", "User input"], correctAnswer: 2 },
            {
              question: "Which attribute makes an input field required?",
              options: ["mandatory", "required", "needed"],
              correctAnswer: 1,
            },
            {
              question: "What does the <meta> tag define?",
              options: ["Metadata about HTML document", "Main content", "Footer"],
              correctAnswer: 0,
            },
            {
              question: "Which tag is used to define an unordered list?",
              options: ["<ol>", "<ul>", "<list>"],
              correctAnswer: 1,
            },
            {
              question: "The <img> tag requires which attribute?",
              options: ["href", "src", "link"],
              correctAnswer: 1,
            },
            {
              question: "Which tag is used for line breaks?",
              options: ["<break>", "<br>", "<lb>"],
              correctAnswer: 1,
            },
            {
              question: "The <title> tag belongs in which section?",
              options: ["<body>", "<head>", "<footer>"],
              correctAnswer: 1,
            },
            {
              question: "Which input type creates a password field?",
              options: ['type="password"', 'type="secret"', 'type="hidden"'],
              correctAnswer: 0,
            },
            {
              question: "What is the correct HTML for creating a checkbox?",
              options: ['<input type="check">', '<input type="checkbox">', "<checkbox>"],
              correctAnswer: 1,
            },
            {
              question: "Which tag defines a table row?",
              options: ["<row>", "<tr>", "<table-row>"],
              correctAnswer: 1,
            },
            {
              question: "The <nav> tag is used for?",
              options: ["Images", "Navigation links", "Videos"],
              correctAnswer: 1,
            },
            {
              question: "Which tag creates a dropdown list?",
              options: ["<list>", "<select>", "<dropdown>"],
              correctAnswer: 1,
            },
            {
              question: "The <canvas> element is used for?",
              options: ["Drawing graphics", "Playing videos", "Creating forms"],
              correctAnswer: 0,
            },
            {
              question: "Which tag defines a paragraph?",
              options: ["<para>", "<p>", "<paragraph>"],
              correctAnswer: 1,
            },
            {
              question: "The alt attribute is used with which tag?",
              options: ["<img>", "<link>", "<div>"],
              correctAnswer: 0,
            },
            {
              question: "Which tag makes text bold?",
              options: ["<b>", "<bold>", "<strong>"],
              correctAnswer: 0,
            },
          ],
          codingQuestions: [
            {
              title: "Create a simple HTML portfolio page",
              description:
                "Create a simple HTML portfolio page with a title, profile picture, name, introduction, and GitHub link.",
              difficulty: "Easy",
              marks: 10,
            },
            {
              title: "Build an HTML Contact Form",
              description:
                "Create an HTML contact form with fields for name, email, subject, message, and a submit button.",
              difficulty: "Easy",
              marks: 10,
            },
          ],
        },
      },
      {
        moduleNumber: 2,
        title: "CSS Fundamentals",
        videos: [
          {
            id: "web-css-1",
            title: "CSS Full Course – Bro Code",
            url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
            duration: 4200,
          },
          {
            id: "web-css-2",
            title: "CSS Crash Course – Traversy Media",
            url: "https://www.youtube.com/watch?v=yfoY53QXEnI",
            duration: 3000,
          },
          {
            id: "web-css-3",
            title: "Responsive CSS – Kevin Powell",
            url: "https://www.youtube.com/watch?v=srvUrASNj0s",
            duration: 2700,
          },
          {
            id: "web-css-4",
            title: "Flexbox in 15 Minutes – Web Dev Simplified",
            url: "https://www.youtube.com/watch?v=fYq5PXgSsbE",
            duration: 900,
          },
          {
            id: "web-css-5",
            title: "CSS Grid Tutorial – Net Ninja",
            url: "https://www.youtube.com/watch?v=t6CBKf8K_Ac",
            duration: 1800,
          },
        ],
        quiz: {
          moduleNumber: 2,
          mcqQuestions: [
            {
              question: "CSS stands for?",
              options: ["Creative Style System", "Cascading Style Sheets", "Computer Style Structure"],
              correctAnswer: 1,
            },
            {
              question: "Which property changes text color?",
              options: ["font-style", "color", "text-color"],
              correctAnswer: 1,
            },
            {
              question: "Flexbox helps to create?",
              options: ["Animations", "Responsive layouts", "Tables"],
              correctAnswer: 1,
            },
            { question: "Grid is used for?", options: ["2D layouts", "1D layouts", "Audio"], correctAnswer: 0 },
            { question: "Which selector selects all <p> elements?", options: [".p", "p", "#p"], correctAnswer: 1 },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Create a webpage layout using CSS Flexbox",
              description:
                "Create a webpage layout with Header, Sidebar (left), Main content area, and Footer using CSS Flexbox.",
              difficulty: "Medium",
              marks: 15,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
      {
        moduleNumber: 3,
        title: "JavaScript Fundamentals",
        videos: [
          {
            id: "web-js-1",
            title: "JavaScript Full Course – Bro Code",
            url: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
            duration: 7200,
          },
          {
            id: "web-js-2",
            title: "JavaScript Crash Course – Traversy Media",
            url: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
            duration: 3600,
          },
          {
            id: "web-js-3",
            title: "JavaScript DOM Tutorial – Net Ninja",
            url: "https://www.youtube.com/watch?v=0ik6X4DJKCc",
            duration: 2400,
          },
          {
            id: "web-js-4",
            title: "Async JS – Web Dev Simplified",
            url: "https://www.youtube.com/watch?v=PoRJizFvM7s",
            duration: 1800,
          },
          {
            id: "web-js-5",
            title: "JavaScript Projects – Florin Pop",
            url: "https://www.youtube.com/watch?v=3PHXvlpOkf4",
            duration: 5400,
          },
        ],
        quiz: {
          moduleNumber: 3,
          mcqQuestions: [
            {
              question: "JavaScript is used for?",
              options: ["Styling", "Structure", "Interactivity"],
              correctAnswer: 2,
            },
            {
              question: "let is used to?",
              options: ["Declare a variable", "Create a function", "Import libraries"],
              correctAnswer: 0,
            },
            {
              question: "Which prints to console?",
              options: ["echo()", "printf()", "console.log()"],
              correctAnswer: 2,
            },
            { question: "Arrays are written with?", options: ["{}", "[]", "()"], correctAnswer: 1 },
            {
              question: "DOM stands for:",
              options: ["Document Object Model", "Digital Output Module", "Document Oriented Markup"],
              correctAnswer: 0,
            },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Write JavaScript to interact with DOM",
              description:
                "Ask user for their name using prompt(), print 'Hello <name>!' in the webpage using DOM, and change text color to blue.",
              difficulty: "Easy",
              marks: 10,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
      {
        moduleNumber: 4,
        title: "React & Backend",
        videos: [
          {
            id: "web-react-1",
            title: "React JS Full Course – Mosh",
            url: "https://www.youtube.com/watch?v=SqcY0GlETPk",
            duration: 5400,
          },
          {
            id: "web-react-2",
            title: "React Crash Course – Traversy Media",
            url: "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
            duration: 3000,
          },
          {
            id: "web-backend-1",
            title: "Node.js & Express – Net Ninja",
            url: "https://www.youtube.com/watch?v=ZlI5MN0zY0c",
            duration: 2700,
          },
          {
            id: "web-backend-2",
            title: "REST API Basics – AmigosCode",
            url: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
            duration: 2400,
          },
          {
            id: "web-roadmap-1",
            title: "Full Web Dev Roadmap – Fireship",
            url: "https://www.youtube.com/watch?v=0pThnRneDjw",
            duration: 900,
          },
        ],
        quiz: {
          moduleNumber: 4,
          mcqQuestions: [
            {
              question: "React is a __________ library.",
              options: ["Backend", "Styling", "Frontend"],
              correctAnswer: 2,
            },
            { question: "Components return:", options: ["CSS", "HTML (JSX)", "PHP"], correctAnswer: 1 },
            {
              question: "State is used to:",
              options: ["Store dynamic data", "Store CSS", "Write SQL"],
              correctAnswer: 0,
            },
            {
              question: "Express.js is a:",
              options: ["Database", "Backend framework", "CSS framework"],
              correctAnswer: 1,
            },
            { question: "REST API uses:", options: ["HTTP", "C++", "XML only"], correctAnswer: 0 },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Create a React counter component",
              description:
                "Create a React counter component that displays a counter, has + and – buttons, and updates the counter using useState.",
              difficulty: "Medium",
              marks: 15,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
    ],
  },
  {
    id: "app-dev-android",
    title: "Mobile App Development",
    description: "Master Android (Java/Kotlin), Flutter, and Cross-Platform Development",
    category: "Mobile Development",
    modules: [
      {
        moduleNumber: 1,
        title: "Android Java Basics",
        videos: [
          {
            id: "app-android-java-1",
            title: "Java for Android – Telusko",
            url: "https://www.youtube.com/watch?v=eIrMbAQSU34",
            duration: 3600,
          },
          {
            id: "app-android-java-2",
            title: "Android Studio Crash Course – Coding in Flow",
            url: "https://www.youtube.com/watch?v=IS2F9aQGsnM",
            duration: 2400,
          },
          {
            id: "app-android-java-3",
            title: "First Android App – Google Developers",
            url: "https://www.youtube.com/watch?v=fis26HvvDII",
            duration: 1800,
          },
          {
            id: "app-android-java-4",
            title: "Android Activities – Coding in Flow",
            url: "https://www.youtube.com/watch?v=bgIUdb-7Rqo",
            duration: 2100,
          },
          {
            id: "app-android-java-5",
            title: "Layouts & XML – Google Developers",
            url: "https://www.youtube.com/watch?v=_ytlYjC6iTo",
            duration: 1500,
          },
        ],
        quiz: {
          moduleNumber: 1,
          mcqQuestions: [
            {
              question: "Java is primarily used in Android for:",
              options: ["UI Design", "Backend Logic", "Database"],
              correctAnswer: 1,
            },
            { question: "Android Studio is:", options: ["A game engine", "An IDE", "A browser"], correctAnswer: 1 },
            {
              question: "Toast is used to:",
              options: ["Show short messages", "Create buttons", "Store data"],
              correctAnswer: 0,
            },
            {
              question: "Intent is used to:",
              options: ["Navigate between activities", "Store data", "Create UI"],
              correctAnswer: 0,
            },
            {
              question: "XML in Android is used for:",
              options: ["Logic", "Layout design", "Networking"],
              correctAnswer: 1,
            },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Create a BMI Calculator app",
              description:
                "Create a BMI Calculator app with input fields for height and weight, a calculate button, display BMI result using Toast, and navigate to result activity.",
              difficulty: "Easy",
              marks: 10,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
      {
        moduleNumber: 2,
        title: "Kotlin & Advanced Android",
        videos: [
          {
            id: "app-kotlin-1",
            title: "Kotlin Basics – Google Developers",
            url: "https://www.youtube.com/watch?v=F9UC9DY-vIU",
            duration: 3000,
          },
          {
            id: "app-kotlin-2",
            title: "Kotlin Android Project – Coding in Flow",
            url: "https://www.youtube.com/watch?v=BBWyXo-3JGQ",
            duration: 2700,
          },
          {
            id: "app-kotlin-3",
            title: "ConstraintLayout – Android Developers",
            url: "https://www.youtube.com/watch?v=XamMbnzI5vE",
            duration: 1800,
          },
          {
            id: "app-kotlin-4",
            title: "RecyclerView Lists – Coding in Flow",
            url: "https://www.youtube.com/watch?v=Vyqz_-sJGFk",
            duration: 2400,
          },
          {
            id: "app-kotlin-5",
            title: "SQLite Local Storage – CodingWithMitch",
            url: "https://www.youtube.com/watch?v=312RhjfetP8",
            duration: 3300,
          },
        ],
        quiz: {
          moduleNumber: 2,
          mcqQuestions: [
            {
              question: "Kotlin is:",
              options: ["Older than Java", "More concise than Java", "Only for iOS"],
              correctAnswer: 1,
            },
            {
              question: "ConstraintLayout is used for:",
              options: ["Data storage", "Flexible UI design", "Networking"],
              correctAnswer: 1,
            },
            {
              question: "RecyclerView is used to:",
              options: ["Display lists efficiently", "Store data", "Make network calls"],
              correctAnswer: 0,
            },
            {
              question: "SQLite is a:",
              options: ["Cloud database", "Local database", "UI framework"],
              correctAnswer: 1,
            },
            {
              question: "Kotlin null safety uses:",
              options: ["? operator", "* operator", "& operator"],
              correctAnswer: 0,
            },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Build a Todo App with SQLite",
              description:
                "Build a Todo App with SQLite that includes a RecyclerView to display tasks, a button to add new tasks, storing tasks in SQLite database, and implementing delete functionality.",
              difficulty: "Medium",
              marks: 15,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
      {
        moduleNumber: 3,
        title: "Flutter Basics",
        videos: [
          {
            id: "app-flutter-1",
            title: "Dart Basics for Flutter – Flutter Official",
            url: "https://www.youtube.com/watch?v=5rtujDjt50I",
            duration: 2400,
          },
          {
            id: "app-flutter-2",
            title: "Flutter Crash Course – Net Ninja",
            url: "https://www.youtube.com/watch?v=1ukSR1GRtMU",
            duration: 3000,
          },
          {
            id: "app-flutter-3",
            title: "Flutter Widgets – Flutter Official",
            url: "https://www.youtube.com/watch?v=b_sQ9bMltGU",
            duration: 1800,
          },
          {
            id: "app-flutter-4",
            title: "Flutter Layouts – The Flutter Way",
            url: "https://www.youtube.com/watch?v=0gvhxY0NWLs",
            duration: 2100,
          },
          {
            id: "app-flutter-5",
            title: "Navigation in Flutter – Flutter Explained",
            url: "https://www.youtube.com/watch?v=nyvwx7o277U",
            duration: 1500,
          },
        ],
        quiz: {
          moduleNumber: 3,
          mcqQuestions: [
            { question: "Flutter uses which language?", options: ["JavaScript", "Dart", "Python"], correctAnswer: 1 },
            {
              question: "StatefulWidget is used for:",
              options: ["Static UI", "Dynamic UI with state", "Navigation"],
              correctAnswer: 1,
            },
            {
              question: "Hot reload in Flutter:",
              options: ["Restarts the app", "Updates UI instantly", "Clears cache"],
              correctAnswer: 1,
            },
            {
              question: "Column widget arranges children:",
              options: ["Horizontally", "Vertically", "In a grid"],
              correctAnswer: 1,
            },
            {
              question: "Navigator.push is used for:",
              options: ["Closing app", "Navigation", "Data storage"],
              correctAnswer: 1,
            },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Create a Flutter login page",
              description:
                "Create a Flutter login page with TextField for email and password, a Login button, navigation to home page on button press, and display a SnackBar on error.",
              difficulty: "Easy",
              marks: 10,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
      {
        moduleNumber: 4,
        title: "React Native & Cross-Platform",
        videos: [
          {
            id: "app-react-native-1",
            title: "React Native Full Course – Programming with Mosh",
            url: "https://www.youtube.com/watch?v=0-S5a0eXPoc",
            duration: 7200,
          },
          {
            id: "app-react-native-2",
            title: "React Native Crash Course – Traversy Media",
            url: "https://www.youtube.com/watch?v=Hf4MJH0jDb4",
            duration: 3600,
          },
          {
            id: "app-react-native-3",
            title: "React Native Navigation – React Navigation Docs",
            url: "https://www.youtube.com/watch?v=nQVCkqvU1uE",
            duration: 2400,
          },
          {
            id: "app-react-native-4",
            title: "Expo vs React Native CLI – Academind",
            url: "https://www.youtube.com/watch?v=uHlAM4ICi1s",
            duration: 1800,
          },
          {
            id: "app-react-native-5",
            title: "Mobile App Deployment – FreeCodeCamp",
            url: "https://www.youtube.com/watch?v=wbXj4Z5iBiA",
            duration: 2700,
          },
        ],
        quiz: {
          moduleNumber: 4,
          mcqQuestions: [
            { question: "React Native uses:", options: ["JavaScript", "Swift", "Kotlin"], correctAnswer: 0 },
            {
              question: "React Native renders to:",
              options: ["WebView", "Native components", "Canvas"],
              correctAnswer: 1,
            },
            {
              question: "Expo is:",
              options: ["A framework", "A programming language", "A database"],
              correctAnswer: 0,
            },
            {
              question: "StyleSheet.create() is used for:",
              options: ["Navigation", "Styling", "API calls"],
              correctAnswer: 1,
            },
            {
              question: "Which can build for both iOS and Android?",
              options: ["Swift", "React Native", "Java"],
              correctAnswer: 1,
            },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Create a weather app with React Native",
              description:
                "Create a weather app with React Native that fetches weather data from an API, displays current temperature, shows weather icon based on conditions, and adds location search functionality.",
              difficulty: "Medium",
              marks: 15,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
    ],
  },
  {
    id: "game-dev-unity",
    title: "Game Development",
    description: "Master Unity, Unreal Engine, and Game Design Principles",
    category: "Game Development",
    modules: [
      {
        moduleNumber: 1,
        title: "Unity Basics",
        videos: [
          {
            id: "game-unity-1",
            title: "Unity Complete Beginner Course – Brackeys",
            url: "https://www.youtube.com/watch?v=pwZpJzpE2lQ",
            duration: 10800,
          },
          {
            id: "game-unity-2",
            title: "C# for Unity Beginners – Brackeys",
            url: "https://www.youtube.com/watch?v=IFayQioG71A",
            duration: 2400,
          },
          {
            id: "game-unity-3",
            title: "Unity 2D Game Development – Brackeys",
            url: "https://www.youtube.com/watch?v=on9nwbZngyw",
            duration: 5400,
          },
          {
            id: "game-unity-4",
            title: "Unity 3D Game Tutorial – GameDev.tv",
            url: "https://www.youtube.com/watch?v=gB1F9G0JXOo",
            duration: 7200,
          },
          {
            id: "game-unity-5",
            title: "Unity Animation – Brackeys",
            url: "https://www.youtube.com/watch?v=hkaysu1Z-N8",
            duration: 1800,
          },
        ],
        quiz: {
          moduleNumber: 1,
          mcqQuestions: [
            {
              question: "Unity uses which programming language primarily?",
              options: ["Python", "C#", "JavaScript"],
              correctAnswer: 1,
            },
            {
              question: "GameObject is:",
              options: ["A script", "A basic entity in Unity", "A physics engine"],
              correctAnswer: 1,
            },
            {
              question: "Transform component controls:",
              options: ["Audio", "Position/Rotation/Scale", "Animations"],
              correctAnswer: 1,
            },
            { question: "Rigidbody component adds:", options: ["Physics", "Graphics", "Audio"], correctAnswer: 0 },
            {
              question: "Update() method is called:",
              options: ["Once", "Every frame", "On collision"],
              correctAnswer: 1,
            },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Create a simple player movement script in Unity",
              description:
                "Create a simple player movement script in Unity that handles WASD input, moves player character using Transform, adds jump functionality with space key, and implements basic collision detection.",
              difficulty: "Easy",
              marks: 10,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
      {
        moduleNumber: 2,
        title: "Unreal Engine Basics",
        videos: [
          {
            id: "game-unreal-1",
            title: "Unreal Engine 5 for Beginners – Unreal Sensei",
            url: "https://www.youtube.com/watch?v=k-zMkzmduqI",
            duration: 7200,
          },
          {
            id: "game-unreal-2",
            title: "Blueprints Visual Scripting – Unreal Engine",
            url: "https://www.youtube.com/watch?v=EFXMW_UEDco",
            duration: 3600,
          },
          {
            id: "game-unreal-3",
            title: "C++ in Unreal Engine – Unreal C++",
            url: "https://www.youtube.com/watch?v=LsNW4FPHuZE",
            duration: 5400,
          },
          {
            id: "game-unreal-4",
            title: "Unreal Materials & Lighting – Unreal Engine",
            url: "https://www.youtube.com/watch?v=k7YJy9_pJsY",
            duration: 2700,
          },
          {
            id: "game-unreal-5",
            title: "Unreal First Person Shooter – GameDev.tv",
            url: "https://www.youtube.com/watch?v=m7QR0xMO4xM",
            duration: 6600,
          },
        ],
        quiz: {
          moduleNumber: 2,
          mcqQuestions: [
            { question: "Unreal Engine uses:", options: ["C++", "Java", "Python"], correctAnswer: 0 },
            {
              question: "Blueprints in Unreal are:",
              options: ["3D models", "Visual scripting", "Audio files"],
              correctAnswer: 1,
            },
            {
              question: "Which engine is better for realistic graphics?",
              options: ["Unity", "Unreal", "Both equal"],
              correctAnswer: 1,
            },
            { question: "Actor in Unreal is:", options: ["A game object", "A script", "A level"], correctAnswer: 0 },
            {
              question: "Level Blueprint is used for:",
              options: ["Character movement", "Level-specific logic", "UI design"],
              correctAnswer: 1,
            },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Create a Blueprint for a collectible item",
              description:
                "Create a Blueprint for a collectible item in Unreal Engine that detects player overlap, adds score to player, plays collection sound, and destroys the item after collection.",
              difficulty: "Easy",
              marks: 10,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
      {
        moduleNumber: 3,
        title: "Game Design Fundamentals",
        videos: [
          {
            id: "game-design-1",
            title: "Game Design Fundamentals – GDC",
            url: "https://www.youtube.com/watch?v=z06QR-tz1_o",
            duration: 3600,
          },
          {
            id: "game-design-2",
            title: "Level Design Principles – Game Maker's Toolkit",
            url: "https://www.youtube.com/watch?v=09r1B9cVEQY",
            duration: 1800,
          },
          {
            id: "game-design-3",
            title: "Game Mechanics – Extra Credits",
            url: "https://www.youtube.com/watch?v=uepAJ-rqJKA",
            duration: 1200,
          },
          {
            id: "game-design-4",
            title: "Player Feedback & Polish – Juice It or Lose It",
            url: "https://www.youtube.com/watch?v=Fy0aCDmgnxg",
            duration: 900,
          },
          {
            id: "game-design-5",
            title: "Game Balancing – Extra Credits",
            url: "https://www.youtube.com/watch?v=e31OSVZF77w",
            duration: 1500,
          },
        ],
        quiz: {
          moduleNumber: 3,
          mcqQuestions: [
            {
              question: "Game loop typically includes:",
              options: ["Update and Render", "Compile and Run", "Design and Test"],
              correctAnswer: 0,
            },
            {
              question: "MDA framework stands for:",
              options: ["Mechanics, Dynamics, Aesthetics", "Models, Data, Assets", "Movement, Design, Audio"],
              correctAnswer: 0,
            },
            {
              question: "Player feedback is important for:",
              options: ["Game feel", "Graphics quality", "File size"],
              correctAnswer: 0,
            },
            {
              question: "Balancing in games refers to:",
              options: ["Audio levels", "Fair difficulty", "Color schemes"],
              correctAnswer: 1,
            },
            {
              question: "Prototyping helps with:",
              options: ["Final graphics", "Testing mechanics early", "Publishing"],
              correctAnswer: 1,
            },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Design a simple scoring system",
              description:
                "Design a simple scoring system in Unity that awards points for collecting items, displays current score on UI, adds combo multiplier for consecutive collections, and saves high score using PlayerPrefs.",
              difficulty: "Medium",
              marks: 15,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
      {
        moduleNumber: 4,
        title: "Advanced Game Development",
        videos: [
          {
            id: "game-advanced-1",
            title: "AI & Pathfinding – Sebastian Lague",
            url: "https://www.youtube.com/watch?v=-L-WgKMFuhE",
            duration: 3600,
          },
          {
            id: "game-advanced-2",
            title: "Procedural Generation – Sebastian Lague",
            url: "https://www.youtube.com/watch?v=wbpMiKiSKm8",
            duration: 5400,
          },
          {
            id: "game-advanced-3",
            title: "Multiplayer Networking – Brackeys",
            url: "https://www.youtube.com/watch?v=UK57qdq_lak",
            duration: 4200,
          },
          {
            id: "game-advanced-4",
            title: "Shader Programming – Freya Holmér",
            url: "https://www.youtube.com/watch?v=kfM-yu0iQBk",
            duration: 3000,
          },
          {
            id: "game-advanced-5",
            title: "Game Optimization – Unity",
            url: "https://www.youtube.com/watch?v=1e5WY2qf600",
            duration: 2400,
          },
        ],
        quiz: {
          moduleNumber: 4,
          mcqQuestions: [
            { question: "A* algorithm is used for:", options: ["Pathfinding", "Graphics", "Audio"], correctAnswer: 0 },
            {
              question: "Procedural generation creates:",
              options: ["Manual assets", "Random/algorithmic content", "Documentation"],
              correctAnswer: 1,
            },
            {
              question: "Photon is used for:",
              options: ["Graphics", "Multiplayer networking", "Audio"],
              correctAnswer: 1,
            },
            { question: "Shaders are programs for:", options: ["AI", "Visual effects", "Physics"], correctAnswer: 1 },
            { question: "Object pooling helps with:", options: ["Performance", "Design", "Sound"], correctAnswer: 0 },
            // Additional questions can be added here if needed
          ],
          codingQuestions: [
            {
              title: "Implement an AI enemy that follows the player",
              description:
                "Implement an AI enemy in Unity that detects player within range, uses pathfinding to navigate to player, attacks when close enough, and returns to patrol when player is out of range.",
              difficulty: "Medium",
              marks: 15,
            },
            // Additional coding question can be added here if needed
          ],
        },
      },
    ],
  },
]
