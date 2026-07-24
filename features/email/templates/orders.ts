import { formatNaira } from "@/features/catalogue/format";

export function createOrderConfirmationEmail(order: {
  orderNumber: string;
  recipientName: string;
  total: { toString(): string };
  state: string;
  items: readonly {
    productName: string;
    size: string;
    colour: string;
    quantity: number;
  }[];
}) {
  const lines = order.items
    .map(
      (item) =>
        `${item.quantity} × ${item.productName} — ${item.colour} / ${item.size}`,
    )
    .join("\n");
  return {
    subject: `THREADD order confirmed — ${order.orderNumber}`,
    textBody: `Hi ${order.recipientName},

Your payment has been verified and your THREADD order is confirmed.

Order: ${order.orderNumber}
${lines}

Total: ${formatNaira(order.total.toString())}
Delivery state: ${order.state}

We will keep the order status updated as it moves through fulfilment.

This is a Demo Outbox preview. No external email was sent.`,
  };
}
