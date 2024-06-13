import {useEffect, useRef} from 'react'
import { useTranslation } from "./locales"
import Button from '@mui/material/Button'
import {Streaming} from './conference/Conference'
import { copyToClipboard, mainButtonStyle } from './App'
import './App.css'

export interface PreviewProps{
    streaming: Streaming
    stop: () => void
    apply: () => void
}
export function Preview(props: PreviewProps) {
  const {t} = useTranslation();
  const ref = useRef<HTMLVideoElement>(null)
  const firstRef = useRef<boolean>(true)
  useEffect(()=>{
    if (ref.current && firstRef.current){
      firstRef.current = false
      const videoTrack = props.streaming.tracks.find(t=>t.track.kind==='video')
      const mediaStream = videoTrack && new MediaStream([videoTrack.track])
        ref.current.srcObject = mediaStream ? mediaStream : null
      console.log(`useEffect ${ref.current} = ${JSON.stringify(mediaStream?.getTracks().length)}`)
    }
  }, [props.streaming.tracks])
  
  return (
    <div className="Preview">
      <Button variant='contained' style={mainButtonStyle} onClick={()=>{
        copyToClipboard(`rtspt://vrc.jp/${props.streaming.id}`)
      }}>
        {t('windows')}
      </Button>
      <Button variant='contained' style={mainButtonStyle} onClick={()=>{
        copyToClipboard(`rtsp://vrc.jp/${props.streaming.id}`)
      }}>
        {t('quest')}
      </Button>
      <Button variant='contained' color="primary" style={mainButtonStyle} onClick={()=>{
        props.apply()
      }}>
        {t('apply')}
      </Button>
      <Button variant='contained' color="secondary" style={mainButtonStyle} onClick={()=>{
        props.stop()
      }}>
        {t('stopSharing')}
      </Button><br></br>
      <video className="Preview-video" ref={ref} autoPlay/>
    </div>
  );

}

export default Preview
