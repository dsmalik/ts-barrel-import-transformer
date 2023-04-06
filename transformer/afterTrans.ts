import { SourceFile, TransformationContext, Transformer, Visitor } from "typescript";

import type { TsCompilerInstance } from "ts-jest/dist/types";

export const version = 1;
export const name = "beforeTrans";


const printLog = (...args: any[]) => {
    console.log('After Trans -', ...args);
};


export function factory(compilerInstance: TsCompilerInstance) {
    const ts = compilerInstance.configSet.compilerModule;
    function createVisitor(ctx: TransformationContext, sf: SourceFile) {
        printLog("Input - \n", ts.createPrinter().printFile(sf));
        const visitor: Visitor = (node) => {
            return ts.visitEachChild(node, visitor, ctx);
        };
        return visitor;
    }

    return (ctx: TransformationContext): Transformer<SourceFile> => {
        return (sf: SourceFile) => {
            const tsf = ts.visitNode(sf, createVisitor(ctx, sf));
            printLog("Output - \n", ts.createPrinter().printFile(tsf));
            return tsf;
        }
    };
}
