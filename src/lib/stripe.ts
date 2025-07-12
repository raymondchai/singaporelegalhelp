import { Stripe } from 'stripe'
import { getSupabaseAdmin } from './supabase'
import { SUBSCRIPTION_TIERS, SubscriptionTier, BillingCycle } from './subscription-config'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

// Enhanced subscription management service
export class StripeSubscriptionService {
  private readonly supabase = getSupabaseAdmin();

  /**
   * Create or retrieve Stripe customer
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      // Check if customer already exists in our database
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (subscription?.stripe_customer_id) {
        return subscription.stripe_customer_id;
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          user_id: userId,
        },
      });

      return customer.id;
    } catch (error) {
      console.error('Failed to get or create Stripe customer:', error);
      throw new Error('Customer creation failed');
    }
  }

  /**
   * Create subscription with enhanced features
   */
  async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    billingCycle: BillingCycle,
    paymentMethodId?: string,
    promotionalCodeId?: string
  ): Promise<{ subscription: Stripe.Subscription; clientSecret?: string }> {
    try {
      // Get user profile
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Get or create Stripe customer
      const customerId = await this.getOrCreateCustomer(userId, profile.email, profile.full_name);

      // Get tier configuration
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      const priceId = billingCycle === 'monthly'
        ? tierConfig.pricing.stripe_price_id_monthly
        : tierConfig.pricing.stripe_price_id_annual;

      if (!priceId) {
        throw new Error(`Price ID not configured for ${tier} ${billingCycle}`);
      }

      // Create subscription parameters
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
          tier,
          billing_cycle: billingCycle,
        },
      };

      // Add payment method if provided
      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      // Apply promotional code if provided
      if (promotionalCodeId) {
        const { data: promoCode } = await this.supabase
          .from('promotional_codes')
          .select('*')
          .eq('id', promotionalCodeId)
          .single();

        if (promoCode && this.isPromoCodeValid(promoCode, tier, billingCycle)) {
          // Create Stripe coupon for the promotional code
          const coupon = await this.createStripeCoupon(promoCode);
          subscriptionParams.coupon = coupon.id;
        }
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Store subscription in database
      await this.storeSubscriptionInDatabase(userId, subscription, tier, billingCycle, promotionalCodeId);

      // Get client secret for payment confirmation
      const latestInvoice = subscription.latest_invoice;
      const clientSecret = typeof latestInvoice === 'object' && latestInvoice?.payment_intent &&
        typeof latestInvoice.payment_intent === 'object' ?
        latestInvoice.payment_intent.client_secret || undefined : undefined;

      return { subscription, clientSecret };

    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw new Error('Subscription creation failed');
    }
  }

  /**
   * Update subscription with prorated billing
   */
  async updateSubscription(
    userId: string,
    newTier: SubscriptionTier,
    newBillingCycle: BillingCycle
  ): Promise<Stripe.Subscription> {
    try {
      // Get current subscription
      const { data: currentSub } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!currentSub || !currentSub.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Get new price ID
      const tierConfig = SUBSCRIPTION_TIERS[newTier];
      const newPriceId = newBillingCycle === 'monthly'
        ? tierConfig.pricing.stripe_price_id_monthly
        : tierConfig.pricing.stripe_price_id_annual;

      if (!newPriceId) {
        throw new Error(`Price ID not configured for ${newTier} ${newBillingCycle}`);
      }

      // Update Stripe subscription
      const subscription = await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
        items: [{
          id: (await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id)).items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: {
          user_id: userId,
          tier: newTier,
          billing_cycle: newBillingCycle,
          previous_tier: currentSub.tier,
        },
      });

      // Update database
      await this.updateSubscriptionInDatabase(userId, subscription, newTier, newBillingCycle);

      // Log subscription change
      await this.logSubscriptionChange(userId, currentSub.tier, newTier, currentSub.billing_cycle, newBillingCycle, 'upgraded');

      return subscription;

    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw new Error('Subscription update failed');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    try {
      // Get current subscription
      const { data: currentSub } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!currentSub || !currentSub.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Cancel Stripe subscription
      const subscription = cancelAtPeriodEnd
        ? await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
            cancel_at_period_end: true,
          })
        : await stripe.subscriptions.cancel(currentSub.stripe_subscription_id);

      // Update database
      await this.supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: cancelAtPeriodEnd,
          canceled_at: new Date().toISOString(),
          status: cancelAtPeriodEnd ? 'active' : 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSub.id);

      // Log subscription change
      await this.logSubscriptionChange(userId, currentSub.tier, null, currentSub.billing_cycle, null, 'cancelled');

      return subscription;

    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error('Subscription cancellation failed');
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async storeSubscriptionInDatabase(
    userId: string,
    subscription: Stripe.Subscription,
    tier: SubscriptionTier,
    billingCycle: BillingCycle,
    promotionalCodeId?: string
  ): Promise<void> {
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    const baseAmount = billingCycle === 'monthly'
      ? tierConfig.pricing.monthly_price_sgd
      : tierConfig.pricing.annual_price_sgd;

    await this.supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        tier,
        billing_cycle: billingCycle,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: subscription.items.data[0].price.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        base_amount_sgd: baseAmount,
        final_amount_sgd: baseAmount, // Will be updated if discounts applied
        promotional_code_id: promotionalCodeId,
        status: subscription.status === 'active' ? 'active' : 'incomplete',
      });

    // Update user profile subscription tier
    await this.supabase
      .from('user_profiles')
      .update({ subscription_tier: tier })
      .eq('id', userId);
  }

  private async updateSubscriptionInDatabase(
    userId: string,
    subscription: Stripe.Subscription,
    tier: SubscriptionTier,
    billingCycle: BillingCycle
  ): Promise<void> {
    await this.supabase
      .from('user_subscriptions')
      .update({
        tier,
        billing_cycle: billingCycle,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    // Update user profile subscription tier
    await this.supabase
      .from('user_profiles')
      .update({ subscription_tier: tier })
      .eq('id', userId);
  }

  private async logSubscriptionChange(
    userId: string,
    fromTier: SubscriptionTier | null,
    toTier: SubscriptionTier | null,
    fromBillingCycle: BillingCycle | null,
    toBillingCycle: BillingCycle | null,
    changeType: string
  ): Promise<void> {
    await this.supabase
      .from('subscription_changes')
      .insert({
        user_id: userId,
        change_type: changeType,
        from_tier: fromTier,
        to_tier: toTier,
        from_billing_cycle: fromBillingCycle,
        to_billing_cycle: toBillingCycle,
        initiated_by: userId,
      });
  }

  private isPromoCodeValid(promoCode: any, tier: SubscriptionTier, billingCycle: BillingCycle): boolean {
    const now = new Date();
    const validFrom = new Date(promoCode.valid_from);
    const validUntil = new Date(promoCode.valid_until);

    // Check date validity
    if (now < validFrom || now > validUntil) return false;

    // Check if tier is applicable
    if (promoCode.applicable_tiers.length > 0 && !promoCode.applicable_tiers.includes(tier)) return false;

    // Check if billing cycle is applicable
    if (promoCode.applicable_billing_cycles.length > 0 && !promoCode.applicable_billing_cycles.includes(billingCycle)) return false;

    // Check usage limits
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) return false;

    return true;
  }

  private async createStripeCoupon(promoCode: any): Promise<Stripe.Coupon> {
    const couponParams: Stripe.CouponCreateParams = {
      id: `promo_${promoCode.id}`,
      name: promoCode.name,
      metadata: { promotional_code_id: promoCode.id },
    };

    if (promoCode.discount_type === 'percentage') {
      couponParams.percent_off = promoCode.discount_value;
    } else {
      couponParams.amount_off = Math.round(promoCode.discount_value * 100); // Convert to cents
      couponParams.currency = 'sgd';
    }

    return await stripe.coupons.create(couponParams);
  }

  // Webhook handlers
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription created:', subscription.id);
    // Additional logic for subscription creation
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription updated:', subscription.id);

    // Update subscription status in database
    await this.supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription deleted:', subscription.id);

    // Update subscription status to cancelled
    await this.supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    // Reset user to free tier
    const { data: sub } = await this.supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (sub) {
      await this.supabase
        .from('user_profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', sub.user_id);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('Payment succeeded for invoice:', invoice.id);

    // Record successful payment
    if (invoice.subscription) {
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', invoice.subscription)
        .single();

      if (subscription) {
        await this.supabase
          .from('payment_transactions')
          .insert({
            user_id: subscription.user_id,
            stripe_invoice_id: invoice.id,
            amount_sgd: (invoice.amount_paid || 0) / 100, // Convert from cents
            currency: 'SGD',
            payment_method: 'stripe',
            status: 'succeeded',
            billing_reason: 'subscription_cycle',
            paid_at: new Date().toISOString(),
          });
      }
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('Payment failed for invoice:', invoice.id);

    // Record failed payment and update subscription status
    if (invoice.subscription) {
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', invoice.subscription)
        .single();

      if (subscription) {
        // Record failed payment
        await this.supabase
          .from('payment_transactions')
          .insert({
            user_id: subscription.user_id,
            stripe_invoice_id: invoice.id,
            amount_sgd: (invoice.amount_due || 0) / 100,
            currency: 'SGD',
            payment_method: 'stripe',
            status: 'failed',
            billing_reason: 'subscription_cycle',
            failed_at: new Date().toISOString(),
          });

        // Update subscription status
        await this.supabase
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription);
      }
    }
  }
}

// Singleton instance
export const stripeSubscriptionService = new StripeSubscriptionService();

// Pricing configuration for Singapore market
export const PRICING_PLANS = {
  basic: {
    priceId: 'price_basic_sgd',
    amount: 2900, // $29 SGD
    currency: 'sgd',
    interval: 'month',
    name: 'Basic Plan',
    description: 'Essential legal assistance features',
    features: [
      'AI Legal Q&A (50 questions/month)',
      'Document Analysis (5 documents/month)',
      'Basic Legal Templates',
      'Email Support',
    ],
  },
  premium: {
    priceId: 'price_premium_sgd',
    amount: 9900, // $99 SGD
    currency: 'sgd',
    interval: 'month',
    name: 'Premium Plan',
    description: 'Advanced legal assistance with priority support',
    features: [
      'AI Legal Q&A (Unlimited)',
      'Document Analysis (50 documents/month)',
      'Advanced Legal Templates',
      'Priority Email Support',
      'Chat Support',
      'Legal Document Generation',
    ],
  },
  enterprise: {
    priceId: 'price_enterprise_sgd',
    amount: 29900, // $299 SGD
    currency: 'sgd',
    interval: 'month',
    name: 'Enterprise Plan',
    description: 'Complete legal solution for businesses',
    features: [
      'Everything in Premium',
      'Unlimited Document Analysis',
      'Custom Legal Templates',
      'Dedicated Account Manager',
      'Phone Support',
      'API Access',
      'Custom Integrations',
    ],
  },
}

export type PricingPlan = keyof typeof PRICING_PLANS

// Helper function to format currency
export function formatPrice(amount: number, currency: string = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100)
}

// Helper function to create checkout session
export async function createCheckoutSession(
  priceId: string,
  customerId?: string,
  successUrl?: string,
  cancelUrl?: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  })

  return session
}
