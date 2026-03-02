import React from 'react'
import { Card } from 'react-bootstrap'

export function UiCard({ 
  children,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <Card className={className} {...props}>
      {children}
    </Card>
  )
}

export function CardHeader({ 
  children,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <Card.Header className={className} {...props}>
      {children}
    </Card.Header>
  )
}

export function CardContent({ 
  children,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <Card.Body className={className} {...props}>
      {children}
    </Card.Body>
  )
}

export function CardTitle({ 
  children,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <Card.Title className={className} {...props}>
      {children}
    </Card.Title>
  )
}

export default UiCard