import '@testing-library/jest-dom'

// Mock TensorFlow.js and MediaPipe to avoid loading actual models in tests
jest.mock('@tensorflow/tfjs', () => ({
  tidy: jest.fn(),
  browser: {
    isMobile: jest.fn(() => false),
  },
}))

jest.mock('@mediapipe/face_detection', () => ({
  FaceDetection: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    initialize: jest.fn(),
    close: jest.fn(),
  })),
}))

jest.mock('@tensorflow-models/face-detection', () => ({
  createDetector: jest.fn().mockResolvedValue({
    estimateFaces: jest.fn().mockResolvedValue([]),
  }),
  SupportedModels: {
    MediaPipeFaceDetector: {},
  },
}))

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
}))

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  onValue: jest.fn(),
  push: jest.fn(),
  update: jest.fn(),
}))

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [],
    }),
  },
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))