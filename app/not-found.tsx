import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#ece8df] px-6 text-[#171713]">
      <div className="max-w-xl text-center">
        <p className="text-[0.65rem] font-semibold tracking-[0.28em] uppercase">
          Error 404
        </p>
        <h1 className="mt-5 text-6xl leading-[0.9] font-medium tracking-[-0.07em] sm:text-8xl">
          This thread ends here.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-black/60">
          The piece or page you were looking for has moved out of this
          collection.
        </p>
        <Link
          href="/"
          className="mt-9 inline-flex rounded-full bg-[#171713] px-6 py-3 text-xs font-semibold tracking-[0.18em] text-white uppercase focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
