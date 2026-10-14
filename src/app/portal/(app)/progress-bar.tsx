export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-stone">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-ink/10"
      >
        <div className="h-full rounded-full bg-ink" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
