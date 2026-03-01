import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold">L</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">LearnAI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-white transition-colors">
              Platform
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Enterprise
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Resources
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth?mode=signin" className="text-sm text-gray-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Button asChild className="bg-white text-black hover:bg-gray-200 rounded-full px-6">
              <Link href="/auth?mode=signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-20 animate-in fade-in duration-1000">
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 pb-2">
              The complete platform for modern learning.
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Your personal AI tutor that stops you from losing focus. Securely build habits, track progress, and scale
              your knowledge with LearnAI.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12 text-base font-medium"
              >
                <Link href="/auth?mode=signup">Start Learning</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 h-12 text-base font-medium bg-transparent"
              >
                <Link href="#explore">Explore Content</Link>
              </Button>
            </div>
          </div>

          {/* Explore Content Section */}
          <div id="explore" className="mb-32 scroll-mt-24">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">AI-Based Student Learning & Monitoring Platform</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Unlike normal e-learning systems, this platform monitors real student presence using webcam-based AI face detection, attention and tab-switch monitoring, and session-time enforcement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-bold mb-3">Key Idea</h3>
                <p className="text-gray-400 text-sm">
                  "Online learning should measure real learning, not just video play time." This system ensures no background video playing, no tab switching, and no fake progress.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="text-xl font-bold mb-3">Face Monitoring System</h3>
                <p className="text-gray-400 text-sm">
                  Automatically starts when a course video is played. Monitors camera status, face detection, attention & focus, and tab switching. All AI processing runs locally in the browser using TensorFlow.js.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-xl font-bold mb-3">Privacy & Security</h3>
                <p className="text-gray-400 text-sm">
                  No video recording, no image storage. All face detection runs locally in the browser. Only session data and progress are saved.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-3">Session Time Control</h3>
                <p className="text-gray-400 text-sm">
                  Session time increases only when camera is ON, face is detected, tab is active, and video is playing. This prevents fake learning and background watching.
                </p>
              </div>

              {/* Card 5 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-3">Course Management</h3>
                <p className="text-gray-400 text-sm">
                  Available courses: Web Development, App Development, Game Development. Each course contains 10 structured beginner-level videos with sequential learning flow.
                </p>
              </div>

              {/* Card 6 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-bold mb-3">Quiz System</h3>
                <p className="text-gray-400 text-sm">
                  After completing all videos, unlocks 20 MCQs + 2 coding questions. Quiz access is blocked until course completion to ensure concept understanding.
                </p>
              </div>
            </div>

            {/* Main Description */}
            <div className="mt-12 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-center">Why This Platform?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-cyan-400">✔</div>
                  <p className="text-sm text-gray-300">Encourages focused learning</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">✔</div>
                  <p className="text-sm text-gray-300">Prevents misuse of online education</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">✔</div>
                  <p className="text-sm text-gray-300">Improves student discipline</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">✔</div>
                  <p className="text-sm text-gray-300">Real-time monitoring & feedback</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 border-t border-white/10 pt-16">
            <div className="space-y-2">
              <h3 className="text-4xl font-bold">20 mins</h3>
              <p className="text-gray-400">saved per study session.</p>
              <p className="font-semibold mt-4">HARVARD</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold">98% faster</h3>
              <p className="text-gray-400">knowledge retention.</p>
              <p className="font-semibold mt-4">MIT</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold">300% increase</h3>
              <p className="text-gray-400">in focus time.</p>
              <p className="font-semibold mt-4">STANFORD</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold">6x faster</h3>
              <p className="text-gray-400">to master new skills.</p>
              <p className="font-semibold mt-4">YALE</p>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
            <div className="space-y-6">
              <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Real-time Monitoring
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Faster feedback.
                <br />
                Better habits.
              </h2>
              <p className="text-lg text-gray-400 max-w-md">
                The platform for rapid improvement. Let our AI focus on your posture and attention instead of managing
                distractions manually.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-black border border-white/10 rounded-lg p-8 h-full flex flex-col justify-end min-h-[400px]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="text-sm font-mono text-gray-400">Live Alert System</div>
                  </div>
                  <div className="space-y-2 font-mono text-sm text-green-400">
                    <p>{">"} Initializing webcam stream...</p>
                    <p>{">"} Loading TensorFlow model...</p>
                    <p>{">"} Face detection active</p>
                    <p className="text-blue-400">{">"} Monitoring attention levels: 98%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlight */}
          <div className="border-t border-white/10 pt-32 mb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-8 aspect-video flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                  <div className="relative bg-black/50 backdrop-blur border border-white/10 p-6 rounded-lg w-3/4">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                      <div className="font-semibold">Performance Report</div>
                      <div className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Excellent</div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-white rounded-full"></div>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-white/50 rounded-full"></div>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-5/6 bg-white/80 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 space-y-6">
                <h2 className="text-4xl font-bold">Make learning seamless.</h2>
                <p className="text-lg text-gray-400">
                  Tools for students and teachers to share feedback and iterate faster. Track your progress with
                  detailed analytics and insights.
                </p>
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">1</div>
                    Real-time posture correction
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">2</div>
                    Attention span analytics
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">3</div>
                    Personalized study recommendations
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center py-32 border-t border-white/10">
            <h2 className="text-5xl font-bold mb-8">Ready to transform your learning?</h2>
            <p className="text-xl text-gray-400 mb-10">Join thousands of students building better habits today.</p>
            <div className="flex items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12">
                <Link href="/auth?mode=signup">Get Started</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 h-12 bg-transparent"
              >
                <Link href="/auth?mode=signin">Log In</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <span className="text-black text-xs font-bold">L</span>
              </div>
              <span className="font-semibold tracking-tight">LearnAI</span>
            </div>
            <div className="text-sm text-gray-500">© 2025 LearnAI Inc. All rights reserved.</div>
          </div>
        </footer>
      </main>
    </div>
  )
}
