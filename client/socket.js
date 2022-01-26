let socket = null;

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = Emitter.prototype.addEventListener = function (
  event,
  fn,
) {
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function (event, fn) {
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
  Emitter.prototype.removeListener =
  Emitter.prototype.removeAllListeners =
  Emitter.prototype.removeEventListener =
    function (event, fn) {
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function (event) {
  this._callbacks = this._callbacks || {};

  var args = new Array(arguments.length - 1),
    callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function (event) {
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function (event) {
  return !!this.listeners(event).length;
};

const PacketType = {
  CONNECT: 0,
  DISCONNECT: 1,
  EVENT: 2,
  ACK: 3,
  CONNECT_ERROR: 4,
};

const isInteger =
  Number.isInteger ||
  function (value) {
    return (
      typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value
    );
  };

const isString = function (value) {
  return typeof value === 'string';
};

const isObject = function (value) {
  return Object.prototype.toString.call(value) === '[object Object]';
};

function Encoder() {}

Encoder.prototype.encode = function (packet) {
  return [notepack.encode(packet)];
};

function Decoder() {}

Emitter(Decoder.prototype);

Decoder.prototype.add = function (obj) {
  const decoded = notepack.decode(obj);
  this.checkPacket(decoded);
  this.emit('decoded', decoded);
};

Decoder.prototype.destroy = function () {};

function isDataValid(decoded) {
  switch (decoded.type) {
    case PacketType.CONNECT:
      return decoded.data === undefined || isObject(decoded.data);
    case PacketType.DISCONNECT:
      return decoded.data === undefined;
    case PacketType.CONNECT_ERROR:
      return isString(decoded.data) || isObject(decoded.data);
    default:
      return Array.isArray(decoded.data);
  }
}

Decoder.prototype.checkPacket = function (decoded) {
  const isTypeValid =
    isInteger(decoded.type) &&
    decoded.type >= PacketType.CONNECT &&
    decoded.type <= PacketType.CONNECT_ERROR;
  if (!isTypeValid) {
    throw new Error('invalid packet type');
  }

  if (!isString(decoded.nsp)) {
    throw new Error('invalid namespace');
  }

  if (!isDataValid(decoded)) {
    throw new Error('invalid payload');
  }

  const isAckValid = decoded.id === undefined || isInteger(decoded.id);
  if (!isAckValid) {
    throw new Error('invalid packet id');
  }
};

function init(url, optionString) {
  const options = {
    ...{
      autoConnect: false,
      reconnection: false,
      // transports: ['websocket'],
      parser: {
        Decoder,
        Encoder,
      },
    },
    ...JSON.parse(optionString),
  };
  socket = new io(url, options);

  socket.on('connect', () => {
    console.log(socket);
  });
}

function connect() {
  socket.connect();
}

function disconnect() {
  return socket.disconnect();
}

function getSocketId() {
  return socket ? socket.id : '';
}

function cloneData(data) {
  return Array.isArray(data) ? [...data] : { ...data };
}

function send(event, data, callback, eventId) {
  const payload = JSON.parse(data);

  socket.emit(event, payload, (data) => {
    const clone = cloneData(data);

    console.log(`Incoming event: ${event}`);
    console.table(clone);

    if (callback) {
      callback(null, null, JSON.stringify(clone), eventId);
    }
  });
}

function on(event, callback, eventId) {
  return socket.on(event, (data) => {
    const clone = Array.isArray(data) ? [...data] : { ...data };

    callback(null, null, JSON.stringify(clone), eventId);
  });
}

function once(event, callback, eventId) {
  return socket.once(event, (data) => {
    /*const data = notepack.unpack(new Uint8Array(buffer));
    console.log(event, eventId);
    console.table(data);*/
    const clone = Array.isArray(data) ? [...data] : { ...data };

    callback(null, null, JSON.stringify(clone), eventId);
  });
}
