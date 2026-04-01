import globals from 'globals';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Ошибки
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-const-assign': 'error',

      // Предупреждения — стиль
      'eqeqeq': ['warn', 'always'],
      'no-var': 'warn',
      'prefer-const': 'warn',

      // Выключено — в монолите много globals по дизайну
      'no-global-assign': 'error',
    },
  },
];
