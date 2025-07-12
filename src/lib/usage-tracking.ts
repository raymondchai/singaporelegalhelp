// =====================================================
// Phase 6A: Usage Tracking & Enforcement System
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { getSupabaseAdmin } from './supabase';
import { SUBSCRIPTION_TIERS, SubscriptionTier, UsageData, UsageLimits } from './subscription-config';

export type UsageResourceType = 'document_generation' | 'ai_query' | 'storage_gb' | 'team_member' | 'api_call' | 'template_access';

export interface UsageTrackingEntry {
  id: string;
  user_id: string;
  subscription_id?: string;
  resource_type: UsageResourceType;
  quantity: number;
  unit_cost_sgd?: number;
  resource_id?: string;
  team_id?: string;
  billing_period_start?: string;
  billing_period_end?: string;
  metadata?: Record<string, any>;
  tracked_at: string;
  created_at: string;
}

export interface UsageCheckResult {
  allowed: boolean;
  current_usage: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
  percentage_used: number;
  will_exceed: boolean;
}

export interface UsageSummary {
  user_id: string;
  subscription_tier: SubscriptionTier;
  billing_period_start: string;
  billing_period_end: string;
  usage: UsageData;
  limits: UsageLimits;
  usage_percentages: Record<UsageResourceType, number>;
  warnings: string[];
}

// Usage tracking service
export class UsageTrackingService {
  private supabase = getSupabaseAdmin();

  /**
   * Track usage for a specific resource
   */
  async trackUsage(
    userId: string,
    resourceType: UsageResourceType,
    quantity: number = 1,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get user's current subscription
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('id, tier, current_period_start, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      // Insert usage tracking record
      await this.supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          subscription_id: subscription?.id,
          resource_type: resourceType,
          quantity,
          billing_period_start: subscription?.current_period_start,
          billing_period_end: subscription?.current_period_end,
          metadata: metadata || {},
          tracked_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Failed to track usage:', error);
      throw new Error('Usage tracking failed');
    }
  }

  /**
   * Check if user can perform an action based on their subscription limits
   */
  async checkUsageLimit(
    userId: string,
    resourceType: UsageResourceType,
    requestedQuantity: number = 1
  ): Promise<UsageCheckResult> {
    try {
      // Get user's current subscription
      const { data: subscriptionData } = await this.supabase
        .from('user_subscriptions')
        .select('tier, current_period_start, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      const subscription = subscriptionData || {
        tier: 'free',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Get subscription tier limits
      const tierConfig = SUBSCRIPTION_TIERS[subscription.tier as SubscriptionTier];
      const limit = this.getResourceLimit(tierConfig.features, resourceType);

      // If unlimited, always allow
      if (limit === 'unlimited') {
        return {
          allowed: true,
          current_usage: 0,
          limit: 'unlimited',
          remaining: 'unlimited',
          percentage_used: 0,
          will_exceed: false,
        };
      }

      // Get current usage for this billing period
      const { data: usageRecords } = await this.supabase
        .from('usage_tracking')
        .select('quantity')
        .eq('user_id', userId)
        .eq('resource_type', resourceType)
        .gte('tracked_at', subscription.current_period_start)
        .lte('tracked_at', subscription.current_period_end);

      const currentUsage = usageRecords?.reduce((sum, record) => sum + record.quantity, 0) || 0;
      const remaining = Math.max(0, limit - currentUsage);
      const percentageUsed = limit > 0 ? (currentUsage / limit) * 100 : 0;
      const willExceed = currentUsage + requestedQuantity > limit;

      return {
        allowed: !willExceed,
        current_usage: currentUsage,
        limit,
        remaining,
        percentage_used: percentageUsed,
        will_exceed: willExceed,
      };

    } catch (error) {
      console.error('Failed to check usage limit:', error);
      // Default to allowing the action in case of error
      return {
        allowed: true,
        current_usage: 0,
        limit: 'unlimited',
        remaining: 'unlimited',
        percentage_used: 0,
        will_exceed: false,
      };
    }
  }

  /**
   * Get comprehensive usage summary for a user
   */
  async getUserUsageSummary(userId: string): Promise<UsageSummary> {
    try {
      // Get user's current subscription
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('tier, current_period_start, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      const tier = (subscription?.tier as SubscriptionTier) || 'free';
      const periodStart = subscription?.current_period_start || new Date().toISOString();
      const periodEnd = subscription?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get usage data for current billing period
      const { data: usageRecords } = await this.supabase
        .from('usage_tracking')
        .select('resource_type, quantity')
        .eq('user_id', userId)
        .gte('tracked_at', periodStart)
        .lte('tracked_at', periodEnd);

      // Aggregate usage by resource type
      const usage: UsageData = {
        document_generation: 0,
        ai_query: 0,
        storage_gb: 0,
        team_member: 0,
        api_call: 0,
        template_access: 0,
      };

      usageRecords?.forEach(record => {
        if (record.resource_type in usage) {
          usage[record.resource_type as UsageResourceType] += record.quantity;
        }
      });

      // Get limits from subscription tier
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      const limits: UsageLimits = {
        document_generation: tierConfig.features.document_templates_per_month,
        ai_query: tierConfig.features.ai_queries_per_month,
        storage_gb: tierConfig.features.document_storage_gb,
        team_member: tierConfig.features.team_members_limit,
        api_call: tierConfig.features.api_access ? 'unlimited' : 0,
        template_access: tierConfig.features.articles_access === 'unlimited' ? 'unlimited' : 
                        (typeof tierConfig.features.articles_access === 'number' ? tierConfig.features.articles_access : 10),
      };

      // Calculate usage percentages and warnings
      const usagePercentages: Record<UsageResourceType, number> = {} as any;
      const warnings: string[] = [];

      Object.keys(usage).forEach(key => {
        const resourceType = key as UsageResourceType;
        const currentUsage = usage[resourceType];
        const limit = limits[resourceType];

        if (limit === 'unlimited') {
          usagePercentages[resourceType] = 0;
        } else {
          const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
          usagePercentages[resourceType] = percentage;

          // Add warnings for high usage
          if (percentage >= 90) {
            warnings.push(`${resourceType.replace('_', ' ')} usage is at ${percentage.toFixed(1)}% of limit`);
          } else if (percentage >= 75) {
            warnings.push(`${resourceType.replace('_', ' ')} usage is at ${percentage.toFixed(1)}% of limit`);
          }
        }
      });

      return {
        user_id: userId,
        subscription_tier: tier,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        usage,
        limits,
        usage_percentages: usagePercentages,
        warnings,
      };

    } catch (error) {
      console.error('Failed to get usage summary:', error);
      throw new Error('Failed to retrieve usage summary');
    }
  }

  /**
   * Reset usage for a new billing period
   */
  async resetUsageForNewPeriod(userId: string, subscriptionId: string): Promise<void> {
    try {
      // This is typically called when a subscription renews
      // Usage tracking records are kept for historical purposes
      // but new period calculations will only consider records within the new period
      
      console.log(`Usage reset for user ${userId}, subscription ${subscriptionId}`);
      
      // Could implement cleanup of old usage records here if needed
      // For now, we keep all records for analytics and billing history
      
    } catch (error) {
      console.error('Failed to reset usage:', error);
      throw new Error('Usage reset failed');
    }
  }

  /**
   * Get resource limit from subscription features
   */
  private getResourceLimit(features: any, resourceType: UsageResourceType): number | 'unlimited' {
    switch (resourceType) {
      case 'document_generation':
        return features.document_templates_per_month;
      case 'ai_query':
        return features.ai_queries_per_month;
      case 'storage_gb':
        return features.document_storage_gb;
      case 'team_member':
        return features.team_members_limit;
      case 'api_call':
        return features.api_access ? 'unlimited' : 0;
      case 'template_access':
        return features.articles_access === 'unlimited' ? 'unlimited' : 
               (typeof features.articles_access === 'number' ? features.articles_access : 10);
      default:
        return 0;
    }
  }
}

// Singleton instance
export const usageTracker = new UsageTrackingService();

// Helper functions for common usage patterns
export async function trackDocumentGeneration(userId: string, documentType?: string): Promise<void> {
  await usageTracker.trackUsage(userId, 'document_generation', 1, { document_type: documentType });
}

export async function trackAIQuery(userId: string, queryType?: string): Promise<void> {
  await usageTracker.trackUsage(userId, 'ai_query', 1, { query_type: queryType });
}

export async function trackStorageUsage(userId: string, sizeInGB: number): Promise<void> {
  await usageTracker.trackUsage(userId, 'storage_gb', sizeInGB);
}

export async function trackAPICall(userId: string, endpoint?: string): Promise<void> {
  await usageTracker.trackUsage(userId, 'api_call', 1, { endpoint });
}

export async function canGenerateDocument(userId: string): Promise<UsageCheckResult> {
  return await usageTracker.checkUsageLimit(userId, 'document_generation', 1);
}

export async function canMakeAIQuery(userId: string): Promise<UsageCheckResult> {
  return await usageTracker.checkUsageLimit(userId, 'ai_query', 1);
}

export async function canAddTeamMember(userId: string): Promise<UsageCheckResult> {
  return await usageTracker.checkUsageLimit(userId, 'team_member', 1);
}
