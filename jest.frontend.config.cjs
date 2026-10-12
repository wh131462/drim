module.exports = {
    testMatch: ['<rootDir>/src/**/*.spec.ts'],
    testEnvironment: 'node',
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: {
                    target: 'ES2021',
                    module: 'commonjs',
                    moduleResolution: 'node',
                    esModuleInterop: true,
                    baseUrl: '.',
                    paths: { '@/*': ['src/*'] },
                    types: ['jest', '@dcloudio/types'],
                    importsNotUsedAsValues: 'remove',
                    verbatimModuleSyntax: false
                }
            }
        ]
    }
};
