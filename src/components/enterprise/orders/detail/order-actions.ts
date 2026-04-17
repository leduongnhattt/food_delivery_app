"use client";

export type DeliveryMethod = "SelfDelivery" | "ThirdParty";

export type EnterpriseOrderActionKey =
  | "confirm"
  | "arrange_shipment"
  | "start_preparing"
  | "start_delivery"
  | "mark_delivered";

export type EnterpriseOrderAction = {
  key: EnterpriseOrderActionKey;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
};

function norm(s: string | null | undefined): string {
  return (s || "").trim().toLowerCase();
}

export function getDeliveryMethodFromMetadata(metadata: unknown): DeliveryMethod | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  const v = m.deliveryMethod;
  if (v === "SelfDelivery" || v === "ThirdParty") return v;
  return null;
}

export function buildEnterpriseOrderActions(order: { status: string; metadata?: unknown }): {
  actions: EnterpriseOrderAction[];
  deliveryMethod: DeliveryMethod | null;
} {
  const st = norm(order.status);
  const deliveryMethod = getDeliveryMethodFromMetadata(order.metadata);

  if (st === "pending") {
    return { deliveryMethod, actions: [{ key: "confirm", label: "Confirm order" }] };
  }

  if (st === "confirmed") {
    return {
      deliveryMethod,
      actions: [
        { key: "start_preparing", label: "Start preparing" },
      ],
    };
  }

  if (st === "preparing") {
    return {
      deliveryMethod,
      // After kitchen is preparing, the next step is ship arrangement.
      actions: [{ key: "arrange_shipment", label: "Arrange shipment" }],
    };
  }

  if (st === "outfordelivery") {
    return {
      deliveryMethod,
      actions: [{ key: "mark_delivered", label: "Mark delivered" }],
    };
  }

  return { deliveryMethod, actions: [] };
}

