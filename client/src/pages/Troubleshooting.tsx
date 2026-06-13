import Navigation from "@/components/Navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Troubleshooting() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const guides = [
    {
      id: 1,
      title: "Buffering & Playback Issues",
      content: [
        "Clear your browser cache and cookies, then reload the page.",
        "Check your internet connection speed (minimum 5 Mbps for 1080p, 25 Mbps for 4K).",
        "Try switching to a lower quality setting if available.",
        "Disable browser extensions that might interfere with streaming.",
        "Try a different browser (Chrome, Firefox, Safari, Edge).",
        "Restart your router and reconnect to the internet.",
      ],
    },
    {
      id: 2,
      title: "Geo-Restriction & Access Issues",
      content: [
        "This platform is designed to work globally without VPN setup.",
        "If you see a geo-restriction error, try refreshing the page.",
        "Clear your browser cache and try again.",
        "If the issue persists, try accessing from a different network or device.",
        "Contact support if the problem continues.",
      ],
    },
    {
      id: 3,
      title: "Browser Compatibility",
      content: [
        "Recommended browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+",
        "Ensure your browser is up to date.",
        "Enable JavaScript in your browser settings.",
        "Disable any privacy extensions that block tracking pixels.",
        "Try incognito/private browsing mode to test.",
      ],
    },
    {
      id: 4,
      title: "Stream Quality & Resolution",
      content: [
        "Quality depends on your internet connection speed.",
        "Higher resolutions (4K) require faster connections.",
        "Adaptive bitrate streaming automatically adjusts quality.",
        "You can manually select quality from the player settings.",
        "Lower quality streams use less bandwidth and buffer faster.",
      ],
    },
    {
      id: 5,
      title: "Audio & Subtitle Issues",
      content: [
        "Check your device volume and browser volume settings.",
        "Ensure your speakers/headphones are properly connected.",
        "Try muting and unmuting the video player.",
        "Subtitles availability depends on the broadcast.",
        "Use the player controls to toggle subtitles on/off.",
      ],
    },
    {
      id: 6,
      title: "Mobile & Tablet Viewing",
      content: [
        "This platform is fully responsive and works on mobile devices.",
        "For best experience, use landscape orientation on tablets.",
        "Ensure your device has a stable WiFi or mobile connection.",
        "Mobile data usage varies based on stream quality.",
        "Consider using WiFi for 4K streaming to avoid high data charges.",
      ],
    },
    {
      id: 7,
      title: "Fullscreen & Display Issues",
      content: [
        "Click the fullscreen button in the player controls.",
        "On mobile, rotate your device to landscape for fullscreen.",
        "Press ESC to exit fullscreen mode.",
        "If fullscreen doesn't work, try a different browser.",
        "Ensure your device display settings allow fullscreen apps.",
      ],
    },
    {
      id: 8,
      title: "General Tips & Best Practices",
      content: [
        "Close unnecessary browser tabs and applications to free up resources.",
        "Use a wired connection (Ethernet) for more stable streaming.",
        "Stream during off-peak hours for better performance.",
        "Keep your device updated with the latest OS version.",
        "Disable VPN if you're using one, as this platform doesn't require it.",
        "For the best experience, use a modern device with adequate RAM.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 container mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl font-bold text-foreground mb-4">Troubleshooting & Streaming Guide</h1>
        <p className="text-muted-foreground mb-12">
          Find solutions to common streaming issues and learn how to optimize your viewing experience.
        </p>

        <div className="space-y-4">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="card-premium cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => setExpandedId(expandedId === guide.id ? null : guide.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{guide.title}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-accent transition-transform ${
                    expandedId === guide.id ? "rotate-180" : ""
                  }`}
                />
              </div>

              {expandedId === guide.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {guide.content.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-accent">{idx + 1}</span>
                      </div>
                      <p className="text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-16 card-premium bg-card/50">
          <h3 className="text-2xl font-bold text-foreground mb-6">Still Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-foreground mb-2">System Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>• Stable internet connection (5+ Mbps recommended)</li>
                <li>• JavaScript enabled</li>
                <li>• Cookies enabled for session management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-2">Recommended Setup</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Wired connection for stability</li>
                <li>• 25+ Mbps for 4K streaming</li>
                <li>• Modern device with adequate RAM</li>
                <li>• Updated browser version</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-muted-foreground">
            For additional support, visit the official CazeTV channel
          </p>
          <a
            href="https://www.youtube.com/@CazeTV"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block btn-premium"
          >
            Visit CazeTV YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
