export type Events = 'onPhoneCode' | 'onPassword';

export const EventEmitter = {
  _events: {} as { [key: string]: Array<Function> },
  dispatch(event: Events, data: any) {
    if (!this._events[event]) return;
    this._events[event].forEach((callback) => callback(data));
  },
  subscribe(event: Events, callback: (data: any) => any) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
  },
  unsubscribe(event: Events) {
    if (!this._events[event]) return;
    delete this._events[event];
  },
};

export function promiseFromEvent(eventName: Events) {
  const promise = new Promise<string>((resolve) => {
    EventEmitter.subscribe(eventName, async (value) => {
      resolve(value);
    });
  }).finally(() => {
    EventEmitter.unsubscribe(eventName);
  });
  return promise;
}
