
// Gets the users camera and returns the media stream
export async function getDisplayMedia(fps:number, w:number, h:number){
  const constrants = Object.freeze({
    audio:{
      channelCount:{
        ideal: 2
      },
      echoCancellation: false
    },
    video: {
    width: w ? {max: w} : undefined,
    height: h ? {max: h} : undefined,
    frameRate: fps ? {ideal: fps}: undefined,
    }
  });
  return await navigator.mediaDevices.getDisplayMedia(constrants);
};
