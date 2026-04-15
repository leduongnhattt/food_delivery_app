type EnterpriseActivateShellProps = {
  children: React.ReactNode
  contentClassName?: string
}

export function EnterpriseActivateShell({
  children,
  contentClassName = "pt-14 px-4 pb-10",
}: EnterpriseActivateShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-30">
        <div className="h-full max-w-6xl mx-auto px-6 flex items-center gap-3">
          <div className="text-2xl font-extrabold leading-none text-[#2563FF]">Hanala</div>
          <div className="text-[15px] leading-5 font-semibold text-slate-900">Enterprise Center</div>
        </div>
      </header>
      <div className={contentClassName}>{children}</div>
    </div>
  )
}
