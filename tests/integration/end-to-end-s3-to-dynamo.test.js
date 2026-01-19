const { Readable } = require('stream');

const mockS3Send = jest.fn();
const mockDynamoSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({
        send: mockS3Send
    })),
    GetObjectCommand: jest.fn().mockImplementation((params) => params)
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn().mockImplementation(() => ({
            send: mockDynamoSend
        }))
    },
    PutCommand: jest.fn().mockImplementation((params) => params),
    GetCommand: jest.fn().mockImplementation((params) => params)
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

describe('End-to-End: S3 to DynamoDB', () => {
    const validCsvContent = `id_venda,data,cliente,produto,quantidade,valor_unitario,valor_total
1,2024-01-01,João,Produto A,10,50.00,500.00
2,2024-01-02,Maria,Produto B,5,100.00,500.00
3,2024-01-03,Pedro,Produto A,20,50.00,1000.00`;

    const createS3Event = (bucket, key) => ({
        Records: [{
            s3: {
                bucket: { name: bucket },
                object: { key: key }
            }
        }]
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        process.env.AWS_REGION = 'us-east-2';
        process.env.DYNAMO_TABLE = 'test-table';
    });

    it('deve processar arquivo CSV do S3 e salvar no DynamoDB', async () => {
        const mockStream = Readable.from([Buffer.from(validCsvContent)]);
        mockS3Send.mockResolvedValue({ Body: mockStream });
        mockDynamoSend.mockResolvedValue({});

        const { handler } = require('../../src/interface/handler');

        const event = createS3Event('test-bucket', 'uploads/sales-report.csv');
        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        
        const body = JSON.parse(result.body);
        expect(body.message).toBe('File processed successfully');
        expect(body.result.success).toBe(true);
        expect(body.result.fileName).toBe('sales-report.csv');
    });

    it('deve retornar erro 500 quando S3 falha', async () => {
        mockS3Send.mockRejectedValue(new Error('S3 connection failed'));

        jest.resetModules();
        const { handler } = require('../../src/interface/handler');

        const event = createS3Event('test-bucket', 'uploads/test.csv');
        const result = await handler(event);

        expect(result.statusCode).toBe(500);
        
        const body = JSON.parse(result.body);
        expect(body.message).toBe('Failed to process file');
    });

    it('deve decodificar corretamente keys com caracteres especiais', async () => {
        const mockStream = Readable.from([Buffer.from(validCsvContent)]);
        mockS3Send.mockResolvedValue({ Body: mockStream });
        mockDynamoSend.mockResolvedValue({});

        jest.resetModules();
        const { handler } = require('../../src/interface/handler');

        const event = createS3Event('test-bucket', 'uploads/relatorio+de+vendas.csv');
        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        
        const body = JSON.parse(result.body);
        expect(body.result.fileName).toBe('relatorio de vendas.csv');
    });

    it('deve extrair fileName corretamente de path com subpastas', async () => {
        const mockStream = Readable.from([Buffer.from(validCsvContent)]);
        mockS3Send.mockResolvedValue({ Body: mockStream });
        mockDynamoSend.mockResolvedValue({});

        jest.resetModules();
        const { handler } = require('../../src/interface/handler');

        const event = createS3Event('test-bucket', 'uploads/2024/01/sales.csv');
        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        
        const body = JSON.parse(result.body);
        expect(body.result.fileName).toBe('sales.csv');
    });
});
