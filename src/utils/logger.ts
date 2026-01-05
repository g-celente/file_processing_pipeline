export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogEntry {
    level: LogLevel,
    message: string,
    timestamp: string,
    requestId?: string;
    metadata?: any;
}

export class Logger {

    private static instance: Logger;
    private logLevel: LogLevel;

    private constructor () {
        this.logLevel = (process.env.LOG_LEVEL as LogLevel) || "INFO";
    }

    public static getInstance (): Logger {
        if (!Logger.instance) {
            return Logger.instance = new Logger();
        }

        return Logger.instance;
    }

    debug ( message:string, metadata?:any ) {
        if (this.shouldLog("DEBUG")) {
            this.output(this.formatLog("DEBUG", message, metadata));
        }
    }

    info ( message:string, metadata?:any ) {
        if (this.shouldLog("INFO")) {
            this.output(this.formatLog("INFO", message, metadata));
        }
    }

    warn ( message:string, metadata?:any ) {
        if (this.shouldLog("WARN")) {
            this.output(this.formatLog("WARN", message, metadata));
        }
    }

    error ( message:string, metadata?:any ) {
        if (this.shouldLog("ERROR")) {
            this.output(this.formatLog("ERROR", message, metadata));
        }
    }


    private shouldLog(level: LogLevel): boolean {
        const priority = {
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4
        };

        return priority[level] >= priority[this.logLevel];
    }

    private formatLog(level: LogLevel, message: string, metadata?: any): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID,
            metadata
        };
    }

    private output(entry: LogEntry): void {
        console.log(JSON.stringify(entry));
    }
}