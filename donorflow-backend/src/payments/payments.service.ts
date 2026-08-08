import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SafepayService } from './safepay.service';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safepay: SafepayService,
  ) {}

  async createSession(dto: CreatePaymentSessionDto, organizationIdFromAuth: number | null) {
    // 1. Find campaign by slug to get organizationId
    const campaign = await this.prisma.campaign.findFirst({
      where: { 
        slug: dto.campaignSlug,
        status: 'Active', // ✅ Fixed: Use PascalCase to match your Prisma enum
      },
      include: { organization: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found or inactive');
    }

    // Use the organization from the campaign (not from auth, since this is public)
    const organizationId = campaign.organizationId;

    // 2. Validate amount
    if (dto.amount < 50) {
      throw new BadRequestException('Minimum donation amount is PKR 50');
    }

    // 3. Create or find donor
    let donor = null;
    if (dto.donorEmail) {
      donor = await this.prisma.donor.findFirst({
        where: {
          email: dto.donorEmail,
          organizationId,
        },
      });

      if (!donor) {
        donor = await this.prisma.donor.create({
          data: {
            fullName: dto.donorName || 'Anonymous Donor',
            email: dto.donorEmail,
            phone: dto.donorPhone,
            organizationId,
          },
        });
      }
    }

    // 4. Generate unique reference
    const reference = `DON-${Date.now()}-${randomBytes(4).toString('hex')}`;

    // 5. Create pending donation record
    const donation = await this.prisma.donation.create({
      data: {
        amount: dto.amount,
        currency: 'PKR',
        status: 'PENDING',
        paymentMethod: dto.paymentMethod || 'SAFEPAY',
        isRecurring: dto.isMonthly || false,
        campaignId: campaign.id,
        organizationId,
        donorId: donor?.id,
        gatewaySessionId: reference,
      },
    });

    // 6. Create SafePay checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const checkoutUrl = await this.safepay.createCheckoutSession({
      organizationId,
      reference,
      amount: dto.amount,
      currency: 'PKR',
      cancelUrl: `${frontendUrl}/donation/cancel`,
      redirectUrl: `${frontendUrl}/donation/success`,
      isMonthly: dto.isMonthly,
      planId: process.env.SAFEPAY_DEFAULT_PLAN_ID,
    });

    return {
      checkoutUrl,
      reference,
      donationId: donation.id,
    };
  }

  async handleSuccessfulCheckout(params: { reference: string }) {
    // Find the donation by reference
    const donation = await this.prisma.donation.findFirst({
      where: { gatewaySessionId: params.reference },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    // Don't mark as completed yet - wait for webhook confirmation
    return {
      status: 'pending_verification',
      donationId: donation.id,
      reference: params.reference,
    };
  }

  async processWebhook(payload: any) {
    // Handle SafePay webhook events
    const eventType = payload.event || payload.type;
    const reference = payload.order_id || payload.reference;

    if (!reference) {
      return { received: false, message: 'No reference in webhook' };
    }

    const donation = await this.prisma.donation.findFirst({
      where: { gatewaySessionId: reference },
    });

    if (!donation) {
      return { received: false, message: 'Donation not found' };
    }

    // Update donation status based on webhook event
    if (eventType === 'checkout.paid' || eventType === 'payment.completed') {
      await this.prisma.$transaction(async (tx) => {
        // Update donation
        await tx.donation.update({
          where: { id: donation.id },
          data: {
            status: 'COMPLETED',
            gatewayPaymentId: payload.payment_id || payload.id,
          },
        });

        // ✅ Fixed: Add null check for campaignId
        if (donation.campaignId) {
          await tx.campaign.update({
            where: { id: donation.campaignId },
            data: {
              currentAmount: {
                increment: donation.amount,
              },
            },
          });
        }
      });

      return { received: true, message: 'Donation completed' };
    }

    if (eventType === 'checkout.cancelled' || eventType === 'payment.failed') {
      await this.prisma.donation.update({
        where: { id: donation.id },
        data: { status: 'FAILED' },
      });

      return { received: true, message: 'Donation failed' };
    }

    return { received: true, message: 'Event processed' };
  }

  async verifySessionStatus(sessionId: string) {
    const donation = await this.prisma.donation.findFirst({
      where: { gatewaySessionId: sessionId },
    });

    if (!donation) {
      throw new NotFoundException('Session not found');
    }

    // Try to get status from SafePay API
    const safePayStatus = await this.safepay.getSessionStatus(sessionId);

    return {
      donationId: donation.id,
      status: donation.status,
      amount: donation.amount,
      safePayStatus,
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

    // Cancel in SafePay
    if (subscription.gatewaySubscriptionId) {
      await this.safepay.cancelSubscription(subscription.gatewaySubscriptionId, organizationId);
    }

    // Update local record
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
