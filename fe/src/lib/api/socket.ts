import SERVER_URL from ".";

let connection = null as WebSocket | null;
const messageHandlers = {} as {[type: string]: ((_: any) => void)[]};

export const establishSocketConnnection = () => {
  connection = new WebSocket(`ws://${SERVER_URL}/socket`);
  connection.addEventListener("message", (event) => {
    const handlers = messageHandlers[event.data["type"]];
    for(let handler of handlers) {
      handler(event.data);
    }
  });
  return connection;
};

export const destroySocketConnection = () => {
  connection = null;
  for(let type of Object.keys(messageHandlers)) {
    delete messageHandlers[type];
  }
};

export const addSocketMessageHandler = (type: string, handler: (_: any) => void) => {
  if(!(type in messageHandlers)) messageHandlers[type] = [];
  messageHandlers[type].push(handler);
};

export const sendData = (data: any) => {
  if(connection) connection.send(JSON.stringify(data));
}

