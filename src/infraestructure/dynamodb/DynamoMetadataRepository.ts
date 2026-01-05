import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SalesReport } from "../../domain/entities/SalesReport";
import { ISalesReportRepository } from "../../domain/repositories/ISalesReportRepository";
import { Logger } from "../../utils/logger";

const logger = Logger.getInstance();

export class DynamoMetadaRepository implements ISalesReportRepository {
    private readonly docClient: DynamoDBDocumentClient;
    private readonly tableName: string;

    constructor() {
        const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.DYNAMO_TABLE!;
    }

    public async save(report: SalesReport): Promise<void> {
        if (!report) {
            throw new Error("DynamoMetadataRepository: report cannot be null or undefined.");
        }

        try {
            const item = report.toJSON();

            const command = new PutCommand({
                TableName: this.tableName,
                Item: {
                    ...item,
                    pk: `REPORT#${report.id}`,
                    sk: `METADATA#${report.processedAt}`,
                    gsi1pk: `FILE#${report.fileName}`,
                    gsi1sk: report.processedAt,
                }
            });

            await this.docClient.send(command);
        } catch (error) {
            logger.error('Failed to save report to DynamoDB', { 
                reportId: report.id,
                tableName: this.tableName,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`Failed to save report to DynamoDB: ${error}`);
        }
    }

    public async findById(id: string): Promise<SalesReport | null> {
        if (!id || !id.trim()) {
            throw new Error("DynamoMetadataRepository: id cannot be empty.");
        }

        try {
            const command = new GetCommand({
                TableName: this.tableName,
                Key: {
                    pk: `REPORT#${id}`,
                }
            });

            const response = await this.docClient.send(command);

            if (!response.Item) {
                logger.info('Report not found in DynamoDB', { reportId: id });
                return null;
            }

            const item = response.Item;
            return new SalesReport({
                fileName: item.fileName,
                columns: item.columns,
                rowCount: item.rowCount,
                period: item.period,
                totalItemsSold: item.totalItemsSold,
                totalSales: item.totalSales,
                bestSeller: item.bestSeller,
                topRevenueProduct: item.topRevenueProduct,
                s3Bucket: item.s3Bucket,
                s3Key: item.s3Key,
                processedAt: item.processedAt
            });
        } catch (error) {
            logger.error('Failed to fetch report from DynamoDB', { 
                reportId: id,
                tableName: this.tableName,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`Failed to fetch report from DynamoDB: ${error}`);
        }
    }
}