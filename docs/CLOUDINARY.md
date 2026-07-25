# THREADD Cloudinary catalogue storage

Cloudinary is the selected managed image provider for Vercel and future
customer deployments. Prisma remains the database layer: PostgreSQL stores the
image URL, dimensions, provider name, and provider-issued public ID, while
Cloudinary stores and delivers the image bytes.

## Why it is required

The local adapter writes to `public/uploads/catalogue`. That is suitable for
local development but not Vercel because function filesystems are ephemeral.
Cloudinary provides durable object storage, image decoding/transformation, CDN
delivery, and server-authenticated deletion without changing catalogue or
commerce data ownership.

## Data sent to Cloudinary

- JPEG, PNG, or WebP bytes uploaded by an authorized administrator;
- a deployment-specific asset folder;
- Cloudinary-generated asset/public identifiers;
- technical image metadata required to process and deliver the asset.

THREADD does not intentionally send customer accounts, addresses, enquiries,
orders, payment data, authentication tokens, or administrator filenames.
Original filenames are discarded before upload. The incoming transformation
strips embedded image profiles to remove avoidable EXIF/location metadata.

A merchant must still review Cloudinary's contract, data location, retention,
backup, deletion, access, and pricing terms before customer launch.

## Configuration

Set these encrypted server environment variables:

```dotenv
MEDIA_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<server-only-key>
CLOUDINARY_API_SECRET=<server-only-secret>
CLOUDINARY_FOLDER=threadd/<unique-deployment-name>
```

Only `CLOUDINARY_FOLDER` is non-secret. No Cloudinary credential uses a
`NEXT_PUBLIC_` prefix. Vercel production is configured with encrypted
credentials, `MEDIA_STORAGE_PROVIDER=cloudinary`, and the isolated
`threadd/portfolio-demo` folder.

## Upload and deletion controls

- The existing server-side admin role boundary remains mandatory.
- THREADD validates MIME allowlists, binary structure, byte size, dimensions,
  and pixel count before invoking Cloudinary.
- Uploads use signed server credentials, generated identifiers, no overwrite,
  and the fixed deployment folder.
- PostgreSQL stores the returned secure URL and public ID.
- Replacement and failed database operations attempt provider cleanup.
- Deletion accepts only stored provider IDs under the configured folder; a
  browser URL cannot select an arbitrary Cloudinary object.
- Demo reset deletes recorded Cloudinary uploads only after the canonical
  database reset commits.

## Verification

On 25 July 2026, `npm run cloudinary:check` authenticated with the configured
account, uploaded an in-memory PNG into `threadd/portfolio-demo`, verified the
secure provider identity, and deleted the probe successfully. The script is
extensively commented, never prints credentials, and fails if cleanup is not
confirmed.

Remaining browser/reset verification:

1. Confirm the API key is restricted to the intended Cloudinary product
   environment where the account supports scoped keys.
2. Upload a catalogue image through the protected administrator form.
3. Verify it is stored under `threadd/portfolio-demo`, has no original filename
   or EXIF profile, and renders through Next.js optimization.
4. Replace that image and confirm the former public ID is removed or marked
   deleted.
5. Run the demo reset and confirm visitor-created Cloudinary assets are removed
   while repository seed images remain.
6. Record Cloudinary backup/retention settings together with the database
   restore evidence.

Official references:

- [Cloudinary Node upload documentation](https://cloudinary.com/documentation/node_image_and_video_upload)
- [Cloudinary Upload API and deletion behavior](https://cloudinary.com/documentation/image_upload_api_reference)
