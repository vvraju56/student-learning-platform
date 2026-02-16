"use client"

import { useState } from 'react'
import { Download, FileText, Calendar, TrendingUp, Activity, AlertCircle, Settings } from 'lucide-react'

interface ReportData {
  dateRange: string
  summary: any
  metrics: any[]
  charts: any
  alerts: any
  recommendations: string[]
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
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    downloadFile(blob, `learning-analytics-report-${new Date().toISOString().split('T')[0]}.json`)
  }

  const exportToCSV = () => {
    // Flatten the data for CSV format
    const csvData = []
    
    // Summary data
    csvData.push(['Report Section', 'Metric', 'Value', 'Unit'])
    
    if (data.summary) {
      Object.entries(data.summary).forEach(([key, value]) => {
        csvData.push(['Summary', key, String(value), ''])
      })
    }
    
    // Metrics data
    if (data.metrics && includeRawData) {
      data.metrics.forEach((metric: any) => {
        csvData.push(['Metrics', metric.label || metric.name, String(metric.value), metric.unit || ''])
      })
    }
    
    // Convert to CSV string
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
    // Note: In a real implementation, you would use a library like jsPDF or Puppeteer
    // For now, we'll create a simplified text-based PDF-like content
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