export default function Loading() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-[#171713] text-[#f4f0e7]"
      aria-busy="true"
      aria-labelledby="site-loading-status"
    >
      <div className="w-[min(19rem,72vw)] text-center">
        <p
          className="threadd-loading-wordmark text-2xl font-semibold tracking-[-0.05em] uppercase"
          data-wordmark="THREADD"
          aria-hidden="true"
        >
          THREADD
        </p>
        <p id="site-loading-status" className="sr-only" aria-live="polite">
          Preparing the collection
        </p>
        <div
          className="threadd-loading-captions mt-3 text-[0.6rem] tracking-[0.28em] text-white/55 uppercase"
          aria-hidden="true"
        >
          <span>Preparing the collection</span>
          <span>Selecting the pieces</span>
          <span>Finishing the look</span>
        </div>
        <div className="threadd-loading-thread mt-5" aria-hidden="true">
          <span />
        </div>
      </div>
    </main>
  );
}
