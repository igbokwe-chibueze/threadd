import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The storage module is intentionally server-only. Unit tests replace the
 * marker and Cloudinary transport while exercising the real environment,
 * validation, folder-isolation, and result-mapping logic.
 */
vi.mock("server-only", () => ({}));

const cloudinaryMocks = vi.hoisted(() => ({
  config: vi.fn(),
  upload: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: cloudinaryMocks.config,
    uploader: {
      upload: cloudinaryMocks.upload,
      destroy: cloudinaryMocks.destroy,
    },
  },
}));

function validPng(): File {
  const bytes = new Uint8Array(45);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  view.setUint32(16, 1_200);
  view.setUint32(20, 1_600);
  bytes.set([0x49, 0x45, 0x4e, 0x44], 37);
  return new File([bytes], "ignored-original-name.png", {
    type: "image/png",
  });
}

describe("Cloudinary catalogue storage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("MEDIA_STORAGE_PROVIDER", "cloudinary");
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "threadd-test");
    vi.stubEnv("CLOUDINARY_API_KEY", "safe-test-api-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "safe-test-api-secret");
    vi.stubEnv("CLOUDINARY_FOLDER", "threadd/customer-test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uploads a validated image into the deployment-scoped folder", async () => {
    cloudinaryMocks.upload.mockResolvedValue({
      secure_url:
        "https://res.cloudinary.com/threadd-test/image/upload/v1/threadd/customer-test/asset.png",
      public_id: "threadd/customer-test/asset",
      width: 1_200,
      height: 1_600,
    });
    const { storeCatalogueImage } =
      await import("@/features/catalogue/media-storage");

    await expect(storeCatalogueImage(validPng())).resolves.toEqual({
      url: "https://res.cloudinary.com/threadd-test/image/upload/v1/threadd/customer-test/asset.png",
      width: 1_200,
      height: 1_600,
      storageProvider: "cloudinary",
      storageKey: "threadd/customer-test/asset",
    });
    expect(cloudinaryMocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/png;base64,/),
      expect.objectContaining({
        folder: "threadd/customer-test",
        overwrite: false,
        resource_type: "image",
        transformation: [{ flags: "strip_profile" }],
      }),
    );
  });

  it("refuses deletion outside the configured deployment folder", async () => {
    const { removeCatalogueImage } =
      await import("@/features/catalogue/media-storage");

    await expect(
      removeCatalogueImage({
        storageProvider: "cloudinary",
        storageKey: "another-customer/asset",
      }),
    ).rejects.toThrow(/outside the catalogue folder/);
    expect(cloudinaryMocks.destroy).not.toHaveBeenCalled();
  });
});
