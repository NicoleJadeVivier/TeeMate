function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function Avatar({
  url,
  name,
  size = 36,
}: {
  url?: string | null
  name: string
  size?: number
}) {
  const style = { width: size, height: size, fontSize: size * 0.4 }

  if (url) {
    return <img src={url} alt={name} className="avatar" style={style} />
  }

  return (
    <span className="avatar avatar-fallback" style={style}>
      {initials(name) || '?'}
    </span>
  )
}
