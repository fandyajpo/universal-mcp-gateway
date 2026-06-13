import { MFASetup } from "./mfa-setup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Settings",
};

export default function SecuritySettingsPage(): React.ReactNode {
  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>
      <MFASetup />
    </div>
  );
}
