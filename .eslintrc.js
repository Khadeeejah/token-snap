module.exports = {
  root: true,

  env: {
    browser: true,
  },

  extends: ['@metamask/eslint-config'],

  plugins: ['prettier'],

  overrides: [
    {
      files: ['*.js'],
      parserOptions: {
        sourceType: 'script',
      },
      globals: {
        wallet: 'readonly',
        ethereum: 'readonly',
      },
      extends: ['@metamask/eslint-config-nodejs'],
    },
  ],

  ignorePatterns: ['!.eslintrc.js', '!.prettierrc.js', 'dist/'],

  rules: {
    'prettier/prettier': [
      1,
      {
        printWidth: 110,
        arrowParens: 'avoid',
      },
    ],
    curly: 0,
    'no-param-reassign': 0,
    'no-negated-condition': 0,
    'node/no-unpublished-require': [
      'error',
      {
        convertPath: {
          '{src/*.js,abis/*.json}': ['.*', 'dist/bundle.js'],
        },
      },
    ],
  },
};
