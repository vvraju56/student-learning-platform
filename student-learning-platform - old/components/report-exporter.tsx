"use client"

import { useState } from 'react'
import { Download, FileText, Calendar, TrendingUp, Activity, AlertCircle, Settings, CheckCircle } from 'lucide-react'

interface TestResult {
  testName: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  passed: boolean
  date: string
  category?: string
}

interface TestResultAnalysis {
  totalTests: number
  passedTests: number
  failedTests: number
  averageScore: number
  highestScore: number
  lowestScore: number
  averageTimeSpent: number
  passRate: number
  categoryBreakdown?: { category: string; avgScore: number; count: number }[]
  trendAnalysis?: { improving: boolean; trendPercentage: number }
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

interface ReportData {
  dateRange: string
  summary: any
  metrics: any[]
  charts: any
  alerts: any
  recommendations: string[]
  testResults?: TestResult[]
  testResultAnalysis?: TestResultAnalysis
}

interface ReportExporterProps {
  data: ReportData
  onExport?: (format: string, data: any) => void
}

export function ReportExporter({ data, onExport }: ReportExporterProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf' | 'html'>('json')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeRawData, setIncludeRawData] = useState(true)
  const [includeRecommendations, setIncludeRecommendations] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const exportToJSON = () => {
    const exportData = {
      ...data,
      exportOptions: {
        includeCharts,
        includeRawData,
        includeRecommendations
      },
      exportedAt: new Date().toISOString(),
      testResults: data.testResults || [],
      testResultAnalysis: data.testResultAnalysis || null
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    downloadFile(blob, `learning-analytics-report-${new Date().toISOString().split('T')[0]}.json`)
  }

  const exportToCSV = () => {
    const csvData = []
    
    csvData.push(['Report Section', 'Metric', 'Value', 'Unit'])
    
    if (data.summary) {
      Object.entries(data.summary).forEach(([key, value]) => {
        csvData.push(['Summary', key, String(value), ''])
      })
    }
    
    if (data.metrics && includeRawData) {
      data.metrics.forEach((metric: any) => {
        csvData.push(['Metrics', metric.label || metric.name, String(metric.value), metric.unit || ''])
      })
    }
    
    if (data.testResults && includeRawData) {
      csvData.push([])
      csvData.push(['=== TEST RESULTS ==='])
      csvData.push(['Test Name', 'Score', 'Total Questions', 'Correct Answers', 'Time Spent (min)', 'Passed', 'Date', 'Category'])
      data.testResults.forEach((test: TestResult) => {
        csvData.push([
          test.testName,
          String(test.score),
          String(test.totalQuestions),
          String(test.correctAnswers),
          String(test.timeSpent),
          test.passed ? 'Yes' : 'No',
          test.date,
          test.category || ''
        ])
      })
      
      if (data.testResultAnalysis) {
        csvData.push([])
        csvData.push(['=== TEST RESULT ANALYSIS ==='])
        const analysis = data.testResultAnalysis
        csvData.push(['Analysis', 'Total Tests', String(analysis.totalTests), ''])
        csvData.push(['Analysis', 'Passed Tests', String(analysis.passedTests), ''])
        csvData.push(['Analysis', 'Failed Tests', String(analysis.failedTests), ''])
        csvData.push(['Analysis', 'Average Score', String(analysis.averageScore.toFixed(2)), '%'])
        csvData.push(['Analysis', 'Highest Score', String(analysis.highestScore), '%'])
        csvData.push(['Analysis', 'Lowest Score', String(analysis.lowestScore), '%'])
        csvData.push(['Analysis', 'Pass Rate', String(analysis.passRate.toFixed(2)), '%'])
        csvData.push(['Analysis', 'Average Time Spent', String(analysis.averageTimeSpent.toFixed(2)), 'min'])
        if (analysis.trendAnalysis) {
          csvData.push(['Analysis', 'Trend', analysis.trendAnalysis.improving ? 'Improving' : 'Declining', ''])
          csvData.push(['Analysis', 'Trend Percentage', String(analysis.trendAnalysis.trendPercentage.toFixed(2)), '%'])
        }
      }
    }
    
    const csvString = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    downloadFile(blob, `learning-analytics-report-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportToHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning Analytics Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .section { background: white; margin-bottom: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric-card { background: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .metric-label { font-size: 14px; color: #6b7280; }
        .alert { padding: 10px; border-radius: 4px; margin: 5px 0; }
        .alert.warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .alert.info { background: #dbeafe; border-left: 4px solid #3b82f6; }
        .recommendation { background: #f0fdf4; border-left: 4px solid #10b981; padding: 10px; margin: 5px 0; }
        .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
        h1 { margin: 0; font-size: 28px; }
        h2 { color: #1f2937; margin-bottom: 15px; }
        h3 { color: #374151; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Learning Analytics Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} for period: ${data.dateRange}</p>
        </div>
        
        <div class="section">
            <h2>Executive Summary</h2>
            <div class="metric-grid">
                ${data.summary ? Object.entries(data.summary).map(([key, value]) => `
                    <div class="metric-card">
                        <div class="metric-value">${value}</div>
                        <div class="metric-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                    </div>
                `).join('') : '<p>No summary data available</p>'}
            </div>
        </div>
        
        ${includeRawData && data.metrics ? `
        <div class="section">
            <h2>Detailed Metrics</h2>
            <div class="metric-grid">
                ${data.metrics.map((metric: any) => `
                    <div class="metric-card">
                        <div class="metric-value">${metric.value}${metric.unit || ''}</div>
                        <div class="metric-label">${metric.label || metric.name}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${data.alerts && data.alerts.length > 0 ? `
        <div class="section">
            <h2>Alerts & Insights</h2>
            ${data.alerts.map((alert: any) => `
                <div class="alert ${alert.type || 'info'}">
                    <strong>${alert.title || 'Alert'}</strong>: ${alert.message || alert.description}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${includeRecommendations && data.recommendations && data.recommendations.length > 0 ? `
        <div class="section">
            <h2>Recommendations</h2>
            ${data.recommendations.map((rec: string) => `
                <div class="recommendation">
                    ${rec}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${includeRawData && data.testResults && data.testResults.length > 0 ? `
        <div class="section">
            <h2>Test Results</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${data.testResultAnalysis?.totalTests || data.testResults.length}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card" style="border-left-color: #10b981;">
                    <div class="metric-value">${data.testResultAnalysis?.passedTests || data.testResults.filter(t => t.passed).length}</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric-card" style="border-left-color: #ef4444;">
                    <div class="metric-value">${data.testResultAnalysis?.failedTests || data.testResults.filter(t => !t.passed).length}</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric-card" style="border-left-color: #8b5cf6;">
                    <div class="metric-value">${(data.testResultAnalysis?.averageScore || (data.testResults.reduce((acc, t) => acc + t.score, 0) / data.testResults.length)).toFixed(1)}%</div>
                    <div class="metric-label">Average Score</div>
                </div>
            </div>
            
            <h3 style="margin-top: 20px;">Test Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Test Name</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Score</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Questions</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Time</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Status</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.testResults.map((test: TestResult) => `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px;">${test.testName}</td>
                        <td style="padding: 12px; text-align: center; font-weight: bold; color: ${test.passed ? '#10b981' : '#ef4444'};">${test.score}%</td>
                        <td style="padding: 12px; text-align: center;">${test.correctAnswers}/${test.totalQuestions}</td>
                        <td style="padding: 12px; text-align: center;">${test.timeSpent} min</td>
                        <td style="padding: 12px; text-align: center;">
                            <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${test.passed ? '#d1fae5' : '#fee2e2'}; color: ${test.passed ? '#065f46' : '#991b1b'};">
                                ${test.passed ? 'PASSED' : 'FAILED'}
                            </span>
                        </td>
                        <td style="padding: 12px; text-align: center;">${test.date}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
        
        ${data.testResultAnalysis ? `
        <div class="section">
            <h2>Test Results Analysis</h2>
            
            <h3>Performance Overview</h3>
            <div class="metric-grid">
                <div class="metric-card" style="border-left-color: #3b82f6;">
                    <div class="metric-value">${data.testResultAnalysis.highestScore}%</div>
                    <div class="metric-label">Highest Score</div>
                </div>
                <div class="metric-card" style="border-left-color: #f59e0b;">
                    <div class="metric-value">${data.testResultAnalysis.lowestScore}%</div>
                    <div class="metric-label">Lowest Score</div>
                </div>
                <div class="metric-card" style="border-left-color: #10b981;">
                    <div class="metric-value">${data.testResultAnalysis.passRate.toFixed(1)}%</div>
                    <div class="metric-label">Pass Rate</div>
                </div>
                <div class="metric-card" style="border-left-color: #8b5cf6;">
                    <div class="metric-value">${data.testResultAnalysis.averageTimeSpent.toFixed(0)} min</div>
                    <div class="metric-label">Avg Time Spent</div>
                </div>
            </div>
            
            ${data.testResultAnalysis.trendAnalysis ? `
            <h3 style="margin-top: 20px;">Trend Analysis</h3>
            <div class="alert ${data.testResultAnalysis.trendAnalysis.improving ? 'info' : 'warning'}">
                <strong>${data.testResultAnalysis.trendAnalysis.improving ? '📈 Improving' : '📉 Declining'}</strong>: 
                Your test scores are ${data.testResultAnalysis.trendAnalysis.improving ? 'improving' : 'declining'} by ${Math.abs(data.testResultAnalysis.trendAnalysis.trendPercentage).toFixed(1)}% over the selected period.
            </div>
            ` : ''}
            
            ${data.testResultAnalysis.categoryBreakdown && data.testResultAnalysis.categoryBreakdown.length > 0 ? `
            <h3 style="margin-top: 20px;">Performance by Category</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Category</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Tests Taken</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Average Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.testResultAnalysis.categoryBreakdown.map((cat: any) => `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px;">${cat.category}</td>
                        <td style="padding: 12px; text-align: center;">${cat.count}</td>
                        <td style="padding: 12px; text-align: center; font-weight: bold; color: ${cat.avgScore >= 70 ? '#10b981' : cat.avgScore >= 50 ? '#f59e0b' : '#ef4444'};">${cat.avgScore.toFixed(1)}%</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : ''}
            
            ${data.testResultAnalysis.strengths && data.testResultAnalysis.strengths.length > 0 ? `
            <h3 style="margin-top: 20px;">💪 Strengths</h3>
            ${data.testResultAnalysis.strengths.map((strength: string) => `
                <div class="recommendation" style="background: #dbeafe; border-left-color: #3b82f6;">
                    ${strength}
                </div>
            `).join('')}
            ` : ''}
            
            ${data.testResultAnalysis.weaknesses && data.testResultAnalysis.weaknesses.length > 0 ? `
            <h3 style="margin-top: 20px;">⚠️ Areas for Improvement</h3>
            ${data.testResultAnalysis.weaknesses.map((weakness: string) => `
                <div class="alert warning">
                    ${weakness}
                </div>
            `).join('')}
            ` : ''}
            
            ${data.testResultAnalysis.recommendations && data.testResultAnalysis.recommendations.length > 0 ? `
            <h3 style="margin-top: 20px;">📚 Study Recommendations</h3>
            ${data.testResultAnalysis.recommendations.map((rec: string) => `
                <div class="recommendation">
                    ${rec}
                </div>
            `).join('')}
            ` : ''}
        </div>
        ` : ''}
        
        <div class="footer">
            <p>This report was generated automatically by the Learning Analytics Platform</p>
            <p>Data accuracy and completeness are subject to the selected parameters</p>
        </div>
    </div>
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    downloadFile(blob, `learning-analytics-report-${new Date().toISOString().split('T')[0]}.html`)
  }

  const exportToPDF = async () => {
    const pdfContent = `
Learning Analytics Report
========================

Generated: ${new Date().toLocaleDateString()}
Period: ${data.dateRange}

EXECUTIVE SUMMARY
----------------
${data.summary ? Object.entries(data.summary).map(([key, value]) => `${key}: ${value}`).join('\n') : 'No summary data available'}

${includeRawData && data.metrics ? `
DETAILED METRICS
---------------
${data.metrics.map((metric: any) => `${metric.label || metric.name}: ${metric.value}${metric.unit || ''}`).join('\n')}
` : ''}

${data.alerts && data.alerts.length > 0 ? `
ALERTS & INSIGHTS
----------------
${data.alerts.map((alert: any) => `${alert.title || 'Alert'}: ${alert.message || alert.description}`).join('\n')}
` : ''}

${includeRawData && data.testResults && data.testResults.length > 0 ? `
TEST RESULTS
-----------
Total Tests: ${data.testResultAnalysis?.totalTests || data.testResults.length}
Passed: ${data.testResultAnalysis?.passedTests || data.testResults.filter(t => t.passed).length}
Failed: ${data.testResultAnalysis?.failedTests || data.testResults.filter(t => !t.passed).length}
Average Score: ${(data.testResultAnalysis?.averageScore || (data.testResults.reduce((acc, t) => acc + t.score, 0) / data.testResults.length)).toFixed(1)}%

Test Details:
${data.testResults.map((test: TestResult) => 
  `- ${test.testName}: ${test.score}% (${test.passed ? 'PASSED' : 'FAILED'}) - ${test.correctAnswers}/${test.totalQuestions} correct - ${test.timeSpent}min - ${test.date}`
).join('\n')}
` : ''}

${data.testResultAnalysis ? `
TEST RESULTS ANALYSIS
--------------------
Highest Score: ${data.testResultAnalysis.highestScore}%
Lowest Score: ${data.testResultAnalysis.lowestScore}%
Pass Rate: ${data.testResultAnalysis.passRate.toFixed(1)}%
Average Time Spent: ${data.testResultAnalysis.averageTimeSpent.toFixed(0)} minutes

${data.testResultAnalysis.trendAnalysis ? `
Trend: ${data.testResultAnalysis.trendAnalysis.improving ? 'Improving' : 'Declining'} (${data.testResultAnalysis.trendAnalysis.trendPercentage.toFixed(1)}%)
` : ''}

${data.testResultAnalysis.strengths && data.testResultAnalysis.strengths.length > 0 ? `
Strengths:
${data.testResultAnalysis.strengths.map((s: string) => `  • ${s}`).join('\n')}
` : ''}

${data.testResultAnalysis.weaknesses && data.testResultAnalysis.weaknesses.length > 0 ? `
Areas for Improvement:
${data.testResultAnalysis.weaknesses.map((w: string) => `  • ${w}`).join('\n')}
` : ''}

${data.testResultAnalysis.recommendations && data.testResultAnalysis.recommendations.length > 0 ? `
Study Recommendations:
${data.testResultAnalysis.recommendations.map((r: string) => `  • ${r}`).join('\n')}
` : ''}
` : ''}

${includeRecommendations && data.recommendations && data.recommendations.length > 0 ? `
RECOMMENDATIONS
---------------
${data.recommendations.join('\n')}
` : ''}

---
Report generated by Learning Analytics Platform
    `
    
    const blob = new Blob([pdfContent], { type: 'text/plain' })
    downloadFile(blob, `learning-analytics-report-${new Date().toISOString().split('T')[0]}.txt`)
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      switch (exportFormat) {
        case 'json':
          exportToJSON()
          break
        case 'csv':
          exportToCSV()
          break
        case 'html':
          exportToHTML()
          break
        case 'pdf':
          await exportToPDF()
          break
      }
      
      onExport?.(exportFormat, data)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setTimeout(() => setIsExporting(false), 1000)
    }
  }

  const formatDescriptions = {
    json: 'Structured data format for developers and further analysis',
    csv: 'Spreadsheet-compatible format for data analysis',
    html: 'Fully formatted report for viewing and printing',
    pdf: 'Professional document format for sharing and archiving'
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Export Report
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          {data.dateRange}
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Export Format</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries({
            json: { icon: '📄', name: 'JSON' },
            csv: { icon: '📊', name: 'CSV' },
            html: { icon: '🌐', name: 'HTML' },
            pdf: { icon: '📋', name: 'PDF' }
          }).map(([format, info]) => (
            <button
              key={format}
              onClick={() => setExportFormat(format as any)}
              className={`p-3 rounded-lg border-2 transition-all ${
                exportFormat === format
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{info.icon}</div>
              <div className="text-sm font-medium">{info.name}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {formatDescriptions[exportFormat as keyof typeof formatDescriptions]}
        </p>
      </div>

      {/* Export Options */}
      <div className="mb-6 space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Include in Report</h4>
        
        <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={includeCharts}
            onChange={(e) => setIncludeCharts(e.target.checked)}
            className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <span>Charts and Visualizations</span>
        </label>
        
        <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={includeRawData}
            onChange={(e) => setIncludeRawData(e.target.checked)}
            className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <span>Raw Data Tables</span>
        </label>
        
        <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={includeRecommendations}
            onChange={(e) => setIncludeRecommendations(e.target.checked)}
            className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <span>Recommendations & Insights</span>
        </label>
      </div>

      {/* Report Preview */}
      <div className="mb-6 p-4 bg-gray-700/30 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Report Contents</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Performance Summary & KPIs</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="w-4 h-4" />
            <span>Learning Analytics Data</span>
          </div>
          {data.alerts && data.alerts.length > 0 && (
            <div className="flex items-center gap-2 text-gray-400">
              <AlertCircle className="w-4 h-4" />
              <span>Alerts & Notifications ({data.alerts.length})</span>
            </div>
          )}
          {data.testResults && data.testResults.length > 0 && (
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-4 h-4" />
              <span>Test Results ({data.testResults.length} tests)</span>
            </div>
          )}
          {data.testResultAnalysis && (
            <div className="flex items-center gap-2 text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>Test Results Analysis</span>
            </div>
          )}
          {includeRecommendations && (
            <div className="flex items-center gap-2 text-gray-400">
              <Settings className="w-4 h-4" />
              <span>Personalized Recommendations</span>
            </div>
          )}
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
          isExporting
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
        }`}
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Generating Report...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Export Report
          </>
        )}
      </button>

      {/* Export History (Optional Enhancement) */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Previous exports available in your download history
        </p>
      </div>
    </div>
  )
}