import "server-only";

import { unlink } from "node:fs/promises";
import path from "node:path";

import { seedCanonicalDemo } from "@/prisma/seed";

import { removeCatalogueImage } from "@/features/catalogue/media-storage";
import { db } from "@/lib/db/client";

const RESET_LOCK_ID = 842_190_731;

export type DemoResetResult = Readonly<{
  completedAt: string;
  canonicalState: {
    demoUsers: number;
    products: number;
    variants: number;
    inventoryMovements: number;
    enquiries: number;
    shippingZones: number;
    sampleOrders: number;
  };
}>;

export async function resetDemoDatabase(): Promise<DemoResetResult> {
  const uploadedImages = await db.productImage.findMany({
    where: {
      OR: [
        { url: { startsWith: "/uploads/catalogue/" } },
        { storageProvider: { in: ["local_demo", "cloudinary"] } },
      ],
    },
    select: {
      url: true,
      storageProvider: true,
      storageKey: true,
    },
  });

  const result = await db.$transaction(
    async (transaction) => {
      const lock = await transaction.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_try_advisory_xact_lock(${RESET_LOCK_ID}) AS locked
      `;

      if (!lock[0]?.locked) {
        throw new Error("A demo reset is already running.");
      }

      await transaction.$executeRaw`
        TRUNCATE TABLE
          "EmailMessage", "Session", "Account", "Verification", "AuditLog",
          "ProductCollection", "ProductImage", "CartItem", "OrderItem",
          "PaymentEvent", "OrderStatusHistory", "CancellationRequest",
          "ReturnRequest", "Refund", "Payment", "InventoryMovement",
          "EnquiryNote", "EnquiryStatusHistory", "Enquiry", "Address", "Cart",
          "Order", "ProductVariant", "Product", "Collection", "Category",
          "ShippingZone", "User"
        RESTART IDENTITY CASCADE
      `;

      await seedCanonicalDemo(transaction);

      const [
        demoUsers,
        products,
        variants,
        inventoryMovements,
        enquiries,
        shippingZones,
        sampleOrders,
      ] = await Promise.all([
        transaction.user.count({
          where: {
            email: {
              in: ["admin@demo.threadd.store", "customer@demo.threadd.store"],
            },
            isDemoAccount: true,
          },
        }),
        transaction.product.count(),
        transaction.productVariant.count(),
        transaction.inventoryMovement.count(),
        transaction.enquiry.count(),
        transaction.shippingZone.count(),
        transaction.order.count({
          where: { orderNumber: "THR-DEMO-240701" },
        }),
      ]);

      return {
        completedAt: new Date().toISOString(),
        canonicalState: {
          demoUsers,
          products,
          variants,
          inventoryMovements,
          enquiries,
          shippingZones,
          sampleOrders,
        },
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 10_000,
      timeout: 120_000,
    },
  );

  const uploadRoot = path.resolve(
    process.cwd(),
    "public",
    "uploads",
    "catalogue",
  );
  await Promise.allSettled(
    uploadedImages.map(({ url, storageProvider, storageKey }) => {
      if (
        storageKey &&
        (storageProvider === "local_demo" || storageProvider === "cloudinary")
      ) {
        return removeCatalogueImage({ storageProvider, storageKey });
      }

      /*
       * Compatibility cleanup for demo uploads created before storage identity
       * was persisted. Only the fixed historical URL prefix can reach this
       * branch; current uploads always use the provider/key path above.
       */
      const target = path.resolve(process.cwd(), "public", url.slice(1));
      const relative = path.relative(uploadRoot, target);

      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(
          "Refusing to remove media outside the demo upload root.",
        );
      }

      return unlink(target);
    }),
  );

  return result;
}
