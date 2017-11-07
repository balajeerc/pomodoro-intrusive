/*
 * Reducer managing state changes for pomodoro-screenlock's process
 */

import { REGISTER_MAIN_WINDOW } from './constants';

function reducer(store = {}, action) {
  if (!action) {
    return store;
  }
  switch (action.type) {
    case REGISTER_MAIN_WINDOW:
      return Object.assign({}, store, { mainWindow: action.mainWindow });
    default:
      return store;
  }
}

export default reducer;
