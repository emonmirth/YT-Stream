import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Maximize, Minimize, Play, Pause, AlertCircle } from "lucide-react";
import HLS from "hls.js";

interface VideoPlayerProps {
  videoId?: string;
  manifestUrl?: string;
  title?: string;
  onError?: (error: string) => void;
}

export default function VideoPlayer({
  videoId,
  manifestUrl,
  title = "CazeTV Stream",
  onError,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<HLS | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");

  // Initialize video player
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    const handleError = () => {
      const errorMessage = "Failed to load video stream";
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
    };
    const handleCanPlay = () => {
      setIsLoading(false);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [onError]);

  // Load video source with hls.js
  useEffect(() => {
    if (!videoRef.current) return;

    const loadStream = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let proxiedManifestUrl = "";

        if (videoId) {
          proxiedManifestUrl = `/api/proxy/stream-url?videoId=${videoId}`;
        } else if (manifestUrl) {
          proxiedManifestUrl = `/api/proxy/manifest?url=${encodeURIComponent(manifestUrl)}`;
        } else {
          setError("No stream URL or video ID provided");
          setIsLoading(false);
          return;
        }

        // Initialize HLS.js
        if (HLS.isSupported()) {
          const hls = new HLS({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            maxBufferSize: 120 * 1024 * 1024,
            progressive: true,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 3,
            nudgeMaxRetry: 10,
          });

          hlsRef.current = hls;

          // Listen for manifest parsed event to extract quality levels
          hls.on(HLS.Events.MANIFEST_PARSED, (event, data) => {
            const levels = data.levels.map((level: any) => {
              const height = level.height || level.bitrate;
              return height ? `${height}p` : "auto";
            });
            setAvailableQualities(["auto", ...levels]);
            setSelectedQuality("auto");
          });

          // Handle errors
          hls.on(HLS.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error("HLS fatal error:", data);
              setError(`Stream error: ${data.details}`);
              onError?.(`Stream error: ${data.details}`);
              setIsLoading(false);
            }
          });

          hls.loadSource(proxiedManifestUrl);
          if (videoRef.current) {
            hls.attachMedia(videoRef.current);
          }
        } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
          // Fallback for Safari native HLS support
          if (videoRef.current) {
            videoRef.current.src = proxiedManifestUrl;
          }
        } else {
          setError("HLS streaming is not supported in your browser");
          setIsLoading(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Stream loading error:", err);
        setError(errorMessage);
        onError?.(errorMessage);
        setIsLoading(false);
      }
    };

    loadStream();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoId, manifestUrl, onError]);

  // Handle quality selection
  const handleQualityChange = (quality: string) => {
    if (!hlsRef.current) return;

    setSelectedQuality(quality);

    if (quality === "auto") {
      hlsRef.current.currentLevel = -1; // Auto
    } else {
      const levelIndex = hlsRef.current.levels.findIndex((level: any) => {
        const height = level.height || level.bitrate;
        return height?.toString() === quality.replace("p", "");
      });

      if (levelIndex !== -1) {
        hlsRef.current.currentLevel = levelIndex;
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        controlsList="nodownload"
        playsInline
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center space-y-4 px-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-500 font-semibold">{error}</p>
            <p className="text-muted-foreground text-sm">
              Please check your connection and try again
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            aria-label="Seek video"
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-700 rounded-full cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/20 rounded transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                aria-label="Volume"
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-700 rounded-full cursor-pointer accent-accent"
              />
            </div>

            {/* Quality Selector */}
            {availableQualities.length > 1 && (
              <select
                aria-label="Video quality"
                value={selectedQuality}
                onChange={(e) => handleQualityChange(e.target.value)}
                className="px-2 py-1 bg-black/50 text-white text-xs rounded border border-gray-600 hover:border-accent transition-colors"
              >
                {availableQualities.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality}
                  </option>
                ))}
              </select>
            )}

            {/* Title */}
            <span className="text-sm text-white ml-4 truncate">{title}</span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Title Overlay */}
      {!isLoading && (
        <div className="absolute top-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
        </div>
      )}
    </div>
  );
}
