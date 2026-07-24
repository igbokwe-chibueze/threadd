import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StructuredData } from "@/components/seo/structured-data";

describe("structured data", () => {
  it("escapes markup supplied through catalogue content", () => {
    const markup = renderToStaticMarkup(
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "</script><script>alert('unsafe')</script>",
        }}
      />,
    );

    expect(markup).not.toContain("</script><script>alert");
    expect(markup).toContain("\\u003c/script>");
  });
});
