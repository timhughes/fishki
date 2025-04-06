export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // This is needed for React Router v7 and other ESM packages
    '/node_modules/(?!(react-markdown|remark-gfm|rehype-raw|rehype-sanitize|rehype-highlight|micromark|mdast-util-.*|unist-util-.*|unified|bail|is-plain-obj|trough|vfile|vfile-message|devlop|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|ccount|escape-string-regexp|react-router|react-router-dom|@remix-run)/)',
  ],
};
