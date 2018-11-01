window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var buf;

// Audio 用の buffer を読み込む
var getAudioBuffer = function(url, fn) {
    var req = new XMLHttpRequest();
    // array buffer を指定
    req.responseType = 'arraybuffer';

    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 0 || req.status === 200) {
                // array buffer を audio buffer に変換
                buf = context.decodeAudioData(req.response);/*, function(buffer) {
                    // コールバックを実行
                    callback = fn(buffer);
                });*/
            }
        }
    };

    req.open('GET', url, true);
    req.send('');
};

// サウンドを再生
var playSound = function(buffer) {
    // source を作成
    var source = context.createBufferSource();
    // buffer をセット
    source.buffer = buffer;
    // context に connect
    source.connect(context.destination);
    // 再生
    source.start(0);
};

// var stopSound = function() {
//     context.close();
// };

// main
// window.onload = function() {
//     // サウンドを読み込む
//     getAudioBuffer('se.mp3', function(buffer) {
//         // 読み込み完了後にボタンにクリックイベントを登録
//         var btn = document.getElementById('btn');
//         btn.onclick = function() {
//             // サウンドを再生
//             playSound(buffer);
//         };
//         var stop = document.getElementById('stop');
//         stop.onclick = function() {
//             stopSound();
//         }
//     });
// };
window.onload = function() {
    getAudioBuffer('sound.mp3');

    var btn = document.getElementById('btn');
    btn.onclick = function () {
        // サウンドを再生
        playSound(buf.success);
    };
};