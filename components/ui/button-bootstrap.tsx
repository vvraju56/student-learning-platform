import React from 'react'

export function Button({ 
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  onClick,
  ...props 
}: {
  variant?: string
  size?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
  [key: string]: any
}) {
  const btnClass = `btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${className}`
  
  return (
    <button 
      className={btnClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button