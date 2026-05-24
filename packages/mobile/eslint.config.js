import js from '@eslint/js';
import react from 'eslint-plugin-react';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: [
      'src/**/*.ts',
      'src/**/*.tsx',
      'app/**/*.ts',
      'app/**/*.tsx',
      'Tests/**/*.ts',
      'Tests/**/*.tsx',
    ],
    languageOptions: {
      parser: tsparser,
      globals: {
        console: 'readonly',
        require: 'readonly',
        alert: 'readonly',
        window: 'readonly',
        global: 'readonly',
        __DEV__: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        navigator: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        __d: 'readonly',
        Realm: 'readonly',
        AbortController: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'off',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-undef': 'off', // TypeScript już to sprawdza
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    ignores: [
      'node_modules',
      'build',
      'dist',
      'android',
      'ios',
      'web-build',
      'android/app/build',
      '**/*.d.ts',
      '.expo/types/router.d.ts',
      'babel.config.js',
    ],
  },
];
