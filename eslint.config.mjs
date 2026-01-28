import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  prettier,
  {
    rules: {
      semi: ['error', 'never'],
      'no-unused-vars': 'off',
      'prefer-destructuring': [
        'error',
        {
          object: true,
          array: false,
        },
      ],
      'arrow-parens': 'off',
      'max-len': [
        'error',
        {
          code: 120,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/label-has-associated-control': [
        'error',
        {
          assert: 'either',
        },
      ],
      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['hrefLeft', 'hrefRight'],
          aspects: ['invalidHref', 'preferButton'],
        },
      ],
      'jsx-a11y/click-events-have-key-events': 0,
      'no-console': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'client/**',
    'unitTests/**',
  ]),
])

export default eslintConfig
