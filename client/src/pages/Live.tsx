import Navigation from "@/components/Navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { AlertCircle, Info, Loader2, Radio } from "lucide-react";
import { useEffect, useState } from "react";

interface LiveSource {
  liveId: string | null;
  status: "online" | "offline" | "error";
  message?: string;
}

export default function Live() {
  const [source, setSource] = useState<LiveSource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveLiveSource = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const queryVideoId = params.get("videoId") || params.get("matchId");

        if (queryVideoId) {
          setSource({ liveId: queryVideoId, status: "online" });
          return;
        }

        const response = await fetch("/api/proxy/live-source");
        const json = await response.json();
        setSource({
          liveId: json.liveId || null,
          status: json.status || (json.liveId ? "online" : "offline"),
          message: json.message,
        });
      } catch (error) {
        console.error("Failed to resolve live source:", error);
        setSource({
          liveId: null,
          status: "error",
          message: "Unable to contact the live stream resolver.",
        });
      } finally {
        setLoading(false);
      }
    };

    resolveLiveSource();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
          <p className="text-muted-foreground">Resolving CazeTV live stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 container mx-auto px-4 max-w-6xl pb-20">
        <h1 className="text-5xl font-bold text-foreground mb-4">CazeTV Live</h1>
        <p className="text-muted-foreground mb-8">
          Watch the current CazeTV live broadcast through the Brazilian HLS proxy.
        </p>

        <div className="mb-12">
          {source?.liveId ? (
            <VideoPlayer
              title="CazeTV Live Broadcast"
              videoId={source.liveId}
              onError={(err) => console.error("Player error:", err)}
            />
          ) : (
            <div className="card-premium border-accent/30 bg-card/60 p-8 text-center space-y-4">
              <Radio className="w-12 h-12 text-accent mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Live Player Ready</h3>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                {source?.message || "No active CazeTV live broadcast was found right now. The player will work automatically as soon as the official YouTube live stream is available."}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card-premium">
            <h3 className="text-lg font-bold text-foreground mb-2">Stream Source</h3>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p><strong>Origin:</strong> CazeTV YouTube Live</p>
              <p><strong>Status:</strong> <span className={source?.liveId ? "text-red-500 font-bold" : "text-accent"}>{source?.status?.toUpperCase() || "UNKNOWN"}</span></p>
              {source?.liveId && <p><strong>Video ID:</strong> {source.liveId}</p>}
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-lg font-bold text-foreground mb-2">Stream Quality</h3>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p><strong>Protocol:</strong> HLS (m3u8)</p>
              <p><strong>Mode:</strong> Adaptive playback</p>
              <p><strong>Player:</strong> HLS.js</p>
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-lg font-bold text-foreground mb-2">Proxy Path</h3>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p><strong>Resolver:</strong> YouTube Data API</p>
              <p><strong>M3U8:</strong> Brazilian proxy tunnel</p>
              <p><strong>Segments:</strong> Proxied media chunks</p>
            </div>
          </div>
        </div>

        <div className="card-premium bg-card/50 border-accent/30 space-y-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-foreground mb-2">About This Stream</h3>
              <p className="text-muted-foreground text-sm">
                The app resolves the current CazeTV live video directly from YouTube, then requests the M3U8 manifest through the Brazilian proxy layer. Local match database rows are not required for playback.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 card-premium bg-card/50">
          <div className="flex gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <h3 className="font-bold text-foreground">Having Issues?</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            If the player is ready but no broadcast appears, CazeTV may not currently be live or the stream may not expose an HLS manifest yet.
          </p>
        </div>
      </div>
    </div>
  );
}
