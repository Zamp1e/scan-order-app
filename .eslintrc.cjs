/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier'],
  ignorePatterns: ['node_modules', 'dist', 'public', 'screenshots'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': ['warn', { allow: ['log', 'warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'vue/multi-word-component-names': 'off',
    'vue/attributes-order': 'off',
    'vue/max-attributes-per-line': [
      'warn',
      {
        singleline: { max: 4 },
        multiline: { max: 1 },
      },
    ],
  },
}
