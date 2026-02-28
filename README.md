# Student Learning Platform

A face-monitoring powered learning management system with real-time monitoring, progress tracking, and interactive quizzes for Web Development, App Development, and Game Development courses.

[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-black?style=for-the-badge&logo=render)](https://render.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Enabled-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)

![Home Page .<img width="1920" height="1080" alt="home-page" src="https://github.com/user-attachments/assets/97418a63-c742-4bf0-b218-09c8ccc84320" /> ]


## Features

- **Interactive Video Learning** - Watch course videos with face-powered attention monitoring
- **Face Detection** - Real-time face detection to ensure student engagement
- **Progress Tracking** - Track video completion, quiz scores, and learning analytics
- **Quiz System** - MCQ and coding questions with anti-cheating measures
- **Study Materials** - Comprehensive study materials for multiple courses
- **Performance Reports** - Detailed analytics and progress reports
- **User Authentication** - Secure login with Firebase Authentication

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components, Bootstrap
- **Backend**: Firebase (Firestore, Authentication)
- **AI/ML**: TensorFlow.js, BlazeFace, face-api.js for face detection
- **Deployment**: Render

## Live Demo

Visit the live platform: **[student-learning-platform-9f9d.onrender.com](https://student-learning-platform-9f9d.onrender.com)**

## Screenshots

### Sign Up
![Sign Up](./img/signup.png)<img width="1920" height="1080" alt="signup" src="https://github.com/user-attachments/assets/7ecc4059-4086-4af0-b7dd-23e1bb45e15b" />


### Sign In
![Sign In](./img/signin.png)<img width="1920" height="1080" alt="signin" src="https://github.com/user-attachments/assets/2c5eb76b-7328-48f4-a035-8638d0421a3b" />


### Dashboard
![Dashboard](./img/dashboard.png)<img width="1920" height="1080" alt="dashboard" src="https://github.com/user-attachments/assets/db5ba84e-2736-4322-abc3-b240f424b7b9" />


### Select Courses
![Select Courses](./img/select-courses.png)<img width="1920" height="1080" alt="select-courses" src="https://github.com/user-attachments/assets/885faa08-c6f3-4458-ab12-116b89d23e73" />


### Video Courses
![Video Courses](./img/video-courses.png)<img width="1906" height="994" alt="video-courses" src="https://github.com/user-attachments/assets/d61218d5-e70d-4238-9f4e-41219ed9c883" />


### Quiz Test
![Quiz Test](./img/quiz-test.png)<img width="842" height="1075" alt="quiz-test" src="https://github.com/user-attachments/assets/30357ec7-471b-44a2-b7b0-710816c68708" />


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

## Deployment

### Deploy to Render

1. **Push your code to GitHub**

2. **Go to** https://dashboard.render.com

3. **Click "New" → "Web Service"**

4. **Connect your GitHub repo** - select `vvraju56/student-learning-platform`

5. **Configure:**
   - Name: `student-learning-platform`
   - Region: Oregon (or your choice)
   - Branch: `main`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

6. **Add Environment Variables:**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

7. **Click "Create Web Service"**

## Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Add authorized domains for your deployment

### Firestore Collections

| Collection | Description |
|------------|-------------|
| `video_progress` | Video completion records |
| `quiz_attempts` | Quiz attempt history |
| `focus_analytics` | Attention monitoring data |
| `users` | User profiles and data |

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
│   ├── ui/               # UI components (shadcn)
│   ├── face-monitoring*  # Face monitoring components
├── hooks/                # Custom React hooks
│   ├── use-face-monitoring*
├── lib/                  # Utility functions & Firebase config
├── data/                 # Course data & study materials
├── services/             # API services
├── styles/               # Global styles
└── img/                  # Project screenshots
```

## Key Features

### Face Detection System

Uses TensorFlow.js with BlazeFace model to detect student presence during video lectures:
- Pauses video when face is not detected
- Tracks attention status
- Monitors tab visibility
- Logs focus analytics

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

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests
```

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
- Render for hosting
- TensorFlow.js for face detection
- shadcn/ui for UI components
- Next.js team for the framework

