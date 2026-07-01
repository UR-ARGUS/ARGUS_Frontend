import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, ChevronRight, ExternalLink, Terminal,
  AlertTriangle, Bug, Cpu, Lock, Search,
} from "lucide-react";
import { T } from "./tokens";
import type { ScanResult, ZapAlert } from "../types/scan";

// ─────────────────────────────────────────
// ZAP 결과 → 화면 표시용 매핑
// ─────────────────────────────────────────

function riskMeta(risk: string): { label: string; color: string; bg: string } {
  switch (risk) {
    case "High": return { label: "높음", color: T.red, bg: T.redBg };
    case "Medium": return { label: "중간", color: T.amber, bg: T.amberBg };
    case "Low": return { label: "낮음", color: T.primary, bg: T.primaryBg };
    default: return { label: "정보", color: T.muted, bg: T.bg };
  }
}

function confidenceLabel(confidence: string): string {
  switch (confidence) {
    case "High": return "신뢰도 높음";
    case "Medium": return "신뢰도 중간";
    case "Low": return "신뢰도 낮음";
    case "Confirmed": return "확인됨";
    default: return confidence || "신뢰도 정보 없음";
  }
}

interface Finding {
  key: string;
  alert: ZapAlert;
  sev: string;
  color: string;
  bg: string;
  endpoint: string;
}

function toFindings(alerts: ZapAlert[]): Finding[] {
  return alerts.map((alert, i) => {
    const meta = riskMeta(alert.risk);
    return {
      key: `${alert.pluginId || "alert"}-${i}`,
      alert,
      sev: meta.label,
      color: meta.color,
      bg: meta.bg,
      endpoint: `${alert.method ?? "GET"} ${alert.url}`,
    };
  });
}

// ─────────────────────────────────────────
// 공통 UI
// ─────────────────────────────────────────

function SectionCard({ icon: Icon, title, accent, accentBg, badge, children }: {
  icon: React.ElementType; title: string; accent: string; accentBg: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: T.surface, borderRadius: 12, border: `1.5px solid ${accent}22`, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: accentBg, borderBottom: `1px solid ${accent}18` }}>
        <Icon size={13} color={accent} />
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: accent }}>{title}</span>
        {badge && <span style={{ marginLeft: "auto", fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: accent, background: T.surface, padding: "2px 8px", borderRadius: 20, opacity: 0.8 }}>{badge}</span>}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: T.bg }}>
      <Icon size={28} color={T.muted} />
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{title}</p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.muted, margin: 0, maxWidth: 380, textAlign: "center", lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

export function TriageScreen({ scanResult }: { scanResult: ScanResult | null }) {
  const findings = scanResult ? toFindings(scanResult.parameter_tampering_alerts) : [];
  const [selKey, setSelKey] = useState<string | null>(null);
  const sel = findings.find(f => f.key === selKey) ?? findings[0] ?? null;

  if (!scanResult) {
    return (
      <EmptyState icon={Search} title="아직 스캔 결과가 없습니다"
        desc="파이프라인 화면에서 스캔을 실행하면 완료 후 이 화면에 실제 탐지 결과가 표시됩니다." />
    );
  }

  if (!sel) {
    return (
      <EmptyState icon={Shield} title="파라미터 조작 취약점이 발견되지 않았습니다"
        desc={`대상: ${scanResult.target_url} · 전체 탐지 ${scanResult.total_alerts}건 (파라미터 조작 관련 항목 없음)`} />
    );
  }

  const references = sel.alert.reference.split("\n").map(r => r.trim()).filter(Boolean);
  const hasCwe = sel.alert.cweid && sel.alert.cweid !== "-1" && sel.alert.cweid !== "0";

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", background: T.bg }}>

      {/* ── 좌측 피드 ── */}
      <div style={{ width: 310, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* 헤더 */}
        <div style={{ padding: "11px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: T.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Bug size={13} color={T.muted} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: T.text }}>탐지된 취약점</span>
          </div>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: T.green, background: T.greenBg, padding: "2px 8px", borderRadius: 6 }}>{findings.length}</span>
        </div>

        {/* 대상 정보 */}
        <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
            {scanResult.target_url} · 전체 탐지 {scanResult.total_alerts}건
          </span>
        </div>

        {/* 카드 목록 */}
        <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          {findings.map(f => {
            const active = sel.key === f.key;
            return (
              <button key={f.key} onClick={() => setSelKey(f.key)} style={{
                textAlign: "left", borderRadius: 10, overflow: "hidden",
                border: `1.5px solid ${active ? f.color + "40" : T.border}`,
                background: active ? f.bg : T.surface,
                cursor: "pointer", position: "relative",
                boxShadow: active ? `0 3px 12px ${f.color}14` : "none",
                transition: "all 0.15s",
              }}>
                {/* 심각도 바 */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: f.color, borderRadius: "10px 0 0 10px" }} />
                <div style={{ padding: "11px 11px 11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{f.alert.alert}</span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: f.color, background: `${f.color}15`, padding: "1px 6px", borderRadius: 4 }}>{f.sev}</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: T.muted }}>{confidenceLabel(f.alert.confidence)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 600, color: T.blue, background: T.blueBg, padding: "1px 5px", borderRadius: 3 }}>DAST</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>{f.endpoint}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 600, color: T.primary, background: T.primaryBg, padding: "2px 7px", borderRadius: 20 }}>OWASP ZAP DAST</span>
                    {active && <ChevronRight size={12} color={f.color} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 우측 인스펙터 ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          <motion.div key={sel.key}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}
          >
            {/* 인스펙터 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: sel.bg, border: `1.5px solid ${sel.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={17} color={sel.color} />
                </div>
                <div>
                  <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3 }}>{sel.alert.alert}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: T.muted }}>{sel.endpoint}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: sel.color, background: sel.bg, padding: "1px 7px", borderRadius: 4 }}>{sel.sev} · {confidenceLabel(sel.alert.confidence)}</span>
                  </div>
                </div>
              </div>
              <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.bg, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 12, color: T.sub }}>
                <ExternalLink size={11} /> JIRA 이슈 생성
              </button>
            </div>

            {/* 섹션 A — 위험 요약 */}
            <SectionCard icon={Cpu} title="섹션 A — 위험 요약" accent={T.primary} accentBg={T.primaryBg} badge="OWASP ZAP 탐지">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: T.sub, lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
                {sel.alert.description || "설명 정보가 제공되지 않았습니다."}
              </p>
            </SectionCard>

            {/* 섹션 B — 공격 증거 */}
            <SectionCard icon={Terminal} title="섹션 B — 공격 증거" accent={T.amber} accentBg={T.amberBg} badge="ZAP Active Scan">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* 공격 파라미터/페이로드 */}
                <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    <Terminal size={10} color={T.muted} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.sub }}>공격 파라미터 / 페이로드</span>
                  </div>
                  <div style={{ padding: 10, background: "#FAFBFF" }}>
                    <pre style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#334155", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
{`URL: ${sel.alert.url}
Param: ${sel.alert.param || "-"}
Attack: ${sel.alert.attack || "-"}`}
                    </pre>
                  </div>
                </div>
                {/* 증거 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, flex: 1 }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "6px 10px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.muted }}>ZAP Evidence</span>
                    </div>
                    <div style={{ padding: 10, background: "#FFFBF5" }}>
                      <pre style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#92400E", margin: 0, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                        {sel.alert.evidence || "증거 데이터가 없습니다."}
                      </pre>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 7, background: T.amberBg }}>
                    <AlertTriangle size={10} color={T.amber} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 500, color: T.amber }}>
                      ZAP Active Scan으로 탐지됨 — 실제 악용 가능성은 수동 검증이 필요합니다.
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 섹션 C — 조치 권고 */}
            <SectionCard icon={Lock} title="섹션 C — 조치 권고" accent={T.green} accentBg={T.greenBg} badge={hasCwe ? `CWE-${sel.alert.cweid}` : undefined}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: T.sub, margin: "0 0 6px" }}>권장 조치</p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.text, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                    {sel.alert.solution || "권장 조치 정보가 제공되지 않았습니다."}
                  </p>
                </div>
                {references.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: T.sub, margin: "0 0 6px" }}>참고 자료</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {references.map(ref => (
                        <a key={ref} href={ref} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: T.primary, textDecoration: "none", wordBreak: "break-all" }}>
                          {ref}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}