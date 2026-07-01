import { useState } from "react";
import { TopNav } from "./components/TopNav";
import { PipelineScreen } from "./components/PipelineScreen";
import { TriageScreen } from "./components/TriageScreen";
import type { ScanResult, ScanProgress } from "./types/scan";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<1 | 2>(1);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: "#F4F6FA", fontFamily: "Inter, sans-serif" }}>
      <TopNav activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      <main style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {activeScreen === 1
          ? <PipelineScreen
              onGoToTriage={() => setActiveScreen(2)}
              scanning={scanning}
              scanError={scanError}
              scanProgress={scanProgress}
              onScanStart={() => { setScanning(true); setScanError(null); setScanProgress(null); }}
              onScanProgress={setScanProgress}
              onScanFinish={(result, error) => {
                setScanning(false);
                setScanProgress(null);
                if (error) setScanError(error);
                else { setScanError(null); setScanResult(result); }
              }}
            />
          : <TriageScreen scanResult={scanResult} />}
      </main>
    </div>
  );
}
