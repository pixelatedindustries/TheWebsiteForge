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
    interval: string;
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
  type: string;
  deployUrl: string | null;
}

export interface ProjectAction {
  id: string;
  title: string;
  details: string | null;
  status: string;
  dueAt: string | null;
}

export interface ProjectFile {
  id: string;
  kind: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface ProjectActivity {
  id: string;
  type: string;
  title: string;
  details: string | null;
  createdAt: string;
}

export interface CustomerProject {
  id: string;
  name: string;
  planKey: string;
  status: string;
  progress: number;
  estimatedLaunchAt: string | null;
  brief: Record<string, unknown>;
  customerNotes: string | null;
  latestUpdate: string | null;
  actions: ProjectAction[];
  files: ProjectFile[];
  activity: ProjectActivity[];
}

export interface ChangeRequest {
  id: string;
  title: string;
  details: string;
  status: string;
  quotedCents: number | null;
  createdAt: string;
}

export interface UpcomingCost {
  id: string;
  label: string;
  amountCents: number;
  dueAt: string;
  kind: string;
}
