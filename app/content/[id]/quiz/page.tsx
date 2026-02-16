"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { dummyContent } from "@/data/content"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, BookOpen, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function QuizPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { auth } = { auth } // This will be handled differently

  const content = dummyContent.find((c) => c.id === id)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!content) return

    const savedState = localStorage.getItem(`quiz-${id}`)
    if (savedState) {
      const parsed = JSON.parse(savedState)
      setSelectedAnswers(parsed.answers || {})
      setCurrentQuestionIndex(parsed.currentIndex || 0)
    }
  }, [id, content])

  useEffect(() => {
    if (!content || isSubmitted) return

    localStorage.setItem(
      `quiz-${id}`,
      JSON.stringify({
        answers: selectedAnswers,
        currentIndex: currentQuestionIndex,
      }),
    )
  }, [selectedAnswers, currentQuestionIndex, id, content, isSubmitted])

  if (!content) {
    return <div className="p-8 text-center">Content not found</div>
  }

  const currentQuestion = content.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / content.questions.length) * 100

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: Number.parseInt(value),
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < content.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = async () => {
    setLoading(true)
    let calculatedScore = 0

    content.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        calculatedScore++
      }
    })

    const finalScore = Math.round((calculatedScore / content.questions.length) * 100)
    setScore(finalScore)
    setIsSubmitted(true)

    localStorage.removeItem(`quiz-${id}`)

    try {
      if (auth.currentUser) {
        const resultsRef = collection(db, "quiz_results")
        await addDoc(resultsRef, {
          user_id: auth.currentUser.uid,
          content_id: content.id,
          score: finalScore,
          created_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Failed to save quiz result:", error)
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    const passed = score >= 70
    const correctAnswers = Math.round((score / 100) * content.questions.length)

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {passed ? (
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              ) : (
                <div className="p-4 bg-orange-100 rounded-full">
                  <AlertCircle className="h-12 w-12 text-orange-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold text-primary">{score}%</div>
              <p className="text-muted-foreground">
                You answered {correctAnswers} out of {content.questions.length} questions correctly
              </p>
              <Badge variant={passed ? "default" : "secondary"} className="text-sm px-4 py-1">
                {passed ? "Passed" : "Needs Review"}
              </Badge>
            </div>

            {!passed && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-sm">
                  <strong>Suggestion:</strong> Your score is below 70%. We recommend reviewing the content again before
                  retaking the quiz.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <Button variant="outline" asChild>
                <Link href={`/content/${id}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Review Content
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/content/${id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Link>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Question {currentQuestionIndex + 1} of {content.questions.length}
            </span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <Badge variant="outline" className="w-fit mb-2">
              {content.category}
            </Badge>
            <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedAnswers[currentQuestion.id]?.toString()}
              onValueChange={handleAnswerSelect}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 border-2 p-4 rounded-lg hover:bg-gray-50 transition-all cursor-pointer ${
                    selectedAnswers[currentQuestion.id] === index ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-normal text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion.id] === undefined || loading}
              size="lg"
            >
              {currentQuestionIndex === content.questions.length - 1 ? (
                loading ? (
                  "Submitting..."
                ) : (
                  "Submit Quiz"
                )
              ) : (
                <>
                  Next Question <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
