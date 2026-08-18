export interface Creator {
  id: string;
  slug: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  youtube_url: string | null;
  upi_id: string | null;
  upi_verified: boolean;
  wallet_balance: string;
  obs_token: string;
}

export interface TipEvent {
  id: string;
  donorName: string;
  amount: number;
  message: string;
  timestamp: number;
}
