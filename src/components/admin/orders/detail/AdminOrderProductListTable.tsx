"use client";

import { useMemo } from "react";
import type { AdminOrderDetail } from "@/types/admin-api.types";
import { adminVoucherIsPlatform, adminVoucherIsShop } from "@/lib/admin-order-promotion";
import { parseOrderMetadataCheckout } from "@/lib/order-metadata-checkout";
import { formatPrice, parseFiniteNumber, parseOptionalFiniteNumber } from "@/lib/utils";

type OrderLine = AdminOrderDetail["orderDetails"][number];

/** Total voucher discount for the order (checkout snapshot, else voucher fields). */
function resolveOrderVoucherDiscountTotal(order: AdminOrderDetail): number | null {
  const checkoutPricing = parseOrderMetadataCheckout(order.Metadata ?? null);
  if (
    checkoutPricing?.voucherDiscount != null &&
    Number.isFinite(checkoutPricing.voucherDiscount) &&
    checkoutPricing.voucherDiscount > 0
  ) {
    return checkoutPricing.voucherDiscount;
  }

  const appliedVoucher = order.voucher;
  if (!appliedVoucher) return null;

  const fixedDiscountAmount = parseOptionalFiniteNumber(appliedVoucher.DiscountAmount);
  if (fixedDiscountAmount != null && fixedDiscountAmount > 0) return fixedDiscountAmount;

  const discountPercent = parseOptionalFiniteNumber(appliedVoucher.DiscountPercent);
  if (discountPercent != null && discountPercent > 0) {
    const sumOfLineSubtotals = order.orderDetails.reduce(
      (runningTotal, line) => runningTotal + parseFiniteNumber(line.SubTotal),
      0,
    );
    if (sumOfLineSubtotals <= 0) return null;
    return Math.round(sumOfLineSubtotals * (discountPercent / 100) * 100) / 100;
  }

  return null;
}

/** Discount implied by list price × quantity vs what the line subtotal charged (catalog vs paid). */
function catalogVersusLineSubtotalDiscount(orderLine: OrderLine): number | null {
  const listUnitPrice = parseFiniteNumber(orderLine.food.Price);
  const quantity = orderLine.Quantity;
  const lineSubtotal = parseFiniteNumber(orderLine.SubTotal);
  const listExtendedPrice = listUnitPrice * quantity - lineSubtotal;
  if (!Number.isFinite(listExtendedPrice) || listExtendedPrice <= 0) return null;
  return Math.round(listExtendedPrice * 100) / 100;
}

type LineVoucherShares = { platformVoucherDiscountForLine: number; shopVoucherDiscountForLine: number };

function computeLineVoucherDiscountShares(
  order: AdminOrderDetail,
  orderLine: OrderLine,
  orderLevelVoucherDiscount: number,
): LineVoucherShares {
  const appliedVoucher = order.voucher;
  if (!appliedVoucher || orderLevelVoucherDiscount <= 0) {
    return { platformVoucherDiscountForLine: 0, shopVoucherDiscountForLine: 0 };
  }

  if (adminVoucherIsPlatform(appliedVoucher)) {
    const sumOfAllLineSubtotals = order.orderDetails.reduce(
      (runningTotal, line) => runningTotal + parseFiniteNumber(line.SubTotal),
      0,
    );
    if (sumOfAllLineSubtotals <= 0) {
      return { platformVoucherDiscountForLine: 0, shopVoucherDiscountForLine: 0 };
    }
    const shareRatio = parseFiniteNumber(orderLine.SubTotal) / sumOfAllLineSubtotals;
    return {
      platformVoucherDiscountForLine: Math.round(shareRatio * orderLevelVoucherDiscount * 100) / 100,
      shopVoucherDiscountForLine: 0,
    };
  }

  if (adminVoucherIsShop(appliedVoucher)) {
    const voucherEnterpriseId = (appliedVoucher.EnterpriseID ?? "").trim();
    const sumOfShopLineSubtotals = order.orderDetails
      .filter((line) => line.food.enterprise.EnterpriseID === voucherEnterpriseId)
      .reduce((runningTotal, line) => runningTotal + parseFiniteNumber(line.SubTotal), 0);

    const lineBelongsToVoucherShop =
      voucherEnterpriseId.length > 0 &&
      sumOfShopLineSubtotals > 0 &&
      orderLine.food.enterprise.EnterpriseID === voucherEnterpriseId;

    if (!lineBelongsToVoucherShop) {
      return { platformVoucherDiscountForLine: 0, shopVoucherDiscountForLine: 0 };
    }

    const shareRatio = parseFiniteNumber(orderLine.SubTotal) / sumOfShopLineSubtotals;
    return {
      platformVoucherDiscountForLine: 0,
      shopVoucherDiscountForLine: Math.round(shareRatio * orderLevelVoucherDiscount * 100) / 100,
    };
  }

  return { platformVoucherDiscountForLine: 0, shopVoucherDiscountForLine: 0 };
}

function parseCommissionLineAmount(orderLine: OrderLine): number | null {
  return parseOptionalFiniteNumber(orderLine.CommissionLineAmount ?? null);
}

function formatAppliedCommissionPercent(orderLine: OrderLine): string | null {
  const parsedPercent = parseOptionalFiniteNumber(orderLine.AppliedCommissionPercent ?? null);
  if (parsedPercent == null) return null;
  return `${parsedPercent}%`;
}

export function AdminOrderProductListTable({ order }: { order: AdminOrderDetail }) {
  const orderVoucherDiscountTotal = useMemo(() => resolveOrderVoucherDiscountTotal(order), [order]);

  const voucherDiscountSharesPerLine = useMemo(() => {
    const discountTotal = orderVoucherDiscountTotal ?? 0;
    return order.orderDetails.map((orderLine) =>
      computeLineVoucherDiscountShares(order, orderLine, discountTotal),
    );
  }, [order, orderVoucherDiscountTotal]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
        Product List
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-[12px] leading-4">
          <thead>
            <tr className="bg-[#f9fbfc] text-left border-b border-slate-200">
              <th className="py-2 pr-4 pl-4 text-xs font-semibold text-slate-600">Product ID</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Quantity</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Item</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Price Discount</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Subtotal</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Voucher Discount (Platform)</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Voucher Discount (Shop)</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Commission Fee</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Commission Fee Rule ID</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Seller Transaction Fee</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Refund ID</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Refund Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {order.orderDetails.map((orderLine, lineIndex) => {
              const catalogPriceDiscount = catalogVersusLineSubtotalDiscount(orderLine);
              const lineCommissionFee = parseCommissionLineAmount(orderLine);
              const appliedCommissionPercentLabel = formatAppliedCommissionPercent(orderLine);
              const { platformVoucherDiscountForLine, shopVoucherDiscountForLine } =
                voucherDiscountSharesPerLine[lineIndex] ?? {
                  platformVoucherDiscountForLine: 0,
                  shopVoucherDiscountForLine: 0,
                };

              return (
                <tr key={`${orderLine.FoodID}:${orderLine.food.enterprise.EnterpriseID}`}>
                  <td className="py-2 pr-4 pl-4 font-mono text-[11px] text-slate-600">{orderLine.FoodID}</td>
                  <td className="py-2 pr-4 text-slate-700">{orderLine.Quantity}</td>
                  <td className="py-2 pr-4 text-slate-700 font-medium">{orderLine.food.DishName}</td>
                  <td className="py-2 pr-4 text-slate-700">
                    {catalogPriceDiscount != null && catalogPriceDiscount > 0 ? (
                      formatPrice(catalogPriceDiscount)
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">{formatPrice(orderLine.SubTotal)}</td>
                  <td className="py-2 pr-4 text-slate-700">
                    {platformVoucherDiscountForLine > 0 ? (
                      formatPrice(platformVoucherDiscountForLine)
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {shopVoucherDiscountForLine > 0 ? (
                      formatPrice(shopVoucherDiscountForLine)
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {lineCommissionFee != null ? (
                      formatPrice(lineCommissionFee)
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {appliedCommissionPercentLabel ? (
                      <span title="Applied commission percent on line (no separate rule UUID)">
                        {appliedCommissionPercentLabel}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-slate-500" title="Not modeled per line">
                    —
                  </td>
                  <td className="py-2 pr-4 text-slate-500" title="Return/refund not included in admin order detail API">
                    —
                  </td>
                  <td className="py-2 pr-4 text-slate-500" title="Return/refund not included in admin order detail API">
                    —
                  </td>
                </tr>
              );
            })}

            {order.orderDetails.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-10 text-center text-slate-500">
                  No products
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
