interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export default function TestimonialCard({ quote, name, role, avatarUrl }: TestimonialCardProps) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border relative">
      {/* Quote mark decoration */}
      <div className="absolute top-4 right-4 text-primary/20 text-6xl font-serif leading-none">
        &ldquo;
      </div>
      
      <p className="text-muted-foreground mb-6 relative z-10 italic leading-relaxed">
        &ldquo;{quote}&rdquo;
      </p>
      
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt={name}
          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
        />
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}
