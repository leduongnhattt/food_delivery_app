import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import { FooterGate } from "@/components/layout/FooterGate";
import { AppProvider } from "@/components/providers/app-provider";
import { DeliveryDestinationProvider } from "@/contexts/delivery-destination-context";
import { DeliveryDestinationOnboardingModal } from "@/components/location/DeliveryDestinationOnboardingModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodieExpress - Food Delivery App",
  description: "Order delicious food from the best restaurants in Ho Chi Minh City",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={inter.className}>
      <AppProvider>
        <DeliveryDestinationProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <FooterGate />
          </div>
          <DeliveryDestinationOnboardingModal />
        </DeliveryDestinationProvider>
      </AppProvider>
    </div>
  );
}
