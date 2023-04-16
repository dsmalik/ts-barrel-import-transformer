/**
 * The pattern of files from which we should generate the import lookup map from
 */
export const filesToLookupExportsFrom = ["src/**/*.ts*", "node_modules/@material-ui/core/**/*.ts*"];

export const publicApiToLookupExportsFrom = ["src/index.ts", "node_modules/@material-ui/core/index.d.ts"];

/**
 * Condition to evaluate when checking whether to transform a import declarations based on the module name of import statement
 * @param specifier The module name in an import statement
 * @returns Whether to transform the import declaration or not
 */
export const shouldTransformImportDeclarationCriteria = (specifier: string) =>
    specifier && specifier.startsWith("./src");
