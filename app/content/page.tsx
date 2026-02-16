"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { content as studyMaterials } from "@/data/study-materials"
import { Search, BookOpen, ChevronRight, CheckCircle2, FileText } from "lucide-react"

export default function ContentListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)

  const allCategories = Array.from(new Set(studyMaterials.flatMap((material) => material.topics))).sort()

  const filteredContent = studyMaterials.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.topics.some((topic) => topic.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = !selectedCategory || item.topics.includes(selectedCategory)

    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Study Materials</h1>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics and materials..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </Button>
          {allCategories.slice(0, 15).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Browse {studyMaterials.length} comprehensive study materials covering Web Development, Mobile App Development,
          and Game Development
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((item) => (
          <Card key={item.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
              </div>
              <CardDescription className="text-sm">{item.summary}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {item.key_points && item.key_points.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">Key Points:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {item.key_points.slice(0, 2).map((point, i) => (
                      <li key={i} className="line-clamp-1">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-1 mt-3">
                {item.topics.slice(0, 3).map((topic, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                    {topic}
                  </span>
                ))}
                {item.topics.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    +{item.topics.length - 3}
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button className="flex-1" size="sm" onClick={() => setSelectedMaterial(item)}>
                Learn More <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        {filteredContent.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No materials found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selectedMaterial && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedMaterial.title}</DialogTitle>
                <DialogDescription className="text-base">{selectedMaterial.summary}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-primary">Detailed Article</h3>
                  <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                      {selectedMaterial.content}
                    </pre>
                  </div>
                </div>

                {selectedMaterial.key_points && selectedMaterial.key_points.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Key Learning Points</h3>
                    <ul className="space-y-2">
                      {selectedMaterial.key_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedMaterial.topics && selectedMaterial.topics.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Topics Covered</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMaterial.topics.map((topic, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMaterial.practice && selectedMaterial.practice.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-amber-900">Practice Exercises</h3>
                    <p className="text-sm text-amber-800 mb-3 font-medium">
                      ⚠️ Important: You must TYPE your answers manually. Copy-paste is disabled for learning purposes.
                    </p>
                    <ol className="list-decimal list-inside space-y-3">
                      {selectedMaterial.practice.map((exercise, i) => (
                        <li key={i} className="text-sm text-gray-700 leading-relaxed">
                          {exercise}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
