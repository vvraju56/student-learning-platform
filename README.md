# Student Learning Platform

An AI-powered learning management system with real-time monitoring, progress tracking, and interactive quizzes for Web Development, App Development, and Game Development courses.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

## Features

- **Interactive Video Learning**: Watch course videos with AI-powered attention monitoring
- **Face Detection**: Real-time face detection to ensure student engagement
- **Progress Tracking**: Track video completion, quiz scores, and learning analytics
- **Quiz System**: MCQ and coding questions with anti-cheating measures
- **Study Materials**: Comprehensive study materials for multiple courses
- **Performance Reports**: Detailed analytics and progress reports
- **User Authentication**: Secure login with Firebase Authentication

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Firebase (Firestore, Realtime Database, Authentication)
- **AI/ML**: TensorFlow.js, BlazeFace for face detection
- **Deployment**: Vercel

## Courses Available

### 1. Web Development
- HTML, CSS, JavaScript fundamentals
- React, Node.js, Express
- Full-stack development patterns
- Responsive design & accessibility

### 2. App Development
- Android (Java & Kotlin)
- Flutter & Dart
- Mobile UI/UX patterns
- App deployment strategies

### 3. Game Development
- Unity (C# scripting)
- Unreal Engine (Blueprints)
- Godot (GDScript)
- Game design fundamentals

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/vvraju56/student-learning-platform.git
cd student-learning-platform
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` file with Firebase credentials
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start development server
```bash
npm run dev
```

5. Open http://localhost:3000

## Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Create Realtime Database
5. Add authorized domains for your deployment

### Firestore Collections

| Collection | Description |
|------------|-------------|
| `video_progress` | Video completion records |
| `quiz_attempts` | Quiz attempt history |
| `focus_analytics` | Attention monitoring data |

## Project Structure

```
student-learning-platform/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── content/           # Study materials & quizzes
│   ├── dashboard/         # Student dashboard
│   ├── lecture/           # Video learning pages
│   ├── profile/           # User profile
│   └── reports/           # Performance reports
├── components/            # React components
│   └── ui/               # UI components (shadcn)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions & Firebase config
├── data/                 # Course data & study materials
├── services/             # API services
└── styles/               # Global styles
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to https://vercel.com
3. Sign in with GitHub
4. Click "Add New Project"
5. Import `student-learning-platform` repository
6. Set Root Directory to `student-learning-platform`
7. Add environment variables from `.env.local`
8. Click "Deploy"

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Key Features Explained

### Face Detection System
Uses TensorFlow.js with BlazeFace model to detect student presence during video lectures. Pauses video when face is not detected.

### Progress Tracking
- Videos watched count
- Quiz scores and pass rates
- Focus/attention scores
- Learning streaks

### Anti-Cheating Measures
- Copy-paste blocking in quizzes
- Tab switch detection
- Face presence verification
- Timed quiz sessions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

**vvraju56**
- GitHub: https://github.com/vvraju56

## Acknowledgments

- Firebase for backend services
- Vercel for hosting
- TensorFlow.js for face detection
- shadcn/ui for UI components
