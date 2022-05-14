import * as ts from "typescript";
import { barrelImportTransformer } from "./barrelImportTransformer";

/**
 * Processes the file by transforming the barrel imports using TSC Api as in barrelImportTransformer.ts file.
 * Then the transformed file is passed to the ts-jest to process it further
 */
export const process = (sourceText: string, sourcePath: string, config: any, options: any) => {
    printLog("->Transforming file -", sourcePath);
    const transformedText = getTransformedText(sourcePath, sourceText);
    return require("ts-jest").createTransformer().process(transformedText, sourcePath, config, options);
};

const printLog = (...args: any[]) => {
    console.log(...args);
};

const getTransformedText = (sourcePath: string, sourceText: string) => {
    const scriptKind = sourcePath.toLowerCase().endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    // Setting setParentNodes argument to true below is key for transform to work
    const sourceFile = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.ES2015, true, scriptKind);

    // Transform the file here to convert barrel imports to specific import
    const tranformedSourceFile = ts.transform(sourceFile, [barrelImportTransformer], {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.ESNext,
        isolatedModules: true,
    }).transformed[0];

    const newSourceText = ts.createPrinter().printFile(tranformedSourceFile);
    printLog(" ->Transformed Source -", newSourceText);
    return newSourceText;
};
