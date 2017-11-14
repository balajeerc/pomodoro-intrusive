/*
 * Saga wrappers around 'net' module's server
 */
import net from 'net';
import { eventChannel } from 'redux-saga';

export function createServer(port) {
  return Promise.resolve({
    listener: net.createServer(),
    port,
    connections: {},
  });
}

export function stopServer(serverObject) {
  return new Promise((resolve, reject) => {
    serverObject.listener.close(err => {
      if (err) {
        reject(new Error(err));
        return;
      }
      resolve();
    });
  });
}

export function createListeningChannel(serverObject) {
  const server = serverObject.listener;
  return eventChannel(emit => {
    function handleConnection(connection) {
      const remoteId = `${connection.remoteAddress}:${connection.remotePort}`;
      connection.setEncoding('utf8');

      function onConnectionData(data) {
        emit({ sender: remoteId, message: data });
      }

      function onConnClose() {
        delete serverObject.connections[remoteId]; // eslint-disable-line no-param-reassign
      }

      function onConnectionError(err) {
        // throw new Error(`Error in handling connection: ${err}`);
        onConnClose(err);
      }

      connection.once('close', onConnClose);
      connection.on('data', onConnectionData);
      connection.on('error', onConnectionError);

      serverObject.connections[remoteId] = connection; // eslint-disable-line no-param-reassign
    }

    server.on('connection', handleConnection);
    server.listen(serverObject.port);

    // the subscriber must return an unsubscribe function
    // this will be invoked when the saga calls `channel.close` method
    const unsubscribe = () => {
      Object.keys(serverObject.connections).map(connectionId => {
        serverObject.connections[connectionId].on('data', () => {});
        return null;
      });
    };

    return unsubscribe;
  });
}

export function writeMessage(serverObject, message, targetId) {
  const destConnections = (() => {
    if (targetId && targetId in serverObject.connections) {
      return [serverObject.connections[targetId]];
    }
    return Object.keys(serverObject.connections).map(key => serverObject.connections[key]);
  })();
  const writes = destConnections.map(
    connection =>
      new Promise((resolve, reject) => {
        connection.write(message, err => {
          if (err) {
            reject(new Error(err));
            return;
          }
          resolve();
        });
      }),
  );
  return Promise.all[writes];
}
