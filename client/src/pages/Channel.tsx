import { useCallback, useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ChannelTabNav from "@/components/ChannelTabNav";
import VideoCard from "@/components/VideoCard";
import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Channel() {
    const [activeTab, setActiveTab] = useState("videos");
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPageTokens, setNextPageTokens] = useState<Record<string, string | null>>({});
    const [channelInfo, setChannelInfo] = useState<{
        title: string;
        customUrl: string;
        thumbnail: string;
        subscriberCount: string;
        videoCount: string;
        uploadsPlaylistId?: string; // Add uploadsPlaylistId to channelInfo
    } | null>(null);
    const [, setLocation] = useLocation();

    const tabs = [
        { id: "videos", label: "Videos" },
        { id: "shorts", label: "Shorts" },
        { id: "live", label: "Live" },
        { id: "playlists", label: "Playlists" },
    ];

    useEffect(() => {
        const fetchChannelInfo = async () => {
            try {
                const response = await fetch("/api/channel/info");
                const json = await response.json();
                if (json.success) setChannelInfo(json.data);
            } catch (error) {
                console.error("Failed to fetch channel info:", error);
            }
        };
        fetchChannelInfo();
    }, []);

    const fetchTabContent = useCallback(async (tabId: string, loadMore = false, pageToken?: string | null) => {
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setItems([]);
        }

        try {
            const params = loadMore && pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : "";
            const response = await fetch(`/api/channel/${tabId}${params}`);
            const json = await response.json();

            if (json.success) {
                setItems((prevItems) => loadMore ? [...prevItems, ...(json.data || [])] : json.data || []);
                setNextPageTokens((prev) => ({ ...prev, [tabId]: json.nextPageToken || null }));
            } else {
                if (!loadMore) setItems([]);
                setNextPageTokens((prev) => ({ ...prev, [tabId]: null }));
            }
        } catch (error) {
            console.error("Failed to fetch channel items:", error);
            if (!loadMore) setItems([]);
            setNextPageTokens((prev) => ({ ...prev, [tabId]: null }));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchTabContent(activeTab);
    }, [activeTab, fetchTabContent]);

    const handleLoadMore = () => {
        fetchTabContent(activeTab, true, nextPageTokens[activeTab]);
    };

    const handleWatchLive = () => {
        setLocation("/live");
    };

    const handleItemClick = (itemId: string) => {
        if (activeTab === "playlists") {
            window.open(`https://www.youtube.com/playlist?list=${encodeURIComponent(itemId)}`, "_blank", "noopener,noreferrer");
            return;
        }

        setLocation(`/live?videoId=${itemId}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            {/* Channel Header / Banner */}
            <div className="pt-20">
                <div className="h-48 md:h-64 w-full bg-gradient-to-r from-accent/20 via-accent/5 to-background border-b border-border relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    <div className="container mx-auto h-full px-4 flex items-end pb-8 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 w-full">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-card overflow-hidden shadow-xl">
                                <img
                                    src={channelInfo?.thumbnail || "https://yt3.googleusercontent.com/oc90Z6G7Sg1WlX18mYVAnT_pL8k5v7pY4H9xXJ0Sg2YhZ7L7gJ9V8z1v0Y7g8Y9xXJ0Sg2YhZ7L=s176-c-k-c0x00ffffff-no-rj"}
                                    alt="CazeTV"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{channelInfo?.title || "CazéTV"}</h1>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                                    <span>{channelInfo?.customUrl || "@CazeTV"}</span>
                                    {channelInfo?.subscriberCount && <span>•</span>}
                                    {channelInfo?.subscriberCount && <span>{channelInfo.subscriberCount} subscribers</span>}
                                    {channelInfo?.videoCount && <span>•</span>}
                                    {channelInfo?.videoCount && <span>{channelInfo.videoCount} videos</span>}
                                </div>
                                <button
                                    onClick={handleWatchLive}
                                    className="btn-premium flex items-center gap-2 py-2.5"
                                >
                                    <PlayCircle className="w-5 h-5" />
                                    WATCH WORLD CUP LIVE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub Navigation */}
            <ChannelTabNav
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Main Content Grid */}
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-accent animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Fetching latest content...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                        {items.map((item) => (
                            <VideoCard
                                key={item.id}
                                id={item.id}
                                title={item.title}
                                thumbnail={item.thumbnail}
                                duration={item.duration || (item.videoCount ? `${item.videoCount} videos` : "")}
                                views={item.views || ""}
                                publishedAt={item.publishedAt || ""}
                                isLive={item.isLive}
                                onClick={() => handleItemClick(item.id)}
                            />
                        ))}
                    </div>
                )}
                {nextPageTokens[activeTab] && !loading && (
                    <div className="flex justify-center mt-10">
                        <Button onClick={handleLoadMore} disabled={loadingMore} className="btn-premium">
                            {loadingMore ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
