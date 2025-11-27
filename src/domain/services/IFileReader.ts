/**
 * Defines IFileReader interface
 * @interface IFileReader
 * @method readFile
 */

export interface IFileReader {
    readFile(bucket: string, key: string): Promise<string>;
}