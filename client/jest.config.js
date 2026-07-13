module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'ecmascript', jsx: true },
          transform: { react: { runtime: 'automatic' } },
          target: 'es2021',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  // Transform every dependency (some ship as ESM: zustand, socket.io-client,
  // lucide-react, axios, react-hot-toast).
  transformIgnorePatterns: ['/node_modules/(?!(zustand|socket.io-client|socket.io-parser|engine.io-client|engine.io-parser|lucide-react|axios|react-hot-toast|debug|ms|follow-redirects|optimist)/)'],
  testMatch: ['<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'],
  collectCoverageFrom: [
    'store/**/*.js',
    'components/layout/TopBar.jsx',
    'components/layout/NotificationProvider.jsx',
  ],
};
