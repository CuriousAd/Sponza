import { apiClient } from "@/lib/api-client";

export interface CreateTipOrderPayload {
  creator_slug: string;
  donor_name: string;
  amount: number;
  message?: string;
}

export interface CreateTipOrderResult {
  order_id: string;
  payment_session_id: string;
  amount: number;
  creator_name: string;
}

export async function createTipOrder(payload: CreateTipOrderPayload): Promise<CreateTipOrderResult> {
  return await apiClient<CreateTipOrderResult>("/api/tip/create-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
