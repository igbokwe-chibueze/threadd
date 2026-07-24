export default function StoreLoading() {
  return (
    <section
      className="grid min-h-[55svh] place-items-center bg-[#ece8df] px-5 text-[#171713]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto block size-8 animate-spin rounded-full border-2 border-black/20 border-t-black motion-reduce:animate-none"
        />
        <p className="mt-4 text-[0.62rem] font-bold tracking-[0.2em] uppercase">
          Loading the collection…
        </p>
      </div>
    </section>
  );
}
