import { Body, Controller, Get, Headers, Param, ParseIntPipe, Post, Query, Req, HttpCode, BadRequestException,  } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { PaymentsService } from './payments.service';
import { SafepayService } from './safepay.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly safepay: SafepayService,
  ) {}

  @Public()
  @Post('create-session')
  @ApiOperation({ summary: 'Create a SafePay hosted checkout session for a donation' })
  @ApiResponse({ status: 201, description: 'SafePay checkout URL returned successfully' })
  async createSession(@Body() dto: CreatePaymentSessionDto) {
    // ✅ Pass null for organizationId - it will be derived from campaignSlug
    return this.paymentsService.createSession(dto, null);
  }

  @Public()
  @Get('success')
  @ApiOperation({ summary: 'Redirect landing page for successful SafePay checkout' })
  async success(@Query('reference') reference?: string) {
    if (reference) {
      await this.paymentsService.handleSuccessfulCheckout({ reference });
    }
    return { ok: true, message: 'Payment confirmation is pending verification' };
  }

  @Public()
  @Get('cancel')
  @ApiOperation({ summary: 'Redirect landing page for cancelled SafePay checkout' })
  async cancel() {
    return { ok: true, message: 'Payment cancelled' };
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Receive and verify SafePay webhook events' })
  async webhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody = req.body;
    const parsedBody = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

    const isValid = await this.safepay.verifyWebhook({
      headers,
      body: parsedBody,
      rawBody: typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
    });

    if (!isValid) {
      return { received: false, message: 'Invalid signature' };
    }

    return this.paymentsService.processWebhook(parsedBody);
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'SafePay webhook endpoint' })
  async handleWebhook(@Req() req: any, @Body() payload: any) {
    // 1. Verify the webhook signature
    const isVerified = await this.safepay.verifyWebhook({
      headers: req.headers,
      body: payload,
      rawBody: req.rawBody || req.body,
    });

    if (!isVerified) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Process the verified webhook
    const result = await this.paymentsService.processWebhook(payload);
    return result;
  }

  @Public()
  @Get('session-status/:sessionId')
  @ApiOperation({ summary: 'Check whether a SafePay session has completed' })
  async sessionStatus(@Param('sessionId') sessionId: string) {
    return this.paymentsService.verifySessionStatus(sessionId);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List subscriptions for the current organization' })
  async listSubscriptions(@CurrentOrganization() organizationId: number | null) {
    if (!organizationId) {
      return [];
    }
    return this.paymentsService.getSubscriptionList(organizationId);
  }

  @Post('subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Cancel a recurring subscription' })
  async cancelSubscription(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) subscriptionId: number,
  ) {
    if (!organizationId) {
      return { ok: false, message: 'Organization context is required' };
    }
    return this.paymentsService.cancelSubscription(subscriptionId, organizationId);
  }
}