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
    // 属性换行交给 Prettier 统一处理，避免两条规则互相打架
    'vue/max-attributes-per-line': 'off',
  },
}
