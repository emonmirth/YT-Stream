import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Channel", path: "/channel" },
    { label: "Live Now", path: "/live" },
    { label: "Schedule", path: "/schedule" },
    { label: "Troubleshooting Guide", path: "/troubleshooting" },
    { label: "Legal", path: "/legal" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-accent rounded-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-accent-foreground font-bold text-lg">Y</span>
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:inline">YT Stream</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={`nav-link cursor-pointer ${isActive(item.path)
                    ? "text-accent border-b-2 border-accent pb-1"
                    : "text-foreground hover:text-accent"
                  }`}
              >
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-card rounded-sm transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-foreground" />
          ) : (
            <Menu className="w-6 h-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={`nav-link block py-2 cursor-pointer ${isActive(item.path)
                      ? "text-accent border-l-2 border-accent pl-2"
                      : "text-foreground hover:text-accent"
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
