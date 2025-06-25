import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors: any[] = [];

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || message;
                errors = (exceptionResponse as any).message
                    ? Array.isArray((exceptionResponse as any).message)
                        ? (exceptionResponse as any).message
                        : [(exceptionResponse as any).message]
                    : [];
            } else {
                message = exceptionResponse as string;
            }
        } else if (exception instanceof QueryFailedError) {
            status = HttpStatus.BAD_REQUEST;
            message = 'Database query failed';

            // Handle specific database errors
            if (exception.message.includes('duplicate key value')) {
                message = 'Resource already exists';
                status = HttpStatus.CONFLICT;
            } else if (exception.message.includes('foreign key constraint')) {
                message = 'Referenced resource not found';
                status = HttpStatus.BAD_REQUEST;
            }

            errors = [exception.message];
        } else if (exception instanceof Error) {
            message = exception.message;
            errors = [exception.message];
        }

        // Log the error
        this.logger.error(
            `${request.method} ${request.url}`,
            exception instanceof Error ? exception.stack : exception,
        );

        const errorResponse = {
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
            path: request.url,
            statusCode: status,
        };

        response.status(status).json(errorResponse);
    }
}