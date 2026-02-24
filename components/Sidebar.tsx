import { useRouter } from 'next/router';

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'teacher' | 'student';
  userName?: string;
};

export default function Sidebar({ activeTab, setActiveTab, userRole, userName }: SidebarProps) {
  const router = useRouter();

  const adminTabs = [
    { id: 'dashboard', label: 'Хяналтын самбар', icon: '📊' },
    { id: 'classes', label: 'Ангиуд', icon: '🏫' },
    { id: 'teachers', label: 'Багш нар', icon: '👨‍🏫' },
    { id: 'subjects', label: 'Хичээлүүд', icon: '📚' },
    { id: 'rooms', label: 'Кабинетууд', icon: '🚪' },
    { id: 'schedule', label: 'Хуваарь', icon: '📅' },
    { id: 'users', label: 'Хэрэглэгчид', icon: '👥' },
  ];

  const teacherTabs = [
    { id: 'dashboard', label: 'Хяналтын самбар', icon: '📊' },
    { id: 'schedule', label: 'Миний хуваарь', icon: '📅' },
    { id: 'classes', label: 'Миний ангиуд', icon: '🏫' },
  ];

  const studentTabs = [
    { id: 'dashboard', label: 'Хяналтын самбар', icon: '📊' },
    { id: 'schedule', label: 'Хуваарь', icon: '📅' },
  ];

  const tabs = userRole === 'admin' ? adminTabs : userRole === 'teacher' ? teacherTabs : studentTabs;

  const handleLogout = async () => {
    // Implement logout logic here
    router.push('/');
  };

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xl font-bold text-primary-600">
          <span className="text-2xl">🎓</span>
          <span>Хуваарь</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Үндсэн
          </p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Account Section */}
        <div className="mt-8 space-y-1">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Бүртгэл
          </p>
          <button className="sidebar-link w-full">
            <span className="text-xl">📧</span>
            <span>Мессеж</span>
          </button>
          <button className="sidebar-link w-full">
            <span className="text-xl">⚙️</span>
            <span>Тохиргоо</span>
          </button>
          <button className="sidebar-link w-full">
            <span className="text-xl">🔔</span>
            <span>Мэдэгдэл</span>
          </button>
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName || 'Хэрэглэгч'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-danger-500 transition-colors"
            title="Гарах"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
