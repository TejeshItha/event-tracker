import { EventBucket, BUCKET_RANGES } from './types';

export function classifyEventBucket(totalCost: number): EventBucket {
  if (totalCost < 40000) return 'low-cost';
  if (totalCost < 100000) return 'micro';
  if (totalCost < 300000) return 'mini';
  if (totalCost <= 600000) return 'major';
  return 'strategic';
}

export function getBucketLabel(bucket: EventBucket): string {
  return BUCKET_RANGES[bucket].label;
}

export function calculateTotalCost(budget: {
  sponsorshipCost: number;
  boothCost: number;
  travelCost: number;
  stayCost: number;
  localTransportCost: number;
  teamCost: number;
  boothMaterialCost: number;
  merchandiseCost: number;
  brochureCost: number;
  contentProductionCost: number;
  photographyCost: number;
  paidPromotionCost: number;
  miscCost: number;
}): number {
  return (
    (budget.sponsorshipCost || 0) +
    (budget.boothCost || 0) +
    (budget.travelCost || 0) +
    (budget.stayCost || 0) +
    (budget.localTransportCost || 0) +
    (budget.teamCost || 0) +
    (budget.boothMaterialCost || 0) +
    (budget.merchandiseCost || 0) +
    (budget.brochureCost || 0) +
    (budget.contentProductionCost || 0) +
    (budget.photographyCost || 0) +
    (budget.paidPromotionCost || 0) +
    (budget.miscCost || 0)
  );
}

export function formatINR(amount: number): string {
  if (amount === 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getPipelineRatioLabel(ratio: number): { label: string; color: string } {
  if (ratio < 1) return { label: 'Weak', color: 'text-red-600' };
  if (ratio < 3) return { label: 'Risky', color: 'text-orange-600' };
  if (ratio < 5) return { label: 'Acceptable', color: 'text-yellow-600' };
  return { label: 'Strong', color: 'text-green-600' };
}

export function getCostPerMetric(totalCost: number, metricValue: number): number {
  if (!metricValue || metricValue === 0) return 0;
  return Math.round(totalCost / metricValue);
}
