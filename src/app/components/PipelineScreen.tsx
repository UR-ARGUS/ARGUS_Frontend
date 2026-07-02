import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Play, Globe, Code2, GitBranch, FileDown,
  CheckCircle2, ArrowRight, TrendingDown, Zap,
  Upload, X, FileArchive, Link2, ToggleLeft, ToggleRight,
  Shield, Brain, AlertTriangle,
} from "lucide-react";
import { T } from "./tokens";
import type { ScanResult, ScanProgress } from "../types/scan";

const SCAN_API_BASE = "http://localhost:8085/api/v1/scan";
const POLL_INTERVAL_MS = 3000;

async function pollScanResult(taskId: string, onProgress: (progress: ScanProgress) => void): Promise<ScanResult> {
  for (;;) {
    const res = await fetch(`${SCAN_API_BASE}/${taskId}`);
    if (!res.ok) throw new Error(`스캔 상태 조회 실패 (HTTP ${res.status})`);
    const data = await res.json();

    if (data.state === "SUCCESS") {
      if (data.result?.status === "failed") {
        throw new Error(data.result.error || "스캔이 실패했습니다.");
      }
      return data.result?.results as ScanResult;
    }
    if (data.state === "FAILURE") {
      throw new Error(data.error || "스캔이 실패했습니다.");
    }
    if (data.state === "PROGRESS" && data.progress) {
      onProgress(data.progress as ScanProgress);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// ─────────────────────────────────────────
// 공통 원자
// ─────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: T.border }} />;
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color, background: bg, padding: "2px 8px", borderRadius: 20 }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────
// 파이프라인 카드 (동일 크기 강제)
// ─────────────────────────────────────────

function PipeCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 12,
      border: `1.5px solid ${T.border}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      // 동일 높이 — 내부가 scroll 처리
      minHeight: 0,
    }}>
      {children}
    </div>
  );
}

function PipeHeader({ step, label, accent, right }: {
  step: number; label: string; accent: string; right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", background: T.bg,
      borderBottom: `1px solid ${T.border}`, flexShrink: 0,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7, background: accent, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: "#fff",
      }}>{step}</div>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: T.text }}>{label}</span>
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}

function PipeBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// 스캔 진행 바
// ─────────────────────────────────────────

function ScanBar({ label, tag, tagColor, barColor, running, percent }: {
  label: string; tag: string; tagColor: string; barColor: string; running: boolean; percent: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "9px 11px", borderRadius: 8, background: T.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: T.sub, flex: 1 }}>{label}</span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 600, color: tagColor, background: `${tagColor}18`, padding: "1px 6px", borderRadius: 4 }}>{tag}</span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: running ? barColor : T.muted, width: 30, textAlign: "right" }}>
          {running ? (percent < 100 ? `${Math.round(percent)}%` : "완료") : "대기"}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: T.border, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", borderRadius: 99, background: barColor }} animate={{ width: `${running ? percent : 0}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 깔때기 (4단계)
// ─────────────────────────────────────────

function Funnel({ phase }: { phase: "sk" | "ai" | "none" }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setTimeout(() => setOn(true), 100); }, []);

  const rows = [
    { label: "원시 탐지",    v: 1690, pct: 100,  color: T.muted },
    { label: "SK 가이드 필터", v: 680,  pct: 40.2, color: T.blue,   show: phase === "sk" || phase === "ai" },
    { label: "AI 우선순위",   v: 230,  pct: 13.6, color: T.green,  show: phase === "ai" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {rows.filter(r => r.show !== false).map((r, i) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.sub, width: 76, flexShrink: 0 }}>{r.label}</span>
          <div style={{ flex: 1, height: 14, borderRadius: 4, background: T.bg, overflow: "hidden" }}>
            <motion.div style={{ height: "100%", borderRadius: 4, background: r.color, opacity: 0.28 }}
              initial={{ width: 0 }} animate={{ width: on ? `${r.pct}%` : 0 }}
              transition={{ duration: 0.75, delay: i * 0.12, ease: "easeOut" }} />
          </div>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: r.color, width: 36, textAlign: "right", flexShrink: 0 }}>
            {r.v.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// 심각도 바
// ─────────────────────────────────────────

function SevBars() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {[
        { label: "치명적", n: 12, color: T.red },
        { label: "높음",   n: 48, color: T.amber },
        { label: "중간",   n: 97, color: T.primary },
        { label: "낮음",   n: 73, color: T.muted },
      ].map(s => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.sub, width: 34 }}>{s.label}</span>
          <div style={{ flex: 1, height: 5, borderRadius: 99, background: T.border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(s.n / 230) * 100}%`, borderRadius: 99, background: s.color }} />
          </div>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 600, color: s.color, width: 22, textAlign: "right" }}>{s.n}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// 스캔 입력 패널
// ─────────────────────────────────────────

function ScanInputPanel({ scanning, scanError, onScanStart, onScanProgress, onScanFinish }: {
  scanning: boolean;
  scanError: string | null;
  onScanStart: () => void;
  onScanProgress: (progress: ScanProgress) => void;
  onScanFinish: (result: ScanResult | null, error?: string) => void;
}) {
  const [dastEnabled, setDastEnabled] = useState(true);
  const [sastEnabled, setSastEnabled] = useState(false);
  const [dastUrl, setDastUrl]         = useState("");
  const [apiBaseUrl, setApiBaseUrl]   = useState(""); // Swagger 명세용 API 베이스 URL 상태 추가
  
  // 로그인 및 인증 설정 상태 추가
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authMode, setAuthMode]       = useState<"form" | "header">("form");
  const [customHeader, setCustomHeader] = useState(""); // 예: Cookie: Session=xyz

  const [loginUrl, setLoginUrl]       = useState("");
  const [usernameField, setUsernameField] = useState("username");
  const [passwordField, setPasswordField] = useState("password");
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [loggedInIndicator, setLoggedInIndicator] = useState("Logout");

  const [gitUrl, setGitUrl]           = useState("");
  const [branch, setBranch]           = useState("main");
  const [sastMode, setSastMode]       = useState<"git" | "zip">("git");
  const [zipFile, setZipFile]         = useState<File | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".zip") || f.name.endsWith(".tar.gz"))) setZipFile(f);
  };

  const canScan = (dastEnabled && dastUrl.trim()) || (sastEnabled && (gitUrl.trim() || zipFile));

  // 스캔 트리거 연동 함수
  const triggerScanApi = async () => {
    if (!canScan) return;

    if (dastEnabled) {
      try {
        const parsed = new URL(dastUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("invalid protocol");
      } catch {
        onScanFinish(null, "올바른 URL 형식이 아닙니다. (예: https://target-service.com)");
        return;
      }
    }

    onScanStart();
    try {
      const payload = {
        target_url: dastUrl,
        login_config: authEnabled && authMode === "form" ? {
          login_url: loginUrl || dastUrl,
          username_field: usernameField,
          password_field: passwordField,
          username: username,
          password: password,
          logged_in_indicator: loggedInIndicator
        } : null,
        custom_header: authEnabled && authMode === "header" ? customHeader : null,
        api_base_url: apiBaseUrl.trim() ? apiBaseUrl.trim() : null // Swagger API URL 페이로드 주입
      };

      const response = await fetch(`${SCAN_API_BASE}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`스캔 요청 실패 (HTTP ${response.status})`);
      const data = await response.json();
      console.log("Scan Triggered:", data);

      const result = await pollScanResult(data.task_id, onScanProgress);
      onScanFinish(result);
    } catch (err) {
      console.error("Scan triggering failed:", err);
      const message = err instanceof Error ? err.message : "스캔 중 오류가 발생했습니다.";
      onScanFinish(null, message);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <div style={{
        background: T.surface, borderRadius: 14,
        border: `1.5px solid ${scanning ? T.primary : T.border}`,
        boxShadow: scanning ? `0 0 0 3px ${T.primaryBg}` : "0 2px 12px rgba(0,0,0,0.05)",
        transition: "all 0.2s", overflow: "hidden",
      }}>

        {/* ── DAST 행 ── */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* 토글 */}
            <button onClick={() => setDastEnabled(v => !v)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
              {dastEnabled
                ? <ToggleRight size={22} color={T.blue} />
                : <ToggleLeft  size={22} color={T.muted} />}
            </button>
            <Globe size={14} color={dastEnabled ? T.blue : T.muted} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: dastEnabled ? T.blue : T.muted, background: dastEnabled ? T.blueBg : T.bg, padding: "1px 7px", borderRadius: 4 }}>DAST</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.muted }}>동적 분석 — 웹 서비스 URL</span>
            {scanning && dastEnabled && (
              <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue, marginLeft: "auto" }}
                animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
            )}
          </div>
          {dastEnabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, paddingLeft: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link2 size={13} color={T.muted} style={{ flexShrink: 0 }} />
                <input
                  value={dastUrl} onChange={e => setDastUrl(e.target.value)}
                  placeholder="https://target-service.com"
                  style={{ flex: 1, border: "none", outline: "none", fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: T.text, background: "transparent" }}
                />
              </div>

              {/* API Base URL / Swagger 스펙 연동 필드 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
                <Code2 size={13} color={T.muted} style={{ flexShrink: 0 }} />
                <input
                  value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)}
                  placeholder="백엔드 API 서버 URL (예: http://localhost:8080 - Swagger/OpenAPI 연동)"
                  style={{ flex: 1, border: "none", outline: "none", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: T.sub, background: "transparent" }}
                />
              </div>

              {/* ZAP DAST 전용 자동 로그인 인증 설정 패널 */}
              <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: 10, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <button onClick={() => setAuthEnabled(v => !v)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
                    {authEnabled
                      ? <ToggleRight size={18} color={T.blue} />
                      : <ToggleLeft  size={18} color={T.muted} />}
                  </button>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: authEnabled ? T.text : T.muted }}>
                    인증 세션 자동 적용 (Parameter Tampering 테스트 최적화)
                  </span>
                </div>

                {authEnabled && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* 인증 방식 서브 탭 */}
                    <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 7, padding: 3, alignSelf: "flex-start" }}>
                      <button onClick={() => setAuthMode("form")} style={{
                        padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                        fontFamily: "Inter, sans-serif", fontSize: 10,
                        fontWeight: authMode === "form" ? 600 : 400,
                        color: authMode === "form" ? T.blue : T.muted,
                        background: authMode === "form" ? T.surface : "transparent",
                        boxShadow: authMode === "form" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        transition: "all 0.13s",
                      }}>
                        계정 양식 로그인 (Form)
                      </button>
                      <button onClick={() => setAuthMode("header")} style={{
                        padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                        fontFamily: "Inter, sans-serif", fontSize: 10,
                        fontWeight: authMode === "header" ? 600 : 400,
                        color: authMode === "header" ? T.blue : T.muted,
                        background: authMode === "header" ? T.surface : "transparent",
                        boxShadow: authMode === "header" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        transition: "all 0.13s",
                      }}>
                        세션 쿠키/헤더 직접 주입 (Cookie)
                      </button>
                    </div>

                    {authMode === "form" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: T.bg, padding: 10, borderRadius: 8, border: `1.5px solid ${T.border}` }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.sub, fontWeight: 600 }}>로그인 페이지 URL</label>
                          <input 
                            value={loginUrl} onChange={e => setLoginUrl(e.target.value)}
                            placeholder="https://target-service.com/login"
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.sub, fontWeight: 600 }}>성공 식별문자 (Logged in Indicator)</label>
                          <input 
                            value={loggedInIndicator} onChange={e => setLoggedInIndicator(e.target.value)}
                            placeholder="Logout"
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.sub, fontWeight: 600 }}>ID Input name 속성</label>
                          <input 
                            value={usernameField} onChange={e => setUsernameField(e.target.value)}
                            placeholder="username"
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.sub, fontWeight: 600 }}>PW Input name 속성</label>
                          <input 
                            value={passwordField} onChange={e => setPasswordField(e.target.value)}
                            placeholder="password"
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.sub, fontWeight: 600 }}>테스트용 ID</label>
                          <input 
                            value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="test_user"
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.sub, fontWeight: 600 }}>테스트용 PW</label>
                          <input 
                            type="password"
                            value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, background: T.bg, padding: 10, borderRadius: 8, border: `1.5px solid ${T.border}` }}>
                        <label style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.sub, fontWeight: 600 }}>인증 헤더 / 쿠키 문자열 입력</label>
                        <input 
                          value={customHeader} onChange={e => setCustomHeader(e.target.value)}
                          placeholder="Cookie: SESSION_ID=abc123xyz  또는  Authorization: Bearer mytoken..."
                          style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "6px 8px", fontSize: 11, fontFamily: "JetBrains Mono, monospace", width: "100%" }}
                        />
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: T.muted }}>
                          * 로그인 모달이 팝업으로 뜰 때 개발자 도구(F12)에서 발급된 실제 Cookie 헤더값을 그대로 복사해 오면 ZAP에 강제 매핑됩니다.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 액션 바 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: T.bg }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {(dastEnabled ? ["OWASP ZAP"] : []).concat(["KISA W-01~W-28", "ISMS-P"]).map(t => (
              <span key={t} style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 7px" }}>{t}</span>
            ))}
          </div>
          <button
            onClick={triggerScanApi}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 20px", borderRadius: 8, border: "none",
              cursor: (!scanning && canScan) ? "pointer" : "default",
              fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
              background: scanning ? T.primaryBg : canScan ? T.primary : T.border,
              color: scanning ? T.primary : canScan ? "#fff" : T.muted,
              boxShadow: (!scanning && canScan) ? "0 3px 10px rgba(67,97,238,0.35)" : "none",
              transition: "all 0.18s",
            }}
          >
            <Play size={13} fill={(!scanning && canScan) ? "currentColor" : "none"} />
            {scanning ? "스캔 실행 중..." : "스캔 시작"}
          </button>
        </div>

        {scanError && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", background: T.redBg, borderTop: `1px solid ${T.red}22` }}>
            <AlertTriangle size={12} color={T.red} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.red }}>{scanError}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

export function PipelineScreen({ onGoToTriage, scanning, scanError, scanProgress, onScanStart, onScanProgress, onScanFinish }: {
  onGoToTriage: () => void;
  scanning: boolean;
  scanError: string | null;
  scanProgress: ScanProgress | null;
  onScanStart: () => void;
  onScanProgress: (progress: ScanProgress) => void;
  onScanFinish: (result: ScanResult | null, error?: string) => void;
}) {
  const phaseLabel = scanProgress?.phase === "openapi_discovery" ? "API 스펙 탐지"
    : scanProgress?.phase === "spider" ? "크롤링(Spider)"
    : scanProgress?.phase === "ajax_spider" ? "크롤링(JS 렌더링)"
    : scanProgress?.phase === "ascan" ? "액티브 스캔"
    : "동적";

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* 스캔 입력 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingTop: 4 }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.muted, margin: 0 }}>
          OWASP ZAP DAST 동적 스캔 — Argus ASPM
        </p>
        <ScanInputPanel
          scanning={scanning}
          scanError={scanError}
          onScanStart={onScanStart}
          onScanProgress={onScanProgress}
          onScanFinish={onScanFinish}
        />
      </div>

      {/* ── 3단계 파이프라인 (동일 너비) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 28px 1fr 28px 1fr",
        alignItems: "stretch",   // ← 높이 동일
        maxWidth: 1160, margin: "0 auto", width: "100%",
      }}>

        {/* STEP 1 — 원시 탐지 */}
        <PipeCard>
          <PipeHeader step={1} label="원시 탐지" accent={T.muted}
            right={scanning
              ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: T.primary }}>● 실행 중</motion.span>
              : <Pill label="대기" color={T.muted} bg={T.bg} />}
          />
          <PipeBody>
            <ScanBar label="OWASP ZAP DAST" tag={phaseLabel} tagColor={T.blue} barColor={T.blue} running={scanning} percent={scanProgress?.percent ?? 0} />
            <Divider />
            {/* 탐지 수치 — 흐릿하게 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.bg }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={13} color={T.muted} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.muted }}>원시 탐지 건수</span>
              </div>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 22, fontWeight: 700, color: "#CBD5E1" }}>1,690</span>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.muted, lineHeight: 1.65, margin: 0 }}>
              HTTP 엔드포인트 동적 취약점 공격 진단. 오탐 및 중복 포함된 원시 데이터입니다.
            </p>
          </PipeBody>
        </PipeCard>

        {/* 화살표 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowRight size={15} color={T.borderHov} />
        </div>

        {/* STEP 2 — AI 도달성 트리아지 (SK 가이드 → AI 우선순위) */}
        <PipeCard>
          <PipeHeader step={2} label="AI 도달성 트리아지" accent={T.amber}
            right={<Pill label="2단계 필터" color={T.amber} bg={T.amberBg} />}
          />
          <PipeBody>
            {/* 레이어 1: SK쉴더스 가이드 필터링 */}
            <div style={{ padding: 12, borderRadius: 9, background: T.amberBg, border: `1px solid ${T.amber}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <Shield size={12} color={T.amber} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: T.amber }}>레이어 1 — SK쉴더스 가이드 필터링</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { label: "KISA W-01~W-28 매핑", done: true },
                  { label: "ISMS-P 통제 항목 검증", done: true },
                  { label: "오탐 패턴 제거", done: true },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={11} color={item.done ? T.green : T.muted} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.sub }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.amber}20` }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.sub }}>SK 가이드 필터 후</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 700, color: T.amber }}>680건</span>
              </div>
            </div>

            {/* 레이어 2: AI 우선순위 분석 */}
            <div style={{ padding: 12, borderRadius: 9, background: T.greenBg, border: `1px solid ${T.green}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <Brain size={12} color={T.green} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: T.green }}>레이어 2 — AI 우선순위 분석</span>
              </div>
              <Funnel phase="ai" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.green}20` }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.sub }}>최종 검증 취약점</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 700, color: T.green }}>230건</span>
              </div>
            </div>

            <Divider />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: T.redBg }}>
                <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 10, color: T.red }}>제거된 오탐</p>
                <p style={{ margin: 0, fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 700, color: T.red }}>−1,460</p>
              </div>
              <div style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: T.amberBg }}>
                <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 10, color: T.amber }}>SK 가이드 제거</p>
                <p style={{ margin: 0, fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 700, color: T.amber }}>−1,010</p>
              </div>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.muted, lineHeight: 1.65, margin: 0 }}>
              SK쉴더스 보안 가이드로 1차 필터 후, AI가 도달성·비즈니스 영향도 기반으로 우선순위를 결정합니다.
            </p>
          </PipeBody>
        </PipeCard>

        {/* 화살표 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowRight size={15} color={T.borderHov} />
        </div>

        {/* STEP 3 — 조치 및 보고 */}
        <PipeCard>
          <PipeHeader step={3} label="조치 및 보고" accent={T.primary}
            right={<Pill label="완료" color={T.primary} bg={T.primaryBg} />}
          />
          <PipeBody>
            {/* KPI */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "자동 수정",  value: "29",  unit: "자동화 가능",  color: T.green,   bg: T.greenBg },
                { label: "SLA 준수율", value: "85%", unit: "컴플라이언스", color: T.primary, bg: T.primaryBg },
              ].map(m => (
                <div key={m.label} style={{ padding: 12, borderRadius: 8, background: m.bg }}>
                  <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: m.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</p>
                  <p style={{ margin: 0, fontFamily: "JetBrains Mono, monospace", fontSize: 24, fontWeight: 700, color: m.color, lineHeight: 1.15 }}>{m.value}</p>
                  <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 10, color: m.color, opacity: 0.7 }}>{m.unit}</p>
                </div>
              ))}
            </div>
            <Divider />
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: T.sub, margin: 0 }}>심각도 분포</p>
            <SevBars />
            <Divider />
            {[
              { label: "KISA W-01~W-28 보고서 다운로드",          color: T.primary, bg: T.primaryBg },
              { label: "경영진 요약 보고서 다운로드 (한국어 PDF)", color: T.green,   bg: T.greenBg },
            ].map(btn => (
              <button key={btn.label} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                width: "100%", padding: "9px 0", borderRadius: 8,
                border: `1.5px solid ${btn.color}22`, background: btn.bg,
                color: btn.color, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                <FileDown size={13} />
                {btn.label}
              </button>
            ))}
          </PipeBody>
        </PipeCard>
      </div>

      {/* 트리아지 이동 */}
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
        <button onClick={onGoToTriage} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 22px", borderRadius: 9,
          border: `1.5px solid ${T.primary}25`, background: T.primaryBg,
          color: T.primary, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          취약점 트리아지 상세 보기 <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
