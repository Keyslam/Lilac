import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    eslintPluginPrettierRecommended,
    {
        files: ['packages/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: ['./tsconfig.base.json', './packages/*/tsconfig.json'],
                tsconfigRootDir: process.cwd(),
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',

            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        constructors: 'no-public',
                    },
                },
            ],

            eqeqeq: ['error', 'always'],
            'no-restricted-syntax': [
                'error',
                {
                    selector: "Literal[raw='null']",
                    message: 'Use undefined instead of null',
                },
            ],

            'prefer-const': 'error',
            semi: ['error', 'always'],
            quotes: ['error', 'single'],
            curly: 'error',
        },
    },
]);
