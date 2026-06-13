import Navigation from "@/components/Navigation";
import { trpc } from "../lib/trpc";
import { Calendar, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Schedule() {
  const { data: matches, isLoading, error } = trpc.matches.getAll.useQuery();

  const formatStage = (stage: string) => {
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 container mx-auto px-4 max-w-6xl pb-20">
        <h1 className="text-5xl font-bold text-foreground mb-4">World Cup 2026 Schedule</h1>
        <p className="text-muted-foreground mb-12">All times in Brazil Standard Time (BRT)</p>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
            <p className="text-muted-foreground">Loading matches from database...</p>
          </div>
        )}

        {error && (
          <div className="card-premium border-red-500/30 bg-red-500/5 p-8 text-center space-y-4 max-w-lg mx-auto">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold text-foreground">Failed to Load Schedule</h3>
            <p className="text-muted-foreground text-sm">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && matches && matches.length === 0 && (
          <div className="card-premium text-center py-12">
            <p className="text-muted-foreground">No matches found in the schedule.</p>
          </div>
        )}

        {!isLoading && !error && matches && matches.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {matches.map((match) => {
              const isLive = match.status === "live";
              const isCompleted = match.status === "completed";
              
              return (
                <div 
                  key={match.id} 
                  className={`card-premium transition-all hover:border-accent/40 ${
                    isLive ? "border-accent/50 bg-accent/5" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Date & Time */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(match.scheduledTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <Clock className={`w-4 h-4 ${isLive ? "text-red-500 animate-pulse" : "text-accent"}`} />
                        {match.timezoneBRT}
                        {isLive && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-sm animate-pulse uppercase">
                            Live
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="md:col-span-2">
                      <div className="text-center md:text-left">
                        <p className="text-xl font-bold text-foreground">
                          {match.team1} 
                          {isCompleted && (
                            <span className="mx-2 text-accent">
                              {match.team1Goals} - {match.team2Goals}
                            </span>
                          )}
                          {!isCompleted && <span className="mx-2 text-muted-foreground">vs</span>}
                          {match.team2}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatStage(match.stage)} {match.group ? `• Group ${match.group}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground/80 mt-1">
                          {match.stadium}, {match.city}
                        </p>
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="text-right">
                      {isLive ? (
                        <Link href={`/live?matchId=${match.matchId}`}>
                          <a className="btn-premium text-sm py-2 px-4 bg-red-600 hover:bg-red-500 inline-block">
                            Watch Live
                          </a>
                        </Link>
                      ) : isCompleted ? (
                        <Link href={`/live?matchId=${match.matchId}`}>
                          <a className="px-4 py-2 border border-gray-600 text-gray-300 text-sm font-semibold rounded-sm hover:bg-white/10 transition-colors inline-block">
                            Watch Replay
                          </a>
                        </Link>
                      ) : (
                        <button 
                          onClick={() => alert(`Reminder set for ${match.team1} vs ${match.team2}!`)}
                          className="px-4 py-2 border border-accent text-accent text-sm font-semibold rounded-sm hover:bg-accent/10 transition-colors"
                        >
                          Set Reminder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule Info */}
        <div className="mt-16 card-premium bg-card/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Tournament Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-accent">104</p>
              <p className="text-sm text-muted-foreground">Total Matches</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">48</p>
              <p className="text-sm text-muted-foreground">Teams</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">39</p>
              <p className="text-sm text-muted-foreground">Days</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">3</p>
              <p className="text-sm text-muted-foreground">Host Countries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
