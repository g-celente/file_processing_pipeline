import { SQSEvent, SQSHandler } from 'aws-lambda';
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import { Logger } from '../utils/logger';
import { Container } from '../infraestructure/di/container';
import { FailedFileMessage } from '../infraestructure/sqs/DeadLetterQueueService';

const logger = Logger.getInstance();
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-2' });
const useCase = Container.getSalesProcessUseCase();

const MAX_RETRIES = 2;
const DEAD_LETTER_PREFIX = 'dead-letter/';

export const handler: SQSHandler = async (event: SQSEvent) => {
    for (const record of event.Records) {
        const message: FailedFileMessage = JSON.parse(record.body);
        const { bucket, key, fileName, retryCount } = message;

        logger.info('Processing DLQ message', { fileName, retryCount });

        if (retryCount < MAX_RETRIES) {
            try {
                await useCase.execute(bucket, key, fileName);
                logger.info('Retry successful', { fileName, attempt: retryCount + 1 });
            } catch (error) {
                logger.error('Retry failed', { fileName, attempt: retryCount + 1, error });
                throw error;
            }
        } else {
            await moveToDeadLetter(bucket, key, fileName);
        }
    }
};

async function moveToDeadLetter(bucket: string, key: string, fileName: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const deadLetterKey = `${DEAD_LETTER_PREFIX}${date}/${fileName}`;

    try {
        await s3Client.send(new CopyObjectCommand({
            Bucket: bucket,
            CopySource: `${bucket}/${key}`,
            Key: deadLetterKey,
            Metadata: {
                'original-key': key,
                'moved-at': new Date().toISOString(),
                'reason': 'max-retries-exceeded'
            },
            MetadataDirective: 'REPLACE'
        }));

        logger.info('File moved to dead-letter', { fileName, deadLetterKey });
    } catch (error) {
        logger.error('Failed to move file to dead-letter', { fileName, error });
    }
}