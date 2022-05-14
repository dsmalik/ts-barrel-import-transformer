/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { existsSync } = require("fs");

const canUseBarrelImportTransformer = existsSync("./transform_cache/importLookupData.json");

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
    moduleNameMapper: {
        "src/(.*)": "<rootDir>/src/$1",
    },
    transformIgnorePatterns: ["node_modules"],
    transform: {
        "^.+\\.(js|jsx)": "babel-jest",
        "^.+\\.(ts|tsx)": canUseBarrelImportTransformer
            ? "<rootDir>/transform_cache/barrelImportTransformerProcessor.js"
            : "ts-jest",
    },
};
