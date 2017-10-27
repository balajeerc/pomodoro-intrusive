import moment from 'moment';

import { WAIT_ON_WORK, WAIT_ON_BREAK, START_ACTIVITY_CHECK } from '../pomodoroStates';

function reducer(store = {}, action) {
  if (!action) {
    return { pomodoroMode: { current: 'UNINITIALIZED', since: moment() } };
  }

  switch (action.type) {
    case WAIT_ON_WORK:
    case WAIT_ON_BREAK:
    case START_ACTIVITY_CHECK:
      return Object.assign({}, store, { pomodoroMode: { current: action.type, since: moment() } });
    default:
      return store;
  }
}

export default reducer;
