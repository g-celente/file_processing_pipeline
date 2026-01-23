import { Container } from '../infraestructure/di/container';
import { S3Event } from 'aws-lambda';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();
const useCase = Container.getSalesProcessUseCase();
const dlqService = Container.getDeadLetterQueueService();

export const handler = async (event: S3Event) => {
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const fileName = key.split('/').pop() || key;

    try {
        const result = await useCase.execute(bucket, key, fileName);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'File processed successfully',
                result: result
            })
        };

    } catch (error) {
        logger.error('Error processing file:', { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });

        await dlqService.sendToQueue(bucket, key, fileName, error as Error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to process file',
                error: error instanceof Error ? error.message : String(error)
            })
        };
    }
};