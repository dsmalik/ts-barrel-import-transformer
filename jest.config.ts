/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { existsSync } = require("fs");

const canUseBarrelImportTransformer = existsSync("./transform_cache/importLookupData.json");

module.exports = {
    rootDir: ".",
    testEnvironment: "node",
    moduleFileExtensions: ["ts", "js", "mjs"],
    moduleNameMapper: {
        "src/(.*)": "<rootDir>/src/$1",
    },
    testPathIgnorePatterns: ["/transform_cache/"],
    transformIgnorePatterns: ["node_modules"],
    transform: {
        "^.+\\.(js|jsx)": "babel-jest",
        "^.+\\.(ts|tsx)": [
            "ts-jest",
            {
                compiler: "typescript",
                useESM: true,
                astTransformers: {
                    before: ["<rootDir>/transformer/beforeTrans.ts"],
                    after: ["<rootDir>/transformer/afterTrans.ts"],
                },
            },
        ],
    },
};
