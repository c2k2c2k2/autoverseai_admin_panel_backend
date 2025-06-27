import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentDbUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.dbUser;

        return data ? user?.[data] : user;
    },
);