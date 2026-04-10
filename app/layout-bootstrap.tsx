import 'bootstrap/dist/css/bootstrap.min.css'

export const metadata = {
  title: 'Smart Learning Platform',
  description: 'AI-powered learning platform with posture and attention monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
