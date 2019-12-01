'use strict';

const REDIRECT_URL = 'このページのURL';
const COGNITO_URL = 'https://[ドメイン名].auth.ap-northeast-1.amazoncognito.com';

//var vConsole = new VConsole();

var encoder = new TextEncoder('utf-8');
var decoder = new TextDecoder('utf-8');

var vue_options = {
  el: "#top",
  data: {
    progress_title: '',

  },
  computed: {},
  methods: {},
  created: function() {},
  mounted: function() {
    proc_load();

    if (searchs.code) {
      var state = JSON.parse(hex2str(searchs.state));
      console.log(state);
      var message = {
        code: searchs.code,
        state: state.state
      };
      if (state.origin) {
        console.log(state);
        window.opener.postMessage(message, state.origin);
      } else {
        window.opener.vue.do_token(message);
      }
      window.close();
    } else {
      var state = {
        origin: searchs.origin,
        state: searchs.state
      };
      auth_location(searchs.client_id, searchs.scope, str2hex(JSON.stringify(state)));
    }
  }
};
vue_add_methods(vue_options, methods_utils);
var vue = new Vue(vue_options);

function auth_location(client_id, scope, state) {
  var params = {
    client_id: client_id,
    redirect_uri: REDIRECT_URL,
    response_type: 'code',
    state: state,
    scope: scope
  };
  window.location = COGNITO_URL + "/login" + to_urlparam(params);
}


function str2hex(str) {
  return byteAry2hexStr(encoder.encode(str));
}

function hex2str(hex) {
  return decoder.decode(new Uint8Array(hexStr2byteAry(hex)));
}

function hexStr2byteAry(hexs, sep = '') {
  hexs = hexs.trim(hexs);
  if (sep == '') {
    var array = [];
    for (var i = 0; i < hexs.length / 2; i++)
      array[i] = parseInt(hexs.substr(i * 2, 2), 16);
    return array;
  } else {
    return hexs.split(sep).map((h) => {
      return parseInt(h, 16);
    });
  }
}

function byteAry2hexStr(bytes, sep = '', pref = '') {
  if (bytes instanceof ArrayBuffer)
    bytes = new Uint8Array(bytes);
  if (bytes instanceof Uint8Array)
    bytes = Array.from(bytes);

  return bytes.map((b) => {
      var s = b.toString(16);
      return pref + (b < 0x10 ? '0' + s : s);
    })
    .join(sep);
}

function to_urlparam(qs) {
  var params = new URLSearchParams();
  for (var key in qs)
    params.set(key, qs[key]);
  var param = params.toString();

  if (param == '')
    return '';
  else
    return '?' + param;
}
