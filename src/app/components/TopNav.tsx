import { Eye, Bell, Settings, ChevronDown, BarChart2, List } from "lucide-react";
import { T } from "./tokens";

interface TopNavProps {
  activeScreen: 1 | 2;
  onScreenChange: (s: 1 | 2) => void;
}

export function TopNav({ activeScreen, onScreenChange }: TopNavProps) {
  const tabs = [
    { id: 1 as const, icon: BarChart2, label: "파이프라인" },
    { id: 2 as const, icon: List,      label: "취약점 트리아지" },
  ];

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 52, background: T.surface,
      borderBottom: `1px solid ${T.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      flexShrink: 0,
    }}>
      {/* 로고 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: T.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Eye size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 16, color: T.text, letterSpacing: "-0.4px" }}>
          Argus
        </span>
        <span style={{
          fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600,
          color: T.primary, background: T.primaryBg,
          padding: "2px 6px", borderRadius: 4, letterSpacing: "0.06em",
        }}>
          ASPM
        </span>
      </div>

      {/* 탭 네비게이션 */}
      <nav style={{ display: "flex", alignItems: "center", gap: 2, background: T.bg, padding: 3, borderRadius: 9, border: `1px solid ${T.border}` }}>
        {tabs.map(({ id, icon: Icon, label }) => {
          const active = activeScreen === id;
          return (
            <button key={id} onClick={() => onScreenChange(id)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: "Inter, sans-serif", fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? T.primary : T.muted,
              background: active ? T.surface : "transparent",
              boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}>
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* 우측 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "5px 11px", borderRadius: 8,
          background: T.bg, border: `1px solid ${T.border}`,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%", background: T.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff",
          }}>A</div>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: T.sub }}>SK쉴더스</span>
          <ChevronDown size={12} color={T.muted} />
        </div>
        {[
          { icon: Bell, badge: true },
          { icon: Settings, badge: false },
        ].map(({ icon: Icon, badge }, i) => (
          <button key={i} style={{ position: "relative", padding: 7, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: T.muted, display: "flex" }}>
            <Icon size={16} />
            {badge && <span style={{ position: "absolute", top: 7, right: 7, width: 5, height: 5, borderRadius: "50%", background: T.red, border: `1.5px solid ${T.surface}` }} />}
          </button>
        ))}
      </div>
    </header>
  );
}
