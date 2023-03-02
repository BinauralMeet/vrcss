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

function sharingStart(width:number, height:number, fps:number){
  const promise = new Promise<void>((resolve, reject) => {
    const id = conference.createStreamId()
    getDisplayMedia(fps, width, height).then((ms)=>{
      conference.streamingStart(id, ms).then(()=>{
        resolve()
      }).catch(e=>reject)
    }).catch(e=>reject)  
  }) 
  return promise
}
function toInt(s: string, r=10){
  const rv = parseInt(s, r)
  if (isFinite(rv)) return rv
  else return 0
}

export const mainButtonStyle:React.CSSProperties = {
  textTransform:'none',
  margin:'0.2em 0.2em 0.5em 0.2em',
  fontSize:'calc(10px + 1.6vmin)'
}

function App() {
  const { t, i18n } = useTranslation();
  const [width, setWidth] = React.useState<number>(1280)
  const [height, setHeight] = React.useState<number>(720)
  const [fps, setFps] = React.useState<number>(30)
  const [streamings, setStreamings] = React.useState(conference.streamings)

  const inputProps:InputProps = {'style': {color:'white', fontSize: 30, textAlignLast:'end', height: '1.1em'}}
  const previews = streamings.map(s => <Preview streaming={s} key={s.id} stop={()=>{
    conference.streamingStop(s.id)
    setStreamings(conference.streamings)
  }}/>)

  return (
    <div className="App">
      <header className="App-header">
        <Button variant="contained"
          style={{ backgroundColor:'gray', position: "absolute", top: 30, right: 20 }}
          onClick={() => {
            const idx =
              (i18nSupportedLngs.findIndex((l:any) => l === i18n.language) + 1) %
              i18nSupportedLngs.length;
            i18n.changeLanguage(i18nSupportedLngs[idx]);
          }}
          >
          <TranslateIcon />
        </Button>
        <h2 className="App-title">
          {t('title')}
        </h2>
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
        <div style={{display:'flex', alignItems:'center', margin:'0.2em 0.2em 0.2em 0.2em'}}>
          {t('fps')}&nbsp;
          <TextField className="App-tf" label={t('fps')} size='small' multiline={false} InputProps={inputProps}
            value={fps.toString()} 
            onChange={(ev)=>{setFps(toInt(ev.target.value, 10))}}
          />&nbsp;{t('fpsUnit')}
        </div>
        <Button variant="contained" style={mainButtonStyle} onClick={()=>{
          sharingStart(width, height, fps).then(()=>{
            setStreamings([...conference.streamings])
          })
        }}>
          {t('sharingStart')}
        </Button>
      </header>
      <article className="App-article">
        {previews}
      </article>
    </div>
  );
}

export default App;
