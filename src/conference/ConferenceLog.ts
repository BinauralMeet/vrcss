export const CONNECTIONLOG = false
export const TRACKLOG = false        // show add, remove... of tracks
export const EVENTLOG = false
export const SENDLOG = false

export const trackLog = TRACKLOG ? console.log : (_a:any) => {}
export const connLog = CONNECTIONLOG ? console.log : (_a:any) => {}
export const connDebug = CONNECTIONLOG ? console.debug : (_a:any) => {}
export const eventLog = EVENTLOG ? console.log : (_a:any) => {}
export const sendLog = SENDLOG ? console.log : (_a:any) => {}
