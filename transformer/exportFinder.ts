import { Project, SourceFile, SyntaxKind } from "ts-morph";
import { writeFileSync } from "fs";
import { filesToLookupExportsFrom } from "./transformParameters";

export interface ISymbolInfo {
    identifier: string;
    path: string;
}

export interface IAmbigiousSymbolInfo {
    name: string;
    filePath: string;
}

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true,
});

const printLog = (...args: any[]) => {
    console.log(...args);
};

/**
 * Iterates all files specified in pattern and write all the exports into unique and ambigous import lookup data.
 * This information is then used in transformer to transform the barrel import to specific imports
 */
export const getAllExports = (filesPattern): void => {
    const startDate = new Date();
    console.log("getAllExport started at - ", startDate);

    project.addSourceFilesAtPaths(filesPattern);
    console.log("Total files - ", project.getSourceFiles().length);

    let totalExports = 1;

    const uniqueSymbolMap = new Map<string, ISymbolInfo>();
    // To track exports that are not unique. Like same name exported from 2 files in project
    const ambigiousSymbolMap = new Map<IAmbigiousSymbolInfo, string>();
    // Keep track of symbols that are ambigious and must not be added in unique symbol map
    const symbolsToIgnore = new Set<string>();

    const getPathForImport = (sf: SourceFile) => {
        const filePath = sf.getFilePath();
        return filePath.substring(filePath.indexOf("/src") + 1, filePath.lastIndexOf("."));
    };

    for (const file of project.getSourceFiles()) {
        const filePath = file.getFilePath();
        if (filePath.endsWith("index.ts") || filePath.endsWith("index.d.ts")) {
            continue;
        }

        file.getExportSymbols().forEach((s) => {
            if (s.getName() === "default") {
                return;
            }

            const mapKey = s.getName();
            if (uniqueSymbolMap.has(mapKey)) {
                // Deleting the symbol since it is ambigious
                const filePathOfSymbolToDelete = uniqueSymbolMap.get(mapKey).path;
                symbolsToIgnore.add(mapKey);
                ambigiousSymbolMap.set({ name: mapKey, filePath: filePathOfSymbolToDelete }, getPathForImport(file));
                ambigiousSymbolMap.set({ name: mapKey, filePath: file.getFilePath() }, getPathForImport(file));
                uniqueSymbolMap.delete(mapKey);
            } else {
                if (!symbolsToIgnore.has(mapKey)) {
                    uniqueSymbolMap.set(mapKey, {
                        identifier: getPathForImport(file),
                        path: file.getFilePath(),
                    });
                } else {
                    printLog("  Ignoring symbol since it is ambigous", mapKey, file.getFilePath());
                    ambigiousSymbolMap.set({ name: mapKey, filePath: file.getFilePath() }, getPathForImport(file));
                }
            }
        });
    }

    uniqueSymbolMap.forEach(() => {
        totalExports++;
    });

    console.log("Total exports -", totalExports);

    writeFileSync(
        "./transform_cache/importLookupData.json",
        JSON.stringify(Array.from(uniqueSymbolMap.entries())),
        "utf-8"
    );
    writeFileSync(
        "./transform_cache/ambigousLookupData.json",
        JSON.stringify(Array.from(ambigiousSymbolMap.entries())),
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

getAllExports(filesToLookupExportsFrom);
