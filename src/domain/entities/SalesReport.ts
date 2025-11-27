import { randomUUID } from 'crypto';

export interface SalesReportPeriod {
    start: string | null;
    end: string | null;
}

export interface SalesReportConstructorParams {
    fileName: string;
    columns: string[];
    rowCount: number;
    period: SalesReportPeriod;
    totalItemsSold: number;
    totalSales: number;
    bestSeller: string | null;
    topRevenueProduct: string | null;
    s3Bucket: string;
    s3Key: string;
    processedAt?: string;
}

export interface SalesReportJSON {
    id: string;
    fileName: string;
    type: string;
    columns: string[];
    rowCount: number;
    period: SalesReportPeriod;
    totalItemsSold: number;
    totalSales: number;
    bestSeller: string | null;
    topRevenueProduct: string | null;
    s3Bucket: string;
    s3Key: string;
    extractionStatus: 'success' | 'failed';
    processedAt: string;
    errorMessage?: string;
}

export interface SalesReportSummary {
    id: string;
    fileName: string;
    totalSales: number;
    totalItemsSold: number;
    bestSeller: string | null;
    period: SalesReportPeriod;
    status: 'success' | 'failed';
}

export class SalesReport {
    public readonly id: string;
    public readonly fileName: string;
    public readonly type: string = 'sales_report';
    public readonly columns: string[];
    public readonly rowCount: number;
    public readonly period: SalesReportPeriod;
    public readonly totalItemsSold: number;
    public readonly totalSales: number;
    public readonly bestSeller: string | null;
    public readonly topRevenueProduct: string | null;
    public readonly s3Bucket: string;
    public readonly s3Key: string;
    public extractionStatus: 'success' | 'failed';
    public processedAt: string;
    public errorMessage?: string;

    constructor(params: SalesReportConstructorParams) {
        this.id = randomUUID();
        this.fileName = params.fileName;
        this.columns = params.columns || [];
        this.rowCount = params.rowCount || 0;
        this.period = params.period || { start: null, end: null };
        this.totalItemsSold = params.totalItemsSold || 0;
        this.totalSales = params.totalSales || 0;
        this.bestSeller = params.bestSeller || null;
        this.topRevenueProduct = params.topRevenueProduct || null;
        this.s3Bucket = params.s3Bucket;
        this.s3Key = params.s3Key;
        this.extractionStatus = 'success';
        this.processedAt = params.processedAt || new Date().toISOString();

        this.validate();
    }

    private validate(): void {
        if (!this.fileName || typeof this.fileName !== 'string') {
            throw new Error("SalesReport must have a valid fileName.");
        }

        if (!this.s3Bucket || typeof this.s3Bucket !== 'string') {
            throw new Error("SalesReport must have a valid s3Bucket.");
        }

        if (!this.s3Key || typeof this.s3Key !== 'string') {
            throw new Error("SalesReport must have a valid s3Key.");
        }

        if (!Array.isArray(this.columns) || this.columns.length === 0) {
            throw new Error("SalesReport must have at least one column.");
        }

        if (typeof this.rowCount !== 'number' || this.rowCount < 0) {
            throw new Error("SalesReport must have a valid rowCount (non-negative number).");
        }

        if (!this.period || !this.period.start || !this.period.end) {
            throw new Error("SalesReport must have a valid period with start and end dates.");
        }

        if (typeof this.totalItemsSold !== 'number' || this.totalItemsSold < 0) {
            throw new Error("SalesReport must have a valid totalItemsSold (non-negative number).");
        }

        if (typeof this.totalSales !== 'number' || this.totalSales < 0) {
            throw new Error("SalesReport must have a valid totalSales (non-negative number).");
        }

        if (this.bestSeller !== null && typeof this.bestSeller !== 'string') {
            throw new Error("SalesReport bestSeller must be a string or null.");
        }

        if (this.topRevenueProduct !== null && typeof this.topRevenueProduct !== 'string') {
            throw new Error("SalesReport topRevenueProduct must be a string or null.");
        }
    }

    public markAsFailure(errorMessage: string): void {
        this.extractionStatus = 'failed';
        this.errorMessage = errorMessage;
        this.processedAt = new Date().toISOString();
    }

    public toJSON(): SalesReportJSON {
        const json: SalesReportJSON = {
            id: this.id,
            fileName: this.fileName,
            type: this.type,
            columns: this.columns,
            rowCount: this.rowCount,
            period: this.period,
            totalItemsSold: this.totalItemsSold,
            totalSales: this.totalSales,
            bestSeller: this.bestSeller,
            topRevenueProduct: this.topRevenueProduct,
            s3Bucket: this.s3Bucket,
            s3Key: this.s3Key,
            extractionStatus: this.extractionStatus,
            processedAt: this.processedAt
        };

        if (this.errorMessage) {
            json.errorMessage = this.errorMessage;
        }

        return json;
    }

    public getSummary(): SalesReportSummary {
        return {
            id: this.id,
            fileName: this.fileName,
            totalSales: this.totalSales,
            totalItemsSold: this.totalItemsSold,
            bestSeller: this.bestSeller,
            period: this.period,
            status: this.extractionStatus
        };
    }

    public isWithinPeriod(startDate: string | Date, endDate: string | Date): boolean {
        const reportStart = new Date(this.period.start!);
        const reportEnd = new Date(this.period.end!);
        const start = new Date(startDate);
        const end = new Date(endDate);

        return reportStart >= start && reportEnd <= end;
    }

    public isLargeReport(threshold: number = 1000): boolean {
        return this.rowCount > threshold;
    }
}
