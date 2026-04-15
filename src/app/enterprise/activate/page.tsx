import { Suspense } from "react"
import EnterpriseActivateClient from "./EnterpriseActivateClient"

export default function EnterpriseActivatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <EnterpriseActivateClient />
    </Suspense>
  )
}

