export interface WalletData {
  currency: string;
  balanceCents: number;
  monthlyBurnCents: number;
  runwayMonths: number | null;
  recurring: Array<{
    id: string;
    kind: string;
    label: string;
    amountCents: number;
    nextChargeAt: string;
  }>;
}

export interface Txn {
  id: string;
  type: string;
  amountCents: number;
  balanceAfterCents: number;
  description: string;
  reference: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: number;
  type: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: string;
}

export interface Site {
  id: string;
  name: string;
  status: string;
}
