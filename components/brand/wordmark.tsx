type WordmarkProps = Readonly<{
  className?: string;
}>;

export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm font-bold tracking-[-0.04em] uppercase ${className}`}
      aria-label="THREADD"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 28 28"
        className="size-5 overflow-visible"
        fill="none"
      >
        <path
          d="M3 7.5h14.5a7.5 7.5 0 1 1 0 15H11V4"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="3" cy="7.5" r="2" fill="#d7ff3f" />
      </svg>
      <span>Threadd</span>
    </div>
  );
}
