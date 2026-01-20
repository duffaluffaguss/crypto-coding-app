interface StatItem {
  value: string;
  label: string;
}

const stats: StatItem[] = [
  { value: '500+', label: 'Lessons' },
  { value: '6', label: 'Project Types' },
  { value: '< 5 min', label: 'Deploy Time' },
];

export default function StatsSection() {
  return (
    <section className="py-16 bg-primary/5 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
