type StatCardProps = {
  title: string;
  value: number | string;
  change?: number;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
};

export function StatCard({ title, value, change, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const isPositive = change && change > 0;

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {value}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-sm font-medium ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-500">vs өмнөх 7 хоног</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

type StatsGridProps = {
  stats: {
    classes: number;
    teachers: number;
    subjects: number;
    rooms: number;
    schedules?: number;
  };
};

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Нийт анги"
        value={stats.classes}
        icon="🏫"
        color="blue"
      />
      <StatCard
        title="Багш нар"
        value={stats.teachers}
        icon="👨‍🏫"
        color="green"
      />
      <StatCard
        title="Хичээлүүд"
        value={stats.subjects}
        icon="📚"
        color="purple"
      />
      <StatCard
        title="Кабинетууд"
        value={stats.rooms}
        icon="🚪"
        color="yellow"
      />
    </div>
  );
}
