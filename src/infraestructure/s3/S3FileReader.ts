import { IFileReader } from "../../domain/services/IFileReader";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";


/**
 * * S3FileReader - Implementing IFileReader to read files from AWS S3
* This class covers:
* - Connecting to AWS S3
* - Downloading files using a bucket and key
* - Converting byte streams to UTF-8 strings
* - Handling S3 access errors (AccessDenied, NoSuchKey, etc.)
 */
export class S3FileReader implements IFileReader {

    private s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-2'
        })
    }

    public async readFile(bucket: string, key: string): Promise<string> {
        if (!bucket?.trim() || !key?.trim()) {
            throw new Error("S3FileReader: bucket and key are required and cannot be empty.");
        }

        try {
            const response = await this.s3Client.send(
                new GetObjectCommand({Bucket: bucket, Key: key})
            );

            if (!response.Body) {
                throw new Error(`S3FileReader: No content returned from S3 for bucket="${bucket}", key="${key}".`);
            }

            const content = await this.streamToString(response.Body as Readable);

            return content;

        } catch (error: any) {
            if (error.name === 'NoSuchKey') {
                throw new Error(`S3FileReader: File not found in bucket="${bucket}", key="${key}".`);
            }
            if (error.name === 'NoSuchBucket') {
                throw new Error(`S3FileReader: Bucket "${bucket}" does not exist.`);
            }
            if (error.name === 'AccessDenied') {
                throw new Error(`S3FileReader: Access denied to bucket="${bucket}", key="${key}". Check IAM permissions.`);
            }

            throw new Error(`S3FileReader: Failed to read file from S3. Bucket="${bucket}", Key="${key}". Original error: ${error.message}`);
        }
    }

    private async streamToString(stream: Readable): Promise<string> {
        return await new Promise((resolve, reject) => {
            const chunks: Uint8Array[] = [];
            stream.on("data", chunk => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        });
    }
} 