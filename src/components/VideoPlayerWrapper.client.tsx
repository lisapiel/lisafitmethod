"use client"
import dynamic from "next/dynamic"

const VideoPlayer = dynamic(() => import("./VideoPlayer.client"), { ssr: false })

export default function VideoPlayerWrapper({ src, style }: { src: string; style?: React.CSSProperties }) {
  return <VideoPlayer src={src} style={style} />
}
