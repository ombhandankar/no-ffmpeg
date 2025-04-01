module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    sourceType: 'module',
    ecmaVersion: 2020,
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['build/**/*', 'dist/**/*', 'node_modules/**/*'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/interface-name-prefix': 'off',
    'object-shorthand': ['error', 'always'],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    'arrow-body-style': ['error', 'as-needed'],
    'no-return-await': 'off',
    '@typescript-eslint/return-await': ['error', 'in-try-catch'],
    "@typescript-eslint/no-explicit-any": 'off',
    "@typescript-eslint/no-non-null-assertion": "off"
  },
  overrides: [
    {
      files: ['*.ts', '*.mts', '*.cts', '*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
          },
        ],
      },
    },
    {
      files: ['tests/**/*.ts', '**/__tests__/**/*.ts'],
      parserOptions: {
        project: ['tsconfig.json']
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off'
      }
    }
  ],
};
