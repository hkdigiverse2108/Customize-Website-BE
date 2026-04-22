
interface TrackEventParams {
  storeId: string;
  eventType: 'visit' | 'view' | 'click' | 'sale';
  resourceType?: 'product' | 'page' | 'component';
  resourceId?: string;
  metadata?: any;
  req?: any;
}

export const trackEvent = async (params: any) => {
  // Internal tracking disabled as per user request
  return;
};
