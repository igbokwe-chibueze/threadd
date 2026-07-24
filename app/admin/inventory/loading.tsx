export default function InventoryLoading() {
  return (
    <main
      aria-label="Loading inventory"
      aria-busy="true"
      className="min-h-screen animate-pulse bg-[#171713] px-5 py-8 text-white sm:px-10 lg:px-14"
    >
      <div className="h-8 border-b border-white/20" />
      <div className="mt-16 h-3 w-36 bg-[#d7ff3f]/50" />
      <div className="mt-5 h-20 max-w-4xl bg-white/10" />
      <div className="mt-14 flex gap-3 border-y border-white/20 py-4">
        <div className="h-10 w-36 bg-white/10" />
        <div className="h-10 w-40 bg-white/10" />
      </div>
      <p className="mt-8 text-xs font-bold tracking-[0.18em] text-white/45 uppercase">
        Loading inventory…
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-44 border border-white/10 bg-white/5" />
        ))}
      </div>
    </main>
  );
}
