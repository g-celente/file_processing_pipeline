const { Readable } = require('stream');

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({
        send: mockSend
    })),
    GetObjectCommand: jest.fn().mockImplementation((params) => params)
}));

const { S3FileReader } = require('../../src/infraestructure/s3/S3FileReader');

describe('S3FileReader', () => {
    let s3FileReader;

    beforeEach(() => {
        jest.clearAllMocks();
        s3FileReader = new S3FileReader();
    });

    describe('readFile', () => {
        it('deve ler arquivo do S3 com sucesso', async () => {
            const csvContent = 'id_venda,data,cliente\n1,2024-01-01,João';
            const mockStream = Readable.from([Buffer.from(csvContent)]);

            mockSend.mockResolvedValue({ Body: mockStream });

            const result = await s3FileReader.readFile('test-bucket', 'test-key.csv');

            expect(result).toBe(csvContent);
            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('deve lançar erro quando bucket está vazio', async () => {
            await expect(s3FileReader.readFile('', 'test-key.csv'))
                .rejects.toThrow('bucket and key are required and cannot be empty');
        });

        it('deve lançar erro quando key está vazio', async () => {
            await expect(s3FileReader.readFile('test-bucket', ''))
                .rejects.toThrow('bucket and key are required and cannot be empty');
        });

        it('deve lançar erro quando bucket e key são apenas espaços', async () => {
            await expect(s3FileReader.readFile('   ', '   '))
                .rejects.toThrow('bucket and key are required and cannot be empty');
        });

        it('deve tratar erro NoSuchKey', async () => {
            const error = new Error('File not found');
            error.name = 'NoSuchKey';
            mockSend.mockRejectedValue(error);

            await expect(s3FileReader.readFile('test-bucket', 'missing.csv'))
                .rejects.toThrow('File not found in bucket="test-bucket"');
        });

        it('deve tratar erro NoSuchBucket', async () => {
            const error = new Error('Bucket not found');
            error.name = 'NoSuchBucket';
            mockSend.mockRejectedValue(error);

            await expect(s3FileReader.readFile('invalid-bucket', 'test.csv'))
                .rejects.toThrow('Bucket "invalid-bucket" does not exist');
        });

        it('deve tratar erro AccessDenied', async () => {
            const error = new Error('Access denied');
            error.name = 'AccessDenied';
            mockSend.mockRejectedValue(error);

            await expect(s3FileReader.readFile('test-bucket', 'test.csv'))
                .rejects.toThrow('Access denied to bucket="test-bucket"');
        });

        it('deve lançar erro quando Body é undefined', async () => {
            mockSend.mockResolvedValue({ Body: undefined });

            await expect(s3FileReader.readFile('test-bucket', 'test.csv'))
                .rejects.toThrow('No content returned from S3');
        });
    });
});
