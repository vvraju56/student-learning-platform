import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['.next/**', 'node_modules/**'],
    languageOptions: {
      parser: typescriptParser,
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Buffer: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        self: 'readonly',
        ReadableStream: 'readonly',
        TransformStream: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        navigateTo: 'readonly',
        handleLogout: 'readonly',
        continueCourse: 'readonly',
        startQuiz: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
];