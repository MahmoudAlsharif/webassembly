var i_width = 0;
var audio_files_names;
var width = 0;
var a_width = 0;
var i_width = 0;
var audio_objects;
var timestamp = 0;
var a_worker;
var filesElement;
var aud_running = false;
var isAudioWorkerLoaded=false;
var image_objects = new Array();
var image_files_names

var isSupported = (function () {
    return document.querySelector && window.URL && window.Worker;
})();

//Audio Web Worker is initialied as soon as the page is loaded
document.addEventListener("DOMContentLoaded", function () {
    initAudWorker(); 
    filesElement_audio_results = document.querySelector("#audio_results");
    filesElement_audio = document.querySelector("#audio_files");
});

function startAudRunning() {
    filesElement_audio.innerHTML = "";
    filesElement_audio_results.innerHTML = "";
    aud_running = true;
}
function stopAudRunning() {
    aud_running = false;
}

//This function is called when the user attempts to select a file. After checking the file 
//extension, the audio file is displayed in both the video and the audio tab.
function getAllAudios() {
    if (document.getElementById("audio-to-upload").value != "") {
      // A file has been selected
      deleteAudio(); // Replace current audio file
        if (checkAudioExtension() == 1) {
            // We have a valid audio file
            var files = document.getElementById("audio-to-upload").files;

            audio_objects = new Array(files.length);
            //audio_objects will contain the raw file data
            audio_files_names = new Array(files.length);
            var reader;

            for (i = 0; i < files.length; i++) {
                (function (file) {
                    if (i < 10) {
                        idx = '00' + String(i);
                    } else if (i < 100) {
                        idx = '0' + String(i);
                    } else {
                        idx = String(i);
                    }
                    var name = 'audio-' + idx + "." + file.name.split('.').pop();
                    //A name has been assigned to the selected audio file. It is saved in
                    //the audio_files_names array.
                    audio_files_names[i] = name;

                    reader = new FileReader();
                    reader.onload = function (e) {
                    var data = e.target.result;
                    var array = new Int8Array(data);

                    var file_obj = { "name": name, "data": array }
                    audio_objects.push(file_obj);
                    //audio_objects now contains the data. displayAudio is called, and the audio is
                    //visually shown as an audio player in the audio tab.
                    //console.log("id " + id)
                    // document.getElementById("audio_to_display").appendChild(displayAudio(data));
                    document.getElementById("audio2_to_display").appendChild(displayAudio(data));

                        if (files.length == 1) {
                            document.getElementById(id).addEventListener('loadedmetadata', function (e) {
                                videoWidth = document.getElementById(id).videoWidth;
                                videoHeight = document.getElementById(id).videoHeight;
                                //console.log("width " + videoWidth + "Height " + videoHeight);
                            })
                        }
                    }
                    reader.readAsArrayBuffer(file);
                })(files[i]);
            }
        }
    }
  }
  
  //This function is analogous to getAllAudios(), except that it processes an image file
  function getAllImagesForAudio() {
    if (document.getElementById("bground-to-upload").value != "") {
      // A file has been selected
        if (checkImageExtension() == 1) {
            // We have a valid image file
            var files = document.getElementById("bground-to-upload").files;
            //console.log("File length: " + files.length)
            image_objects = new Array(files.length);
            image_files_names = new Array(files.length);
            var reader;

            for (i = 0; i < files.length; i++) {
                (function (file) {
                    if (i < 10) {
                        idx = '00' + String(i);
                    } else if (i < 100) {
                        idx = '0' + String(i);
                    } else {
                        idx = String(i);
                    }
                    var name = 'image-' + idx + "." + file.name.split('.').pop();
                    image_files_names[i] = name;

                    reader = new FileReader();
                    reader.onload = function (e) {

                        var data = e.target.result;

                        var array = new Int8Array(data);

                        var file_obj = { "name": name, "data": array }
                        image_objects.push(file_obj);
                    }
                    reader.readAsArrayBuffer(file);
                })(files[i]);

            }
        }
    }
  }


function initAudWorker() {
    a_worker = new Worker("audio-worker-asm.js");
    a_worker.onmessage = function (event) {
        var message = event.data;
        if (message.type == "ready") {
            isAudioWorkerLoaded = true;
            a_worker.postMessage({
                type: "command",
                arguments: ["-help"]
            });
        }
        else if (message.type == "stdout") {
            console.log(message.data);
            if (!message.data.includes("Finished processing")) {
                document.getElementById("a_proc").innerHTML = "Processing...";
                a_width++;
                 if (width >= 90) width = 80;
                a_move(width % 100);
            }
            else { 
                a_move(100);
                finish = Date.now() - start;

                document.getElementById("a_proc").innerHTML = "Finished in " + finish / 1000 + " seconds \n"; }
        } else if (message.type == "start") {
            //console.log("Worker has received command\n");
        }

        else if (message.type == "done") {
            stopAudRunning();
            disableAllAudio();
            var buffers = message.data;
            if (buffers.length) {
                //console.log("closed");
            }
            buffers.forEach(function (file) {
                var node;
                if (getAudio(file.data, file.name) != null) {
                    node = filesElement_audio_results.appendChild(getVideo(file.data, file.name));
                    filesElement_audio_results.insertBefore(document.createElement('br'), node);
                    filesElement_audio_results.insertBefore(document.createElement('br'), node);
                }
                else node = null
                filesElement_audio_results.insertBefore(getDownloadLink(file.data, file.name), node);
            });
        }
    };
}

//Disables all audio buttons while an audio command is being processed
function disableAllAudio(){
    if (aud_running == true) {
        document.getElementById("getAudio").setAttribute("disabled", "disabled");
        document.getElementById("addAudio").setAttribute("disabled", "disabled");
        document.getElementById("audio2Vid").setAttribute("disabled", "disabled");
        document.getElementById("removeAudio").setAttribute("disabled", "disabled");
        document.getElementById("replaceAudio").setAttribute("disabled", "disabled");
        document.getElementById("fadeaudio").setAttribute("disabled", "disabled");
    }else{
        document.getElementById("getAudio").removeAttribute("disabled");
        document.getElementById("addAudio").removeAttribute("disabled");
        document.getElementById("audio2Vid").removeAttribute("disabled");
        document.getElementById("removeAudio").removeAttribute("disabled");
        document.getElementById("replaceAudio").removeAttribute("disabled");
        document.getElementById("fadeaudio").removeAttribute("disabled");
    }
}
function a_move(width) {

    var elem = document.getElementById("a_myBar");
    elem.style.width = width + '%';
}

function isReadyAudio() {
    return !aud_running && isAudioWorkerLoaded;
}

function runCommand_audio(text) {
    if (isReadyAudio()) {
        start = Date.now();
        startAudRunning();
        disableAllAudio();
        var args = parseArguments(text);
        //console.log(args);
        a_worker.postMessage({
            type: "command",
            arguments: args,
            files: audio_objects
        });
    }
}

/*
The next two functions are called when the user attempts to delete their uploaded audio
or image files by pressing the respective button.
*/

document.querySelector("#remove_audio").addEventListener('click', function (e) {
    deleteAudio();
    audio_objects = null;
    document.getElementById('audio-to-upload').value = "";
})

document.querySelector("#remove_bground").addEventListener('click', function (e) {
image_objects = null;
document.getElementById('bground-to-upload').value = "";
})

/*
The following functions all operate in the same way: Whenever a user presses one of the
function buttons, the respective function will first check if the input files meet its
requirements. Because some of these functions require input from the video tab, 
the audio and video objects are merged in a single array (this is later undone). Finally,
the arguments are passed to ffmpeg through the respective command.
*/

document.querySelector("#replaceAudio").addEventListener('click', function (e) {
    if(audio_objects != null) audio_objects = audio_objects.filter(x => (!video_objects.includes(x) && !image_objects.includes(x)));
    if (audio_objects != null || video_objects != null) {
        audio_objects = audio_objects.concat(video_objects);
        document.getElementById('a_bar').style.display = 'block';
        document.getElementById('a_myBar').style.width = 0;
        if (/Edge/.test(navigator.userAgent))  runCommand_audio(" -i " + files_names[0] + " -i " + audio_files_names[0] + " -c copy -map 0:v -map 1:a output.mkv");
        if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_audio(" -i " + files_names[0] + " -i " + audio_files_names[0] + " -map 0:v -map 1:a -c:v mpeg4 -c:a aac output.mp4");
        else runCommand_audio(" -i " + files_names[0] + " -i " + audio_files_names[0] + " -map 0:v -map 1:a -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    }else{
        alert("Please choose valid audio and video files first");
    }
})

document.querySelector("#addAudio").addEventListener('click', function (e) {
    if(audio_objects != null) audio_objects = audio_objects.filter(x => (!video_objects.includes(x) && !image_objects.includes(x)));
    if (audio_objects != null || video_objects != null) {
        audio_objects = audio_objects.concat(video_objects);
        document.getElementById('a_bar').style.display = 'block';
        document.getElementById('a_myBar').style.width = 0;
        if (/Edge/.test(navigator.userAgent)) runCommand_audio(" -i " + files_names[0] + " -i " + audio_files_names[0] + " -filter_complex \"[0:a][1:a]amix=duration=shortest[a]\" -map 0:v -map \"[a]\" -c:v copy output.mkv");
        if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_audio(" -i " + files_names[0] + " -i " + audio_files_names[0] + " -filter_complex \"[0:a][1:a]amix=duration=shortest[a]\" -map 0:v -map \"[a]\" -c:v mpeg4 -c:a aac output.mp4");
        else runCommand_audio(" -i " + files_names[0] + " -i " + audio_files_names[0] + " -filter_complex \"[0:a][1:a]amix=duration=shortest[a]\" -map 0:v -map \"[a]\" -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    }else{
        alert("Please choose valid audio and video files first");
    }
})

document.querySelector("#removeAudio").addEventListener('click', function (e) {
    if(audio_objects != null) audio_objects = audio_objects.filter(x => (!video_objects.includes(x) && !image_objects.includes(x)));
    if (video_objects != null || chosen_files.files.length == 1)
     {
        if(audio_objects == undefined) audio_objects = [];
        audio_objects = audio_objects.concat(video_objects);
        document.getElementById('a_bar').style.display = 'block';
        document.getElementById('a_myBar').style.width = 0;
        /*if (!/Chrome/.test(navigator.userAgent) && /Safari/.test(nagivator.userAgent)) runCommand_audio(" -i " + files_names[0] + "-c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
        else*/ runCommand_audio(" -i " + files_names[0] + " -c copy -an nosound.mp4");
    }else{
        alert("Please choose a valid audio file first");
    }
})

document.querySelector("#audio2Vid").addEventListener('click', function (e) {
    if(audio_objects != null && video_objects != null) audio_objects = audio_objects.filter(x => (!video_objects.includes(x) && !image_objects.includes(x)));
    if (audio_objects != null && image_objects.length > 0) {
        audio_objects = audio_objects.concat(image_objects);
        document.getElementById('a_bar').style.display = 'block';
        document.getElementById('a_myBar').style.width = 0;
        runCommand_audio(" -loop 1 -i " + image_files_names[0] + " -i " + audio_files_names[0] + " -shortest -r 1 -acodec copy output.avi");
    }else{
        alert("Please choose valid audio and image files first");
    }
});

document.querySelector("#getAudio").addEventListener("click", function () {
    if(audio_objects != null) audio_objects = audio_objects.filter(x => (!video_objects.includes(x) && !image_objects.includes(x)));
    if (video_objects != null || chosen_files.files.length == 1) {
        if(audio_objects == undefined) audio_objects = [];
        audio_objects = audio_objects.concat(video_objects);
        document.getElementById('a_bar').style.display = 'block';
        document.getElementById('a_myBar').style.width = 0;
        /*if (!/Chrome/.test(navigator.userAgent) && /Safari/.test(nagivator.userAgent)) runCommand_audio(" -i " + files_names[0] + " -vn -sn -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
        else*/ runCommand_audio(" -i " + files_names[0] + " -vn -sn -acodec copy audio.mp4");
    }
    else alert("Please choose a video first");
});

document.querySelector("#fadeaudio").addEventListener("click", function () {
    if(audio_objects != null && video_objects != null) audio_objects = audio_objects.filter(x => (!video_objects.includes(x) && !image_objects.includes(x)));
    if (audio_objects != null && audio_objects.length > 1) {
        document.getElementById('a_bar').style.display = 'block';
        document.getElementById('a_myBar').style.width = 0;
        //runCommand_audio(" -i " + files_names[0] + " -strict -2 -af afade=t=in:st=0:d=3 audio.mp4");
        runCommand_audio(" -i " + audio_files_names[0] + " -i " + audio_files_names[1] + " -filter_complex acrossfade=d=10:o=0:c1=exp:c2=exp audio.mp4");
    }
    else alert("Please choose two audios first!");
});

//Checks if the file uploaded is a valid audio file
function checkAudioExtension() {
    var files = document.getElementById("audio-to-upload").files;
    for (var i = 0; i < files.length; i++) {

        if (!files[i].name.match(/\.mp3|\.wav|\.aac|\.flac|\.mp4/)) {
            document.getElementById("audio-to-upload").files = null;
            alert("Please choose a valid audio file. Accepted formats are .mp3, .mp4, .wav, .aac and .flac.")
            return 0;
        }
    }
    return 1;
}

//Checks if the file uploaded is a valid image file
function checkImageExtension() {
    var files = document.getElementById("bground-to-upload").files;
    for (var i = 0; i < files.length; i++) {

        if (!files[i].name.match(/\.jpg|\.jpeg|\.gif|\.bmp|\.tiff/)) {
            document.getElementById("audio-to-upload").files = null;
            alert("Please choose a valid image file. Accepted formats are .jpg/.jpeg, .gif, .bmp and .tiff.")
            return 0;
        }
    }
    return 1;
}

function displayAudio(fileData) {
    var blob = new Blob([fileData], {type: 'audio/mp3'});
    var src = window.URL.createObjectURL(blob);
    var aud = document.createElement('audio');
    aud.src = src;
    id = id + 1;
    aud.id = id;
    aud.controls = 'controls';
    aud.load();
    return aud;
}    

function deleteAudio() {
    var f = document.querySelector("#audio2_to_display");
    child = f.lastElementChild
    while (child) {
        f.src = null;

        f.removeChild(child);
        child = f.lastElementChild;
    }
}

function getAudio(fileData, fileName) {
    if (fileName.match(/\.mp3|\.wav|\.aac|\.flac|\.mp4|\.webm|\.ogg|\.mov|\.mkv|\.flv/)) {
        var blob = new Blob([fileData], {type: 'audio/mp3'});
        var src = window.URL.createObjectURL(blob);
        var video = document.createElement('video');
        video.src = src;
        video.load();
        video.muted = true;
        video.controls = 'controls';
        return video;
    }
    else return
}

function deleteResultsAudio() {
    var e = document.querySelector("#audio_results");

    //e.firstElementChild can be used. 
    var child = e.lastElementChild;
    if (child != null) {
        document.getElementById('a_bar').style.display = 'none';
        document.getElementById('a_myBar').style.width = 0;
        width = 0;
        while (child) {
            e.removeChild(child);
            child = e.lastElementChild;
        }
    }
}
