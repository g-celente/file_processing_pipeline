const mockSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn().mockImplementation(() => ({
            send: mockSend
        }))
    },
    PutCommand: jest.fn().mockImplementation((params) => ({ type: 'PUT', ...params })),
    GetCommand: jest.fn().mockImplementation((params) => ({ type: 'GET', ...params }))
}));

jest.mock('../../src/utils/logger', () => ({
    Logger: {
        getInstance: () => ({
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn()
        })
    }
}));

jest.mock('../../src/domain/entities/SalesReport', () => ({
    SalesReport: jest.fn().mockImplementation((params) => ({
        id: 'test-uuid',
        fileName: params.fileName,
        processedAt: params.processedAt || '2024-01-01T00:00:00.000Z',
        toJSON: () => ({
            id: 'test-uuid',
            fileName: params.fileName,
            columns: params.columns,
            rowCount: params.rowCount,
            period: params.period,
            totalItemsSold: params.totalItemsSold,
            totalSales: params.totalSales,
            bestSeller: params.bestSeller,
            topRevenueProduct: params.topRevenueProduct,
            s3Bucket: params.s3Bucket,
            s3Key: params.s3Key,
            processedAt: params.processedAt
        })
    }))
}));

const { DynamoMetadaRepository } = require('../../src/infraestructure/dynamodb/DynamoMetadataRepository');

describe('DynamoMetadataRepository', () => {
    let repository;

    const mockReport = {
        id: 'test-uuid',
        fileName: 'test.csv',
        processedAt: '2024-01-01T00:00:00.000Z',
        toJSON: () => ({
            id: 'test-uuid',
            fileName: 'test.csv',
            columns: ['id_venda', 'data'],
            rowCount: 10,
            period: { start: '2024-01-01', end: '2024-01-31' },
            totalItemsSold: 100,
            totalSales: 5000,
            bestSeller: 'Produto A',
            topRevenueProduct: 'Produto A',
            s3Bucket: 'test-bucket',
            s3Key: 'test-key'
        })
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.DYNAMO_TABLE = 'test-table';
        repository = new DynamoMetadaRepository();
    });

    describe('save', () => {
        it('deve salvar relatório com sucesso', async () => {
            mockSend.mockResolvedValue({});

            await repository.save(mockReport);

            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('deve lançar erro quando report é null', async () => {
            await expect(repository.save(null))
                .rejects.toThrow('report cannot be null or undefined');
        });

        it('deve lançar erro quando report é undefined', async () => {
            await expect(repository.save(undefined))
                .rejects.toThrow('report cannot be null or undefined');
        });

        it('deve lançar erro quando DynamoDB falha', async () => {
            mockSend.mockRejectedValue(new Error('DynamoDB error'));

            await expect(repository.save(mockReport))
                .rejects.toThrow('Failed to save report to DynamoDB');
        });
    });

    describe('findById', () => {
        it('deve retornar null quando relatório não existe', async () => {
            mockSend.mockResolvedValue({ Item: undefined });

            const result = await repository.findById('non-existent-id');

            expect(result).toBeNull();
        });

        it('deve lançar erro quando id está vazio', async () => {
            await expect(repository.findById(''))
                .rejects.toThrow('id cannot be empty');
        });

        it('deve lançar erro quando id é apenas espaços', async () => {
            await expect(repository.findById('   '))
                .rejects.toThrow('id cannot be empty');
        });

        it('deve lançar erro quando DynamoDB falha', async () => {
            mockSend.mockRejectedValue(new Error('DynamoDB error'));

            await expect(repository.findById('test-id'))
                .rejects.toThrow('Failed to fetch report from DynamoDB');
        });

        it('deve buscar relatório com sucesso', async () => {
            const mockItem = {
                fileName: 'test.csv',
                columns: ['id_venda', 'data'],
                rowCount: 10,
                period: { start: '2024-01-01', end: '2024-01-31' },
                totalItemsSold: 100,
                totalSales: 5000,
                bestSeller: 'Produto A',
                topRevenueProduct: 'Produto A',
                s3Bucket: 'test-bucket',
                s3Key: 'test-key',
                processedAt: '2024-01-01T00:00:00.000Z'
            };

            mockSend.mockResolvedValue({ Item: mockItem });

            const result = await repository.findById('test-id');

            expect(result).not.toBeNull();
            expect(mockSend).toHaveBeenCalledTimes(1);
        });
    });
});
