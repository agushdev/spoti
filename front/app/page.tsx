import { Suspense } from "react"
import { DiscoverClient } from "@/components/discover-client"

export const dynamic = "force-dynamic"

export default async function Page() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Descubre</h1>
        <p className="text-neutral-600">B&uacute;squeda, filtros y recomendaciones hechas para ti.</p>
      </section>

      <Suspense fallback={<div className="h-80 rounded-2xl bg-neutral-100" />}>
        {/* Client section to handle interactive search */}
        <DiscoverClient />
      </Suspense>
    </div>
  )
}
