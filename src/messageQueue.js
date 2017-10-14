import MessageQueue from 'svmq';
import { eventChannel } from 'redux-saga';

export function createMessageQueue(messageQueueId) {
  return Promise.resolve(new MessageQueue(messageQueueId));
}

export function closeMessageQueue(messageQueue) {
  return new Promise((resolve, reject) => {
    messageQueue.close((err, closed) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(closed);
    });
  });
}

export function createMessageChannel(messageQueue) {
  return eventChannel(emit => {
    const messageHandler = data => {
      // puts event payload into the channel
      // this allows a Saga to take this payload
      // from the returned channel
      emit(data.toString());
    };

    // setup the subscription
    messageQueue.on('data', messageHandler);

    // the subscriber must return an unsubscribe function
    // this will be invoked when the saga calls `channel.close` method
    const unsubscribe = () => {
      messageQueue.on('data', () => {});
    };

    return unsubscribe;
  });
}

export function writeMessage(messageQueue, message) {
  return new Promise((resolve, reject) => {
    messageQueue.push(Buffer.from(message), err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
