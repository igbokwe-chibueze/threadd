"use client";

import { useRef, useState } from "react";

export type DemoCredential = Readonly<{
  label: string;
  email: string;
  password: string;
}>;

type DemoCredentialsDialogProps = Readonly<{
  accounts: readonly DemoCredential[];
  onUse: (account: DemoCredential) => void;
}>;

export function DemoCredentialsDialog({
  accounts,
  onUse,
}: DemoCredentialsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  async function copy(value: string): Promise<void> {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue(null), 1800);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="mt-5 text-[0.62rem] font-bold tracking-[0.14em] uppercase underline decoration-black/30 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        View and copy demo login details
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="demo-credentials-title"
        className="m-auto w-[min(92vw,36rem)] border-0 bg-[#ece8df] p-0 text-[#171713] shadow-2xl backdrop:bg-black/60"
      >
        <div className="border-b border-black/20 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[0.58rem] font-bold tracking-[0.2em] uppercase">
                Portfolio access
              </p>
              <h2
                id="demo-credentials-title"
                className="mt-2 text-3xl font-medium tracking-[-0.045em]"
              >
                Demo login details
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close demo login details"
              onClick={() => dialogRef.current?.close()}
              className="grid size-10 place-items-center rounded-full border border-black/30 text-xl focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              ×
            </button>
          </div>
          <p className="mt-4 max-w-lg text-sm leading-6 text-black/60">
            Copy either value individually, or place the complete account into
            the form. These credentials belong only to the resettable demo.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:p-7">
          {accounts.map((account) => (
            <article key={account.email} className="border border-black/20 p-4">
              <h3 className="text-xs font-bold tracking-[0.14em] uppercase">
                {account.label}
              </h3>
              {[
                ["Email", account.email],
                ["Password", account.password],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="mt-3 grid grid-cols-[1fr_auto] items-center gap-4 bg-white/45 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-[0.55rem] font-bold tracking-[0.14em] text-black/55 uppercase">
                      {label}
                    </p>
                    <p className="truncate text-sm">{value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(value)}
                    className="text-[0.58rem] font-bold tracking-[0.12em] uppercase focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {copiedValue === value ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  onUse(account);
                  dialogRef.current?.close();
                }}
                className="mt-4 w-full bg-[#171713] px-4 py-3 text-[0.62rem] font-bold tracking-[0.15em] text-white uppercase"
              >
                Use these details
              </button>
            </article>
          ))}
        </div>
      </dialog>
    </>
  );
}
