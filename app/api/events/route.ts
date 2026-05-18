import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { readEvents, createEvent } from '@/lib/storage';
import { calculateScore, getRecommendation, generateChecklist } from '@/lib/scoring';
import { classifyEventBucket, calculateTotalCost } from '@/lib/classification';
import { Event } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');
    const bucket = searchParams.get('bucket');
    const recommendation = searchParams.get('recommendation');

    let events = await readEvents();

    if (stage) events = events.filter((e) => e.stage === stage);
    if (bucket) events = events.filter((e) => e.bucket === bucket);
    if (recommendation) events = events.filter((e) => e.recommendation === recommendation);

    events.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(events);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Calculate total cost and bucket
    const totalCost = calculateTotalCost(body.budget || {});
    const bucket = classifyEventBucket(totalCost);

    const eventData: Partial<Event> = {
      ...body,
      bucket,
      budget: { ...body.budget, totalEstimatedCost: totalCost },
    };

    // Calculate score and recommendation
    const scoreBreakdown = calculateScore(eventData);
    const { recommendation, reasons, conditionalRequirements } = getRecommendation(
      scoreBreakdown.totalScore,
      eventData
    );

    // Determine stage
    let stage = body.stage || 'draft';
    if (scoreBreakdown.totalScore > 0 && stage === 'draft') stage = 'scored';

    // Generate checklist if approved
    const checklist = body.checklist || generateChecklist(bucket);

    const now = new Date().toISOString();
    const event: Event = {
      id: uuidv4(),
      name: body.name || 'Unnamed Event',
      organizer: body.organizer || '',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      location: body.location || '',
      city: body.city || '',
      state: body.state || '',
      country: body.country || 'India',
      mode: body.mode || 'offline',
      format: body.format || 'conference',
      theme: body.theme || '',
      websiteLink: body.websiteLink || '',
      expectedAudienceSize: body.expectedAudienceSize || 0,
      hasPastEdition: body.hasPastEdition || false,
      previousYearAttendance: body.previousYearAttendance,
      organizerCredibilityNotes: body.organizerCredibilityNotes || '',
      stage,
      bucket,
      primaryObjective: body.primaryObjective || 'brand-visibility',
      secondaryObjective: body.secondaryObjective,
      tertiaryObjective: body.tertiaryObjective,
      budget: { ...body.budget, totalEstimatedCost: totalCost },
      audience: body.audience || {
        expectedAttendees: 0, icpPercentage: 0, industries: [], companySizes: [], personas: [],
        audienceSeniority: 'unknown', decisionMakersPresent: false, namedTargetAccounts: 0,
        existingCustomersPresent: false, partnersPresent: false, analystsPresent: false,
        mediaPresent: false, competitorsPresent: false, audienceType: 'open', isCurated: false,
        attendeeListAvailable: false, designationListAvailable: false,
        audienceInfoConfidence: 'internal-estimate', audienceFit: 'weak',
      },
      package: body.package || {},
      expectedMetrics: body.expectedMetrics || {
        leads: 0, icpLeads: 0, mqls: 0, sqls: 0, meetings: 0, demos: 0, opportunities: 0,
        pipeline: 0, partnerConversations: 0, customerMeetings: 0, contentAssets: 0,
        brandVisibility: '', thoughtLeadershipValue: '', socialPosts: 0, videos: 0, blogs: 0,
      },
      salesReadiness: body.salesReadiness || {
        eventOwnerAssigned: false, salesOwnerAssigned: false, marketingOwnerAssigned: false,
        leadershipSponsorAssigned: false, salesInvolvedBeforeEvent: false, targetAccountListPrepared: false,
        preEventOutreachStarted: false, preEventMeetingsBeingBooked: false, demoReady: false,
        pitchDeckReady: false, pitchCustomized: false, qualificationQuestionsReady: false,
        leadCaptureReady: false, crmCampaignSetUp: false, leadSourceTrackingSetUp: false,
        utmTrackingSetUp: false, qrCodeTrackingSetUp: false, postEventEmailSequenceReady: false,
        linkedInFollowUpReady: false, salesFollowUpSLADefined: false, contentPlanReady: false,
        postEventReviewScheduled: false, readinessLevel: 'not-ready',
      },
      risk: body.risk || {
        organizerCredible: true, audienceQualityVerified: false, attendeeDataGuaranteed: false,
        riskOfPoorFootfall: false, riskOfLowICPFit: false, riskOfVendorHeavyAudience: false,
        riskOfGenericAudience: false, teamBandwidthAvailable: true, dateConflict: false,
        campaignConflict: false, packageOverpriced: false, dependencyOnUnverifiedPromises: false,
        isNewEvent: true, audienceOverlapWithOtherEvent: false, attendedBefore: false,
        previousROIPositive: false, competitorsHeavilyPresent: false, poorBoothLocation: false,
        poorSpeakingSlotTiming: false, attendeeListUnavailable: false, noFollowUpAccess: false,
        noInternalOwner: false, noPostEventPlan: false, riskLevel: 'medium',
      },
      confidence: body.confidence || {
        audienceSizeConfidence: 'internal-estimate', audienceSeniorityConfidence: 'internal-estimate',
        icpPercentageConfidence: 'internal-estimate', namedAccountsConfidence: 'unknown',
        attendeeListConfidence: 'unknown', leadScannerConfidence: 'unknown',
        speakingSlotConfidence: 'unknown', boothLocationConfidence: 'unknown',
        meetingSchedulerConfidence: 'unknown', costConfidence: 'verbal',
        overallConfidence: 'low',
      },
      scoreBreakdown,
      recommendation,
      recommendationReasons: reasons,
      conditionalGoRequirements: conditionalRequirements,
      approvalStatus: body.approvalStatus || 'draft',
      approvalHistory: body.approvalHistory || [],
      eventOwner: body.eventOwner || '',
      salesOwner: body.salesOwner || '',
      marketingOwner: body.marketingOwner || '',
      checklist,
      notes: body.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const created = await createEvent(event);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
