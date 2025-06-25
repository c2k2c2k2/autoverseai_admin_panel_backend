import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentLicense = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const license = request.license;

        return data ? license?.[data] : license;
    },
);