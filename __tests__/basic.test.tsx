import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Basic Component Tests', () => {
  test('renders learn react link', () => {
    // This is a placeholder test to verify Jest is working
    const div = document.createElement('div')
    expect(div).toBeInTheDocument()
  })

  test('mock environment is working', () => {
    expect(navigator.mediaDevices.getUserMedia).toBeDefined()
    expect(global.IntersectionObserver).toBeDefined()
    expect(global.ResizeObserver).toBeDefined()
  })
})