import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafepayService } from './safepay.service';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safepay: SafepayService,
  ) { }

  async createSession(dto: CreatePaymentSessionDto, organizationIdFromAuth: number | null) {
    // 1. Find campaign by slug
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        slug: dto.campaignSlug,
        status: 'Active',
      },
      include: { organization: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found or inactive');
    }

    const organizationId = campaign.organizationId;

    // 2. Validate amount
    if (dto.amount < 50) {
      throw new BadRequestException('Minimum donation amount is PKR 50');
    }

    // 3. Generate unique reference
    const reference = `DON-${Date.now()}-${randomBytes(4).toString('hex')}`;

    // 4. Create PaymentIntent (temporary tracker) — NO donation created yet
    await this.prisma.paymentIntent.create({
      data: {
        reference,
        organizationId,
        campaignId: campaign.id,
        amount: new Prisma.Decimal(dto.amount),
        currency: 'PKR',
        donorName: dto.donorName || null,
        donorEmail: dto.donorEmail || null,
        donorPhone: dto.donorPhone || null,
        status: 'INITIATED',
      },
    });

    // 5. Create SafePay checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const checkoutUrl = await this.safepay.createCheckoutSession({
      organizationId,
      reference,
      amount: dto.amount,
      currency: 'PKR',
      cancelUrl: `${frontendUrl}/donation/cancel?ref=${reference}`,
      redirectUrl: `${frontendUrl}/donation/success?ref=${reference}`,
      isMonthly: dto.isMonthly,
      planId: process.env.SAFEPAY_DEFAULT_PLAN_ID,
    });

    return {
      checkoutUrl,
      reference,
    };
  }

  async handleSuccessfulCheckout(params: { reference: string }) {
    // Find the PaymentIntent
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { reference: params.reference },
    });

    if (!intent) {
      throw new NotFoundException('Payment session not found');
    }

    // Don't mark as completed yet - wait for webhook confirmation
    return {
      status: 'pending_verification',
      reference: params.reference,
      amount: intent.amount,
    };
  }

  async processWebhook(payload: any) {
    const eventType = payload.event || payload.type;
    const reference = payload.order_id || payload.reference;

    if (!reference) {
      return { received: false, message: 'No reference in webhook' };
    }

    const intent = await this.prisma.paymentIntent.findUnique({
      where: { reference },
    });

    if (!intent) {
      return { received: false, message: 'Payment intent not found' };
    }

    // Only process if not already completed (idempotency)
    if (intent.status === 'COMPLETED') {
      return { received: true, message: 'Already processed' };
    }

    // Handle successful payment
    if (eventType === 'checkout.paid' || eventType === 'payment.completed') {
      await this.prisma.$transaction(async (tx) => {
        // Find or create the donor
        let donorId: number | null = null;
        if (intent.donorEmail) {
          const existing = await tx.donor.findFirst({
            where: { organizationId: intent.organizationId, email: intent.donorEmail },
          });
          if (existing) {
            donorId = existing.id;
          } else {
            const newDonor = await tx.donor.create({
              data: {
                organizationId: intent.organizationId,
                fullName: intent.donorName || 'Anonymous Donor',
                email: intent.donorEmail,
                phone: intent.donorPhone,
                isActive: true,
              },
            });
            donorId = newDonor.id;
          }
        }

        // NOW create the donation (only after payment confirmed)
        await tx.donation.create({
          data: {
            organizationId: intent.organizationId,
            campaignId: intent.campaignId,
            donorId,
            amount: intent.amount,
            currency: intent.currency,
            status: 'COMPLETED',
            paymentMethod: 'SAFEPAY',
            isRecurring: false,
            receiptNumber: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            gatewaySessionId: reference,
            gatewayPaymentId: payload.payment_id || payload.id,
          },
        });

        // Increment campaign total
        if (intent.campaignId) {
          await tx.campaign.update({
            where: { id: intent.campaignId },
            data: {
              currentAmount: {
                increment: intent.amount,
              },
            },
          });
        }

        // Mark intent as completed
        await tx.paymentIntent.update({
          where: { reference },
          data: { status: 'COMPLETED' },
        });
      });

      return { received: true, message: 'Donation completed' };
    }

    // Handle failed/cancelled payment
    if (eventType === 'checkout.cancelled' || eventType === 'payment.failed') {
      await this.prisma.paymentIntent.update({
        where: { reference },
        data: { status: 'FAILED' },
      });

      return { received: true, message: 'Payment failed' };
    }

    return { received: true, message: 'Event processed' };
  }

  async handlePaymentSuccess(reference: string, payload: any) {
    const intent = await this.prisma.paymentIntent.findUnique({ where: { reference } });
    if (!intent || intent.status === 'COMPLETED') return; // idempotency guard

    await this.prisma.$transaction(async (tx) => {
      // Find or create the donor
      let donorId: number | null = null;
      if (intent.donorEmail) {
        const existing = await tx.donor.findFirst({
          where: { organizationId: intent.organizationId, email: intent.donorEmail },
        });
        if (existing) {
          donorId = existing.id;
        } else {
          const newDonor = await tx.donor.create({
            data: {
              organizationId: intent.organizationId,
              fullName: intent.donorName || 'Anonymous',
              email: intent.donorEmail,
              phone: intent.donorPhone,
              isActive: true,
            },
          });
          donorId = newDonor.id;
        }
      }

      // Create the REAL donation (only after payment confirmed)
      await tx.donation.create({
        data: {
          organizationId: intent.organizationId,
          campaignId: intent.campaignId,
          donorId,
          amount: intent.amount,
          currency: intent.currency,
          status: 'COMPLETED',
          paymentMethod: 'SAFEPAY',
          isRecurring: false,
          receiptNumber: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          gatewaySessionId: reference,
          gatewayPaymentId: payload.payment_id || payload.id,
        },
      });

      // Increment campaign total ONLY now
      if (intent.campaignId) {
        await tx.campaign.update({
          where: { id: intent.campaignId },
          data: { currentAmount: { increment: intent.amount } },
        });
      }

      // Mark intent as done
      await tx.paymentIntent.update({ where: { reference }, data: { status: 'COMPLETED' } });
    });
  }

  async verifySessionStatus(sessionId: string) {
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { reference: sessionId },
    });

    if (!intent) {
      throw new NotFoundException('Session not found');
    }

    // Check if a donation was created for this intent
    const donation = await this.prisma.donation.findFirst({
      where: { gatewaySessionId: sessionId },
    });

    return {
      reference: intent.reference,
      amount: intent.amount,
      intentStatus: intent.status,
      donationId: donation?.id,
      donationStatus: donation?.status,
    };
  }

  async getSubscriptionList(organizationId: number) {
    return this.prisma.subscription.findMany({
      where: { organizationId },
      include: {
        campaign: true,
        donor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelSubscription(subscriptionId: number, organizationId: number) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, organizationId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.gatewaySubscriptionId) {
      await this.safepay.cancelSubscription(subscription.gatewaySubscriptionId, organizationId);
    }

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return { message: 'Subscription cancelled successfully' };
  }
}