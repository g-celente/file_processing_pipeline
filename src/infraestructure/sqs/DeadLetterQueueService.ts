import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Logger } from "../../utils/logger";

const logger = Logger.getInstance();

export interface FailedFileMessage {
    bucket: string;
    key: string;
    fileName: string;
    errorMessage: string;
    timestamp: string;
    retryCount: number;
}

export class DeadLetterQueueService {
    private sqsClient: SQSClient;
    private queueUrl: string | undefined;

    constructor() {
        this.sqsClient = new SQSClient({ 
            region: process.env.AWS_REGION || 'us-east-2' 
        });
        this.queueUrl = process.env.DLQ_URL;
    }

    public async sendToQueue(
        bucket: string, 
        key: string, 
        fileName: string, 
        error: Error | string,
        retryCount: number = 0
    ): Promise<boolean> {
        if (!this.queueUrl) {
            logger.warn('DLQ URL not configured, skipping');
            return false;
        }

        const message: FailedFileMessage = {
            bucket,
            key,
            fileName,
            errorMessage: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            retryCount
        };

        try {
            await this.sqsClient.send(new SendMessageCommand({
                QueueUrl: this.queueUrl,
                MessageBody: JSON.stringify(message),
                MessageAttributes: {
                    'fileName': { DataType: 'String', StringValue: fileName }
                }
            }));
            
            logger.info('Message sent to DLQ', { fileName });
            return true;
        } catch (sqsError) {
            logger.error('Failed to send to DLQ', { fileName, error: sqsError });
            return false;
        }
    }
}