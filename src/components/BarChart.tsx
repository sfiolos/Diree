interface BarDatum {
  label: string
  value: number
  display?: string
}

interface BarChartProps {
  data: BarDatum[]
  format?: (value: number) => string
  height?: number
  horizontal?: boolean
}

function BarChart({ data, format = (v) => String(v), height, horizontal = false }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))

  if (horizontal) {
    return (
      <div className="bar-chart-h">
        {data.map((d) => (
          <div className="bar-h-row" key={d.label}>
            <div className="bar-h-label" title={d.label}>
              {d.label}
            </div>
            <div className="bar-h-track">
              <div
                className="bar-h-fill"
                style={{ width: `${(d.value / max) * 100}%` }}
                title={`${d.label}: ${format(d.value)}`}
              />
            </div>
            <div className="bar-h-value">{d.display ?? format(d.value)}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bar-chart" style={height ? { height } : undefined}>
      {data.map((d) => (
        <div className="bar-chart-col" key={d.label}>
          <div className="bar-chart-track">
            <div
              className="bar-chart-fill"
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.label}: ${format(d.value)}`}
            />
          </div>
          <div className="bar-chart-label" title={d.label}>
            {d.label}
          </div>
          <div className="bar-chart-value">{d.display ?? format(d.value)}</div>
        </div>
      ))}
    </div>
  )
}

export default BarChart