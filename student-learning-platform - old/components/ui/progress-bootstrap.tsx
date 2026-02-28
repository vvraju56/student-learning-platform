import React from 'react'

export function Progress({ 
  value = 0,
  className = '',
  ...props 
}: {
  value?: number
  className?: string
  [key: string]: any
}) {
  return (
    <div 
      className={`progress ${className}`}
      style={{height: '8px'}}
      {...props}
    >
      <div 
        className="progress-bar bg-primary"
        style={{width: `${value}%`}}
      ></div>
    </div>
  )
}

export default Progress