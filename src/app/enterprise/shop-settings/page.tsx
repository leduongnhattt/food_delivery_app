"use client";

import React, { useState } from "react";
import {
  ShopSettingsTabs,
  type ShopSettingsTopTabKey,
} from "@/components/enterprise/shop-settings/ShopSettingsTabs";
import { ShippingSettings } from "@/components/enterprise/shop-settings/ShippingSettings";
import { AccountSecuritySettings } from "@/components/enterprise/shop-settings/AccountSecuritySettings";
import { PaymentSettings } from "@/components/enterprise/shop-settings/PaymentSettings";
import { ProductSettings } from "@/components/enterprise/shop-settings/ProductSettings";
import { NotificationsSettings } from "@/components/enterprise/shop-settings/NotificationsSettings";
import { PartnerManagementSettings } from "@/components/enterprise/shop-settings/PartnerManagementSettings";

export default function EnterpriseShopSettingsPage() {
  const [topTab, setTopTab] = useState<ShopSettingsTopTabKey>("shipping");

  return (
    <div className="bg-[#f5f6f8]">
      <div className="w-full px-6 py-5">
        <ShopSettingsTabs value={topTab} onChange={setTopTab} />

        {/* Content */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          {topTab === "shipping" ? <ShippingSettings /> : null}
          {topTab === "account-security" ? <AccountSecuritySettings /> : null}
          {topTab === "payment" ? <PaymentSettings /> : null}
          {topTab === "product" ? <ProductSettings /> : null}
          {topTab === "notifications" ? <NotificationsSettings /> : null}
          {topTab === "partner-management" ? <PartnerManagementSettings /> : null}
        </div>
      </div>
    </div>
  );
}
