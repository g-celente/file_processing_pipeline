import { Container } from "../infraestructure/di/container";
import { Logger } from "../utils/logger";

const logger = Logger.getInstance();

export class ProcessSalesReportUseCase {

    private s3FileReader;
    private salesReportParser;
    private dynamoMetadataRepository;

    constructor() {
        this.s3FileReader = Container.getS3FileReader();
        this.salesReportParser = Container.getSalesReportInstance();
        this.dynamoMetadataRepository = Container.getDynamoMetadataRepository();
    }

    public async execute(bucket: string, key: string, fileName: string) {
        if (!bucket?.trim() || !key?.trim() || !fileName?.trim()) {
            throw new Error("ProcessSalesReportUseCase: bucket, key and fileName are required and cannot be empty.");
        }


        try {
            const fileContent = await this.s3FileReader.readFile(bucket, key);

            if (!fileContent) {
                throw new Error("ProcessSalesReportUseCase: file content not found");
            }
            const salesReport = this.salesReportParser.parse(fileContent, bucket, key, fileName);

            await this.dynamoMetadataRepository.save(salesReport);

            return {
                success: true,
                reportId: salesReport.id,
                fileName: salesReport.fileName,
                summary: salesReport.getSummary()
            };

        } catch (error) {
            logger.error('Failed to process sales report', { 
                fileName,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw new Error(`Failed to process sales report: ${error}`);
        }
    }
}