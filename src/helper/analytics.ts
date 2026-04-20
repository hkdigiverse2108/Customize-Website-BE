import { analyticsModel } from "../database";

interface TrackEventParams {
  storeId: string;
  eventType: 'visit' | 'view' | 'click' | 'sale';
  resourceType?: 'product' | 'page' | 'component';
  resourceId?: string;
  metadata?: any;
  req?: any;
}

export const trackEvent = async (params: TrackEventParams) => {
  try {
    const { storeId, eventType, resourceType, resourceId, metadata, req } = params;

    await new analyticsModel({
      storeId,
      eventType,
      resourceType,
      resourceId,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      timestamp: new Date()
    }).save();

  } catch (error) {
    console.error("Analytics tracking failed:", error);
    // We don't throw error back to user because analytics should not break the main flow
  }
};
