import { SourceFile, Symbol } from "ts-morph";
import { getPathForImport, node_modules } from "./filePathHelper";
import { ISymbolInfo } from "./publicImportFinder";

export const getSymbolInfo = (symbol: Symbol, sf: SourceFile): [string, ISymbolInfo] => {
    const symbolInfo = getSymbolData(symbol);
    return [
        symbolInfo.name,
        {
            path: symbolInfo.path,
            fullPath: symbolInfo.fullPath,
        },
    ];
};

const getPrefixedSymbolName = (symbolName: string, importPath: string, symbol: Symbol) => {
    const qualifiedSymbolName = symbol.getName() === "default" ? symbolName : symbol.getName();

    if (importPath.includes(node_modules)) {
        return (
            importPath
                .substring(importPath.indexOf(node_modules) + node_modules.length + 1)
                .split("/")
                .splice(0, 2)
                .join()
                .replace(/,/g, "/") +
            "::" +
            qualifiedSymbolName
        );
    }

    return qualifiedSymbolName;
};

const getSymbolData = (symbol: Symbol): ISymbol => {
    const s = symbol.getFullyQualifiedName().split(".");

    let importPath;
    const qualifiedSymbolName = symbol.getName() === "default" ? s[1] : symbol.getName();
    if (symbol.isAlias()) {
        printLog(
            "      Symbol - ",
            symbol.getName(),
            " (",
            symbol.getAliasedSymbol()!.getName(),
            "), Full name -",
            symbol.getFullyQualifiedName(),
            " --",
            qualifiedSymbolName,
            ", Alias path -",
            getPathForImport(symbol.getAliasedSymbol()!.getDeclarations()[0].getSourceFile().getFilePath())
        );

        importPath = symbol.getAliasedSymbol()!.getDeclarations()[0].getSourceFile().getFilePath();
    } else {
        importPath = s[0];
    }

    return {
        name: getPrefixedSymbolName(s[1], s[0], symbol),
        path: getPathForImport(importPath),
        fullPath: importPath.replace(/"/g, ""),
    };
};

interface ISymbol {
    name: string;
    path: string;
    fullPath?: string;
}

const printLog = (...args: any[]) => {
    // console.log(...args);
};
