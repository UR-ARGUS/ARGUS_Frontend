// ZAP core.alerts() 응답 항목 (실제로 채워지는 필드만 다룸)
export interface ZapAlert {
  alert: string;
  risk: string;
  confidence: string;
  description: string;
  solution: string;
  reference: string;
  url: string;
  param: string;
  attack: string;
  evidence: string;
  cweid: string;
  wascid: string;
  pluginId: string;
  method?: string;
}

export interface ScanResult {
  target_url: string;
  total_alerts: number;
  parameter_tampering_alerts: ZapAlert[];
}

export interface ScanProgress {
  phase: "collect" | "classify" | "manipulate" | "llm_review";
  percent: number;
}