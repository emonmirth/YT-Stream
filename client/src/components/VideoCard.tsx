import { Play } from "lucide-react";

interface VideoCardProps {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    views: string;
    publishedAt: string;
    isLive?: boolean;
    onClick?: () => void;
}

export default function VideoCard({ id, title, thumbnail, duration, views, publishedAt, isLive, onClick }: VideoCardProps) {
    // The 'group' class must be applied here in JSX, not via @apply in CSS
    return (
        <div className="video-card group" onClick={onClick}>
            <div className="video-card-thumb">
                <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {duration && !isLive && <span className="video-card-duration">{duration}</span>}
                {isLive && (
                    <div className="absolute bottom-2 left-2">
                        <div className="live-badge">
                            <span className="live-pulse" />
                            Live
                        </div>
                    </div>
                )}
                <div className="video-card-overlay group-hover:opacity-100">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white">
                        <Play className="w-6 h-6 fill-current" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{title}</h3>
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <span>{views}</span>
                    <span>•</span>
                    <span>{publishedAt}</span>
                </div>
            </div>
        </div>
    );
}
