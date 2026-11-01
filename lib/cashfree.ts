import crypto from 'crypto';

export interface CashfreeCustomerDetails {
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone: string;
}

export interface CashfreeOrderMeta {
  return_url: string;
  notify_url?: string;
  payment_methods?: string;
}

export interface CreateOrderParams {
  order_id: string;
  order_amount: number;
  order_currency?: string;
  customer_details: CashfreeCustomerDetails;
  order_meta: CashfreeOrderMeta;
  order_note?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  entity: string;
  order_currency: string;
  order_amount: number;
  order_status: 'PAID' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  payment_session_id: string;
  order_token?: string;
  order_expiry_time?: string;
  order_note?: string;
  customer_details: CashfreeCustomerDetails;
  order_meta?: CashfreeOrderMeta;
  payments?: {
    url?: string;
  };
  settlements?: {
    url?: string;
  };
  refunds?: {
    url?: string;
  };
}

export interface CashfreePaymentEntity {
  cf_payment_id: number | string;
  order_id: string;
  entity: string;
  payment_currency: string;
  payment_amount: number;
  payment_time: string;
  payment_status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED' | 'CANCELLED';
  payment_message?: string;
  bank_reference?: string;
  auth_id?: string;
  payment_method?: Record<string, unknown>;
  payment_group?: string;
}

export class CashfreeClient {
  private appId: string;
  private secretKey: string;
  private environment: 'SANDBOX' | 'PRODUCTION';
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.appId =
      process.env.CASHFREE_APP_ID ||
      process.env.CASHFREE_CLIENT_ID ||
      '';

    this.secretKey =
      process.env.CASHFREE_SECRET_KEY ||
      process.env.CASHFREE_CLIENT_SECRET ||
      '';

    const env = (process.env.CASHFREE_ENV || 'SANDBOX').trim().toUpperCase();
    this.environment = env === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';

    this.apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

    this.baseUrl =
      this.environment === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
  }

  public isConfigured(): boolean {
    return Boolean(this.appId && this.secretKey);
  }

  public getEnvironment(): 'SANDBOX' | 'PRODUCTION' {
    return this.environment;
  }

  public getAppId(): string {
    return this.appId;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private getHeaders(): Record<string, string> {
    if (!this.appId || !this.secretKey) {
      throw new Error(
        'Cashfree credentials missing: CASHFREE_APP_ID (or CASHFREE_CLIENT_ID) and CASHFREE_SECRET_KEY are required.'
      );
    }

    return {
      'Content-Type': 'application/json',
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': this.apiVersion,
      'Accept': 'application/json',
    };
  }

  /**
   * Creates an order with Cashfree PG
   */
  public async createOrder(params: CreateOrderParams): Promise<CashfreeOrderResponse> {
    const url = `${this.baseUrl}/orders`;
    const headers = this.getHeaders();

    const payload = {
      order_id: params.order_id,
      order_amount: Number(params.order_amount.toFixed(2)),
      order_currency: params.order_currency || 'INR',
      customer_details: {
        customer_id: params.customer_details.customer_id,
        customer_name: params.customer_details.customer_name || 'Customer',
        customer_email: params.customer_details.customer_email || 'customer@example.com',
        customer_phone: params.customer_details.customer_phone,
      },
      order_meta: {
        return_url: params.order_meta.return_url,
        ...(params.order_meta.notify_url ? { notify_url: params.order_meta.notify_url } : {}),
        ...(params.order_meta.payment_methods ? { payment_methods: params.order_meta.payment_methods } : {}),
      },
      ...(params.order_note ? { order_note: params.order_note } : {}),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Cashfree createOrder failed with status ${response.status}: ${responseText}`
      );
    }

    try {
      return JSON.parse(responseText) as CashfreeOrderResponse;
    } catch {
      throw new Error(`Failed to parse Cashfree response: ${responseText}`);
    }
  }

  /**
   * Retrieves an order by order_id from Cashfree
   */
  public async getOrder(orderId: string): Promise<CashfreeOrderResponse> {
    const url = `${this.baseUrl}/orders/${encodeURIComponent(orderId)}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Cashfree getOrder failed for ${orderId} with status ${response.status}: ${responseText}`
      );
    }

    try {
      return JSON.parse(responseText) as CashfreeOrderResponse;
    } catch {
      throw new Error(`Failed to parse Cashfree order response: ${responseText}`);
    }
  }

  /**
   * Retrieves all payments for an order
   */
  public async getOrderPayments(orderId: string): Promise<CashfreePaymentEntity[]> {
    const url = `${this.baseUrl}/orders/${encodeURIComponent(orderId)}/payments`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Cashfree getOrderPayments failed for ${orderId} with status ${response.status}: ${responseText}`
      );
    }

    try {
      return JSON.parse(responseText) as CashfreePaymentEntity[];
    } catch {
      throw new Error(`Failed to parse Cashfree payments response: ${responseText}`);
    }
  }

  /**
   * Verifies Cashfree webhook signature
   * Signature is computed as HMAC SHA256 of timestamp + rawBody
   */
  public verifyWebhookSignature(params: {
    signature: string;
    rawBody: string;
    timestamp: string;
  }): boolean {
    if (!this.secretKey) {
      throw new Error('CASHFREE_SECRET_KEY is required to verify webhook signatures.');
    }

    if (!params.signature || !params.rawBody || !params.timestamp) {
      return false;
    }

    const dataToSign = `${params.timestamp}${params.rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(dataToSign)
      .digest('base64');

    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(params.signature);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  }
}

export const cashfree = new CashfreeClient();
export default cashfree;
