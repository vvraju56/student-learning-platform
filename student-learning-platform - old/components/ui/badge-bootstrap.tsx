import React from 'react'
import { Badge } from 'react-bootstrap'

export function UiBadge({ 
  variant = 'primary',
  children,
  className = '',
  ...props 
}: {
  variant?: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <Badge bg={variant} className={className} {...props}>
      {children}
    </Badge>
  )
}

export default UiBadge