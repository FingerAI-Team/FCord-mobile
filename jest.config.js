/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.ts',
    // react-native-keychain은 명시적 모킹 (다른 react-native-* 보다 우선 매칭)
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.ts',
    '^react-native-safe-area-context$': '<rootDir>/__mocks__/react-native-safe-area-context.ts',
    '^react-native-(.*)$': '<rootDir>/__mocks__/react-native-stub.ts',
    '^@nozbe/watermelondb(.*)$': '<rootDir>/__mocks__/watermelondb.ts',
    '^@react-native-community/(.*)$': '<rootDir>/__mocks__/react-native-stub.ts',
    // 구체적 패키지 매핑 먼저 (와일드카드보다 앞에 위치)
    '^@react-navigation/stack$': '<rootDir>/__mocks__/@react-navigation/stack.ts',
    '^@react-navigation/bottom-tabs$': '<rootDir>/__mocks__/@react-navigation/bottom-tabs.ts',
    '^@react-navigation/native$': '<rootDir>/__mocks__/@react-navigation/native.ts',
    '^@react-navigation/(.*)$': '<rootDir>/__mocks__/@react-navigation/native.ts',
    '^zustand$': '<rootDir>/__mocks__/zustand.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
