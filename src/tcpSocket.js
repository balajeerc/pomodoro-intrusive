/*
 * Promise wrappers around 'net' module's socket
 */
import net from 'net';
import { eventChannel } from 'redux-saga';

export function connect(port, address, timeout) {
  return new Promise((resolve, reject) => {
    const connection = new net.Socket();
    connection.setTimeout(timeout);
    connection.on('connect', () => {
      resolve(connection);
    });
    connection.on('timeout', () => {
      reject(new Error('Connection timed out'));
    });
    connection.on('error', error => {
      reject(new Error(`Error when connecting: ${error}`));
    });
    connection.connect(port, address);
  });
}

export function createSocketChannel(connection) {
  return eventChannel(emit => {
    function onConnectionData(data) {
      emit({ message: data.toString() });
    }

    function onConnectionError(err) {
      throw new Error(`Error in handling connection: ${err}`);
    }

    function onConnClose() {}

    connection.on('end', onConnClose);
    connection.on('data', onConnectionData);
    connection.on('error', onConnectionError);

    // the subscriber must return an unsubscribe function
    // this will be invoked when the saga calls `channel.close` method
    const unsubscribe = () => {
      connection.end();
    };

    return unsubscribe;
  });
}

export function writeMessage(connection, message) {
  return new Promise((resolve, reject) => {
    connection.write(message, 'UTF-8', error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
