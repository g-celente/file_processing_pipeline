import { ProcessSalesReportUseCase } from "../../applications/ProcessSalesReportUseCase";
import { DynamoMetadaRepository } from "../dynamodb/DynamoMetadataRepository";
import { SalesReportParser } from "../parsers/SalesReportParser";
import { S3FileReader } from "../s3/S3FileReader";


/**
 * Container: Implement Container de Injeção de Dependências
 * @
 */
export class Container {
    private static salesReport: SalesReportParser;
    private static s3FileReader: S3FileReader;
    private static salesProcessUseCase: ProcessSalesReportUseCase;
    private static dynamoMetadataRepository: DynamoMetadaRepository;
    
    private constructor() {

    }

    static getSalesReportInstance(): SalesReportParser {
        if (!this.salesReport) {
            this.salesReport = new SalesReportParser();
        }

        return this.salesReport;
    }

    static getS3FileReader(): S3FileReader {
        if (!this.s3FileReader) {
            this.s3FileReader = new S3FileReader();
        }

        return this.s3FileReader;
    }

    static getSalesProcessUseCase(): ProcessSalesReportUseCase {
        if (!this.salesProcessUseCase) {
            this.salesProcessUseCase = new ProcessSalesReportUseCase();
        }

        return this.salesProcessUseCase;
    }

    static getDynamoMetadataRepository(): DynamoMetadaRepository {
        if (!this.dynamoMetadataRepository) {
            this.dynamoMetadataRepository = new DynamoMetadaRepository();
        }

        return this.dynamoMetadataRepository;
    }
}