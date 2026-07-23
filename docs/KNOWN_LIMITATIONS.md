# Known Limitations

## Open dependency advisories

Recorded: 23 July 2026

`npm audit --omit=dev` reports three high-severity advisories through Next.js 16.2.11:

- PostCSS CSS-stringification and source-map advisories;
- Sharp/libvips image-processing advisories.

Next.js 16.2.11 is the latest stable release available from npm at the time of review. npm's forced remediation proposes a breaking downgrade to Next.js 9.3.3, which is incompatible with this project and is not an acceptable fix.

Current treatment:

- do not use attacker-controlled CSS as a build input;
- do not add public image uploads until upload validation and patched image-processing dependencies are available;
- review the advisories when a newer stable Next.js release is published;
- do not run `npm audit fix --force`.

These advisories must be reassessed before a real production launch.
