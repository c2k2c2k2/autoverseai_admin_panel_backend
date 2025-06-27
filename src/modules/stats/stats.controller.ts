import {
    Controller,
    Get,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { OverviewStatsDto } from './dto/overview-stats.dto';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';

@ApiTags('Stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get()
    @AdminOnly()
    @ApiOperation({ summary: 'Get overview statistics for dashboard' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Overview statistics retrieved successfully',
        type: OverviewStatsDto,
    })
    async getOverviewStats(): Promise<OverviewStatsDto> {
        return this.statsService.getOverviewStats();
    }
}
