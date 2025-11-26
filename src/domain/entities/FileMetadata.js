const randomUUID = require('crypto').randomUUID;

class FileMetadata {
    constructor({ filename, size, mimeType, s3Bucket, s3Key, createdAt, updatedAt }) {
        this.id = randomUUID();
        this.filename = filename;
        this.size = size;
        this.mimeType = mimeType;
        this.s3Bucket = s3Bucket;
        this.s3Key = s3Key;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

        this.metadata = {};

        this.validate();
    }

    addMetadata(key, value) {
        if (typeof key !== 'string' || key.length === 0) {
            throw new Error("Metadata key must be a non-empty string.");
        }
        this.metadata[key] = value;
    }

    getMetadata(key) {
        return this.metadata[key];
    }

    toJSON() {
        return {
            id: this.id,
            filename: this.filename,
            size: this.size,
            mimeType: this.mimeType,
            s3Bucket: this.s3Bucket,
            s3Key: this.s3Key,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    validate() {
        if (!this.filename || typeof this.filename !== 'string') {
            throw new Error("FileMetadata must have a valid filename.");
        }
        if (typeof this.size !== 'number' || this.size < 0) {
            throw new Error("FileMetadata must have a valid size.");
        }
        if (!this.mimeType || typeof this.mimeType !== 'string') {
            throw new Error("FileMetadata must have a valid mimeType.");
        }
        if (!this.s3Bucket || typeof this.s3Bucket !== 'string') {
            throw new Error("FileMetadata must have a valid s3Bucket.");
        }
        if (!this.s3Key || typeof this.s3Key !== 'string') {
            throw new Error("FileMetadata must have a valid s3Key.");
        }
        if (!(this.createdAt instanceof Date)) {
            throw new Error("FileMetadata must have a valid createdAt date.");
        }
        if (!(this.updatedAt instanceof Date)) {
            throw new Error("FileMetadata must have a valid updatedAt date.");
        }
    }
}

module.exports = FileMetadata;