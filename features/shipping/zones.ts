import "server-only";

import { db } from "@/lib/db/client";

const defaults = [
  { name: "Lagos", states: ["Lagos"], fee: 3_000, position: 0 },
  {
    name: "South West",
    states: ["Ogun", "Oyo", "Osun", "Ondo", "Ekiti"],
    fee: 4_500,
    position: 1,
  },
  {
    name: "Nigeria",
    states: [
      "Abia",
      "Adamawa",
      "Akwa Ibom",
      "Anambra",
      "Bauchi",
      "Bayelsa",
      "Benue",
      "Borno",
      "Cross River",
      "Delta",
      "Ebonyi",
      "Edo",
      "Enugu",
      "FCT",
      "Gombe",
      "Imo",
      "Jigawa",
      "Kaduna",
      "Kano",
      "Katsina",
      "Kebbi",
      "Kogi",
      "Kwara",
      "Nasarawa",
      "Niger",
      "Plateau",
      "Rivers",
      "Sokoto",
      "Taraba",
      "Yobe",
      "Zamfara",
    ],
    fee: 6_000,
    position: 2,
  },
] as const;

export async function ensureDefaultShippingZones() {
  if (await db.shippingZone.count()) return;
  await db.shippingZone.createMany({
    data: defaults.map((zone) => ({
      name: zone.name,
      states: [...zone.states],
      fee: zone.fee,
      position: zone.position,
    })),
  });
}

export async function getShippingQuote(state: string) {
  const zones = await getActiveShippingZones();
  const zone = zones.find((candidate) => candidate.states.includes(state));
  if (!zone) throw new Error("Delivery is not configured for that state.");
  return { name: zone.name, fee: zone.fee };
}

export async function getActiveShippingZones() {
  await ensureDefaultShippingZones();
  const zones = await db.shippingZone.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    fee: Number(zone.fee),
    states: Array.isArray(zone.states)
      ? zone.states.filter(
          (state): state is string => typeof state === "string",
        )
      : [],
  }));
}
