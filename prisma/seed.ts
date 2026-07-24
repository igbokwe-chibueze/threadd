import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnvConfig } from "@next/env";
import { hashPassword } from "better-auth/crypto";

import {
  PrismaClient,
  ProductStatus,
  UserRole,
} from "../generated/prisma/client";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed THREADD.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const demoUsers = [
  {
    name: "THREADD Demo Admin",
    email: "admin@demo.threadd.store",
    password: "DemoAdmin123!",
    role: UserRole.ADMIN,
  },
  {
    name: "THREADD Demo Customer",
    email: "customer@demo.threadd.store",
    password: "DemoShopper123!",
    role: UserRole.CUSTOMER,
  },
] as const;

const catalogue = [
  {
    name: "Utility Overshirt 01",
    slug: "utility-overshirt-01",
    shortDescription: "A softened utility layer with room through the body.",
    description:
      "Cut with a relaxed shoulder and four considered patch pockets, Utility Overshirt 01 works as a shirt, jacket, or middle layer. The structured cotton blend settles with wear while keeping its architectural line.",
    category: "Outerwear",
    categorySlug: "outerwear",
    price: 48500,
    compareAtPrice: null,
    image: "/images/catalogue/utility-overshirt.png",
    imageAlt: "Model wearing THREADD Utility Overshirt 01 in charcoal",
    collection: "Study 001",
    collectionSlug: "study-001",
    featured: true,
    colours: [
      ["Charcoal", "#262624"],
      ["Bone", "#ded8ca"],
    ],
    sizes: ["S", "M", "L", "XL"],
    sku: "TH-OS01",
  },
  {
    name: "Foundation Tee",
    slug: "foundation-tee",
    shortDescription: "A substantial everyday tee with a clean, open shape.",
    description:
      "Foundation Tee uses heavyweight cotton jersey, a relaxed neckline, and an easy straight hem. It is balanced to sit alone or under the wider layers in Study 001.",
    category: "Tops",
    categorySlug: "tops",
    price: 18500,
    compareAtPrice: null,
    image: "/images/catalogue/utility-overshirt.png",
    imageAlt: "Cream THREADD Foundation Tee styled under a charcoal overshirt",
    collection: "Essentials",
    collectionSlug: "essentials",
    featured: false,
    colours: [
      ["Bone", "#e8e2d5"],
      ["Ink", "#1b1b19"],
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    sku: "TH-FT01",
  },
  {
    name: "Longline Vest",
    slug: "longline-vest",
    shortDescription: "A sleeveless outer layer that redraws the silhouette.",
    description:
      "The Longline Vest falls below the knee with a softly structured front and open sides for movement. Layer it over a tee, knit, or shirt when the outfit needs length without weight.",
    category: "Outerwear",
    categorySlug: "outerwear",
    price: 56000,
    compareAtPrice: 62000,
    image: "/images/catalogue/longline-vest.png",
    imageAlt: "Model wearing the THREADD Longline Vest in sand",
    collection: "Study 001",
    collectionSlug: "study-001",
    featured: true,
    colours: [
      ["Sand", "#c9bba6"],
      ["Ink", "#20201e"],
    ],
    sizes: ["S", "M", "L"],
    sku: "TH-LV01",
  },
  {
    name: "Volume Trouser",
    slug: "volume-trouser",
    shortDescription: "A long, fluid trouser with a precise front line.",
    description:
      "Volume Trouser is cut wide from the hip with a full break and sharp pressed front. An internal waist adjustment lets the same silhouette sit higher or lower depending on how it is worn.",
    category: "Trousers",
    categorySlug: "trousers",
    price: 42000,
    compareAtPrice: null,
    image: "/images/catalogue/longline-vest.png",
    imageAlt: "Wide THREADD Volume Trouser in pale stone",
    collection: "Essentials",
    collectionSlug: "essentials",
    featured: false,
    colours: [
      ["Stone", "#d8d0c2"],
      ["Black", "#181817"],
    ],
    sizes: ["28", "30", "32", "34", "36"],
    sku: "TH-VT01",
  },
  {
    name: "Drape Jacket",
    slug: "drape-jacket",
    shortDescription:
      "An asymmetric technical-cotton jacket with a quiet edge.",
    description:
      "Drape Jacket crosses the body with an offset fastening and generous sleeves. Lightweight technical cotton gives it shape without stiffness and makes it an adaptable layer across seasons.",
    category: "Outerwear",
    categorySlug: "outerwear",
    price: 68500,
    compareAtPrice: null,
    image: "/images/catalogue/drape-jacket.png",
    imageAlt: "Model wearing the THREADD Drape Jacket in deep olive",
    collection: "Study 001",
    collectionSlug: "study-001",
    featured: true,
    colours: [
      ["Deep Olive", "#4a4a38"],
      ["Clay", "#85584b"],
    ],
    sizes: ["S", "M", "L", "XL"],
    sku: "TH-DJ01",
  },
  {
    name: "Field Trouser",
    slug: "field-trouser",
    shortDescription: "A relaxed technical trouser designed for movement.",
    description:
      "Field Trouser pairs a generous leg with an adjustable waist and discreet utility detailing. The cotton surface is dry and soft, giving daily function a more considered line.",
    category: "Trousers",
    categorySlug: "trousers",
    price: 44500,
    compareAtPrice: null,
    image: "/images/catalogue/drape-jacket.png",
    imageAlt: "Relaxed THREADD Field Trouser in deep olive",
    collection: "Study 001",
    collectionSlug: "study-001",
    featured: false,
    colours: [
      ["Deep Olive", "#4a4a38"],
      ["Smoke", "#5d5b57"],
    ],
    sizes: ["28", "30", "32", "34", "36"],
    sku: "TH-FD01",
  },
  {
    name: "Ease Trouser 02",
    slug: "ease-trouser-02",
    shortDescription:
      "A fluid pull-on trouser balancing soft movement with a long, clean line.",
    description:
      "Ease Trouser 02 uses a relaxed wide leg, elasticated drawcord waist, and fluid drape for effortless daily wear. Designed to sit naturally at the waist or lower on the hip, it moves easily between quiet tailoring and off-duty styling.",
    category: "Trousers",
    categorySlug: "trousers",
    price: 38500,
    compareAtPrice: null,
    image: "/images/catalogue/ease-trouser-black.png",
    additionalImages: ["/images/catalogue/ease-trouser-sand.png"],
    imageAlt:
      "Woman wearing the THREADD Ease Trouser 02 with a white fitted tank",
    collection: "Essentials",
    collectionSlug: "essentials",
    featured: true,
    colours: [
      ["Black", "#111111"],
      ["Sand", "#d5c1a6"],
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    sku: "TH-ET02",
  },
] as const;

async function seed(): Promise<void> {
  for (const user of demoUsers) {
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        emailVerified: true,
        isDemoAccount: true,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true,
        isDemoAccount: true,
      },
    });

    const password = await hashPassword(user.password);

    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: seededUser.id,
        },
      },
      update: { password },
      create: {
        providerId: "credential",
        accountId: seededUser.id,
        userId: seededUser.id,
        password,
      },
    });
  }

  for (const [position, item] of catalogue.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: item.categorySlug },
      update: { name: item.category, position },
      create: {
        name: item.category,
        slug: item.categorySlug,
        description: `${item.category} designed without gendered categories.`,
        position,
      },
    });

    const collection = await prisma.collection.upsert({
      where: { slug: item.collectionSlug },
      update: {
        name: item.collection,
        featured: item.collectionSlug === "study-001",
      },
      create: {
        name: item.collection,
        slug: item.collectionSlug,
        description:
          item.collectionSlug === "study-001"
            ? "THREADD's debut study in proportion, utility, and ease."
            : "The pieces that hold the wardrobe together.",
        featured: item.collectionSlug === "study-001",
        position: item.collectionSlug === "study-001" ? 0 : 1,
      },
    });

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        shortDescription: item.shortDescription,
        description: item.description,
        status: ProductStatus.ACTIVE,
        basePrice: item.price,
        compareAtPrice: item.compareAtPrice,
        featured: item.featured,
        categoryId: category.id,
        publishedAt: new Date(),
        seoTitle: `${item.name} | THREADD`,
        seoDescription: item.shortDescription,
      },
      create: {
        name: item.name,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: item.description,
        status: ProductStatus.ACTIVE,
        basePrice: item.price,
        compareAtPrice: item.compareAtPrice,
        featured: item.featured,
        categoryId: category.id,
        publishedAt: new Date(),
        seoTitle: `${item.name} | THREADD`,
        seoDescription: item.shortDescription,
      },
    });

    await prisma.$transaction([
      prisma.productCollection.deleteMany({
        where: { productId: product.id },
      }),
      prisma.productImage.deleteMany({ where: { productId: product.id } }),
      prisma.productVariant.deleteMany({ where: { productId: product.id } }),
    ]);

    await prisma.productCollection.create({
      data: {
        productId: product.id,
        collectionId: collection.id,
        position,
      },
    });

    const additionalImages =
      "additionalImages" in item ? item.additionalImages : [];

    await prisma.productImage.createMany({
      data: [item.image, ...additionalImages].map((url, imagePosition) => ({
        productId: product.id,
        url,
        altText:
          additionalImages.length === 0
            ? item.imageAlt
            : imagePosition === 0
              ? `${item.imageAlt} in black`
              : `${item.imageAlt} in sand`,
        position: imagePosition,
      })),
    });

    await prisma.productVariant.createMany({
      data: item.colours.flatMap(([colour, colourHex], colourIndex) =>
        item.sizes.map((size, sizeIndex) => ({
          productId: product.id,
          sku: `${item.sku}-${colourIndex + 1}-${size}`,
          size,
          colour,
          colourHex,
          inventoryQuantity: 4 + ((position + sizeIndex + colourIndex) % 8),
          lowStockThreshold: 3,
          active: true,
        })),
      ),
    });

    const seededVariants = await prisma.productVariant.findMany({
      where: { productId: product.id },
      select: { id: true, inventoryQuantity: true },
    });

    await prisma.inventoryMovement.createMany({
      data: seededVariants.map((variant) => ({
        variantId: variant.id,
        type: "INITIAL_STOCK",
        quantityDelta: variant.inventoryQuantity,
        quantityBefore: 0,
        quantityAfter: variant.inventoryQuantity,
        reason: "Canonical demo catalogue seed",
      })),
    });
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
