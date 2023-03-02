import { Producer } from "mediasoup-client/lib/Producer"
import { MSTrack } from "./RtcConnection"
import { RtcTransports } from "./RtcTransports"

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
    console.log(`connecting as ${this.rtc.peer}`)
    this.rtc.connect(room, peer).then(()=>{
      console.log(`connected as ${this.rtc.peer}`)
    })
  }
  public streamingStart(id:string, stream: MediaStream){
    const promise = new Promise<void>((resolve, reject)=>{
      const tracks = stream.getTracks()
      console.log(`streaming for ${tracks.length} tracks.`)
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
        this.rtc.prepareSendTransport(msTrack).then(producer=>{
          streaming.producers.push(producer)
          remain--
          if (remain === 0){
            this.rtc.streamingStart(id, streaming.producers)
            console.log(`streaming started.`)
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
}

export const conference = new Conference()
d.conference = conference
