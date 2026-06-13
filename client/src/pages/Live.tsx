import Navigation from "@/components/Navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { trpc } from "../lib/trpc";
import { AlertCircle, Info, Loader2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Live() {
  const { data: matches, isLoading, error } = trpc.matches.getAll.useQuery();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    // Parse search query parameters
    const params = new URLSearchParams(window.location.search);
    const queryMatchId = params.get("matchId");

    if (queryMatchId) {
      const match = matches.find((m) => m.matchId === queryMatchId);
      if (match) {
        setSelectedMatch(match);
        return;
      }
    }

    // Default: find first live match
    const liveMatch = matches.find((m) => m.status === "live");
    if (liveMatch) {
      setSelectedMatch(liveMatch);
    } else {
      // Fallback: use the first available match
      setSelectedMatch(matches[0]);
    }
  }, [matches]);

  const formatStage = (stage: string) => {
    if (!stage) return "";
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
          <p className="text-muted-foreground">Loading stream player...</p>
        </div>
      </div>
    );
  }

  if (error || !selectedMatch) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="card-premium border-red-500/30 bg-red-500/5 p-8 text-center space-y-4 max-w-lg">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold text-foreground">No Live Broadcasts Available</h3>
            <p className="text-muted-foreground text-sm">
              {error ? error.message : "There are currently no scheduled or live matches available in the database."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 container mx-auto px-4 max-w-6xl pb-20">
        <h1 className="text-5xl font-bold text-foreground mb-4">
          {selectedMatch.status === "live" ? "Live Now" : "Match Broadcast"}
        </h1>
        <p className="text-muted-foreground mb-8">
          Watch YT Stream FIFA World Cup 2026 broadcasts live without restriction.
        </p>

        {/* Video Player */}
        <div className="mb-12">
          <VideoPlayer
            title={`${selectedMatch.team1} vs ${selectedMatch.team2} - ${formatStage(selectedMatch.stage)}`}
            videoId={selectedMatch.youtubeVideoId || undefined}
            manifestUrl={selectedMatch.hlsManifestUrl || undefined}
            onError={(err) => console.error("Player error:", err)}
          />
        </div>

        {/* Google Sports Dashboard Widget */}
        <div className="mb-12 card-premium bg-[#0D0D0D] border-muted p-0 overflow-hidden rounded-lg premium-glow">
          <div className="border-b border-muted p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#111111]">
            <div>
              <h2 className="text-xl font-bold text-foreground">Google Match Dashboard</h2>
              <p className="text-xs text-muted-foreground">Live stats, standings, lineups, and match insights direct from Google Search</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${selectedMatch.team1} vs ${selectedMatch.team2} World Cup 2026 score standings`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-premium py-2 px-4 text-xs inline-flex items-center gap-1.5"
              >
                <span>Open in Google Search</span>
              </a>
            </div>
          </div>
          <div className="relative w-full" style={{ height: "650px" }}>
            <iframe
              src={`https://www.google.com/search?igu=1&prmd=ivn&q=${encodeURIComponent(`${selectedMatch.team1} vs ${selectedMatch.team2} World Cup 2026 live scores stats standings lineups brackets`)}`}
              title="Google World Cup Match Center"
              className="absolute top-0 left-0 w-full h-full border-0 bg-[#0D0D0D]"
              style={{
                colorScheme: "dark"
              }}
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            ></iframe>
          </div>
        </div>

        {/* Stream Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card-premium">
            <h3 className="text-lg font-bold text-foreground mb-2">Match Details</h3>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p><strong>Teams:</strong> {selectedMatch.team1} vs {selectedMatch.team2}</p>
              <p><strong>Stage:</strong> {formatStage(selectedMatch.stage)} {selectedMatch.group ? `• Group ${selectedMatch.group}` : ""}</p>
              <p><strong>Time:</strong> {selectedMatch.timezoneBRT}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={selectedMatch.status === "live" ? "text-red-500 font-bold animate-pulse" : "text-accent"}>
                  {selectedMatch.status.toUpperCase()}
                </span>
              </p>
              {selectedMatch.stadium && (
                <p><strong>Stadium:</strong> {selectedMatch.stadium} ({selectedMatch.city}, {selectedMatch.country})</p>
              )}
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-lg font-bold text-foreground mb-2">Stream Quality</h3>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p><strong>Resolution:</strong> 1080p / 2K / 4K Adaptive</p>
              <p><strong>Buffer Mode:</strong> 120MB Progressive Buffer</p>
              <p><strong>Video Protocol:</strong> HLS (m3u8)</p>
              <p><strong>Status:</strong> Operational</p>
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-lg font-bold text-foreground mb-2">Broadcast Info</h3>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p><strong>App Provider:</strong> YT Stream</p>
              <p><strong>Stream Engine:</strong> HLS.js Tunnel</p>
              <p><strong>Origin Broadcaster:</strong> CazéTV</p>
              <p><strong>Bypass Gateway:</strong> Brazilian Residential Proxy</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="card-premium bg-card/50 border-accent/30 space-y-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-foreground mb-2">About This Stream</h3>
              <p className="text-muted-foreground text-sm">
                This stream is routed dynamically through our Brazilian residential proxy network. The setup bypasses geographic viewing restrictions set on YouTube broadcasts, enabling football fans to watch World Cup matches globally. All original broadcast and stream contents are powered by CazéTV.
              </p>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-12 card-premium bg-card/50">
          <div className="flex gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <h3 className="font-bold text-foreground">Having Issues?</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            If the stream is not loading or buffering, try:
          </p>
          <ul className="space-y-2 text-muted-foreground text-sm list-disc list-inside">
            <li>Refreshing the page</li>
            <li>Clearing your browser cache</li>
            <li>Trying a different browser</li>
            <li>Checking your internet connection</li>
            <li>Visiting the <a href="/troubleshooting" className="text-accent hover:text-accent/80">Troubleshooting Guide</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
