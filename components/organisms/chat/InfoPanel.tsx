interface InfoPanelProps {
  label: string
  value: string
}

export function InfoPanel({ label, value }: InfoPanelProps) {
  return (
    <div className="angel-panel-soft p-5">
      <p className="angel-kicker">{label}</p>
      <p className="mt-3 text-sm leading-7 text-text-secondary">{value}</p>
    </div>
  )
}
