jest.mock('../../src/infraestructure/di/container', () => ({
    Container: {
        getS3FileReader: jest.fn(),
        getSalesReportInstance: jest.fn(),
        getDynamoMetadataRepository: jest.fn()
    }
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

const { Container } = require('../../src/infraestructure/di/container');
const { ProcessSalesReportUseCase } = require('../../src/applications/ProcessSalesReportUseCase');

describe('ProcessSalesReportUseCase', () => {
    let useCase;
    let mockS3FileReader;
    let mockSalesReportParser;
    let mockDynamoRepository;

    const validCsvContent = `id_venda,data,cliente,produto,quantidade,valor_unitario,valor_total
1,2024-01-01,João,Produto A,10,50.00,500.00`;

    const mockSalesReport = {
        id: 'test-uuid',
        fileName: 'test.csv',
        getSummary: () => ({ id: 'test-uuid', totalSales: 500 })
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockS3FileReader = { readFile: jest.fn() };
        mockSalesReportParser = { parse: jest.fn() };
        mockDynamoRepository = { save: jest.fn() };

        Container.getS3FileReader.mockReturnValue(mockS3FileReader);
        Container.getSalesReportInstance.mockReturnValue(mockSalesReportParser);
        Container.getDynamoMetadataRepository.mockReturnValue(mockDynamoRepository);

        useCase = new ProcessSalesReportUseCase();
    });

    describe('execute', () => {
        it('deve processar arquivo com sucesso', async () => {
            mockS3FileReader.readFile.mockResolvedValue(validCsvContent);
            mockSalesReportParser.parse.mockReturnValue(mockSalesReport);
            mockDynamoRepository.save.mockResolvedValue();

            const result = await useCase.execute('test-bucket', 'uploads/test.csv', 'test.csv');

            expect(result.success).toBe(true);
            expect(result.reportId).toBe('test-uuid');
            expect(result.fileName).toBe('test.csv');
            expect(mockS3FileReader.readFile).toHaveBeenCalledWith('test-bucket', 'uploads/test.csv');
            expect(mockDynamoRepository.save).toHaveBeenCalledWith(mockSalesReport);
        });

        it('deve lançar erro quando bucket está vazio', async () => {
            await expect(useCase.execute('', 'key', 'file.csv'))
                .rejects.toThrow('bucket, key and fileName are required');
        });

        it('deve lançar erro quando key está vazio', async () => {
            await expect(useCase.execute('bucket', '', 'file.csv'))
                .rejects.toThrow('bucket, key and fileName are required');
        });

        it('deve lançar erro quando fileName está vazio', async () => {
            await expect(useCase.execute('bucket', 'key', ''))
                .rejects.toThrow('bucket, key and fileName are required');
        });

        it('deve lançar erro quando conteúdo do arquivo está vazio', async () => {
            mockS3FileReader.readFile.mockResolvedValue('');

            await expect(useCase.execute('bucket', 'key', 'file.csv'))
                .rejects.toThrow('Failed to process sales report');
        });

        it('deve lançar erro quando S3 falha', async () => {
            mockS3FileReader.readFile.mockRejectedValue(new Error('S3 error'));

            await expect(useCase.execute('bucket', 'key', 'file.csv'))
                .rejects.toThrow('Failed to process sales report');
        });

        it('deve lançar erro quando DynamoDB falha', async () => {
            mockS3FileReader.readFile.mockResolvedValue(validCsvContent);
            mockSalesReportParser.parse.mockReturnValue(mockSalesReport);
            mockDynamoRepository.save.mockRejectedValue(new Error('DynamoDB error'));

            await expect(useCase.execute('bucket', 'key', 'file.csv'))
                .rejects.toThrow('Failed to process sales report');
        });
    });
});
