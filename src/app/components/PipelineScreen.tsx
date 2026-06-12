import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Play, Globe, Code2, GitBranch, FileDown,
  CheckCircle2, ArrowRight, TrendingDown, Zap,
  Upload, X, FileArchive, Link2, ToggleLeft, ToggleRight,
  Shield, Brain, AlertTriangle,
} from "lucide-react";
import { T } from "./tokens";

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

function ScanBar({ label, tag, tagColor, barColor, delay, running }: {
  label: string; tag: string; tagColor: string; barColor: string; delay: number; running: boolean;
}) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!running) { setPct(0); return; }
    const t = setTimeout(() => {
      const iv = setInterval(() => setPct(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + 0.65; }), 22);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [running, delay]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "9px 11px", borderRadius: 8, background: T.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: T.sub, flex: 1 }}>{label}</span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 600, color: tagColor, background: `${tagColor}18`, padding: "1px 6px", borderRadius: 4 }}>{tag}</span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: running ? barColor : T.muted, width: 30, textAlign: "right" }}>
          {running ? (pct < 100 ? `${Math.round(pct)}%` : "완료") : "대기"}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: T.border, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", borderRadius: 99, background: barColor }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
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

function ScanInputPanel({ scanning, onScan }: { scanning: boolean; onScan: () => void }) {
  const [dastEnabled, setDastEnabled] = useState(true);
  const [sastEnabled, setSastEnabled] = useState(false);
  const [dastUrl, setDastUrl]         = useState("");
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingLeft: 4 }}>
              <Link2 size={13} color={T.muted} style={{ flexShrink: 0 }} />
              <input
                value={dastUrl} onChange={e => setDastUrl(e.target.value)}
                placeholder="https://target-service.com"
                style={{ flex: 1, border: "none", outline: "none", fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: T.text, background: "transparent" }}
              />
            </div>
          )}
        </div>

        <Divider />

        {/* ── SAST 행 ── */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSastEnabled(v => !v)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
              {sastEnabled
                ? <ToggleRight size={22} color={T.purple} />
                : <ToggleLeft  size={22} color={T.muted} />}
            </button>
            <Code2 size={14} color={sastEnabled ? T.purple : T.muted} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: sastEnabled ? T.purple : T.muted, background: sastEnabled ? T.purpleBg : T.bg, padding: "1px 7px", borderRadius: 4 }}>SAST</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.muted }}>정적 분석 — Git 저장소 또는 ZIP 업로드</span>
          </div>

          {sastEnabled && (
            <div style={{ marginTop: 10, paddingLeft: 4, display: "flex", flexDirection: "column", gap: 8 }}>
              {/* 서브 탭 */}
              <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 7, padding: 3, alignSelf: "flex-start" }}>
                {([
                  { id: "git" as const, icon: GitBranch, label: "Git 주소" },
                  { id: "zip" as const, icon: FileArchive, label: "ZIP / 폴더" },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setSastMode(tab.id)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 12px", borderRadius: 5, border: "none", cursor: "pointer",
                    fontFamily: "Inter, sans-serif", fontSize: 11,
                    fontWeight: sastMode === tab.id ? 600 : 400,
                    color: sastMode === tab.id ? T.purple : T.muted,
                    background: sastMode === tab.id ? T.surface : "transparent",
                    boxShadow: sastMode === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.13s",
                  }}>
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {sastMode === "git" ? (
                /* Git 입력 */
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <GitBranch size={13} color={T.muted} style={{ flexShrink: 0 }} />
                  <input
                    value={gitUrl} onChange={e => setGitUrl(e.target.value)}
                    placeholder="https://github.com/org/repo  또는  git@github.com:org/repo.git"
                    style={{ flex: 1, border: "none", outline: "none", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: T.text, background: "transparent" }}
                  />
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <select value={branch} onChange={e => setBranch(e.target.value)} style={{
                      appearance: "none", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500,
                      color: T.sub, background: T.bg, border: `1px solid ${T.border}`,
                      borderRadius: 6, padding: "4px 20px 4px 8px", cursor: "pointer", outline: "none",
                    }}>
                      {["main", "develop", "staging", "release"].map(b => <option key={b}>{b}</option>)}
                    </select>
                    <svg style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="10" height="10" viewBox="0 0 10 10">
                      <path d="M2 3.5L5 6.5L8 3.5" stroke={T.muted} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              ) : (
                /* ZIP 드롭존 */
                zipFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: T.purpleBg, border: `1px solid ${T.purple}28` }}>
                    <FileArchive size={16} color={T.purple} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: T.purple }}>{zipFile.name}</p>
                      <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 10, color: T.muted }}>{(zipFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => setZipFile(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.muted, display: "flex" }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      padding: "18px 16px", borderRadius: 8, cursor: "pointer",
                      border: `1.5px dashed ${dragOver ? T.purple : T.borderHov}`,
                      background: dragOver ? T.purpleBg : T.bg,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    <Upload size={20} color={dragOver ? T.purple : T.muted} />
                    <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: dragOver ? T.purple : T.sub }}>
                      ZIP 또는 tar.gz 파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 11, color: T.muted }}>
                      소스코드 폴더를 압축하여 업로드 — Semgrep OSS + CodeQL 정적 분석 실행
                    </p>
                    <input ref={fileRef} type="file" accept=".zip,.tar.gz" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) setZipFile(f); }} />
                  </div>
                )
              )}

              {scanning && sastEnabled && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: T.purple }}
                    animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.3 }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.purple }}>정적 분석 실행 중...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Divider />

        {/* 액션 바 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: T.bg }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {(dastEnabled ? ["OWASP ZAP"] : []).concat(sastEnabled ? ["Semgrep OSS", "CodeQL"] : []).concat(["KISA W-01~W-28", "ISMS-P"]).map(t => (
              <span key={t} style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 7px" }}>{t}</span>
            ))}
          </div>
          <button
            onClick={() => { if (!scanning && canScan) onScan(); }}
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
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

export function PipelineScreen({ onGoToTriage }: { onGoToTriage: () => void }) {
  const [scanning, setScanning] = useState(false);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* 스캔 입력 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingTop: 4 }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.muted, margin: 0 }}>
          DAST / SAST 개별 또는 동시 스캔 — Argus ASPM
        </p>
        <ScanInputPanel scanning={scanning} onScan={() => setScanning(true)} />
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
            <ScanBar label="OWASP ZAP DAST" tag="동적" tagColor={T.blue} barColor={T.blue} delay={0} running={scanning} />
            <ScanBar label="Semgrep OSS SAST" tag="정적" tagColor={T.purple} barColor={T.purple} delay={280} running={scanning} />
            <ScanBar label="CodeQL 심층 분석" tag="정적" tagColor={T.purple} barColor={T.purple} delay={520} running={scanning} />
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
              HTTP 엔드포인트 동적 공격 + 소스코드 정적 분석. 오탐 및 중복 포함된 원시 데이터입니다.
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
