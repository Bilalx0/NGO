import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Safepay } = require('@sfpy/node-sdk');

// Define the client type based on SafePay SDK
type SafepayClient = {
  payments: {
    create(params: { amount: number; currency: string }): Promise<{ token: string }>;
  };
  authorization: {
    create(): Promise<string>;
  };
  checkout: {
    create(params: {
      token: string;
      orderId: string;
      cancelUrl: string;
      redirectUrl: string;
      source?: string;
      webhooks?: boolean;
    }): string;
    createSubscription(params: {
      planId: string;
      reference: string;
      cancelUrl: string;
      redirectUrl: string;
    }): Promise<string>;
  };
  subscription: {
    cancel(subscriptionId: string): Promise<unknown>;
  };
  verify: {
    webhook(request: unknown): Promise<boolean>;
  };
};

@Injectable()
export class SafepayService {
  private readonly logger = new Logger(SafepayService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getClient(organizationId: number | null): Promise<SafepayClient> {
    const publicKey = this.config.get<string>('SAFEPAY_PUBLIC_KEY', '');
    const secretKey = this.config.get<string>('SAFEPAY_SECRET_KEY', '');
    const webhookSecret = this.config.get<string>('SAFEPAY_WEBHOOK_SECRET', '');
    const fallbackEnvironment = this.config.get<string>('SAFEPAY_ENVIRONMENT', 'sandbox');

    let paymentConfig: { apiKey?: string | null; isLiveMode?: boolean } | undefined;

    if (organizationId) {
      try {
        const orgSettings = await this.settingsService.getOrganizationSettings(organizationId);
        paymentConfig = orgSettings.paymentConfigs?.find((c) => c.provider === 'SAFEPAY');
      } catch {
        paymentConfig = undefined;
      }
    }

    const environment = paymentConfig?.isLiveMode ? 'production' : fallbackEnvironment;

    if (!secretKey) {
      throw new Error('SafePay credentials are not configured');
    }

    return new Safepay({
      environment,
      apiKey: publicKey,
      v1Secret: secretKey,
      webhookSecret,
    }) as SafepayClient;
  }

  async createCheckoutSession(params: {
    organizationId: number;
    reference: string;
    amount: number;
    currency?: string;
    cancelUrl: string;
    redirectUrl: string;
    isMonthly?: boolean;
    planId?: string;
  }): Promise<string> {
    const client = await this.getClient(params.organizationId);

    // Handle monthly/recurring donations
    if (params.isMonthly) {
      if (!params.planId) {
        throw new BadRequestException(
          'SafePay recurring plan ID is not configured. Please set SAFEPAY_DEFAULT_PLAN_ID in .env',
        );
      }

      try {
        // createSubscription returns a string URL directly
        const url = await client.checkout.createSubscription({
          planId: params.planId,
          reference: params.reference,
          cancelUrl: params.cancelUrl,
          redirectUrl: params.redirectUrl,
        });

        if (!url) {
          throw new Error('No URL returned from SafePay subscription');
        }
        return url;
      } catch (error: any) {
        this.logger.error(`SafePay subscription error: ${error.message}`, error.stack);
        throw new BadRequestException('Failed to create subscription checkout');
      }
    }

    // Handle one-time donations
    try {
      // STEP 1: Create the payment tracker with the amount
      const { token } = await client.payments.create({
        amount: Math.round(params.amount),
        currency: params.currency ?? 'PKR',
      });

      if (!token) {
        throw new Error('SafePay did not return a payment token');
      }

      // STEP 2: Build the checkout link from that payment token
      // checkout.create returns a string URL directly
      const checkoutUrl = client.checkout.create({
        token,
        orderId: params.reference,
        cancelUrl: params.cancelUrl,
        redirectUrl: params.redirectUrl,
        source: 'custom',
        webhooks: true,
      });

      if (!checkoutUrl) {
        throw new Error('No checkout URL returned from SafePay');
      }

      return checkoutUrl;
    } catch (error: any) {
      this.logger.error(`SafePay checkout error: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create checkout: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string, organizationId: number): Promise<void> {
    const client = await this.getClient(organizationId);
    await client.subscription.cancel(subscriptionId);
  }

  async verifyWebhook(request: {
    headers?: Record<string, string | string[] | undefined>;
    body?: unknown;
    rawBody?: Buffer | string;
  }): Promise<boolean> {
    try {
      const client = await this.getClient(null);
      return await client.verify.webhook({
        headers: request.headers,
        body: request.body,
        rawBody: request.rawBody,
      });
    } catch (error: any) {
      this.logger.error(`SafePay webhook verification failed: ${error.message}`);
      return false;
    }
  }

  async getSessionStatus(sessionId: string): Promise<{ status: string; amount?: number }> {
    try {
      // Find the donation by reference/sessionId in our database
      const donation = await this.prisma.donation.findFirst({
        where: { gatewaySessionId: sessionId },
      });

      if (!donation) {
        return { status: 'not_found' };
      }

      // Return our DB status — webhook updates this to COMPLETED
      return {
        status: donation.status,
        amount: Number(donation.amount),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get session status: ${error.message}`);
      return { status: 'error' };
    }
  }
}
