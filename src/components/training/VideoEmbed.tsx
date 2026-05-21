interface VideoEmbedProps {
  videoId: string
  title: string
  s3Url?: string
}

export default function VideoEmbed({ videoId, title, s3Url }: VideoEmbedProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#000",
        margin: "1.5rem 0",
        overflow: "hidden",
      }}
    >
      {s3Url ? (
        <video
          src={s3Url}
          title={title}
          controls
          playsInline
          preload="metadata"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: "#0a0a0a",
          }}
        />
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allowFullScreen
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      )}
    </div>
  )
}
