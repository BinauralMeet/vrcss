import React from 'react'
import './App.css'
import { i18nSupportedLngs, useTranslation } from "./locales"
import TranslateIcon from '@mui/icons-material/Translate'
import Button from '@mui/material/Button'
import {getDisplayMedia} from './getDisplayMedia'
import TextField from '@mui/material/TextField'
import {InputProps} from '@mui/material/Input'
import {conference} from './conference/Conference'
import Preview from './Preview'


function toInt(s: string, r=10){
  const rv = parseInt(s, r)
  if (isFinite(rv)) return rv
  else return 0
}
export function copyToClipboard(text: string){
  navigator.clipboard.writeText(text).catch(e => {
    console.warn(`Failed to copy clipboard: ${text}`)
  })
}

export const mainButtonStyle:React.CSSProperties = {
  textTransform:'none',
  margin:'0.2em 0.2em 0.5em 0.2em',
  fontSize:'calc(10px + 1.6vmin)'
}
export const grayButtonStyle:React.CSSProperties = {
  textTransform:'none',
  fontSize:'calc(10px + 1.6vmin)',
  backgroundColor:'gray'
}

function App() {
  const { t, i18n } = useTranslation();
  const [width, setWidth] = React.useState<number>(1280)
  const [height, setHeight] = React.useState<number>(720)
  const [fps, setFps] = React.useState<number>(30)
  const [streamings, setStreamings] = React.useState(conference.streamings)

  const inputProps:InputProps = {'style': {color:'white', fontSize: 30, textAlignLast:'end', height: '1.1em'}}
  const previews = streamings.map(s => <Preview streaming={s} key={s.id} stop={()=>{sharingStop(s.id)}}/>)

  function sharingStart(width:number, height:number, fps:number){
    const promise = new Promise<void>((resolve, reject) => {
      const id = conference.createStreamId()
      copyToClipboard(`rtspt://vrc.jp/${id}`)
      getDisplayMedia(fps, width, height).then((ms)=>{
        conference.streamingStart(id, ms).then(()=>{
          ms.getVideoTracks()[0].addEventListener('ended', ()=>{
            sharingStop(id)
          })
          setStreamings([...conference.streamings])
          resolve()
        }).catch(e=>{
          console.warn(JSON.stringify(e))
          reject(e)
        })
      }).catch(e=>{
        console.warn(JSON.stringify(e))
        reject(e)
      })  
    })
    return promise
  }
  function sharingStop(id:string){
    conference.streamingStop(id)
    setStreamings([...conference.streamings])
  }

  return (
    <div className="App">
      <header className="App-header">
        <Button variant="contained"
          style={{ ...mainButtonStyle, backgroundColor:'dimgray', position: "absolute", top: '0.2em', right: '0.4em' }}
          onClick={() => {
            const idx =
              (i18nSupportedLngs.findIndex((l:any) => l === i18n.language) + 1) %
              i18nSupportedLngs.length;
            i18n.changeLanguage(i18nSupportedLngs[idx]);
          }}
          >&nbsp;
          <TranslateIcon />&nbsp;
        </Button>
        <table><tbody>
        <tr>
          <td className="tdr">
            <h2 className="App-title">
              {t('title')}
            </h2>
          </td>
          <td className="tdl">
            <Button variant="contained" style={{...mainButtonStyle, marginLeft:0}} onClick={()=>{
                    sharingStart(width, height, fps).then(()=>{
                      setStreamings([...conference.streamings])
                    }).catch(e=>{
                      console.warn(`sharingStart: ${JSON.stringify(e)}`)
                    })
                  }}>{t('sharingStart')}</Button>
          </td>
        </tr>
        <tr>
          <td className="tdr">
            <div style={{display:'flex', alignItems:'center', margin:'0.2em 0.2em 0.2em 0.2em'}}>
              {t('resolution')}&nbsp;
              <TextField className="App-tf" label={t('height')} size='small' multiline={false} InputProps={inputProps}
                value={width.toString()}
                onChange={(ev)=>{setWidth(toInt(ev.target.value, 10))}}
              />×
              <TextField className="App-tf" label={t('width')} size='small' multiline={false} InputProps={inputProps}
                value={height.toString()} 
                onChange={(ev)=>{setHeight(toInt(ev.target.value, 10))}}
              />
              &nbsp;px
            </div>
          </td>
          <td className="tdl">
          <Button size="small" variant="contained" style={grayButtonStyle}
            onClick={()=>{setWidth(720); setHeight(480)}}>SD(4:3)</Button>&nbsp;
          <Button size="small" variant="contained" style={grayButtonStyle}
            onClick={()=>{setWidth(1280); setHeight(720)}}>HD</Button>&nbsp;
          <Button size="small" variant="contained" style={grayButtonStyle}
            onClick={()=>{setWidth(1920); setHeight(1080)}}>Full HD</Button>
          </td>
        </tr>
        <tr>
          <td className="tdr">
            <div style={{display:'flex', alignItems:'center', margin:'0.2em 0.2em 0.2em 0.2em'}}>
              {t('fps')}&nbsp;
              <TextField className="App-tf" label={t('fps')} size='small' multiline={false} InputProps={inputProps}
                value={fps.toString()} 
                onChange={(ev)=>{setFps(toInt(ev.target.value, 10))}}
              />&nbsp;{t('fpsUnit')}</div>
          </td>
          <td className="tdl">
            <Button size="small" variant="contained" style={grayButtonStyle}
              onClick={()=>{setFps(5)}}>5</Button>&nbsp;
            <Button size="small" variant="contained" style={grayButtonStyle}
              onClick={()=>{setFps(15)}}>15</Button>&nbsp;
            <Button size="small" variant="contained" style={grayButtonStyle}
              onClick={()=>{setFps(30)}}>30</Button>
          </td>
        </tr>
        </tbody></table>
      </header>
      <article className="App-article">
        {previews}
      </article>
    </div>
  );
}

export default App;
