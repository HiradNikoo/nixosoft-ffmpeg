const ffmpeg_path = process.env['ffmpeg_path'];
const spawn = require('child_process').spawn;
const stream = require('stream');
const core = require('./core');

let params = function(){
    return Array.prototype.slice.call(arguments).join(' ').split(new RegExp(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g));
};

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

let getStringOutput = function(args){
    return new Promise(function(resolve, reject){
        ffmpeg_exec(args).then(function(data){
            resolve(data.toString());
        }).catch(reject);
    });
};

module.exports.getCodecs = function(){
    return getStringOutput(['-codecs']);
};

module.exports.getFormats = function(){
    return getStringOutput(['-formats']);
};

module.exports.streamVideo = function(filename, options){
    options = core.extend({
        host:  '127.0.0.1',
        port : 23000
    }, options);
    return ffmpeg_exec(['-i', filename, '-v', '0', '-c:v', 'h264', '-c:a', 'libvorbis', '-f', 'webm_chunk', 'udp://' + options.host + ':' + options.port]);
};


module.exports.streamToWebM = function(filename, options){
    options = core.extend({
        host:  '127.0.0.1',
        port : 23000,
        size: '640x480'
    }, options || {});

    let args = params(
        '-re -i "' + filename + '" -v 0',
        '-c:v libx264 -profile:v main -preset:v medium -r 30 -g 60 -keyint_min 60',
        '-sc_threshold 0 -b:v 2500k -maxrate 2500k -bufsize 2500k',
        '-filter:v scale="trunc(oha/2)2:720"',
        '-sws_flags lanczos+accurate_rnd',
        '-acodec libfdk_aac -b:a 96k -ar 48000 -ac 2',
        '-f flv udp://' + options.host + ':' + options.port
    );

    // '-i "' + filename + '"',
    // '-c:v libvpx-vp9',
    //     '-s 1280x720 -keyint_min 60 -g 60 ' + vp9_live_param,
    //     '-b:v 3000k',
    // '-f webm_chunk',
    //     '-header "' + __dirname + '\\..\\cache\\glass_360.hdr"',
    //     '-chunk_start_index 1',
    // '"' + __dirname + '\\..\\cache\\glass_360_%d.hdr"',
    // '-map 1:0',
    // '-c:a libvorbis',
    //     '-b:a 128k -ar 44100',
    // '-f webm_chunk',
    //     '-audio_chunk_duration 2000',
    //     '-header "' + __dirname + '\\..\\cache\\glass_171.hdr"',
    //     '-chunk_start_index 1',
    // '"' + __dirname + '\\..\\cache\\glass_171_%d.hdr"'


    return ffmpeg_exec(args);
};