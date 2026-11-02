export type Direction = 'up' | 'down' | 'left' | 'right'
export type FaceButton = 'a' | 'b' | 'x' | 'y'
export type Action = Direction | FaceButton | 'pageUp' | 'pageDown' | 'home' | 'end'

export type PowerState = 'on' | 'shutting-down' | 'off'

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'error'
}
