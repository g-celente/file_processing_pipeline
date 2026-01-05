import { SalesReport } from "../../domain/entities/SalesReport";
import { Logger } from "../../utils/logger";

const logger = Logger.getInstance();

export interface ParsedSalesRow {
    id_venda: string;
    data: string;
    cliente: string;
    produto: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
}

export class SalesReportParser {

    public parse(csvContent: string, bucket: string, key: string, fileName: string): SalesReport {
        if (!csvContent || !csvContent.trim()) {
            throw new Error("SalesReportParser: CSV content cannot be empty.");
        }

        const lines = csvContent.trim().split('\n');
        
        if (lines.length < 2) {
            throw new Error("SalesReportParser: CSV must have at least a header and one data row.");
        }

        const headerLine = lines[0].trim();
        const columns = headerLine.split(',').map(col => col.trim());

        this.validateColumns(columns);

        const dataRows = lines.slice(1);
        const parsedRows = this.parseDataRows(dataRows, columns);

        const metrics = this.calculateMetrics(parsedRows);

        return new SalesReport({
            fileName: fileName,
            columns: columns,
            rowCount: parsedRows.length,
            period: metrics.period,
            totalItemsSold: metrics.totalItemsSold,
            totalSales: metrics.totalSales,
            bestSeller: metrics.bestSeller,
            topRevenueProduct: metrics.topRevenueProduct,
            s3Bucket: bucket,
            s3Key: key
        });
    }

    private validateColumns(columns: string[]): void {
        const requiredColumns = [
            'id_venda',
            'data',
            'cliente',
            'produto',
            'quantidade',
            'valor_unitario',
            'valor_total'
        ];

        for (const required of requiredColumns) {
            if (!columns.includes(required)) {
                throw new Error(`SalesReportParser: Missing required column '${required}'.`);
            }
        }
    }

    private parseDataRows(dataRows: string[], columns: string[]): ParsedSalesRow[] {
        const parsed: ParsedSalesRow[] = [];

        for (let i = 0; i < dataRows.length; i++) {
            const line = dataRows[i].trim();
            
            if (!line) continue; 

            const values = line.split(',').map(v => v.trim());

            if (values.length !== columns.length) {
                logger.warn('Row has incorrect number of values', { 
                    rowNumber: i + 2, 
                    expectedColumns: columns.length, 
                    actualValues: values.length 
                });
                continue;
            }

            try {
                const row: any = {};
                columns.forEach((col, idx) => {
                    row[col] = values[idx];
                });

                row.quantidade = parseInt(row.quantidade, 10);
                row.valor_unitario = parseFloat(row.valor_unitario);
                row.valor_total = parseFloat(row.valor_total);

                if (isNaN(row.quantidade) || isNaN(row.valor_unitario) || isNaN(row.valor_total)) {
                    throw new Error(`Invalid numeric values in row ${i + 2}`);
                }

                parsed.push(row as ParsedSalesRow);
            } catch (error) {
                logger.warn('Error parsing row', { 
                    rowNumber: i + 2, 
                    error: error instanceof Error ? error.message : String(error)
                });
                logger.warn(`SalesReportParser: Error parsing row ${i + 2}: ${error}. Skipping.`);
            }
        }

        return parsed;
    }

    private calculateMetrics(rows: ParsedSalesRow[]) {
        if (rows.length === 0) {
            return {
                period: { start: null, end: null },
                totalItemsSold: 0,
                totalSales: 0,
                bestSeller: null,
                topRevenueProduct: null
            };
        }

        const dates = rows.map(r => r.data).sort();
        const period = {
            start: dates[0],
            end: dates[dates.length - 1]
        };

        const totalItemsSold = rows.reduce((sum, row) => sum + row.quantidade, 0);

        const totalSales = rows.reduce((sum, row) => sum + row.valor_total, 0);

        const productQuantities: { [key: string]: number } = {};
        rows.forEach(row => {
            productQuantities[row.produto] = (productQuantities[row.produto] || 0) + row.quantidade;
        });
        const bestSeller = Object.keys(productQuantities).reduce((a, b) => 
            productQuantities[a] > productQuantities[b] ? a : b
        );

        const productRevenues: { [key: string]: number } = {};
        rows.forEach(row => {
            productRevenues[row.produto] = (productRevenues[row.produto] || 0) + row.valor_total;
        });
        const topRevenueProduct = Object.keys(productRevenues).reduce((a, b) => 
            productRevenues[a] > productRevenues[b] ? a : b
        );

        return {
            period,
            totalItemsSold,
            totalSales: parseFloat(totalSales.toFixed(2)),
            bestSeller,
            topRevenueProduct
        };
    }
}