process.env['ffmpeg_path'] = process.env['ffmpeg_path'] || 'E:\\Hirad\\API And Components\\FFMpeg\\ffmpeg-79465_x64\\ffmpeg\\bin\\ffmpeg.exe';

const ffmpeg = require('./lib/ffmpeg');


// ffmpeg.streamVideo('D:\\Video\\Politics\\Iranian Foreign Minister in Conversation with Charlie Rose.mp4').catch(function(err){
//     console.log(err);
// });

ffmpeg.getCodecs().then(function(data){
    console.log(data);
});