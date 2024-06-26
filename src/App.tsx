import React from 'react'
import {ToastContainer, toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { i18nSupportedLngs, useTranslation } from "./locales"
import TranslateIcon from '@mui/icons-material/Translate'
import Button from '@mui/material/Button'
import {getDisplayMedia} from './getDisplayMedia'
import TextField from '@mui/material/TextField'
import {InputProps} from '@mui/material/Input'
import {useLocation} from 'react-router-dom'
import {conference} from './conference/Conference'
import Preview from './Preview'
import './App.css'


function toInt(s: string, r=10){
  const rv = parseInt(s, r)
  if (isFinite(rv)) return rv
  else return 0
}
export function copyToClipboard(text: string){
  navigator.clipboard.writeText(text).catch(_e => {
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
export const silverButtonStyle:React.CSSProperties = {
  textTransform:'none',
  fontSize:'calc(10px + 1.6vmin)',
  backgroundColor:'silver'
}

function App() {
  const { t, i18n } = useTranslation();
  const [width, setWidth] = React.useState<number>(1280)
  const [height, setHeight] = React.useState<number>(720)
  const [fps, setFps] = React.useState<number>(30)
  const [hint, setHint] = React.useState<string>('motion')
  const [bitrate, setBitrate] = React.useState<number>(8000)
  const [streamings, setStreamings] = React.useState(conference.streamings)

  const inputProps:InputProps = {'style': {color:'white', fontSize: 30, textAlignLast:'end', height: '1.1em'}}
  const previews = streamings.map(s => <Preview streaming={s} key={s.id} stop={()=>{sharingStop(s.id)}} 
    apply={()=>{apply(s.id, width, height, fps, hint, bitrate*1000)}}/>)
  const search = useLocation().search
  const query = new URLSearchParams(search)
  const idInUrl = query.get('id')    

  function sharingStart(width:number, height:number, fps:number, hint:string){
    console.log(`sharingStart`)
    const promise = new Promise<void>((resolve, reject) => {
      const id = idInUrl ? idInUrl : conference.createStreamId()
      //console.log(`id:${id} idInUrl:${idInUrl}`)
      copyToClipboard(`rtspt://vrc.jp/${id}`)
      getDisplayMedia(fps, width, height).then((ms)=>{
        conference.streamingStart(id, ms, bitrate*1000).then(()=>{
          ms.getVideoTracks()[0].addEventListener('ended', ()=>{
            sharingStop(id)
          })
          ms.getVideoTracks()[0].contentHint = hint
          setStreamings([...conference.streamings])
          toast(<><h4>{t('helpStart1')}</h4><br />{t('helpStart2')}</>,  {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            });
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
  function apply(id:string, width:number, height:number, fps:number, hint:string, bitrate: number){
    conference.applyConstrants(id, width, height, fps, hint, bitrate)
  }
  function sharingStop(id:string){
    conference.streamingStop(id)
    setStreamings([...conference.streamings])
  }
  return <div className="App">
    <ToastContainer />
    <header className="App-header">
      <Button variant="contained"
        style={{ ...mainButtonStyle, backgroundColor:'dimgray', position: "absolute", top: '0.2em', right: '0.4em' }}
        onClick={() => {
          console.log('onClick Lang')
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
                  sharingStart(width, height, fps, hint).then(()=>{
                    setStreamings([...conference.streamings])
                  }).catch(e=>{
                    console.warn(`sharingStart: ${JSON.stringify(e)}`)
                  })
                }}>{t('sharingStart')}</Button>
        </td>
      </tr>
      <tr>
        <td className="tdl">
          <div style={{display:'flex', alignItems:'center', margin:'0.2em 0.2em 0.2em 0.2em'}}>
            {t('resolution')}&nbsp;
            <TextField className="App-tf" label={t('width')} size='small' multiline={false} InputProps={inputProps}
              value={width.toString()}
              onChange={(ev)=>{setWidth(toInt(ev.target.value, 10))}}
            />×
            <TextField className="App-tf" label={t('height')} size='small' multiline={false} InputProps={inputProps}
              value={height.toString()} 
              onChange={(ev)=>{setHeight(toInt(ev.target.value, 10))}}
            />
            &nbsp;px
          </div>
        </td>
        <td className="tdl">
        <Button size="small" variant="contained" style={width===720&&height===480 ? silverButtonStyle : grayButtonStyle}
          onClick={()=>{setWidth(720); setHeight(480)}}>SD(4:3)</Button>&nbsp;
        <Button size="small" variant="contained" style={width===1280&&height===720 ? silverButtonStyle : grayButtonStyle}
          onClick={()=>{setWidth(1280); setHeight(720)}}>HD</Button>&nbsp;
        <Button size="small" variant="contained" style={width===1920&&height===1080 ? silverButtonStyle : grayButtonStyle}
          onClick={()=>{setWidth(1920); setHeight(1080)}}>Full HD</Button>
        </td>
      </tr>
      <tr>
        <td className="tdl">
          <div style={{display:'flex', alignItems:'center', margin:'0.2em 0.2em 0.2em 0.2em'}}>
            {t('fps')}&nbsp;
            <TextField className="App-tf" label={t('fps')} size='small' multiline={false} InputProps={inputProps}
              value={fps.toString()} 
              onChange={(ev)=>{setFps(toInt(ev.target.value, 10))}}
            />&nbsp;{t('fpsUnit')}</div>
        </td>
        <td className="tdl">
          <Button size="small" variant="contained" style={fps===5 ? silverButtonStyle : grayButtonStyle}
            onClick={()=>{setFps(5)}}>5</Button>&nbsp;
          <Button size="small" variant="contained" style={fps===15 ? silverButtonStyle : grayButtonStyle}
            onClick={()=>{setFps(15)}}>15</Button>&nbsp;
          <Button size="small" variant="contained" style={fps===30 ? silverButtonStyle : grayButtonStyle}
            onClick={()=>{setFps(30)}}>30</Button>
        </td>
      </tr>
      <tr><td className="tdl">
        {t('encode')}<TextField className="App-tf-long" label={t('videoBps')} size='small' multiline={false} InputProps={inputProps}
              value={bitrate.toString()} 
              onChange={(ev)=>{setBitrate(toInt(ev.target.value, 10))}}
        />kbps
      </td>
      <td className='tdl'>
        <Button size="small" variant="contained" style={hint==='motion' ? silverButtonStyle : grayButtonStyle}
            onClick={()=>{setHint('motion')}}>motion</Button>&nbsp;
        <Button size="small" variant="contained" style={hint==='detail' ? silverButtonStyle : grayButtonStyle}
            onClick={()=>{setHint('detail')}}>detail</Button>&nbsp;
        <Button size="small" variant="contained" style={hint==='text' ? silverButtonStyle : grayButtonStyle}
            onClick={()=>{setHint('text')}}>text</Button>        
      </td></tr>
      </tbody></table>
    </header>
    <article className="App-article">
      {previews}
    </article>
  </div>
}

export default App;
