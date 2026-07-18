import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CampaignsService } from './campaigns.service';

@ApiTags('public-campaigns')
@Controller('public/campaigns')
export class PublicCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active public campaigns across all organizations' })
  @ApiResponse({ status: 200, description: 'Public campaigns returned successfully' })
  async findPublicCampaigns(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('search') search?: string,
  ) {
    return this.campaignsService.findPublicCampaigns(page, limit, search);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get one active public campaign by slug' })
  @ApiResponse({ status: 200, description: 'Public campaign returned successfully' })
  async findPublicCampaignBySlug(@Param('slug') slug: string) {
    return this.campaignsService.findPublicCampaignBySlug(slug);
  }
}
