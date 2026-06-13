import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, Info } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="hero-section pt-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Branding & Content */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 rounded-sm border border-accent/20 bg-accent/5 text-sm font-semibold text-accent/90 backdrop-blur-md leading-relaxed">
                YT Stream | World Cup 2026 Live | Broadcast Powered by CazéTV | Engineered by Cozy Emon, Proudly Crafted in Bangladesh 🇧🇩
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                  FIFA World Cup
                  <span className="block text-accent mt-2">2026</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-light">
                  Stream all 104 matches live from Brazil. No VPN required.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/live">
                  <a className="btn-premium inline-flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Watch Live
                  </a>
                </Link>
                <Link href="/schedule">
                  <a className="px-6 py-3 border border-accent text-accent font-semibold rounded-sm hover:bg-accent/10 transition-colors inline-flex items-center justify-center gap-2">
                    <Info className="w-5 h-5" />
                    View Schedule
                  </a>
                </Link>
              </div>

              {/* Broadcast Rights Attribution */}
              <div className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  All broadcast rights belong to CazeTV
                </p>
                <a
                  href="https://www.youtube.com/@CazeTV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  Visit Official CazeTV Channel →
                </a>
              </div>
            </div>

            {/* Right: Logo & Branding */}
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* CazeTV Official Logo */}
              <div className="w-full max-w-sm bg-card rounded-lg border border-border overflow-hidden">
                <img
                  src="/manus-storage/images_e72cc4be.png"
                  alt="CazeTV Official Logo"
                  className="w-full h-auto object-contain p-4"
                />
                <div className="px-4 pb-4 text-center">
                  <p className="text-sm text-muted-foreground">Official World Cup Broadcaster</p>
                </div>
              </div>

              {/* Premium Credit Line */}
              <div className="w-full text-center space-y-3 pt-8 border-t border-border">
                <p className="text-lg font-bold text-foreground">
                  Engineered by Cozy Emon | Proudly Crafted in Bangladesh 🇧🇩
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30 border-t border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16 text-center">
            Premium Streaming Experience
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "No VPN Required",
                description: "Watch from anywhere with our transparent proxy technology",
                icon: "🌍",
              },
              {
                title: "4K Quality",
                description: "Stream in stunning 4K resolution for the ultimate viewing experience",
                icon: "📺",
              },
              {
                title: "All 104 Matches",
                description: "Every World Cup 2026 match live and on-demand",
                icon: "⚽",
              },
            ].map((feature, idx) => (
              <div key={idx} className="card-premium space-y-4">
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Ready to Watch?
          </h2>
          <p className="text-xl text-muted-foreground">
            The FIFA World Cup 2026 is almost here. Get ready for the biggest football tournament in history.
          </p>
          <Link href="/live">
            <a className="btn-premium inline-block">
              Start Watching Now
            </a>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-foreground mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/"><a className="hover:text-accent transition-colors">Home</a></Link></li>
                <li><Link href="/live"><a className="hover:text-accent transition-colors">Live Now</a></Link></li>
                <li><Link href="/schedule"><a className="hover:text-accent transition-colors">Schedule</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/troubleshooting"><a className="hover:text-accent transition-colors">Troubleshooting</a></Link></li>
                <li><Link href="/legal"><a className="hover:text-accent transition-colors">Legal</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Official</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://www.youtube.com/@CazeTV"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                  >
                    CazeTV YouTube
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">About</h4>
              <p className="text-sm text-muted-foreground">
                Engineered by Cozy Emon<br />
                Proudly Crafted in Bangladesh 🇧🇩
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 YT Stream. All broadcast rights belong to CazéTV.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
