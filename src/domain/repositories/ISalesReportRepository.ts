import { SalesReport } from '../entities/SalesReport';

/**
 * Interface for Sales Report Repository
 * Defines methods for saving and retrieving sales reports.
 * @interface ISalesReportRepository
 * @method save
 * @method findById
 */
export interface ISalesReportRepository {
    save(report: SalesReport): Promise<void>;
    findById(id: string): Promise<SalesReport | null>;
}