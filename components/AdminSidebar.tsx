type Tab = "classes" | "teachers" | "rooms" | "subjects" | "schedule";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const tabs: Array<{ key: Tab; label: string; icon: string }> = [
  { key: "classes", label: "Анги", icon: "CL" },
  { key: "teachers", label: "Багш", icon: "TC" },
  { key: "rooms", label: "Кабинет", icon: "RM" },
  { key: "subjects", label: "Хичээл", icon: "SB" },
  { key: "schedule", label: "Хуваарь", icon: "SC" },
];

export default function AdminSidebar({ activeTab, setActiveTab }: Props) {
  return (
    <aside className="admin-sidebar">
      <div className="px-3 pb-6">
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">HW</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Huwaari</p>
            <p className="text-xs text-gray-500">Админ панел</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`admin-sidebar-btn ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="admin-sidebar-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="px-3 pt-6">
        <button className="admin-logout-btn">Гарах</button>
      </div>
    </aside>
  );
}