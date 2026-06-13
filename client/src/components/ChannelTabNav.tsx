interface Tab {
    id: string;
    label: string;
}

interface ChannelTabNavProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

export default function ChannelTabNav({ tabs, activeTab, onTabChange }: ChannelTabNavProps) {
    return (
        <div className="border-b border-border sticky top-[73px] bg-background/95 backdrop-blur-md z-40">
            <div className="container mx-auto px-4 flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`channel-tab ${activeTab === tab.id ? "tab-active" : ""}`}
                    >
                        {tab.label}
                        {activeTab === tab.id && <div className="tab-indicator" />}
                    </button>
                ))}
            </div>
        </div>
    );
}