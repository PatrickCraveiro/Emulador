export type Direction = 'up' | 'down' | 'left' | 'right'
export type FaceButton = 'a' | 'b' | 'x' | 'y'
export type SystemButton = 'start' | 'select' | 'home'
export type Action = Direction | FaceButton | SystemButton | 'pageUp' | 'pageDown' | 'first' | 'last'

export type PowerState = 'booting' | 'on' | 'shutting-down' | 'off'

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'error'
}
