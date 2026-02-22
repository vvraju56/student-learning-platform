"use client"

import React, { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { signupWithGmail } from "@/app/actions/auth"

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")
  const [isToggled, setIsToggled] = useState(mode === "signup")
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError(null)

    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password)
      router.push("/dashboard")
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setLoginError("Invalid email or password")
      } else if (err.code === "auth/user-not-found") {
        setLoginError("No account found with this email")
      } else if (err.code === "auth/wrong-password") {
        setLoginError("Incorrect password")
      } else {
        setLoginError("Something went wrong. Please try again.")
      }
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRegisterError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        const result = await signupWithGmail(formData)
        if (result?.error) {
          setRegisterError(result.error)
        } else if (result?.success) {
          setSuccess(true)
          setTimeout(() => {
            setIsToggled(false)
            setSuccess(false)
          }, 2000)
        }
      } catch (err) {
        setRegisterError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }

        html {
          scroll-behavior: auto !important;
        }

        body {
          min-height: 100vh;
          width: 100vw;
          background: #1a1a2e;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }

        .auth-wrapper {
          position: relative;
          width: 100%;
          max-width: 900px;
          height: 550px;
          border: 2px solid #00d4ff;
          border-radius: 20px;
          box-shadow: 0 0 50px rgba(0, 212, 255, 0.4);
          overflow: hidden;
        }

        .credentials-panel {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 40px;
          transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .signin-panel {
          left: 0;
          background: #1a1a2e;
          z-index: 2;
        }

        .signup-panel {
          right: 0;
          background: #1a1a2e;
          z-index: 1;
          opacity: 0;
          pointer-events: none;
        }

        .auth-wrapper.toggled .signin-panel {
          transform: translateX(100%);
          opacity: 0;
          z-index: 1;
        }

        .auth-wrapper.toggled .signup-panel {
          transform: translateX(0);
          opacity: 1;
          z-index: 2;
          pointer-events: auto;
        }

        .credentials-panel h2 {
          color: #fff;
          font-size: 36px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 3px;
        }

        .field-wrapper {
          position: relative;
          width: 100%;
          height: 55px;
          margin-bottom: 25px;
        }

        .field-wrapper input {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(255, 255, 255, 0.4);
          outline: none;
          color: #fff;
          font-size: 16px;
          font-weight: 500;
          padding-right: 40px;
          transition: border-color 0.3s;
        }

        .field-wrapper input:focus,
        .field-wrapper input:valid {
          border-bottom-color: #00d4ff;
        }

        .field-wrapper label {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.6);
          font-size: 16px;
          transition: all 0.3s;
          pointer-events: none;
        }

        .field-wrapper input:focus ~ label,
        .field-wrapper input:valid ~ label {
          top: -10px;
          font-size: 12px;
          color: #00d4ff;
        }

        .field-wrapper .toggle-pass {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .field-wrapper .toggle-pass:hover {
          color: #00d4ff;
        }

        .submit-button {
          width: 100%;
          height: 50px;
          background: transparent;
          border: 2px solid #00d4ff;
          border-radius: 30px;
          color: #fff;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .submit-button:hover::before {
          left: 100%;
        }

        .submit-button:hover {
          background: #00d4ff;
          color: #1a1a2e;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .switch-link {
          text-align: center;
          margin-top: 20px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .switch-link a {
          color: #00d4ff;
          text-decoration: none;
          font-weight: 600;
          margin-left: 5px;
          cursor: pointer;
        }

        .switch-link a:hover {
          text-decoration: underline;
        }

        .welcome-panel {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 50px;
          transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          z-index: 3;
        }

        .welcome-panel h2 {
          color: #fff;
          font-size: 48px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 20px;
          text-transform: uppercase;
        }

        .welcome-panel p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
        }

        .welcome-signin {
          right: 0;
          background: linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%);
        }

        .tom-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .welcome-signup {
          left: 0;
          background: linear-gradient(135deg, #00d4ff 0%, #0088aa 100%);
        }

        .auth-wrapper.toggled .welcome-signin {
          transform: translateX(100%);
        }

        .auth-wrapper.toggled .welcome-signup {
          transform: translateX(0);
        }

        .auth-wrapper:not(.toggled) .welcome-signup {
          transform: translateX(-100%);
        }

        .auth-wrapper:not(.toggled) .welcome-signin {
          transform: translateX(0);
        }

        .error-msg {
          color: #ff6b6b;
          font-size: 12px;
          text-align: center;
          margin-bottom: 10px;
        }

        .success-msg {
          color: #00ff88;
          font-size: 13px;
          text-align: center;
          margin-bottom: 10px;
        }

        .hint {
          color: #666;
          font-size: 11px;
          text-align: center;
          margin-top: 5px;
        }

        .footer {
          position: fixed;
          bottom: 20px;
          left: 0;
          right: 0;
          text-align: center;
          color: #666;
          font-size: 14px;
        }

        .footer a {
          color: #00d4ff;
          text-decoration: none;
          font-weight: 600;
        }

        .footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .auth-wrapper {
            height: auto;
            min-height: 500px;
            max-width: 400px;
          }

          .welcome-panel {
            display: none;
          }

          .credentials-panel {
            width: 100%;
            position: relative;
            padding: 30px;
          }

          .signin-panel {
            display: block;
          }

          .signup-panel {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            transform: translateX(100%);
          }

          .auth-wrapper.toggled .signin-panel {
            transform: translateX(-100%);
          }

          .auth-wrapper.toggled .signup-panel {
            transform: translateX(0);
          }
        }

        @media (max-width: 480px) {
          .auth-wrapper {
            max-width: 100%;
            margin: 0 10px;
          }

          .credentials-panel {
            padding: 25px 20px;
          }

          .credentials-panel h2 {
            font-size: 24px;
          }

          .field-wrapper input {
            font-size: 14px;
          }

          .field-wrapper label {
            font-size: 14px;
          }
        }
      `}</style>

      <div className={`auth-wrapper ${isToggled ? "toggled" : ""}`}>
        {/* Sign In Panel */}
        <div className="credentials-panel signin-panel">
          <h2>Sign In</h2>
          <form onSubmit={handleLogin}>
            {loginError && <p className="error-msg">{loginError}</p>}
            
            <div className="field-wrapper">
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <label>Email Address</label>
            </div>

            <div className="field-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <label>Password</label>
              <button 
                type="button" 
                className="toggle-pass"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="switch-link">
            Don't have an account? 
            <a onClick={() => setIsToggled(true)}>Sign Up</a>
          </p>
        </div>

        {/* Sign Up Panel */}
        <div className="credentials-panel signup-panel">
          <h2>Sign Up</h2>
          <form onSubmit={handleRegister}>
            {registerError && <p className="error-msg">{registerError}</p>}
            {success && <p className="success-msg">✓ Account created! Please sign in.</p>}

            <div className="field-wrapper">
              <input
                type="text"
                name="username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
              />
              <label>Username</label>
            </div>

            <div className="field-wrapper">
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
              <label>Email Address</label>
            </div>

            <div className="field-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                minLength={8}
              />
              <label>Password</label>
              <button 
                type="button" 
                className="toggle-pass"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="hint">Use 8+ characters with special character (!@#$%^&*)</p>

            <button type="submit" className="submit-button" disabled={isPending}>
              {isPending ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p className="switch-link">
            Already have an account? 
            <a onClick={() => setIsToggled(false)}>Sign In</a>
          </p>
        </div>

        {/* Welcome Panels */}
        <div className="welcome-panel welcome-signin">
          <h2>Welcome<br/>Back!</h2>
          <p>Continue your learning journey</p>
        </div>

        <div className="welcome-panel welcome-signup">
          <h2>Join<br/>Us!</h2>
          <p>Start your learning adventure</p>
        </div>
      </div>

      <div className="footer">
        <a href="#">MEGA Learning Platform</a> - Empowering Education Through Technology
      </div>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  )
}
