import {
    CancellationToken,
    createPrinter,
    createSourceFile,
    CustomTransformers,
    ModuleKind,
    Program,
    ScriptKind,
    ScriptTarget,
    SourceFile,
    sys,
    transform,
    TransformationContext,
    Transformer,
    Visitor,
    WriteFileCallback,
} from "typescript";
import { readFileSync } from "fs";

import type { TsCompilerInstance } from "ts-jest/dist/types";
import { barrelImportTransformer } from "./barrelImportTransformer";

export const version = 1;
export const name = "beforeTrans";

const printLog = (sf: SourceFile, ...args: any[]) => {
    console.log("Before - Transforming file -", sf.fileName);
    if (sf.fileName.endsWith(".spec.ts")) {
        console.log("Before Trans -", ...args);
    }
};

function p(...args: any[]) {
    console.log(...args);
}

function getSourceFile(
    fileName: string
    // languageVersion: ScriptTarget,
    // onError?: (message: string) => void
): SourceFile | undefined {
    p(" Parsing File - ", fileName);
    if (fileName.endsWith("app.ts")) {
        const a = fileName.replace("app.ts", "app.copy");
        p("Returned dummy -", a);
        return createSourceFile(fileName, sys.readFile(a)!, ScriptTarget.ES2015);
    }
    const sourceText = sys.readFile(fileName);
    return sourceText !== undefined ? createSourceFile(fileName, sourceText, ScriptTarget.ES2015) : undefined;
}

// const getTransformedText = (sourcePath: string, sourceText: string) => {
//     const scriptKind = sourcePath.toLowerCase().endsWith("tsx") ? ScriptKind.TSX : ScriptKind.TS;
//     // Setting setParentNodes argument to true below is key for transform to work
//     const sourceFile = createSourceFile(sourcePath, sourceText, ScriptTarget.ES2015, true, scriptKind);

//     // Transform the file here to convert barrel imports to specific import
//     const tranformedSourceFile = transform(sourceFile, [barrelImportTransformer], {
//         target: ScriptTarget.ES2015,
//         module: ModuleKind.ESNext,
//         isolatedModules: true,
//     }).transformed;

//     return tranformedSourceFile[0]; // createPrinter().printFile(tranformedSourceFile[0]);
// };

export function factory(compilerInstance: TsCompilerInstance) {
    const ts = compilerInstance.configSet.compilerModule;

    function createVisitor(ctx: TransformationContext, sf: SourceFile) {
        printLog(sf, "Input - \n", ts.createPrinter().printFile(sf));

        if (sf.fileName.endsWith(".spec.ts")) {
            const program = compilerInstance.program;

            const newProgram = { ...program! };

            newProgram.getSourceFile = (fileName: string) => {
                p(" Getting file -", fileName);
                return program?.getSourceFile(fileName);
            };

            newProgram.emit = (
                targetSourceFile?: SourceFile | undefined,
                writeFile?: WriteFileCallback | undefined,
                cancellationToken?: CancellationToken | undefined,
                emitOnlyDtsFiles?: boolean | undefined,
                customTransformers?: CustomTransformers | undefined
            ) => {
                p(" Emit result for -", targetSourceFile?.fileName);
                return program!.emit(
                    targetSourceFile,
                    writeFile,
                    cancellationToken,
                    emitOnlyDtsFiles,
                    customTransformers
                );
            };

            compilerInstance.program = newProgram;
        } else {
            const s1 = compilerInstance.program?.getSourceFile(sf.fileName);
        }

        const visitor: Visitor = (node) => {
            if (ts.isSourceFile(node)) {
                // console.warn("Program - ", compilerInstance.program);c
                // if (program?.getSourceFile) {
                //     const act = program.getSourceFile;
                //     (program as any).a = { a1: 1 };
                //     if (sf.fileName.endsWith(".spec.ts")) {
                //         console.warn("act source file taken -", program);
                //     }
                //     program.getSourceFile = (fileName) => {
                //         console.warn("Reading the file -", fileName);
                //         return act(fileName);
                //     };
                // } else {
                //     console.warn("Program doesnt have getSourceFile");
                // }
            }

            return ts.visitEachChild(node, visitor, ctx);
        };
        return visitor;
    }

    return (ctx: TransformationContext): Transformer<SourceFile> => {
        return (sf: SourceFile) => {
            const tsf = ts.visitNode(sf, createVisitor(ctx, sf));
            printLog(tsf, "Output - \n", ts.createPrinter().printFile(tsf));
            return tsf;
        };
    };
}
