import { Project } from "ts-morph";
import { writeFileSync } from "fs";
import { filesToLookupExportsFrom, publicApiToLookupExportsFrom } from "./transformParameters";
import { getSymbolInfo } from "./getSymbolInfo";
import { isBarrelFile } from "./filePathHelper";

export interface ISymbolInfo {
    path: string;
    fullPath?: string;
}

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true,
});

const printLog = (...args: any[]) => {
    // console.log(...args);
};

const processFiles = (
    uniqueSymbolMap: Map<string, ISymbolInfo>,
    ambigiousSymbolMap: Map<string, Array<ISymbolInfo>>,
    onlyProcessPublicApi: boolean = false,
    uniquePublicSymbolMap?: Map<string, ISymbolInfo>
) => {
    for (const file of project.getSourceFiles()) {
        const filePath = file.getFilePath();
        if (onlyProcessPublicApi) {
            if (!isBarrelFile(filePath)) {
                // printLog("   Skipping file - ", filePath);
                continue;
            }
        } else {
            if (isBarrelFile(filePath)) {
                // printLog("   Skipping file - ", filePath);
                continue;
            }
        }

        printLog("");
        printLog("Processing file -", filePath);
        printLog("");

        // printLog("       Full qualified name -", file.getDefaultExportSymbol()?.getName());
        file.getExportSymbols().forEach((symbol) => {
            const [symbolName, symbolInfo] = getSymbolInfo(symbol, file);
            const mapKey = symbolName;

            // if (mapKey.endsWith("::default")) {
            //     return;
            // }

            if (uniquePublicSymbolMap?.has(mapKey)) {
                return;
            }

            if (uniqueSymbolMap.has(mapKey)) {
                // Add this symbol to ambigous map
                if (ambigiousSymbolMap.has(mapKey)) {
                    ambigiousSymbolMap.set(mapKey, [...ambigiousSymbolMap.get(mapKey)!, symbolInfo]);
                } else {
                    ambigiousSymbolMap.set(mapKey, [symbolInfo]);
                }
            } else {
                uniqueSymbolMap.set(mapKey, symbolInfo);
            }
        });
    }

    // Remove the ambigous symbols from the uniqueSymbol map as well and add to amb symbol map
    ambigiousSymbolMap.forEach((_v, mapKey) => {
        if (uniqueSymbolMap.has(mapKey)) {
            // Add to amb map
            ambigiousSymbolMap.set(mapKey, [uniqueSymbolMap.get(mapKey)!, ...ambigiousSymbolMap.get(mapKey)!]);
            //Remove from unique map
            uniqueSymbolMap.delete(mapKey);
        }
    });
};

/**
 * Iterates all files specified in pattern and write all the exports into unique and ambigous import lookup data.
 * This information is then used in transformer to transform the barrel import to specific imports
 */
export const getAllExports = (publicApiToLookupExportsFrom, filesPattern): void => {
    const startDate = new Date();
    console.log("getAllExport started at - ", startDate);

    project.addSourceFilesAtPaths(publicApiToLookupExportsFrom);
    console.log("Total files - ", project.getSourceFiles().length);

    const uniqueIndexSymbolMap = new Map<string, ISymbolInfo>();
    const ambigiousIndexSymbolMap = new Map<string, Array<ISymbolInfo>>();

    const namedSymbolMap = new Map<string, ISymbolInfo>();
    const ambigiousNamedSymbolMap = new Map<string, Array<ISymbolInfo>>();

    console.log("->->->Processing Index ts files");
    processFiles(uniqueIndexSymbolMap, ambigiousIndexSymbolMap, true);

    project.addSourceFilesAtPaths(filesPattern);

    console.log("->->->Processing Non Index ts files");
    processFiles(namedSymbolMap, ambigiousNamedSymbolMap, false, uniqueIndexSymbolMap);

    console.log("");
    console.log("Total Unique Index exports -", uniqueIndexSymbolMap.size);
    console.log("Total Ambigous Index exports -", ambigiousIndexSymbolMap.size);

    console.log("");
    console.log("Total Unique Named exports excluding index exports -", namedSymbolMap.size);
    console.log("Total Ambigous Named exports -", ambigiousNamedSymbolMap.size);

    writeFileSync(
        "./transform_cache/importLookupData.json",
        JSON.stringify(Array.from(namedSymbolMap.entries()).sort()),
        "utf-8"
    );
    writeFileSync(
        "./transform_cache/ambigousLookupData.json",
        JSON.stringify(Array.from(ambigiousNamedSymbolMap.entries()).sort()),
        "utf-8"
    );

    writeFileSync(
        "./transform_cache/indexLookupData.json",
        JSON.stringify(Array.from(uniqueIndexSymbolMap.entries()).sort()),
        "utf-8"
    );
    writeFileSync(
        "./transform_cache/ambigousIndexLookupData.json",
        JSON.stringify(Array.from(ambigiousIndexSymbolMap.entries()).sort()),
        "utf-8"
    );

    const completedDate = new Date();
    console.log("getAllExports completed -", completedDate);
    console.log(
        "Time taken to find all exports - ",
        Math.abs(completedDate.getTime() - startDate.getTime()) / 1000,
        "secs"
    );
};

getAllExports(publicApiToLookupExportsFrom, filesToLookupExportsFrom);
