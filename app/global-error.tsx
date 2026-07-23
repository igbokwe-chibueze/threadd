"use client";

type GlobalErrorProps = Readonly<{
  reset: () => void;
}>;

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            display: "grid",
            minHeight: "100vh",
            placeItems: "center",
            background: "#171713",
            color: "#f4f0e7",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div>
            <h1>THREADD is temporarily unavailable.</h1>
            <button type="button" onClick={reset}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
