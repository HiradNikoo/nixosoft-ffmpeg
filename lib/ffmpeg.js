const ffmpeg_path = process.env['ffmpeg_path'];
const spawn = require('child_process').spawn;
const stream = require('stream');
const core = require('./core');

const ffmpeg_exec = function(args){
    return new Promise(function(resolve, reject) {
        let ffmpeg = spawn(ffmpeg_path, args);
        let gotData = false;
        let isBinary = false;
        let binary = [];
        let outputStr  = '';
        ffmpeg.stdout.on('data', function(data){
            gotData = true;
            binary = binary.concat(data);
            if(!isBinary) isBinary = true;
        });
        ffmpeg.stderr.on('data', function(data){
            // Text info from ffmpeg is output to stderr
            outputStr += data.toString();
        });
        ffmpeg.stderr.on('end', function(){
            if(gotData) {
                if(isBinary) {
                    resolve(Buffer.concat(binary));
                } else {
                    resolve(outputStr);
                }
            } else {
                reject(outputStr);
            }
        });

    }) ;
}


module.exports.get16BitPCMData = function(filename, options){
    options = options || {};

    let sampleRate = options.sampleRate || 44100;
    let channels = options.stereo ? 2 : 1;

    return new Promise(function(resolve, reject) {
        let oddByte = null;
        let ffmpeg = ffmpeg_exec(['-i',filename,'-f','s16le','-ac', channels,
        '-acodec','pcm_s16le','-ar', sampleRate ,'-y','pipe:1']);

        ffmpeg.then(function(result){
            if(result.type == 'data') {
                let data = result.data;
                let value;
                let i = 0;
                let dataLen = data.length;
                
                // If there is a leftover byte from the previous block, combine it with the
                // first byte from this block
                if (oddByte !== null) {
                  value = ((data.readInt8(i++, true) << 8) | oddByte) / 32767.0;
                  resolve({
                    sample : value, 
                    channel : channel
                  });
                  channel = ++channel % 2;
                }
                
                for (; i < dataLen; i += 2) {
                  value = data.readInt16LE(i, true) / 32767.0;
                  resolve({
                    sample : value, 
                    channel : channel
                  });
                  channel = ++channel % 2;
                }
                
                oddByte = (i < dataLen) ? data.readUInt8(i, true) : null;
            }
        }).catch(reject);
    });
};

module.exports.get16BitPCMStream = function(filename, options){
    options = options || {};

    let sampleStream = new stream.Stream();
    sampleStream.readable = true;

    return new Promise(function(resolve, reject) {
        exports.get16BitPCMData(filename, options).then(function(result){
            sampleStream.emit('data', result.sample, channel);
        }).catch(function(err){
            sampleStream.emit('end', err, null);
        });
    });
};

//===================

module.exports.exec = ffmpeg_exec;
module.exports.getCodecs = function(){
    return new Promise(function(resolve, reject){
        ffmpeg_exec(['-codecs']).then(function(data){
            resolve(data.toString());
        }).catch(reject);
    });
};


module.exports.streamVideo = function(filename, options){
    options = core.extend({
        host:  '127.0.0.1',
        port : 23000,
        codec: 'h264'
    }, options);
    host = host || '127.0.0.1';
    port = port || 23000;
    return ffmpeg_exec(['-i', filename, '-v', '0', '-vcodec', 'h264', '-f', 'mpegts', 'udp://' + host + ':' + port]);
};