/*
 * @Author: FMC
 * @Date: 2024-06-22 22:12:35
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-07 20:34:07
 * @FilePath: \three-run-game\.eslintrc.cjs
 * @Description: 
 */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react/no-unknown-property': 'off',
    "react/prop-types": 0, //防止在react组件定义中缺少props验证
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
