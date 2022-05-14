/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    rootDir: ".",
    testEnvironment: "node",
    globals: {
        "ts-jest": {
            isolatedModules: true,
        },
    },
    moduleFileExtensions: ["ts", "js", "mjs"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
    transformIgnorePatterns: ["node_modules"],
};
