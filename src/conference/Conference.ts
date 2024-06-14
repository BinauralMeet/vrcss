import { Producer } from "mediasoup-client/lib/Producer"
import { MSTrack } from "./RtcConnection"
import { RtcTransports } from "./RtcTransports"
import { RtpCodecCapability } from "mediasoup-client/lib/RtpParameters"
import { fixIdString } from "@models/utils"

declare const d:any          //  from index.html

export interface Streaming{
  id: string,
  producers:Producer[],
  tracks:MSTrack[]
}

class Conference{
  streamings:Streaming[] = []
  //  rtc (mediasoup) related
  private rtcTransports_ = new RtcTransports()
  public get rtcTransports(){ return this.rtcTransports_ }
  private createRandomString(len: number){
    const S="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array.from(crypto.getRandomValues(new Uint32Array(len))).map((n)=>S[n%S.length]).join('')    
  }
  private streamIdCount = 0
  public createStreamId(){
    this.streamIdCount++
    return `${this.rtcTransports.peer}_${this.streamIdCount.toString()}`
  }
  public preEnter(room: string){
    return this.rtcTransports.preConnect(fixIdString(room))
  }
  public connectForStreaming(){
    const room = this.createRandomString(12)
    const peer = this.createRandomString(8)
    console.log(`Connecting to main server ....`)
    this.preEnter(room).then((bLogin)=>{
      if (bLogin){
        console.warn(`Login required for room ${room}`)
      }else{
        this.rtcTransports.connect(room, peer).then((peer)=>{
          console.log(`Connected peer:${peer}`)
        })
      }
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
          peer: this.rtcTransports.peer,
          role: id
        }
        streaming.tracks.push(msTrack)
        let codec: RtpCodecCapability|undefined = undefined
        if (track.kind === 'video'){
          codec = this.rtcTransports.device?.rtpCapabilities.codecs?.find(
            c => c.mimeType === 'video/H264' && c.parameters['profile-level-id'] === '4d001f')
        }
        //  console.log(`codecAll:${JSON.stringify(this.rtcTransports.device?.rtpCapabilities.codecs)}`)
        //  console.log(`codec:${JSON.stringify(codec)}`)
        this.rtcTransports.prepareSendTransport(msTrack, maxBitRate, codec).then(producer=>{
          streaming.producers.push(producer)
          remain--
          if (remain === 0){
            this.rtcTransports.streamingStart(id, streaming.producers)
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
    this.rtcTransports.streamingStop(id)
    this.streamings = this.streamings.filter(s => s.id !== id)
    this.rtcTransports.RemoveTrackByRole(true, id)
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
