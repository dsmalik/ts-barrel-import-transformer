import * as ts from "typescript";
import { getImportDeclarationsForImportClause, IChangedImportMetadata, IChangedImportMap } from "./transformHelper";

const updateJestMockStatements = (
    transformedSource: ts.SourceFile,
    mocksDefinedInFile: ts.ExpressionStatement[],
    changedImportMap: IChangedImportMap[]
) => {
    const newMockStatements: ts.ExpressionStatement[] = [];

    mocksDefinedInFile.forEach((expStm) => {
        const m = ts.getMutableClone(expStm);
        const mockedImport = (m.expression as any).arguments[0].getText().replace(/'/g, "");
        printLog("Jest Mock found -", expStm.getText(), mockedImport, changedImportMap, transformedSource.fileName);

        try {
            const filteredImports = changedImportMap.filter((x) => {
                return x.changed.includes(mockedImport);
            });

            printLog("Filtered imports -", filteredImports);
            if (filteredImports && filteredImports.length) {
                filteredImports.forEach((filteredImport, i) => {
                    printLog("  ----> Create new mock code for -", expStm.getText(), "->", filteredImport.changed);
                    const nodesToAdd = ts.createExpressionStatement(
                        ts.createCall(
                            ts.createPropertyAccess(ts.createIdentifier("jest"), ts.createIdentifier("mock")),
                            undefined,
                            // If jest.mock has a second argument than add it as well
                            (m.expression as any).arguments[1]
                                ? [ts.createStringLiteral(filteredImport.changed), (m.expression as any).arguments[1]]
                                : [ts.createStringLiteral(filteredImport.changed)]
                        )
                    );

                    newMockStatements.push(nodesToAdd);
                });
            } else {
                printLog("  ----> Return mock as is -", expStm.getText());
            }
        } catch (e) {
            printLog("Error updating mock -", e);
        }
    });

    return newMockStatements;
};

/**
 * This is main transformer code. It looks at the source file and transforms -
 * 1. Import declarations
 * 2. jest.mock expression statements
 * @param ctx Current transformation context
 * @returns Transformed Source file
 */
export const barrelImportTransformer = (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    // Track all jest.mocks defined in file being processed
    let mocksDefinedInFile: ts.ExpressionStatement[] = [];
    // Track all changed imports that were found in lookup map
    let changedImportMap: IChangedImportMap[] = [];

    const nodeVisitor = (ctx: ts.TransformationContext, sf: ts.SourceFile) => {
        let currentImportDeclaration: ts.ImportDeclaration | undefined;

        const visitor: ts.Visitor = (node) => {
            switch (node.kind) {
                case ts.SyntaxKind.SourceFile:
                    mocksDefinedInFile = [];
                    changedImportMap = [];
                    break;
                case ts.SyntaxKind.ExpressionStatement:
                    const expStatement = node as ts.ExpressionStatement;
                    // Need to re-write the jest.mock to specific imports
                    if (expStatement.getText().startsWith("jest.mock")) {
                        mocksDefinedInFile.push(expStatement);

                        const transformedMockExpressionStatements = updateJestMockStatements(
                            sf,
                            [expStatement],
                            changedImportMap
                        );

                        if (transformedMockExpressionStatements.length) {
                            return transformedMockExpressionStatements;
                        }
                    }
                    break;
                case ts.SyntaxKind.ImportDeclaration:
                    try {
                        const impDec = node as ts.ImportDeclaration;
                        currentImportDeclaration = impDec;
                        let clauses = impDec.importClause;
                        const impDecText = impDec.getText();

                        if (!clauses) {
                            printLog("    No clause found -", impDec.getText());
                            return node;
                        }

                        let namedImport = clauses.getChildAt(0) as ts.NamedImports | undefined;

                        if (!namedImport || !namedImport.elements) {
                            printLog(
                                "   Returning import declaration as is since no named import exists -",
                                impDecText
                            );
                            return node;
                        }

                        if (impDec.getText().includes("* as ")) {
                            printLog("   Returning import declaration as is since it is default import - ", impDecText);
                            return node;
                        }

                        if (!!!namedImport.elements?.map) {
                            printLog("   Returning node as we cannot map imports -", impDecText);
                            return node;
                        }

                        const importsToChange = namedImport.elements.map((x) => x.getText());

                        const newImportDeclarations = getImportDeclarationsForImportClause(impDec, namedImport, sf);
                        if (newImportDeclarations && newImportDeclarations.length) {
                            return newImportDeclarations;
                        }
                    } catch (e) {
                        printLog("   ----> Unhandled exception in transformer -", e);
                        return node;
                    }
            }

            return ts.visitEachChild(node, visitor, ctx);
        };

        return visitor;
    };

    return (sf: ts.SourceFile) => {
        try {
            let tsf = ts.visitNode(sf, nodeVisitor(ctx, sf));
            return tsf;
        } catch (e) {
            printLog("Failed transform - ", sf.fileName, "error -", e);
            return sf;
        } finally {
            mocksDefinedInFile = [];
            changedImportMap = [];
        }
    };
};

const printLog = (...args: any[]) => {
    console.log(...args);
};
