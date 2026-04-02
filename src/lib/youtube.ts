export function extrairYoutubeId(url: string): string | null {
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const regex of regexes) {
    const match = url.match(regex)
    if (match) return match[1]
  }
  return null
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = extrairYoutubeId(url)
  if (!id) return null
  return `https://www.youtube.com/embed/${id}`
}
