export default function Loading() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-[#171713] text-[#f4f0e7]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="text-center">
        <p className="text-2xl font-semibold tracking-[-0.05em] uppercase">
          THREADD
        </p>
        <p className="mt-3 text-[0.6rem] tracking-[0.28em] text-white/55 uppercase">
          Preparing the collection
        </p>
      </div>
    </main>
  );
}
