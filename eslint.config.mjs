import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'output/**', 'html-export/**', 'playwright-report/**', 'test-results/**', 'tests/screenshots/**', '.pnpm-store/**', 'src/components/reactbits/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true } } } },
  { files: ['tests/**'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
);
