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
    transformIgnorePatterns: ["node_modules"],
    transform: {
        "^.+\\.(js|jsx)": "babel-jest",
        "^.+\\.(ts|tsx)": canUseBarrelImportTransformer
            ? ["<rootDir>/transform_cache/barrelImportTransformerProcessor.js", { isolatedModules: true, compiler: 'typescript' }]
            : ["ts-jest", {
                isolatedModules: true,
                compiler: 'typescript'
            }],
    },
};
