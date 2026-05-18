import {
  Event,
  EventBucket,
  Recommendation,
  ScoreBreakdown,
  ConditionalGoRequirement,
  AppSettings,
  DEFAULT_SETTINGS,
} from './types';

function calcICPFitScore(event: Partial<Event>): number {
  const aud = event.audience;
  if (!aud) return 0;
  let score = 0;

  // ICP percentage (0-40 pts)
  score += Math.min(40, (aud.icpPercentage || 0) * 0.4);

  // Audience size with ICP quality (0-20 pts)
  const icpCount = ((aud.expectedAttendees || 0) * (aud.icpPercentage || 0)) / 100;
  if (icpCount >= 200) score += 20;
  else if (icpCount >= 100) score += 15;
  else if (icpCount >= 50) score += 10;
  else if (icpCount >= 20) score += 7;
  else if (icpCount >= 5) score += 4;

  // Seniority (0-20 pts)
  const seniorityScores: Record<string, number> = {
    executive: 20, senior: 15, mixed: 10, mid: 5, junior: 2, unknown: 0,
  };
  score += seniorityScores[aud.audienceSeniority] || 0;

  // Named target accounts (0-20 pts)
  if ((aud.namedTargetAccounts || 0) >= 20) score += 20;
  else if ((aud.namedTargetAccounts || 0) >= 10) score += 15;
  else if ((aud.namedTargetAccounts || 0) >= 5) score += 10;
  else if ((aud.namedTargetAccounts || 0) >= 1) score += 5;

  // Decision makers present (+bonus)
  if (aud.decisionMakersPresent) score = Math.min(100, score + 5);
  // Attendee list available
  if (aud.attendeeListAvailable) score = Math.min(100, score + 5);
  // Curated audience
  if (aud.isCurated) score = Math.min(100, score + 5);

  return Math.min(100, Math.round(score));
}

function calcBusinessValueScore(event: Partial<Event>): number {
  const metrics = event.expectedMetrics;
  const obj = event.primaryObjective;
  const bucket = event.bucket;
  if (!metrics) return 0;
  let score = 0;

  // Weight varies by objective
  const isPipelineFocused = ['enterprise-pipeline', 'deal-acceleration', 'lead-generation'].includes(obj || '');
  const isBrandFocused = ['brand-visibility', 'thought-leadership', 'community-building', 'employer-branding'].includes(obj || '');

  if (isPipelineFocused) {
    // Pipeline value (0-30)
    if ((metrics.pipeline || 0) >= 10000000) score += 30;
    else if ((metrics.pipeline || 0) >= 5000000) score += 22;
    else if ((metrics.pipeline || 0) >= 2000000) score += 15;
    else if ((metrics.pipeline || 0) >= 500000) score += 8;
    // SQLs (0-30)
    if ((metrics.sqls || 0) >= 10) score += 30;
    else if ((metrics.sqls || 0) >= 5) score += 22;
    else if ((metrics.sqls || 0) >= 2) score += 12;
    else if ((metrics.sqls || 0) >= 1) score += 5;
    // ICP leads (0-20)
    score += Math.min(20, (metrics.icpLeads || 0) * 2);
    // Meetings (0-20)
    score += Math.min(20, (metrics.meetings || 0) * 3);
  } else if (isBrandFocused) {
    // Content and visibility
    score += Math.min(30, (metrics.socialPosts || 0) * 3);
    score += Math.min(20, (metrics.videos || 0) * 5);
    score += Math.min(20, (metrics.blogs || 0) * 5);
    score += Math.min(15, (metrics.leads || 0) * 0.5);
    score += 15; // brand events get base score
  } else {
    // Mixed
    score += Math.min(25, (metrics.icpLeads || 0) * 2);
    score += Math.min(25, (metrics.sqls || 0) * 5);
    score += Math.min(20, (metrics.meetings || 0) * 3);
    score += Math.min(15, (metrics.partnerConversations || 0) * 3);
    score += Math.min(15, (metrics.contentAssets || 0) * 3);
  }

  // Adjust for bucket - low-cost/micro don't need high pipeline
  if (bucket === 'low-cost' || bucket === 'micro') {
    // Give partial credit for soft metrics
    if ((metrics.leads || 0) > 0) score = Math.min(100, score + 10);
    if ((metrics.contentAssets || 0) > 0) score = Math.min(100, score + 10);
  }

  return Math.min(100, Math.round(score));
}

function calcPackageQualityScore(event: Partial<Event>): number {
  const pkg = event.package;
  if (!pkg) return 0;
  let score = 0;

  // Authority assets (high value)
  if (pkg.keynote) score += 25;
  else if (pkg.speakingSlot) score += 18;
  else if (pkg.panelParticipation) score += 12;
  else if (pkg.firesideChatModerator) score += 10;

  // Data assets (high value)
  if (pkg.attendeeList) score += 20;
  if (pkg.leadScanner) score += 15;
  if (pkg.hostedBuyerMeetings) score += 15;
  if (pkg.meetingSchedulerAccess) score += 10;

  // Engagement assets
  if (pkg.booth) score += 10;
  if (pkg.demoTable) score += 8;
  if (pkg.workshop) score += 8;
  if (pkg.roundtable) score += 8;
  if (pkg.networkingAccess) score += 5;
  if (pkg.vipLoungeAccess) score += 5;

  // Content assets
  if (pkg.videoRights) score += 5;
  if (pkg.sessionRecording) score += 4;
  if (pkg.mediaInterview) score += 5;
  if (pkg.analystMeeting) score += 8;

  // Follow-up assets
  if (pkg.emailCampaignInclusion) score += 5;
  if (pkg.retargetingAccess) score += 5;
  if (pkg.postEventReport) score += 3;

  // Logo-only penalty: if only visibility assets, max score 20
  const hasEngagementOrData = pkg.booth || pkg.demoTable || pkg.attendeeList || pkg.leadScanner ||
    pkg.speakingSlot || pkg.keynote || pkg.panelParticipation || pkg.workshop || pkg.roundtable ||
    pkg.hostedBuyerMeetings || pkg.meetingSchedulerAccess;

  if (!hasEngagementOrData) {
    score = Math.min(20, score);
  }

  return Math.min(100, Math.round(score));
}

function calcStrategicValueScore(event: Partial<Event>): number {
  const aud = event.audience;
  const pkg = event.package;
  let score = 40; // base

  // Named accounts
  if ((aud?.namedTargetAccounts || 0) >= 10) score += 20;
  else if ((aud?.namedTargetAccounts || 0) >= 5) score += 12;
  else if ((aud?.namedTargetAccounts || 0) >= 1) score += 6;

  // Analyst/media presence
  if (aud?.analystsPresent) score += 10;
  if (aud?.mediaPresent) score += 8;
  if (pkg?.analystMeeting) score += 10;
  if (pkg?.mediaInterview) score += 8;

  // Senior leadership access
  if (aud?.audienceSeniority === 'executive') score += 15;
  else if (aud?.audienceSeniority === 'senior') score += 10;

  // Partner ecosystem
  if (aud?.partnersPresent) score += 8;

  // Keynote / thought leadership
  if (pkg?.keynote) score += 10;
  else if (pkg?.speakingSlot) score += 6;

  return Math.min(100, Math.round(score));
}

function calcSalesReadinessScore(event: Partial<Event>): number {
  const sr = event.salesReadiness;
  if (!sr) return 0;
  let score = 0;
  const checks = [
    sr.eventOwnerAssigned, sr.salesOwnerAssigned, sr.marketingOwnerAssigned,
    sr.salesInvolvedBeforeEvent, sr.targetAccountListPrepared, sr.preEventOutreachStarted,
    sr.demoReady, sr.pitchDeckReady, sr.pitchCustomized, sr.qualificationQuestionsReady,
    sr.leadCaptureReady, sr.crmCampaignSetUp, sr.leadSourceTrackingSetUp, sr.utmTrackingSetUp,
    sr.postEventEmailSequenceReady, sr.linkedInFollowUpReady, sr.salesFollowUpSLADefined,
    sr.contentPlanReady, sr.postEventReviewScheduled,
  ];
  const trueCount = checks.filter(Boolean).length;
  score = Math.round((trueCount / checks.length) * 100);
  return score;
}

function calcCostEfficiencyScore(event: Partial<Event>): number {
  const budget = event.budget;
  const metrics = event.expectedMetrics;
  if (!budget || !metrics) return 50;

  const totalCost = budget.totalEstimatedCost || 0;
  if (totalCost === 0) return 50;

  const pipeline = metrics.pipeline || 0;
  const ratio = pipeline / totalCost;

  if (ratio >= 10) return 100;
  if (ratio >= 7) return 90;
  if (ratio >= 5) return 75;
  if (ratio >= 3) return 60;
  if (ratio >= 1) return 40;
  if (ratio > 0) return 20;

  // If no pipeline expected, look at lead cost
  const icpLeads = metrics.icpLeads || 0;
  if (icpLeads > 0) {
    const costPerICPLead = totalCost / icpLeads;
    if (costPerICPLead < 5000) return 70;
    if (costPerICPLead < 15000) return 50;
    if (costPerICPLead < 30000) return 30;
    return 15;
  }

  return 20;
}

function calcRiskPenalty(event: Partial<Event>): number {
  const risk = event.risk;
  if (!risk) return 0;
  let penalty = 0;

  if (!risk.organizerCredible) penalty += 10;
  if (!risk.audienceQualityVerified) penalty += 8;
  if (!risk.attendeeDataGuaranteed) penalty += 5;
  if (risk.riskOfPoorFootfall) penalty += 8;
  if (risk.riskOfLowICPFit) penalty += 10;
  if (risk.riskOfVendorHeavyAudience) penalty += 7;
  if (risk.riskOfGenericAudience) penalty += 5;
  if (!risk.teamBandwidthAvailable) penalty += 8;
  if (risk.dateConflict) penalty += 10;
  if (risk.campaignConflict) penalty += 5;
  if (risk.packageOverpriced) penalty += 7;
  if (risk.dependencyOnUnverifiedPromises) penalty += 5;
  if (risk.noInternalOwner) penalty += 10;
  if (risk.noPostEventPlan) penalty += 8;
  if (!risk.previousROIPositive && risk.attendedBefore) penalty += 5;

  return Math.min(30, penalty);
}

function calcConfidenceAdjustment(event: Partial<Event>): number {
  const conf = event.confidence;
  if (!conf) return 0;

  const levels = [
    conf.audienceSizeConfidence, conf.audienceSeniorityConfidence, conf.icpPercentageConfidence,
    conf.attendeeListConfidence, conf.speakingSlotConfidence, conf.costConfidence,
  ];

  const weights: Record<string, number> = {
    confirmed: 1, verbal: 0.7, 'organizer-estimate': 0.4, 'internal-estimate': 0.2, unknown: 0,
  };

  const avg = levels.reduce((sum, l) => sum + (weights[l] || 0), 0) / levels.length;

  // Positive if high confidence, negative if low
  if (avg >= 0.8) return 5;
  if (avg >= 0.6) return 0;
  if (avg >= 0.4) return -5;
  return -10;
}

export function calculateScore(event: Partial<Event>, settings?: AppSettings): ScoreBreakdown {
  const s = settings || DEFAULT_SETTINGS;
  const bucket = event.bucket || 'micro';
  const weights = s.scoringWeights[bucket];

  const icpFit = calcICPFitScore(event);
  const businessValue = calcBusinessValueScore(event);
  const packageQuality = calcPackageQualityScore(event);
  const strategicValue = calcStrategicValueScore(event);
  const salesReadiness = calcSalesReadinessScore(event);
  const costEfficiency = calcCostEfficiencyScore(event);
  const riskPenalty = calcRiskPenalty(event);
  const confidenceAdjustment = calcConfidenceAdjustment(event);

  const weightedScore =
    (icpFit * weights.icpFit +
      businessValue * weights.businessValue +
      packageQuality * weights.packageQuality +
      strategicValue * weights.strategicValue +
      salesReadiness * weights.salesReadiness +
      costEfficiency * weights.costEfficiency) /
    (weights.icpFit + weights.businessValue + weights.packageQuality +
      weights.strategicValue + weights.salesReadiness + weights.costEfficiency);

  const totalScore = Math.max(0, Math.min(100, Math.round(weightedScore - riskPenalty + confidenceAdjustment)));

  return {
    icpFit,
    businessValue,
    packageQuality,
    strategicValue,
    salesReadiness,
    costEfficiency,
    riskPenalty,
    confidenceAdjustment,
    totalScore,
  };
}

export function getRecommendation(
  score: number,
  event: Partial<Event>
): { recommendation: Recommendation; reasons: string[]; conditionalRequirements: ConditionalGoRequirement[] } {
  const reasons: string[] = [];
  const conditionalRequirements: ConditionalGoRequirement[] = [];
  let recommendation: Recommendation = score >= 80 ? 'go' : score >= 60 ? 'conditional-go' : 'no-go';

  const budget = event.budget;
  const audience = event.audience;
  const pkg = event.package;
  const risk = event.risk;
  const sr = event.salesReadiness;
  const bucket = event.bucket;
  const confidence = event.confidence;

  // ---- Hard No-Go Rules ----
  const hardNoGo: string[] = [];

  if ((audience?.icpPercentage || 0) < 5) {
    hardNoGo.push('ICP audience percentage is critically low (below 5%).');
  }
  if (!risk?.organizerCredible) {
    hardNoGo.push('Organizer credibility is very weak.');
  }
  if (!event.primaryObjective) {
    hardNoGo.push('No clear event objective has been defined.');
  }
  if (risk?.dateConflict) {
    hardNoGo.push('Event date conflicts with a higher-priority event or campaign.');
  }
  if (bucket === 'major' && !sr?.salesInvolvedBeforeEvent) {
    hardNoGo.push('Major event requires sales involvement before the event.');
  }
  if (bucket === 'major' || bucket === 'strategic') {
    const hasEngagement = pkg?.booth || pkg?.speakingSlot || pkg?.keynote || pkg?.panelParticipation ||
      pkg?.workshop || pkg?.roundtable || pkg?.attendeeList || pkg?.leadScanner || pkg?.hostedBuyerMeetings;
    if (!hasEngagement) {
      hardNoGo.push('Major/Strategic event has only logo visibility — no engagement, data, or authority assets.');
    }
  }
  if (!risk?.noInternalOwner === false && risk?.noInternalOwner) {
    hardNoGo.push('No internal event owner has been assigned.');
  }
  if (bucket === 'strategic' && event.approvalStatus !== 'approved') {
    recommendation = 'strategic-approval-required';
    reasons.push('Strategic event requires CEO/Leadership approval before proceeding.');
  }

  if (hardNoGo.length > 0) {
    recommendation = 'no-go';
    reasons.push(...hardNoGo);
    return { recommendation, reasons, conditionalRequirements };
  }

  // ---- Conditional Go Rules ----
  const condReasons: string[] = [];

  if (!audience?.attendeeListAvailable) {
    condReasons.push('Attendee list access is not confirmed.');
    conditionalRequirements.push({ condition: 'Confirm attendee list access in writing from organizer.', status: 'pending' });
  }
  if (pkg?.speakingSlot && confidence?.speakingSlotConfidence !== 'confirmed') {
    condReasons.push('Speaking slot is promised but not confirmed in writing.');
    conditionalRequirements.push({ condition: 'Get speaking slot confirmation in writing with time and topic.', status: 'pending' });
  }
  if (!sr?.salesOwnerAssigned) {
    condReasons.push('Sales owner is not yet assigned.');
    conditionalRequirements.push({ condition: 'Assign a dedicated sales owner for this event.', status: 'pending' });
  }
  if (!sr?.postEventEmailSequenceReady) {
    condReasons.push('Post-event email follow-up sequence is not ready.');
    conditionalRequirements.push({ condition: 'Prepare post-event email and LinkedIn follow-up sequences.', status: 'pending' });
  }
  if (!sr?.crmCampaignSetUp) {
    condReasons.push('CRM campaign and lead source tracking is not set up.');
    conditionalRequirements.push({ condition: 'Set up CRM campaign with lead source tracking and UTM links.', status: 'pending' });
  }
  if (confidence?.overallConfidence === 'low') {
    condReasons.push('Overall data confidence is low — key audience and package details are unverified.');
    conditionalRequirements.push({ condition: 'Verify and confirm key event details with the organizer in writing.', status: 'pending' });
  }
  if (risk?.isNewEvent) {
    condReasons.push('This is a new event with no track record.');
    conditionalRequirements.push({ condition: 'Get references from other sponsors or attendees about event quality.', status: 'pending' });
  }
  if (risk?.dependencyOnUnverifiedPromises) {
    condReasons.push('There are unverified organizer promises affecting the decision.');
    conditionalRequirements.push({ condition: 'Get all sponsorship deliverables confirmed in writing.', status: 'pending' });
  }
  if ((bucket === 'mini' || bucket === 'major') && sr?.readinessLevel === 'not-ready') {
    condReasons.push(`${bucket === 'mini' ? 'Mini' : 'Major'} event has low sales and marketing readiness.`);
    conditionalRequirements.push({ condition: 'Complete sales and marketing readiness checklist before event day.', status: 'pending' });
  }

  if (condReasons.length > 0 && recommendation === 'go') {
    recommendation = 'conditional-go';
    reasons.push(...condReasons);
  } else if (condReasons.length > 0) {
    reasons.push(...condReasons);
  }

  // ---- Positive reasons ----
  if ((audience?.icpPercentage || 0) >= 50) reasons.push('Strong ICP audience fit (50%+ of attendees match ICP).');
  if ((audience?.namedTargetAccounts || 0) >= 5) reasons.push(`${audience?.namedTargetAccounts} named target accounts expected to attend.`);
  if (pkg?.speakingSlot || pkg?.keynote || pkg?.panelParticipation) reasons.push('Event package includes a thought leadership / speaking opportunity.');
  if (pkg?.attendeeList) reasons.push('Attendee list is included in the package.');
  if (pkg?.leadScanner) reasons.push('Lead scanner is included for direct lead capture.');
  if ((event.expectedMetrics?.sqls || 0) >= 3) reasons.push(`${event.expectedMetrics?.sqls} SQLs expected from this event.`);
  if ((event.expectedMetrics?.pipeline || 0) >= 1000000) reasons.push(`₹${((event.expectedMetrics?.pipeline || 0) / 100000).toFixed(0)}L expected pipeline from this event.`);
  if (audience?.analystsPresent) reasons.push('Industry analysts are expected to attend — strategic visibility opportunity.');
  if (sr?.targetAccountListPrepared && sr?.preEventOutreachStarted) reasons.push('Sales team has prepared target account list and started pre-event outreach.');

  if (recommendation === 'go' && reasons.length === 0) {
    reasons.push('Event scores well across all dimensions — ICP fit, package quality, and business value are aligned.');
  }

  return { recommendation, reasons, conditionalRequirements };
}

export function generateChecklist(bucket: EventBucket) {
  const preEvent = [
    'Event owner assigned', 'Sales owner assigned', 'Marketing owner assigned', 'Budget approved', 'Payment completed',
    'Sponsorship contract uploaded', 'Deliverables confirmed in writing', 'Booth requirements confirmed',
    'Travel booked', 'Hotel booked', 'Team attendees finalized', 'Speaker confirmed', 'Speaker bio submitted',
    'Session title and abstract submitted', 'Presentation deck prepared', 'Demo environment ready',
    'Brochures prepared', 'Whitepapers prepared', 'QR codes created and tested', 'CRM campaign created',
    'Lead source tracking set up', 'UTM links created', 'Target account list prepared',
    'Pre-event email campaign ready', 'Pre-event LinkedIn outreach ready', 'Social media announcement published',
    'Merchandise ordered', 'Event-specific pitch prepared', 'Qualification questions prepared',
    'Meeting booking link created',
  ];
  const duringEvent = [
    'Booth setup completed', 'Demo setup tested', 'QR code working', 'Lead capture working',
    'Team briefing completed', 'Speaker session completed', 'Photos captured', 'Videos captured',
    'Prospect conversations logged', 'Hot leads tagged', 'Customer meetings completed',
    'Partner meetings completed', 'Competitor insights captured', 'Key objections noted',
    'Social media updates posted',
  ];
  const postEvent = [
    'Leads uploaded to CRM', 'Leads cleaned and deduplicated', 'Leads categorized by ICP fit',
    'Hot leads assigned to sales', 'Follow-up email sent within 24 hours', 'Sales outreach completed within 48 hours',
    'LinkedIn follow-up sent', 'Event recap post published', 'Blog / article created', 'Video clips published',
    'Partner follow-ups completed', 'Customer follow-ups completed', 'Pipeline updated in CRM',
    'Event report created', 'ROI review scheduled', 'Lessons learned documented', 'Repeat decision added',
  ];

  // Trim checklist for smaller events
  const preFiltered = bucket === 'low-cost'
    ? preEvent.slice(0, 15)
    : bucket === 'micro'
    ? preEvent.slice(0, 22)
    : preEvent;

  return [
    ...preFiltered.map((task, i) => ({ id: `pre-${i}`, task, phase: 'pre-event' as const, completed: false })),
    ...duringEvent.map((task, i) => ({ id: `dur-${i}`, task, phase: 'during-event' as const, completed: false })),
    ...postEvent.map((task, i) => ({ id: `post-${i}`, task, phase: 'post-event' as const, completed: false })),
  ];
}
