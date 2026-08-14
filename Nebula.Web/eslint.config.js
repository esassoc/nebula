// @ts-check
// Flat config. ESLint 9 dropped .eslintrc support, so this replaces
// .eslintrc.json; the rule set below is a port of it. See the notes on
// @typescript-eslint/indent and simple-import-sort for the two rules that
// could not be carried over as-is.
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = tseslint.config(
  {
    ignores: [
      'projects/**/*',
      // Auto-generated API client (see CLAUDE.md: never hand-edit Generated/).
      // Accounted for 256 of the 759 problems on the first flat-config run --
      // all of them unfixable by definition, and all of them back on the next
      // Scaffold.ps1 run.
      'src/app/shared/generated/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        // Replaces parserOptions.project. projectService resolves the
        // tsconfig per file, which the type-aware rules below need.
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/dot-notation': 'error',
      // Both are new in angular-eslint 22 and arrived with the Angular
      // upgrade, not with this config -- they are opt-in migrations, not
      // defects, so they report without failing the build:
      //   prefer-standalone flags all 39 components that declare
      //     standalone: false, which is this app's deliberate NgModule
      //     architecture.
      //   prefer-inject wants constructor DI moved to inject() in 117 places.
      // Raise either to 'error' when its migration is actually done.
      '@angular-eslint/prefer-standalone': 'warn',
      '@angular-eslint/prefer-inject': 'warn',
      // Dropped from .eslintrc.json, not ported:
      //   @typescript-eslint/indent and lines-between-class-members were
      //   removed in typescript-eslint v8 (formatting rules moved to
      //   @stylistic). lines-between-class-members was already "off", so it
      //   is a no-op; indent enforced 2 spaces and now enforces nothing.
      //   Reinstating it means adding @stylistic/eslint-plugin.
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // .eslintrc.json declared this under its *.ts override, where a template
      // rule never applies -- so it was silently ineffective. Moved here, which
      // is what it was meant to do.
      '@angular-eslint/template/label-has-associated-control': 'off',
    },
  },
);
