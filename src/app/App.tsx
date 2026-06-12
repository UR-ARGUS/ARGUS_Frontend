import { useState } from "react";
import { TopNav } from "./components/TopNav";
import { PipelineScreen } from "./components/PipelineScreen";
import { TriageScreen } from "./components/TriageScreen";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<1 | 2>(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: "#F4F6FA", fontFamily: "Inter, sans-serif" }}>
      <TopNav activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      <main style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {activeScreen === 1
          ? <PipelineScreen onGoToTriage={() => setActiveScreen(2)} />
          : <TriageScreen />}
      </main>
    </div>
  );
}
