"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  BarChart3,
  Settings,
  Lightbulb,
  Zap,
  Brain,
  MessageSquare,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Search,
} from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  formData?: any
}

interface AICopilotProps {
  user: any
}

export function AICopilot({ user }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: `Hello ${user.username}! I'm your AI Copilot for Pilana App. I can help you with:

• **Form Creation**: Generate forms from descriptions
• **Optimization**: Improve existing forms for better UX
• **Analytics**: Analyze form performance and user behavior
• **Best Practices**: Suggest improvements and industry standards
• **Troubleshooting**: Help solve form design challenges

What would you like to work on today?`,
      timestamp: new Date(),
      suggestions: [
        "Create a customer feedback form",
        "Optimize my existing forms",
        "Analyze form completion rates",
        "Suggest best practices for mobile forms",
      ],
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeFeature, setActiveFeature] = useState<"chat" | "generator" | "analyzer" | "optimizer">("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: user.id,
          role: user.role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      const aiResponse: Message = {
        id: data.id || Date.now().toString(),
        type: "assistant",
        content: data.content,
        timestamp: new Date(),
        suggestions: data.suggestions,
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error("Error getting AI response:", error)

      // Fallback response in case of error
      const errorResponse: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Copilot</h2>
            <p className="text-gray-600">Your intelligent form design assistant</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Admin Only
        </Badge>
      </div>

      <Tabs value={activeFeature} onValueChange={(value) => setActiveFeature(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="generator" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Generator</span>
          </TabsTrigger>
          <TabsTrigger value="analyzer" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analyzer</span>
          </TabsTrigger>
          <TabsTrigger value="optimizer" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Optimizer</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span>AI Assistant</span>
                  </CardTitle>
                  <CardDescription>Ask me anything about form design and optimization</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900 border"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            {message.suggestions && (
                              <div className="mt-3 space-y-2">
                                <div className="text-sm font-medium text-gray-600">Suggestions:</div>
                                <div className="flex flex-wrap gap-2">
                                  {message.suggestions.map((suggestion, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="text-xs"
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg p-3 border">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about form design, optimization, or best practices..."
                        className="flex-1 min-h-[60px] resize-none"
                        rows={2}
                      />
                      <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading} className="px-6">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick("Create a customer feedback form")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Form
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick("Analyze my form performance")}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analyze Forms
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick("Optimize my forms for mobile")}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize Forms
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick("Show me best practices for form design")}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Best Practices
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Forms optimized: 8/12</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>Avg completion: 73%</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>Mobile users: 68%</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>4 forms need attention</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="generator" className="mt-6">
          <FormGeneratorTab user={user} />
        </TabsContent>

        <TabsContent value="analyzer" className="mt-6">
          <FormAnalyzerTab user={user} />
        </TabsContent>

        <TabsContent value="optimizer" className="mt-6">
          <FormOptimizerTab />
        </TabsContent>
      </Tabs>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-lg p-4 border">
          <h3 className="font-medium mb-2">AI Copilot</h3>
          <p className="text-sm text-gray-600 mb-4">How can I help you today?</p>
          <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      )}
    </div>
  )
}

function FormGeneratorTab({ user }: { user: any }) {
  const [formType, setFormType] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedForm, setGeneratedForm] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const formTemplates = [
    {
      id: "feedback",
      name: "Customer Feedback",
      description: "Collect customer satisfaction and feedback",
      icon: MessageSquare,
    },
    {
      id: "registration",
      name: "Event Registration",
      description: "Register attendees for events",
      icon: Users,
    },
    {
      id: "survey",
      name: "Research Survey",
      description: "Conduct market or academic research",
      icon: BarChart3,
    },
    {
      id: "contact",
      name: "Contact Form",
      description: "Simple contact and inquiry form",
      icon: FileText,
    },
  ]

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType,
          description: formDescription,
          userId: user.id,
          role: user.role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate form")
      }

      const data = await response.json()
      setGeneratedForm(data)
    } catch (error) {
      console.error("Error generating form:", error)
      setError("Failed to generate form. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateForm = () => {
    if (!generatedForm) return

    try {
      // Add created by and other metadata
      const formToSave = {
        ...generatedForm,
        createdBy: user.username,
        published: false,
      }

      // Save to localStorage
      const existingForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
      existingForms.push(formToSave)
      localStorage.setItem("pilana_forms", JSON.stringify(existingForms))

      alert(`Form "${formToSave.name}" created successfully!`)

      // Reset the form generator
      setFormType("")
      setFormDescription("")
      setGeneratedForm(null)
    } catch (error) {
      console.error("Error saving form:", error)
      alert("Failed to save form. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>AI Form Generator</span>
          </CardTitle>
          <CardDescription>Describe your form and let AI create it for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Choose a template or describe custom form:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {formTemplates.map((template) => {
                const Icon = template.icon
                return (
                  <Button
                    key={template.id}
                    variant={formType === template.name ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col items-center space-y-2"
                    onClick={() => setFormType(template.name)}
                  >
                    <Icon className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium text-xs">{template.name}</div>
                      <div className="text-xs opacity-70">{template.description}</div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Describe your form requirements:</label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="E.g., I need a form to collect customer feedback with rating scales, comments, and contact information for follow-up..."
              rows={4}
            />
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}

          <Button
            onClick={handleGenerate}
            disabled={(!formType && !formDescription) || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Form...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Form with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedForm && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Form Preview</CardTitle>
            <CardDescription>Review and customize your AI-generated form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{generatedForm.name}</h3>
                <p className="text-sm text-gray-600">{generatedForm.description}</p>
              </div>
              <div className="space-y-2">
                {generatedForm.fields.map((field: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{field.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {field.type}
                      </Badge>
                      {field.required && (
                        <Badge variant="destructive" className="ml-1 text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Button className="flex-1" onClick={handleCreateForm}>
                  <Download className="w-4 h-4 mr-2" />
                  Create This Form
                </Button>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FormAnalyzerTab({ user }: { user: any }) {
  const [selectedForm, setSelectedForm] = useState<string>("")
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forms, setForms] = useState<any[]>([])

  useEffect(() => {
    // Load forms from localStorage
    const savedForms = JSON.parse(localStorage.getItem("pilana_forms") || "[]")
    setForms(savedForms)
  }, [])

  const handleAnalyze = async () => {
    if (!selectedForm) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/analyze-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId: selectedForm,
          userId: user.id,
          role: user.role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze form")
      }

      const data = await response.json()
      setAnalysisResults(data)
    } catch (error) {
      console.error("Error analyzing form:", error)
      setError("Failed to analyze form. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Form Performance Analyzer</span>
          </CardTitle>
          <CardDescription>Get AI-powered insights about your form performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select form to analyze:</label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Choose a form...</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name} ({form.fields?.length || 0} fields)
                </option>
              ))}
            </select>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}

          <Button onClick={handleAnalyze} disabled={!selectedForm || isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Form...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Analyze Form Performance
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-blue-600">{analysisResults.score}/100</div>
              <div>
                <div className="font-medium">Overall Performance Score</div>
                <div className="text-sm text-gray-600">Based on UX best practices</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Key Insights:</h4>
              {analysisResults.insights.map((insight: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  {insight.type === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {insight.type === "warning" && <AlertCircle className="w-4 h-4 text-orange-500" />}
                  {insight.type === "info" && <Lightbulb className="w-4 h-4 text-blue-500" />}
                  <span className="text-sm">{insight.message}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">AI Recommendations:</h4>
              <ul className="space-y-1">
                {analysisResults.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm flex items-center space-x-2">
                    <Zap className="w-3 h-3 text-purple-500" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {analysisResults.metrics && (
              <div className="space-y-2 mt-4 pt-4 border-t">
                <h4 className="font-medium">Performance Metrics:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm text-gray-600">Completion Rate</div>
                    <div className="text-xl font-bold text-blue-700">{analysisResults.metrics.completionRate}%</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm text-gray-600">Avg. Time to Complete</div>
                    <div className="text-xl font-bold text-blue-700">
                      {analysisResults.metrics.averageTimeToComplete}s
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm text-gray-600">Mobile Usage</div>
                    <div className="text-xl font-bold text-blue-700">{analysisResults.metrics.mobileUsage}%</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm text-gray-600">Drop-off Fields</div>
                    <div className="text-sm font-medium text-blue-700">
                      {analysisResults.metrics.dropOffFields.join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FormOptimizerTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-orange-600" />
            <span>Smart Form Optimizer</span>
          </CardTitle>
          <CardDescription>Automatically improve your forms with AI suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="w-12 h-12 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              Advanced AI optimization features are being developed. This will include:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 max-w-md mx-auto">
              <li>• Automatic field reordering for better flow</li>
              <li>• Smart conditional logic suggestions</li>
              <li>• Mobile optimization recommendations</li>
              <li>• A/B testing setup and analysis</li>
              <li>• Performance monitoring and alerts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AiCopilot() {
  return (
    <div className="fixed bottom-4 right-4">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>AI Copilot</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">AI assistant is ready to help!</p>
        </CardContent>
      </Card>
    </div>
  )
}
