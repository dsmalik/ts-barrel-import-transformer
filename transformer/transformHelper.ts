import * as ts from "typescript";
import { readFileSync } from "fs";
import { ISymbolInfo } from "./exportFinder";
import { shouldTransformImportDeclarationCriteria } from "./transformParameters";

const fileContent = readFileSync("./transform_cache/importLookupData.json", "utf-8");
let uniqueSymbolMap: Map<string, ISymbolInfo> = new Map(JSON.parse(fileContent));

const ambigousFileContent = readFileSync("./transform_cache/ambigousLookupData.json", "utf-8");
// Not used today but can be once we can figure how to make them unique as well
let ambigiousSymbolMap: Map<string, ISymbolInfo> = new Map(JSON.parse(ambigousFileContent));

export interface IChangedImportMetadata {
    path: string;
    identifierNameFromPath: string;
}

export interface IChangedImportMap {
    orig: string;
    changed: string;
}

/**
 * Checks if we need to process import and convert it. Change the condition as per your need
 * @param importDeclaration Current import declaration
 * @param criteria A function to specify which imports should be transformed
 * @returns Whether or not to process the import declarations
 */
const shouldTransformImportDeclaration = (importDeclaration: ts.ImportDeclaration) => {
    const specifier = getModuleSpecifierForImportDeclaration(importDeclaration);
    // Change here to include or exclude imports
    return shouldTransformImportDeclarationCriteria(specifier);
};

/**
 * Looks at the Lookup map and transforms the current import declaration to new import declarations that
 * contains specific import instead of the barrel import
 * @param importDeclaration Current import declaration to process
 * @param namedImports All named imports in current import declaration
 * @param sf Current source file
 * @returns New transformed set of import declarations
 */
export const getImportDeclarationsForImportClause = (
    importDeclaration: ts.ImportDeclaration,
    namedImports: ts.NamedImports | undefined,
    sf: ts.SourceFile
): ts.ImportDeclaration[] => {
    if (!ts.isNamedImports(namedImports)) {
        printLog("    Named import not found - ", namedImports);
        return undefined;
    }

    const ignoreImportDeclaration = !shouldTransformImportDeclaration(importDeclaration);

    if (ignoreImportDeclaration) {
        printLog("Ignored -", importDeclaration.getText());
        return undefined;
    }

    const importFileWiseMap = new Map<string, Array<string>>();
    const importSpecifier = getModuleSpecifierForImportDeclaration(importDeclaration);

    namedImports.elements.forEach((ni) => {
        // TODO - Still need to fix for aliased imports
        printLog("    Named import lookup -", ni.getText());
        const importPath = getImportFilePath(ni, sf, importSpecifier);

        if (!importPath) {
            printLog("  Import not found so returning");
            return;
        }

        printLog("       -> Import information -", ni.getText(), importPath);

        if (importFileWiseMap.has(importPath)) {
            // Do nothing since this import is already processed
        } else if (uniqueSymbolMap.has(importPath)) {
            importFileWiseMap.set(importPath, [ni.getText()]);
        } else {
            printLog("    Adding import info to file wise import -", ni.getText(), "->", importPath);
            importFileWiseMap.set(importPath ?? getModuleSpecifierForImportDeclaration(importDeclaration), [
                ni.getText(),
            ]);
        }
    });

    const newImportDeclarations: ts.ImportDeclaration[] = [];

    importFileWiseMap.forEach((imports, filePath) => {
        imports.forEach((x) => {
            printLog("    ->Import -", x, "from", filePath);
        });

        if (!filePath) {
            return;
        }

        const importSpecifiers = imports.map((i) =>
            // Below gives compile time error depending on tsc version i think. Change as per
            ts.createImportSpecifier(undefined, undefined, ts.createIdentifier(i))
        );

        const newImportDeclaration = ts.createImportDeclaration(
            undefined,
            undefined,
            ts.createImportClause(undefined, ts.createNamedImports(importSpecifiers)),
            ts.createLiteral(filePath)
        );

        newImportDeclarations.push(newImportDeclaration);
    });

    return newImportDeclarations;
};

/**
 * Returns module specifier of import declaration
 * Module specifier is module name exporting current import -> import { something } from 'modulespecifier';
 * @param importDeclaration Current import declaration
 * @returns Module specifier for current import declarations
 */
const getModuleSpecifierForImportDeclaration = (importDeclaration: ts.ImportDeclaration) => {
    try {
        return importDeclaration.moduleSpecifier.getText().replace(/('|")/g, "");
    } catch {
        // Just safe guarding. Can be removed now as above will never throw?
        printLog("    Error getting module specifier -", importDeclaration.getText());
        return importDeclaration.moduleSpecifier.getText();
    }
};

const getImportFilePath = (
    namedImport: ts.ImportSpecifier,
    _sf: ts.SourceFile,
    _importPathInOriginalImport: string
) => {
    const namedImportText = namedImport.getText();
    let importFilePath = uniqueSymbolMap.get(namedImportText)?.identifier;
    return importFilePath;
};

const printLog = (...args: any[]) => {
    console.log(...args);
};
