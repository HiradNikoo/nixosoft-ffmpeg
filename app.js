process.env['ffmpeg_path'] = process.env['ffmpeg_path'] || 'E:\\Hirad\\API And Components\\FFMpeg\\ffmpeg-79465_x64\\ffmpeg\\bin\\ffmpeg.exe';

const ffmpeg = require('./lib/ffmpeg');

// ffmpeg.streamVideo('D:\\Video\\Politics\\Iranian Foreign Minister in Conversation with Charlie Rose.mp4').catch(function(err){
//     console.log(err);
// });

// ffmpeg.getCodecs().then(function(data){
//     console.log(data);
// });

// ffmpeg.getFormats().then(function(data){
//     console.log(data);
// });

ffmpeg.streamToWebM('E:\\CAMERA\\All\\MVI_3344.MOV').then(function(data){
    console.log(data);
}).catch(function(err){
    console.log(err);
});

