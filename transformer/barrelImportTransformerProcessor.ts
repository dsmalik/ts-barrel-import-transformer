import * as ts from "typescript";
import { createHash } from 'crypto';
import * as tsJest from 'ts-jest';
import { barrelImportTransformer } from "./barrelImportTransformer";
import type {
    TransformOptions as JestTransformOptions,
    SyncTransformer,
    TransformerCreator,
} from '@jest/transform';

/**
 * Processes the file by transforming the barrel imports using TSC Api as in barrelImportTransformer.ts file.
 * Then the transformed file is passed to the ts-jest to process it further
 */
const transformWithTsJest = (tsJestTransformer: tsJest.TsJestTransformer, sourceText: string, sourcePath: string, config: JestTransformOptions) => {
    printLog("->Transforming file -", sourcePath);
    const transformedText = getTransformedText(sourcePath, sourceText);
    return tsJestTransformer.process(transformedText, sourcePath, config);
};

const transformWithTsJestAsync = (tsJestTransformer: tsJest.TsJestTransformer, sourceText: string, sourcePath: string, config: JestTransformOptions) => {
    printLog("->Transforming file async -", sourcePath);
    const transformedText = getTransformedText(sourcePath, sourceText);
    return tsJestTransformer.processAsync(transformedText, sourcePath, config);
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

export const name = 'BarrelTransformer';
export const version = "1.0.0";

function getCacheKeyFromConfig(
    sourceText: string,
    sourcePath: string,
    transformOptions: JestTransformOptions,
): string {
    const { config, configString, instrument } = transformOptions;

    return createHash('sha1')
        .update(sourceText)
        .update('\0', 'utf8')
        .update(name)
        .update('\0', 'utf8')
        .update(version)
        .update('\0', 'utf8')
        .update(sourcePath)
        .update('\0', 'utf8')
        .update(JSON.stringify(config ?? ''))
        .update('\0', 'utf8')
        .update(configString)
        .update('\0', 'utf8')
        .update(instrument ? 'instrument' : '')
        .update('\0', 'utf8')
        .update(process.env.NODE_ENV ?? '')
        .update('\0', 'utf8')
        .update(process.env.BABEL_ENV ?? '')
        .update('\0', 'utf8')
        .update(process.version)
        .digest('hex')
        .substring(0, 32);
}

const getTsJestTranformer = (tsJestConfigOptions?: tsJest.TsJestTransformerOptions | undefined) => {
    return tsJest.default.createTransformer(tsJestConfigOptions);
}

export const createTransformer: TransformerCreator<
    SyncTransformer<tsJest.TsJestTransformerOptions>,
    tsJest.TsJestTransformerOptions> = (tsJestConfigOptions: tsJest.TsJestTransformerOptions | undefined) => {

        return {
            canInstrument: true,
            getCacheKey(sourceText: string, sourcePath: string, transformOptions: JestTransformOptions) {
                const cacheKey = getCacheKeyFromConfig(
                    sourceText,
                    sourcePath,
                    transformOptions,
                );

                printLog('Cache key for - ', sourcePath, '-', cacheKey);
                return cacheKey;
            },
            async getCacheKeyAsync(sourceText: string, sourcePath: string, transformOptions: JestTransformOptions) {
                const cacheKey = getCacheKeyFromConfig(
                    sourceText,
                    sourcePath,
                    transformOptions,
                );

                printLog('Cache key async for - ', sourcePath, '-', cacheKey);
                return cacheKey;
            },
            process(sourceText: string, sourcePath: string, transformOptions: JestTransformOptions) {
                const tsJestTransformer = getTsJestTranformer(tsJestConfigOptions);
                const transformResult = transformWithTsJest(tsJestTransformer, sourceText, sourcePath, transformOptions);

                if (transformResult) {
                    const { code, map } = transformResult;
                    if (typeof code === 'string') {
                        return { code, map };
                    }
                }

                return { code: sourceText };
            },
            async processAsync(sourceText: string, sourcePath: string, transformOptions: JestTransformOptions) {
                const tsJestTransformer = getTsJestTranformer(tsJestConfigOptions);
                const transformResult = await transformWithTsJestAsync(tsJestTransformer, sourceText, sourcePath, transformOptions);
                if (transformResult) {
                    const { code, map } = transformResult;
                    if (typeof code === 'string') {
                        return { code, map };
                    }
                }

                return { code: sourceText };
            },
        };
    };

const transformerFactory = {
    // Assigned here, instead of as a separate export, due to limitations in Jest's
    // requireOrImportModule, requiring all exports to be on the `default` export
    createTransformer
};

export default transformerFactory;
