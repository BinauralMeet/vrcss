import { Producer } from "mediasoup-client/lib/Producer"
import { MSTrack } from "./RtcConnection"
import { RtcTransports } from "./RtcTransports"
import { RtpCodecCapability } from "mediasoup-client/lib/RtpParameters"

declare const d:any          //  from index.html

export interface Streaming{
  id: string,
  producers:Producer[],
  tracks:MSTrack[]
}

class Conference{
  streamings:Streaming[] = []
  private rtc = new RtcTransports()
  private createRandomString(len: number){
    const S="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array.from(crypto.getRandomValues(new Uint32Array(len))).map((n)=>S[n%S.length]).join('')    
  }
  private streamIdCount = 0
  public createStreamId(){
    this.streamIdCount++
    return `${this.rtc.peer}_${this.streamIdCount.toString()}`
  }
  public connect(){
    const room = this.createRandomString(12)
    const peer = this.createRandomString(8)
    console.log(`Connecting to main server ....`)
    this.rtc.connect(room, peer).then(()=>{
      console.log(`Connected as ${this.rtc.peer}`)
    })
  }
  public streamingStart(id:string, stream: MediaStream, maxBitRate:number){
    const promise = new Promise<void>((resolve, reject)=>{
      const tracks = stream.getTracks()
      console.debug(`Streaming starts for ${tracks.length} tracks.`)
      const streaming: Streaming = {
        id,
        producers:[],
        tracks:[]
      }
      this.streamings.push(streaming)
      let remain = tracks.length
      tracks.forEach(track =>{
        const msTrack:MSTrack = {
          track,
          peer: this.rtc.peer,
          role: id
        }
        streaming.tracks.push(msTrack)
        let codec: RtpCodecCapability|undefined = undefined
        if (track.kind === 'video'){
          codec = this.rtc.device?.rtpCapabilities.codecs?.find(
            c => c.mimeType === 'video/H264' && c.parameters['profile-level-id'] === '42e01f')
        }
        this.rtc.prepareSendTransport(msTrack, maxBitRate, codec).then(producer=>{
          streaming.producers.push(producer)
          remain--
          if (remain === 0){
            this.rtc.streamingStart(id, streaming.producers)
            resolve()
          }
        }).catch(reject)
      }) 
    })
    return promise
  }
  public streamingStop(id: string){
    const streaming = this.streamings.find(s => s.id === id)
    if (!streaming){
      console.warn(`streamingStop(): streaming id='${id}' not found.`)
      return false
    }
    this.rtc.streamingStop(id)
    this.streamings = this.streamings.filter(s => s.id !== id)
    this.rtc.RemoveTrackByRole(true, id)
    return true
  }
  public applyConstrants(id: string, width:number, height:number, fps:number, hint:string, bitrate: number){
    const streaming = this.streamings.find(s => s.id === id)
    if (!streaming){
      console.warn(`streamingStop(): streaming id='${id}' not found.`)
      return false
    }
    const videoIndex = streaming.tracks.findIndex(t => t.track.kind === 'video')
    if (videoIndex === -1) return false
    const video = streaming.tracks[videoIndex]
    video.track.applyConstraints({
      width: width ? {ideal: width} : undefined,
      height: height ? {ideal: height} : undefined,
      frameRate: fps ? {ideal: fps}: undefined,
    })
    video.track.contentHint = hint
    const producer = streaming.producers[videoIndex]
    const params:RTCRtpEncodingParameters ={
      maxBitrate:bitrate
    }
    producer.setRtpEncodingParameters(params)
    return true
  }
}

export const conference = new Conference()
d.conference = conference
