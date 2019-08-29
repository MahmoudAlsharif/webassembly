var video_objects;
var name_num = -1;
var v = 0;
var results_objects = [];
var video_name;
var chosen_files;
var v_width = 0;
var videoWidth;
var videoHeight;
var video_data;
var videosElement = document.getElementById("videos_to_display");
var video_convert;
var vid_running = false;
var isVideoWorkerLoaded = false;
var id = 0;
var start;
var finish;
var result_files_names;
var files_names;
var timestamp = 0;
var v_worker;
var filesElement_video;
var isVideoWorkerLoaded = false;
var isWorkerLoaded = false;
var isImageWorkerLoaded = false;
var isAudioWorkerLoaded = false;

var isSupported = (function () {
    return document.querySelector && window.URL && window.Worker;
})();

function isReadyVideo() {
    //console.log("worker " + isWorkerLoaded + " video worker " + isVideoWorkerLoaded + " image worker " + isImageWorkerLoaded + " isVidRunning " + vid_running)
    return !vid_running && isVideoWorkerLoaded;
}

function startVidRunning() {

    filesElement_video.innerHTML = "";

    vid_running = true;
}

function stopVidRunning() {
    vid_running = false;
}

document.querySelector("#remove_video").addEventListener('click', function (e) {

    id = 0;
    deleteVideos();
    video_objects = null;
    if(!vid_running){
    document.getElementById('v_bar').style.display = 'none';
    document.getElementById('v_myBar').style.width = 0;
    width = 0;}
    document.getElementById('videos-to-upload').value = "";
    document.getElementById('video_crop').style.display = 'none';
    document.getElementById('video_split').style.display = 'none';
    document.getElementById('video_convert').style.display='none'
})

function checkvideoExtension() {
    var files = document.getElementById("videos-to-upload").files;
    for (var i = 0; i < files.length; i++) {

        if (!files[i].name.match(/\.mp4|\.webm|\.ogg|\.mov|\.mkv|\.flv|\.MP4|\.MOV|\.WEBM|\.OOG|\.MKV|\.FLV/)) {
            document.getElementById("videos-to-upload").files = null;
            alert("Please choose a valid video file. Accepted formats are .mp4, .webm, .ogg, .mov, .mkv, and .flv.")
            return 0;
        }

    }
    return 1;
}

function displayVideo(fileData) {
    var blob = new Blob([fileData], {type: 'video/mp4'});
    var src = window.URL.createObjectURL(blob);
    var vid = document.createElement('video');
    vid.src = src;
    id = id + 1;
    vid.id = id;
    vid.controls = 'controls';
    if (document.getElementById('videos-to-upload').files.length != 1) {

        vid.width = 300;
        vid.height = 300;
    }

    vid.load();

    videoHeight = vid.height;
    videoWidth = vid.width;
    return vid;
}

function getVideo(fileData, fileName) {
    if (fileName.match(/\.mp4|\.webm|\.ogg|\.mov|\.mkv|\.flv|\.MP4|\.MOV|\.WEBM|\.OOG|\.MKV|\.FLV/)) {
        var blob = new Blob([fileData], {type: 'video/mp4'});
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

function getDownloadLink(fileData, fileName) {
    if (fileName.match(/\.jpeg|\.gif|\.jpg|\.png/)) {
        var blob = new Blob([fileData]);
        var src = window.URL.createObjectURL(blob);
        var img = document.createElement('img');
        img.src = src;
        return img;
    }
    else {
        var a = document.createElement('a');

        var blob = new Blob([fileData], {type: 'video/mp4'});
        var src = window.URL.createObjectURL(blob);
        a.href = src;
        a.download = fileName;
        a.textContent = 'Click here to download  ' + fileName;
        a.style.verticalAlign = 'top';
        return a;
    }
}

function initVideoWorker() {
    v_worker = new Worker("worker-asm.js");
    v_worker.onmessage = function (event) {
        var message = event.data;
        if (message.type == "ready") {
            
            isVideoWorkerLoaded = true;
            document.getElementById("image-loader").style.display='none';
            document.getElementById("wait").style.display='none';
           document.getElementById("wait-string").style.display='none';
            v_worker.postMessage({
                type: "command",
                arguments: ["-version"]
            });
        }
        else if (message.type == "stdout") {
            //console.log(message.data)
            if (!message.data.includes("Finished processing")) {
                document.getElementById("v_proc").innerHTML = "Processing...";
                v_width++;
                if (v_width >= 90) v_width = 70;
                v_move(v_width % 100);
            }
            else {
                v_move(100);
                finish = Date.now() - start;

                document.getElementById("v_proc").innerHTML = "Finished in " + finish / 1000 + " seconds \n";
            }
        } else if (message.type == "start") {
            //console.log("Worker has received command\n")
        }

        else if (message.type == "done") {
            stopVidRunning();
            disableAll();
            var buffers = message.data;
            if (buffers.length) {
                //console.log("closed")
            }
            buffers.forEach(function (file) {
                var node;
                //console.log("file name " + file.name)
                if (getVideo(file.data, file.name) != null) {
                    //console.log(file.data);
                    node = filesElement_video.appendChild(getVideo(file.data, file.name));
                    filesElement_video.insertBefore(document.createElement('br'), node);
                    filesElement_video.insertBefore(document.createElement('br'), node);

                    result_files_names[v] = file.name;
                    v++;
                    results_objects = [];
                    results_objects.push({ "name": file.name, "data": new Int8Array(file.data) });
                }
                else {
                    node = null;
                    results_objects = [];
                    results_objects.push({ "name": file.name, "data": new Int8Array(file.data) });
                }
                filesElement_video.insertBefore(getDownloadLink(file.data, file.name), node);
            }); v = 0;
        }
    };
}

document.querySelector("#getThumb").addEventListener("click", function () {
    
    if (video_objects != null && videosElement.childNodes.length == 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;

        timestamp = document.getElementById("videos_to_display").firstChild.currentTime;

        runCommand_video(" -i " + files_names[0] + " -vf showinfo -vframes 1 -ss " + timestamp + " img-000.jpg");
    }
    else alert("Please choose exactly one video which you want to generate thumbnails from.");
});

document.querySelector("#video2parts").addEventListener("click", function () {
    if (video_objects != null && videosElement.childNodes.length == 1) {
        document.getElementById('video_crop').style.display = 'none';
        document.getElementById('video_convert').style.display = 'none';

        video_duration = document.getElementById(id).duration;
        document.getElementById('video duration').innerHTML = "Please choose a time < " + video_duration;
        document.getElementById('video_split').style.display = 'inline';
    } else alert("Please choose exactly one video which you want to split.")
});

document.querySelector("#split1").addEventListener("click", function () {
    if (video_objects != null && videosElement.childNodes.length == 1) {
        var duration = parseFloat(document.getElementById('duration').value);
        if (duration > 0 && duration <= document.getElementById(id).duration) {
            document.getElementById('v_bar').style.display = 'block';
            document.getElementById('v_myBar').style.width = 0;
            var remaining_duration = document.getElementById(id).duration - duration;
            if (/Edge/.test(navigator.userAgent))runCommand_video(" -ss " + duration + " -t " + remaining_duration + " -i " + files_names[0] + " -t " + remaining_duration + " -cpu-used 5 video-000." + chosen_files.files[0].name.split('.').pop());
            //else if (/Chrome/.test(navigator.userAgent))runCommand_video(" -ss " + duration + " -t " + remaining_duration + " -i " + files_names[0] + " -t " + remaining_duration  + " -c:v libvpx -cpu-used 5 video-000.mkv"); //chosen_files.files[0].name.split('.').pop());
            else if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_video(" -ss " + duration + " -t " + remaining_duration + " -i " + files_names[0] + " -t " + remaining_duration  + " -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
            else runCommand_video(" -ss " + duration + " -t " + remaining_duration + " -i " + files_names[0] + " -t " + remaining_duration  + " -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
            document.getElementById('video_split').style.display = 'none';
        } else alert("Please enter a valid time.");
    }
    else alert("Please choose exactly one video first!");
});

document.getElementById('split2').addEventListener("click", function () {
    if (video_objects != null && chosen_files.files.length == 1 || videosElement.childNodes.length == 1) {
        var duration = parseFloat(document.getElementById('duration').value);
        if (duration > 0 && duration <= document.getElementById(id).duration) {
            document.getElementById('v_bar').style.display = 'block';
            document.getElementById('v_myBar').style.width = 0;
            runCommand_video(" -i " + files_names[0] + " -ss 0" + " -c copy small2." + chosen_files.files[0].name.split('.').pop() + " -t " + duration + "  -c copy video-000." + chosen_files.files[0].name.split('.').pop());
            document.getElementById('video_split').style.display = 'none';
        } else alert("Please check your time inputs");
    }
    else alert("Please choose exactly one video first!");
})
/*
document.getElementById('splitChunks').addEventListener("click", function () {
    if (video_objects != null && chosen_files.files.length == 1 || videosElement.childNodes.length == 1) {
        var duration = parseFloat(document.getElementById('duration').value);
        if (duration > 0 && duration <= document.getElementById(id).duration) {
            document.getElementById('v_bar').style.display = 'block';
            document.getElementById('v_myBar').style.width = 0;
            runCommand_video(" -i " + files_names[0] + " -acodec copy -f segment -segment_time " + duration + "  -vcodec copy -reset_timestamps 1 -map 0 video-%3d." + chosen_files.files[0].name.split('.').pop());
            document.getElementById('video_split').style.display = 'none';
        } else alert("Please enter a valid time.");
    }
    else alert("Please choose a video first!");
})
*/

document.querySelector("#split_hide").addEventListener("click", function () {
    document.getElementById('video_split').style.display = 'None';
    document.getElementById('duration').value = 0;
})

document.querySelector("#video2images").addEventListener("click", function () {
    if (video_objects != null && videosElement.childNodes.length == 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;


        runCommand_video(" -i " + files_names[0] + " -s 100x100 -f image2 -vf fps=fps=1,showinfo -an img-%03d.jpg");
    }
    else alert("Please choose exactly one video first.");
});

document.querySelector("#cropVideo").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length == 1) {
        //console.log("id is " + id)

        document.getElementById('video_split').style.display = 'none';
        document.getElementById('video_convert').style.display = 'none';

        document.getElementById('video Dimintions').innerHTML = "Please choose x and rectangle width between 0 and " + videoWidth + " \n as well as  y and rectangle height between 0 and " + videoHeight;
        document.getElementById('video_crop').style.display = 'inline';
    } else alert("Please choose exactly one video first!")
});

document.querySelector("#crop_hide").addEventListener("click", function () {
    document.getElementById('video_crop').style.display = 'None';
})

document.querySelector("#crop").addEventListener("click", function () {
    if (video_objects != null && videosElement.childNodes.length == 1) {
        var recWidth = document.getElementById('recWidth').value;
        var recHeight = document.getElementById('recHeight').value;
        var x = document.getElementById('x').value;
        var y = document.getElementById('y').value;
        if (x < 0 || x > videoWidth || y < 0 || y > videoHeight || recWidth < 0 || recWidth > videoWidth || recHeight < 0 || recHeight > videoHeight) { alert("Please enter correct dimensions") }
        else {
            document.getElementById('v_bar').style.display = 'block';
            document.getElementById('v_myBar').style.width = 0;
            if (/Edge/.test(navigator.userAgent)) runCommand_video(" -i " + files_names[0] + " -strict -2 -vf crop=" + recWidth + ":" + recHeight + ":" + x + ":" + y + " video-000.mp4");
            else if (/Chrome/.test(navigator.userAgent))runCommand_video(" -i " + files_names[0] + " -strict -2 -vf crop=" + recWidth + ":" + recHeight + ":" + x + ":" + y + " -c:v libvpx -cpu-used 5 -acodec copy video-000.mkv");
            else if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_video(" -i " + files_names[0] + " -vf crop=" + recWidth + ":" + recHeight + ":" + x + ":" + y + " -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
            else runCommand_video(" -i " + files_names[0] + " -vf crop=" + recWidth + ":" + recHeight + ":" + x + ":" + y + " -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
            document.getElementById('video_crop').style.display = 'none';

        }
    } else alert("Please choose exactly one video first!");
})

document.querySelector("#videos2video").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length > 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;
        var videos_string = "";
        var filter_string = "";
        for (i = 0; i < videosElement.childNodes.length; i++) {
            videos_string += " -i " + files_names[i];
            filter_string += "[" + i + ":v:0][" + i + ":a:0]";
        }
        filter_string += "concat=n=" + videosElement.childNodes.length;
        if (/Edge/.test(navigator.userAgent)) runCommand_video(videos_string + " -strict -2 -filter_complex " + filter_string + ":v=1:a=1[outv][outa] -map [outv] -map [outa] video-000.mp4");
        //else if (/Chrome/.test(navigator.userAgent))runCommand_video(videos_string + " -strict -2 -filter_complex " + filter_string + ":v=1:a=1[outv][outa] -map [outv] -map [outa] -c:v libvpx -cpu-used 5 video-000.mkv");
        else if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_video(videos_string + " -strict -2 -filter_complex " + filter_string + ":v=1:a=1[outv][outa] -map [outv] -map [outa] -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
        else runCommand_video(videos_string + " -strict -2 -filter_complex " + filter_string + ":v=1:a=1[outv][outa] -map [outv] -map [outa] -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    }
    else alert("Please choose atleast two videos first!");
});

document.querySelector("#blend").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length > 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;
        if (/Edge/.test(navigator.userAgent)) runCommand_video(" -i " + files_names[0] + " -i " + files_names[1] + " -filter_complex blend=all_expr='A*(X/W)+B*(1-X/W)' " + " video-000.mp4");
        else if (/Chrome/.test(navigator.userAgent))runCommand_video(" -i " + files_names[0] + " -i " + files_names[1] + " -filter_complex blend=all_expr='A*(X/W)+B*(1-X/W)' " + " -c:v libvpx -cpu-used 5 -acodec copy video-000.mkv");
        else if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_video(" -i " + files_names[0] + " -i " + files_names[1] + " -filter_complex blend=all_expr='A*(X/W)+B*(1-X/W)' " + " -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
        else runCommand_video(" -i " + files_names[0] + " -i " + files_names[1] + " -filter_complex blend=all_expr='A*(X/W)+B*(1-X/W)' " + " -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    }
    else alert("Please choose exactly two videos first!");
});

document.querySelector("#light").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length == 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;
        if (/Edge/.test(navigator.userAgent)) runCommand_video(" -i " + files_names[0] + " -vf colorlevels=romin=0.5:gomin=0.5:bomin=0.5 video-000.mp4");
        else if (/Chrome/.test(navigator.userAgent))runCommand_video(" -i " + files_names[0] + " -vf colorlevels=romin=0.5:gomin=0.5:bomin=0.5 -c:v libvpx -cpu-used 5 video-000.mkv");
        else if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_video(" -i " + files_names[0] + " -vf colorlevels=romin=0.5:gomin=0.5:bomin=0.5 -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
        else runCommand_video(" -i " + files_names[0] + " -vf colorlevels=romin=0.5:gomin=0.5:bomin=0.5 -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    }
    else alert("Please choose exactly one video which you want to add an effect to.");
});

document.querySelector("#vintage").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length == 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;
        if (/Edge/.test(navigator.userAgent)) runCommand_video(" -i " + files_names[0] + " -vf curves=vintage video-000.mp4");
        else if (/Chrome/.test(navigator.userAgent))runCommand_video(" -i " + files_names[0] + " -vf curves=vintage -c:v libvpx -cpu-used 5 video-000.mkv");
        else if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_video(" -i " + files_names[0] + " -vf curves=vintage -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
        else runCommand_video(" -i " + files_names[0] + " -vf curves=vintage -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    }
    else alert("Please choose exactly one video which you want to add an effect to.");
});

document.querySelector("#vignette").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length == 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;
        if (/Edge/.test(navigator.userAgent)) runCommand_video(" -i " + files_names[0] + " -vf vignette='PI/4+random(1)*PI/50':eval=frame video-000.mp4");
        else if (/Chrome/.test(navigator.userAgent))runCommand_video(" -i " + files_names[0] + " -vf vignette='PI/4+random(1)*PI/50':eval=frame -c:v libvpx -cpu-used 5 video-000.mkv");
        else if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_video(" -i " + files_names[0] + " -vf vignette='PI/4+random(1)*PI/50':eval=frame -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
        else runCommand_video(" -i " + files_names[0] + " -vf vignette='PI/4+random(1)*PI/50':eval=frame -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    }
    else alert("Please choose exactly one video which you want to add an effect to.");
});

document.querySelector("#grayscale").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length == 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;
        if (/Edge/.test(navigator.userAgent)) runCommand_video(" -i " + files_names[0] + " -vf colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3 video-000.mp4");
        else if (/Chrome/.test(navigator.userAgent))runCommand_video(" -i " + files_names[0] + " -vf colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3 -c:v libvpx -cpu-used 5 video-000.mkv");
        else if (/Safari/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))) runCommand_video(" -i " + files_names[0] + " -vf colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3 -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
        else runCommand_video(" -i " + files_names[0] + " -vf colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3 -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    }
    else alert("Please choose exactly one video which you want to add the grayscale effect to.");
});

document.querySelector("#sepia").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length == 1) {
        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;
        if (/Edge/.test(navigator.userAgent)) runCommand_video(" -i " + files_names[0] + " -vf colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131 video-000.mp4");
        else if (/Chrome/.test(navigator.userAgent))runCommand_video(" -i " + files_names[0] + " -vf colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131 -c:v libvpx -cpu-used 5 -acodec copy video-000.mkv");
        else if (/Firefox/.test(navigator.userAgent))runCommand_video(" -i " + files_names[0] + " -vf colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131 -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
        else runCommand_video(" -i " + files_names[0] + " -vf colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131 -c:v mpeg4 -cpu-used 5 -c:a aac video-000.mp4");
    }
    else alert("Please choose exactly one video which you want to the sepia effect to.");
});

document.querySelector("#convert").addEventListener("click", function () {

    if (video_objects != null && videosElement.childNodes.length == 1) {


        document.getElementById('video_split').style.display = 'none';
        document.getElementById('video_crop').style.display = 'none';
        document.getElementById('video_convert').style.display = 'inline';
    } else alert("Please choose exactly one video which you want to convert.")
});


function getAllVideos() {
    if (document.getElementById("videos-to-upload").value != "") {
        if (checkvideoExtension() == 1) {
            // you have a file

            deleteVideos();

            var files = document.getElementById("videos-to-upload").files;
            //console.log("files length " + files.length)
            window.video_objects = new Array(files.length);
            window.files_names = new Array(files.length);
            result_files_names = [];
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
                    var name = 'video-' + idx + "." + file.name.split('.').pop();
                    files_names[i] = name;

                    reader = new FileReader();
                    reader.onload = function (e) {
                        var data = e.target.result;
                        //console.log("data " + data)
                        var array = new Int8Array(data);
                        var file_obj = { "name": name, "data": array }
                        video_objects.push(file_obj);
                        //console.log("id " + id)
                        videosElement.appendChild(displayVideo(data));
                        document.getElementById("videos2_to_display").appendChild(displayVideo(data));
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
    /*else if (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent))*/ //runCommand_video(" -i " + files_names[0] + " -c:v libvpx -cpu-used 5 -c:a vorbis -strict -2 -ac 2 video-000.webm");
    //use_results();
    //deleteResults();
}

function deleteVideos() {
    var e = document.querySelector("#videos_to_display");

    //e.firstElementChild can be used. 
    var child = e.lastElementChild;
    while (child) {
        e.src = null;

        e.removeChild(child);
        child = e.lastElementChild;
    }

    var e = document.querySelector("#videos2_to_display");

    var child = e.lastElementChild;
    while (child) {
        e.src = null;

        e.removeChild(child);
        child = e.lastElementChild;
    }
    video_objects = null;

}

function v_move(width) {

    var elem = document.getElementById("v_myBar");
    elem.style.width = width + '%';
}

function runCommand_video(text) {
    if (isReadyVideo()) {
        start = Date.now();
        startVidRunning();
        disableAll();
        var args = parseArguments(text);
        //console.log(args);
        v_worker.postMessage({
            type: "command",
            arguments: args,
            files: video_objects
        });
    }
}

function deleteResults() {
    var e = document.querySelector("#video_results");

    //e.firstElementChild can be used. 
    var child = e.lastElementChild;
    if (child != null) {
        document.getElementById('v_bar').style.display = 'none';
        document.getElementById('v_myBar').style.width = 0;
        width = 0;
        while (child) {
            e.removeChild(child);
            child = e.lastElementChild;
        }
    }
}

function openTab(evt, cityName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.getElementById("defaultOpen").click();

function parseArguments(text) {
    text = text.replace(/\s+/g, ' ');
    var args = [];
    // Allow double quotes to not split args.
    text.split('"').forEach(function (t, i) {
        t = t.trim();
        if ((i % 2) === 1) {
            args.push(t);
        } else {
            args = args.concat(t.split(" "));
        }
    });
    return args;
}

function use_results() {
    if (filesElement_video.hasChildNodes()) {
        //videosElement.appendChild(filesElement_video.NodeC

        var c = filesElement_video.childNodes;
        for (i = 0; i < c.length; i++) {
            if (c[i].nodeName == "IMG") { alert("No video as a result"); return }
            // if(c[i].nodeName=="IMG"){ deleteImages();break;}
        }

        deleteVideos();
        var i, j = 0;
        id = 0;
        //console.log("Nodes sum: " + c.length);
        for (i = 0; i < c.length; i++) {

            //console.log(i + "   " + c.length + "     " + c[i].nodeName);
            if (c[i].nodeName == "VIDEO") {
                c[i].id = j;
                j++;
                videosElement.appendChild((c[i]).cloneNode());
                document.getElementById("videos2_to_display").appendChild(c[i]);
            }
        }

        files_names = result_files_names;
        video_objects = results_objects;
        deleteResults();

    } else alert("There is no Result!");
}

function ConvertFunction() {
    if (video_objects != null && videosElement.childNodes.length == 1) {
        var type = document.getElementById("mySelectcedConvert").value;

        // document.getElementById('bar').style.display = 'block';
        // document.getElementById('myBar').style.width = 0;

        //console.log("video name : " + files_names[0])

        if (type == "mp4") {

            /*if(chosen_files.files[0].name.split('.').pop() == "webm")*/ runCommand_video(" -i " + files_names[0] + "  -c:v mpeg4 -c:a aac -strict -2  video-000.mp4");
            //else runCommand_video(" -i " + files_names[0] + "  -c copy -strict -2  video-000.mp4");


        } else if (type == "avi") {

            runCommand_video(" -i " + files_names[0] + "  -vcodec copy -acodec copy video-000.avi");


        } else if (type == "mov") {

            runCommand_video(" -i " + files_names[0] + "  -vcodec copy -acodec copy video-000.mov");


        } else if (type == "mkv") {

            runCommand_video(" -i " + files_names[0] + " -c copy video-000.mkv");


        } else if (type == "webm") {

            // runCommand_video( " -i " + files_names[0] + " -c:v libvpx-vp9 -minrate 500k -b:v 2000k -maxrate 2500k video-000.webm");
             runCommand_video("-i " + files_names[0] + " -vf showinfo -c:v libvpx -cpu-used 5 -c:a vorbis -ac 2 -strict -2 video-000.webm")

        } else if (type == "flv") {

            runCommand_video(" -i " + files_names[0] + " -ar 44100 -ac 2 -ab 96k -f flv video-000.flv");


        }

        document.getElementById('v_bar').style.display = 'block';
        document.getElementById('v_myBar').style.width = 0;
        document.getElementById('video_convert').style.display = 'none';

    } else alert("Please choose exactly one video to convert.");

}

document.querySelector("#convert_hide").addEventListener("click", function () {
    document.getElementById('video_convert').style.display = 'None';
})

document.addEventListener("DOMContentLoaded", function () {

    initVideoWorker();
    chosen_files = document.getElementById('videos-to-upload');
    video_convert = document.getElementById("video_convert");
    filesElement_video = document.querySelector("#video_results");
});

//Disables all video and image buttons while a video or image command is being processed
function disableAll() {

    if (vid_running == true) {
        document.getElementById("getThumb").setAttribute("disabled", "disabled");
        document.getElementById("video2parts").setAttribute("disabled", "disabled");
        document.getElementById("video2images").setAttribute("disabled", "disabled");
        document.getElementById("videos2video").setAttribute("disabled", "disabled");
        document.getElementById("convert").setAttribute("disabled", "disabled");
        document.getElementById("cropVideo").setAttribute("disabled", "disabled");
        document.getElementById("blend").setAttribute("disabled", "disabled");
        document.getElementById("light").setAttribute("disabled", "disabled");
        document.getElementById("vintage").setAttribute("disabled", "disabled");
        document.getElementById("vignette").setAttribute("disabled", "disabled");
        document.getElementById("sepia").setAttribute("disabled", "disabled");
        document.getElementById("grayscale").setAttribute("disabled", "disabled");

        document.getElementById("Vflip").setAttribute("disabled", "disabled");
        document.getElementById("Hflip").setAttribute("disabled", "disabled");
        document.getElementById("blackwhite").setAttribute("disabled", "disabled");
        document.getElementById("gamma").setAttribute("disabled", "disabled");
        document.getElementById("invert").setAttribute("disabled", "disabled");
        document.getElementById("images2video").setAttribute("disabled", "disabled");
        document.getElementById("cropImage").setAttribute("disabled", "disabled");
        document.getElementById("scaleImage").setAttribute("disabled", "disabled");
        document.getElementById("Iconvert").setAttribute("disabled", "disabled");
    } else {
        document.getElementById("getThumb").removeAttribute("disabled");
        document.getElementById("video2parts").removeAttribute("disabled");
        document.getElementById("video2images").removeAttribute("disabled");
        document.getElementById("videos2video").removeAttribute("disabled");
        document.getElementById("convert").removeAttribute("disabled");
        document.getElementById("cropVideo").removeAttribute("disabled");
        document.getElementById("blend").removeAttribute("disabled", "disabled");
        document.getElementById("light").removeAttribute("disabled", "disabled");
        document.getElementById("vintage").removeAttribute("disabled", "disabled");
        document.getElementById("vignette").removeAttribute("disabled", "disabled");
        document.getElementById("sepia").removeAttribute("disabled", "disabled");
        document.getElementById("grayscale").removeAttribute("disabled", "disabled");

        document.getElementById("Vflip").removeAttribute("disabled");
        document.getElementById("Hflip").removeAttribute("disabled");
        document.getElementById("blackwhite").removeAttribute("disabled");
        document.getElementById("gamma").removeAttribute("disabled");
        document.getElementById("invert").removeAttribute("disabled");
        document.getElementById("images2video").removeAttribute("disabled");
        document.getElementById("cropImage").removeAttribute("disabled", "disabled");
        document.getElementById("scaleImage").removeAttribute("disabled", "disabled");
        document.getElementById("Iconvert").removeAttribute("disabled", "disabled");
    }
}
