import { join, parse } from "path";

export const node_modules = "node_modules";

const getRootDirectory = () => {
    return join(__dirname, "..");
};

export const getRelativePathFromRoot = (filePath: string) => {
    const pathForImport = filePath.replace(/"/g, "").substring(getRootDirectory().length + 1);

    return pathForImport;
};

export const isBarrelFile = (filePath: string) => {
    return filePath.endsWith("index.ts") || filePath.endsWith("index.d.ts");
};

export const getRelativePathFromNodeModules = (filePath: string) => {
    const relativeFromRoot = getRelativePathFromRoot(filePath);

    if (relativeFromRoot.startsWith(node_modules)) {
        return relativeFromRoot.substring(node_modules.length + 1);
    }

    throw "Path not inside node_modules";
};

// TODO - Refactor to use parse(filePath).name to remove extension
export const getPathForImport = (filePath: string) => {
    let pathForImport = filePath.replace(/"/g, "").substring(getRootDirectory().length + 1);

    if (pathForImport.startsWith(node_modules)) {
        pathForImport = pathForImport.substring(node_modules.length + 1);
    }

    if (pathForImport.endsWith(".d.ts")) {
        return pathForImport.substring(0, pathForImport.lastIndexOf(".d.ts"));
    }

    if (pathForImport.endsWith(".ts")) {
        return pathForImport.substring(0, pathForImport.lastIndexOf(".ts"));
    }

    return pathForImport;
};
