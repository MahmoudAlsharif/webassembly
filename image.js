var i_files_names;
var i_width = 0;
var image_objects;
var chosen_files;
var timestamp = 0;
var i_worker;
var filesElement_image;
var imagesElement = document.getElementById("images");
var imageWidth;
var imageHeight;
var start;
var finish;
var img_running = false;
var aud_running = false;
var isWorkerLoaded = false;
var isImageWorkerLoaded=false;
var isAudioWorkerLoaded=false;
var isSupported = (function () {
  return document.querySelector && window.URL && window.Worker;
})();


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


  
  document.addEventListener("DOMContentLoaded", function () {
    initImageWorker();
    filesElement_image = document.querySelector("#image_files"); 
    
  });
  



  function isReadyImage() {
    //console.log("worker "+isWorkerLoaded+ " video worker " + isVideoWorkerLoaded +" image worker "+ isImageWorkerLoaded)
    return !img_running &&  isImageWorkerLoaded;//&& sampleImageData && sampleVideoData,video_data ;
  }
  


function displayImage(fileData) {
    var blob = new Blob([fileData]);
    var src = window.URL.createObjectURL(blob);
    var img = document.createElement('img');
    img.width = 350;
    img.height = 350;
  
    img.src = src;
    return img;
  }
  

  
  function startImgRunning() {

    /** replace old image with new one */

    filesElement_image.innerHTML = "";
    img_running = true;
  }

  function stopImgRunning() {
    img_running = false;
  }
  
  

/*************************************************************************************************** */

function getImage(fileData, fileName) {
    if (fileName.match(/\.jpeg|\.gif|\.jpg|\.png|\.tif|\.JPEG|\.GIF|\.JPG|\.PNG|\.TIF/)) {
      var blob = new Blob([fileData]);
      var src = window.URL.createObjectURL(blob);
      var img = document.createElement('img');     //Image you want to save
      img.naturalWidth;
      img.naturalHeight; 
      img.src = src;
      return img;
   }
   if (fileName.match(/\.mp4/)){
    var blob = new Blob([fileData], {type: 'video/mp4'});
    var src = window.URL.createObjectURL(blob);
    var video = document.createElement('video');


    video.src = src;
    video.load();

    video.muted = true;
    video.controls = 'controls';

    return video;

   }
   else return;
}


function getDownloadImgLink(fileData, fileName) {
    if (fileName.match(/\.jpeg|\.gif|\.jpg|\.png|\.tif|\.JPEG|\.GIF|\.JPG|\.PNG|\.TIF/)) {
         var blob = new Blob([fileData]);
         var src = window.URL.createObjectURL(blob);
         var img = document.createElement('img');     //Image you want to save
         var save = document.createElement('a');       // New link we use to save it with
          img.src = src;

        save.href = img.src                           // Assign image src to our link target
        save.download = fileName;               // set filename for download
        save.innerHTML = "Click to Download image";       // Set link text
        document.body.appendChild(save);              // Add link to page
       
         return save;
    //   return img;
        
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
/*************************************************************************************************** */




function initImageWorker() {
    i_worker = new Worker("worker-asm.js");
    i_worker.onmessage = function (event) {
      var message = event.data;
      if (message.type == "ready") {
        isImageWorkerLoaded = true;
        i_worker.postMessage({
          type: "command",
          arguments: ["-help"]
        });
      }
      else if (message.type == "stdout") {
        console.log(message.data);
        if (!message.data.includes("Finished processing")) {
          document.getElementById("i_proc").innerHTML = "Processing...";
          i_width++;
          if (i_width >= 90) i_width = 80;
          i_move((i_width) % 100);
        }
        else { 
          i_move(100); 
          finish = Date.now() - start;

          document.getElementById("i_proc").innerHTML = "Finished in " + finish / 1000 + " seconds \n";
          //document.getElementById("i_proc").innerHTML = "Done"; 
      }

      } else if (message.type == "start") {
        //console.log("Worker has received command\n");
      }
  
      else if (message.type == "done") {
        stopImgRunning();
        disableAll();
        var buffers = message.data;
        if (buffers.length) {
          //console.log("closed");
        }
        buffers.forEach(function (file) {
          var node;
          if (getImage(file.data, file.name) != null) {
             node = filesElement_image.appendChild(getImage(file.data, file.name));
             node.height = 350;
             node.width = 350;
             filesElement_image.insertBefore(getDownloadImgLink(file.data, file.name), node);
             filesElement_image.insertBefore(document.createElement('br'), node);
             filesElement_image.insertBefore(document.createElement('br'), node);
          }
          else node = null
        });
      }
    };
  }


  
  function runCommand_image(text) {
    if (isReadyImage()) {
      start = Date.now();
      startImgRunning();
      disableAll();
      var args = parseArguments(text);
      //console.log(args);
      i_worker.postMessage({
        type: "command",
        arguments: args,
        files: image_objects
  
      });
  
    }
  }

  
  document.querySelector("#images2video").addEventListener("click", function () {
  
    if (image_objects != null && imagesElement.childNodes.length > 1) {
      document.getElementById('i_bar').style.display = 'block';
      document.getElementById('i_myBar').style.width = 0;
        runCommand_image("-framerate 3 -i img-%03d.jpg  -r 25 -pattern_type glob -vf showinfo out.mp4");
    }
    else alert("Please choose atleast two images first!");
  });





  document.querySelector("#invert").addEventListener("click", function () {
  
      if (image_objects != null &&  imagesElement.childNodes.length == 1) {
  
        document.getElementById('image_crop').style.display = 'none';
        document.getElementById('image_scale').style.display = 'none';
        document.getElementById('image_gamma').style.display = 'none';
        document.getElementById('image_convert').style.display = 'none';
        var e = document.querySelector("#image_files");
        var child = e.lastElementChild;
        if (child!=null){
        DeleteImgResults();}
  
      document.getElementById('i_bar').style.display = 'block';
      document.getElementById('i_myBar').style.width = 0;
     runCommand_image(" -i " + i_files_names[0] + " -vf lutyuv=y=negval:u=negval:v=negval image-000.jpeg");
      
     
    }
  else 
  
  alert("Please choose exactly one image first!");
  });

  
  

document.querySelector("#Vflip").addEventListener("click", function () {
  
    if (image_objects != null &&  imagesElement.childNodes.length == 1) {

      document.getElementById('image_crop').style.display = 'none';
      document.getElementById('image_scale').style.display = 'none';
      document.getElementById('image_gamma').style.display = 'none';
      document.getElementById('image_convert').style.display = 'none';
      var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}

    document.getElementById('i_bar').style.display = 'block';
    document.getElementById('i_myBar').style.width = 0;
   runCommand_image(" -i " + i_files_names[0] + " -vf vflip image-000.jpeg"); 
}
else 

alert("Please choose exactly one image first!");
});




document.querySelector("#Hflip").addEventListener("click", function () {
  
    if (image_objects != null && imagesElement.childNodes.length == 1) {

      document.getElementById('image_crop').style.display = 'none';
      document.getElementById('image_scale').style.display = 'none';
      document.getElementById('image_gamma').style.display = 'none';
      document.getElementById('image_convert').style.display = 'none';

      var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}

    document.getElementById('i_bar').style.display = 'block';
    document.getElementById('i_myBar').style.width = 0;
    runCommand_image(" -i " + i_files_names[0] + " -vf hflip image-000.jpeg");
  
}
else 
  
  alert("Please choose exactly one image first!");
});



document.querySelector("#blackwhite").addEventListener("click", function () {
  
    if (image_objects != null &&  imagesElement.childNodes.length == 1) {

      document.getElementById('image_crop').style.display = 'none';
      document.getElementById('image_scale').style.display = 'none';
      document.getElementById('image_gamma').style.display = 'none';
      document.getElementById('image_convert').style.display = 'none';
      var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}

    document.getElementById('i_bar').style.display = 'block';
    document.getElementById('i_myBar').style.width = 0;
    runCommand_image(" -i " + i_files_names[0] + " -vf hue=s=0 image-000.jpeg");
}
else 

alert("Please choose exactly one image first!");
});



/**************************** */

document.querySelector("#cropImage").addEventListener("click", function () {

  if (image_objects != null && imagesElement.childNodes.length == 1) {
       //console.log("id is " + id)

      var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}
      

       document.getElementById('image_scale').style.display = 'none';      document.getElementById('image_convert').style.display = 'none'
      document.getElementById('image_gamma').style.display = 'none';
      document.getElementById('image Crop Dimensions').innerHTML = "Please choose rectangle width as well as rectangle height ";
      document.getElementById('image_crop').style.display = 'inline';
  } else alert("Please choose an image first!")
});

document.querySelector("#Icrop_hide").addEventListener("click", function () {
  document.getElementById('image_crop').style.display = 'None';
})


document.querySelector("#ICreset").addEventListener("click", function () {
  
  document.getElementById('recIWidth').value = '';
  document.getElementById('recIHeight').value = '';
  document.getElementById('cropx').value = '';
  document.getElementById('cropy').value = '';
})

document.querySelector("#Icrop").addEventListener("click", function () {
  if (image_objects != null && imagesElement.childNodes.length == 1 ) {
     //console.log("id is " + id)
   
    var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}

      var recIWidth = document.getElementById('recIWidth').value;
      var recIHeight = document.getElementById('recIHeight').value;
      var cropx = document.getElementById('cropx').value;
      var cropy = document.getElementById('cropy').value;
  if ( recIWidth ==='' && recIHeight==='') { alert("Please enter the dimensions"); }  
  else {
          document.getElementById('i_bar').style.display = 'block';
          document.getElementById('i_myBar').style.width = 0;          
        runCommand_image("-i " + i_files_names[0] + " -vf \"crop=" + recIWidth +":" + recIHeight + ":" + cropx + ":" + cropy + "\" image-000.jpeg");
      }
  } else alert("Please choose an image first!");
})

/**************************** */

document.querySelector("#scaleImage").addEventListener("click", function () {

  if (image_objects != null && imagesElement.childNodes.length == 1) {
      //console.log("id is " + id)

      var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}
      
      document.getElementById('image_crop').style.display = 'none';
      document.getElementById('image_convert').style.display = 'none'
      document.getElementById('image_gamma').style.display = 'none';

      document.getElementById('image scale dimensions').innerHTML = "Please choose scaling width as well as scaling height";
      document.getElementById('image_scale').style.display = 'inline';
  } else alert("Please choose an image first!")
});

document.querySelector("#Iscale_hide").addEventListener("click", function () {
  document.getElementById('image_scale').style.display = 'None';
})


document.querySelector("#ISreset").addEventListener("click", function () {
  document.getElementById('scalIWidth').value = '';
  document.getElementById('scalIHeight').value = '';
})

document.querySelector("#Iscale").addEventListener("click", function () {
  if (image_objects != null && imagesElement.childNodes.length == 1) {

    var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}
    
      var ISWidth = document.getElementById('scalIWidth').value;
      var ISHeight = document.getElementById('scalIHeight').value;
      
      if ( ISWidth ==='' && ISHeight==='') { alert("Please enter the dimensions"); }   
    else {
          document.getElementById('i_bar').style.display = 'block';
          document.getElementById('i_myBar').style.width = 0;
          runCommand_image(" -i " + i_files_names[0] + " -vf scale=w="+ ISWidth + ":h=" + ISHeight + " image-000.jpeg");
      }
  } else alert("Please choose an image first!");
})

/**************************** */

function ConvertImageFunction() {
  if (image_objects != null && imagesElement.childNodes.length == 1) {
      var type = document.getElementById("mySelectcedIConvert").value;

      //console.log("image name : " + i_files_names[0])

      var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}
      /*
      if (type == "png") {

        runCommand_image(" -i " + i_files_names[0] + "  -vf showinfo -strict -2  image-000.png");
        document.getElementById('i_bar').style.display = 'block';
        document.getElementById('i_myBar').style.width = 0;
        // document.getElementById('video_convert').style.display = 'none';
  
      } else */if (type == "jpeg") {

        runCommand_image(" -i " + i_files_names[0] + "  -vcodec copy -acodec copy image-000.jpeg");
        document.getElementById('i_bar').style.display = 'block';
        document.getElementById('i_myBar').style.width = 0;

      } else if (type == "jpg") {

        runCommand_image(" -i " + i_files_names[0] + "  -vcodec copy -acodec copy image-000.jpg");
        document.getElementById('i_bar').style.display = 'block';
        document.getElementById('i_myBar').style.width = 0;
  
      } else if (type == "tif") {

        runCommand_image(" -i " + i_files_names[0] + " -c copy image-000.tif");
        document.getElementById('i_bar').style.display = 'block';
        document.getElementById('i_myBar').style.width = 0;
  
      } else { alert ("Please select the desired format") }


  } else alert("Please choose exactly one video first");

}


document.querySelector("#Iconvert_hide").addEventListener("click", function () {
  document.getElementById('image_convert').style.display = 'None';
})

document.querySelector("#Iconvert").addEventListener("click", function () {

  if (image_objects != null && imagesElement.childNodes.length == 1) {
      //console.log("id is " + id)

      var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}
      
      document.getElementById('image_gamma').style.display = 'none';
      document.getElementById('image_crop').style.display = 'none';
      document.getElementById('image_scale').style.display = 'None'
      document.getElementById('imgcon').innerHTML = "please choose image Formate to convert!";
      document.getElementById('image_convert').style.display = 'inline';

  } else alert("Please choose an image first!")
});



/**************************** */

document.querySelector("#gamma").addEventListener("click", function () {

  if (image_objects != null && imagesElement.childNodes.length == 1) {
      //console.log("id is " + id)

      var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}
      
      document.getElementById('image_crop').style.display = 'none';
      document.getElementById('image_convert').style.display = 'none'
      document.getElementById('image_scale').style.display = 'none';

      document.getElementById('image gamma rate').innerHTML = "Please choose gamma value (Non-negative Number!) ";
      document.getElementById('image_gamma').style.display = 'inline';
  } else alert("Please choose an image first!")
});

document.querySelector("#Igamma_hide").addEventListener("click", function () {
  document.getElementById('image_gamma').style.display = 'None';
})

document.querySelector("#Igammareset").addEventListener("click", function () {
  document.getElementById('rate').value = '';
  
})

document.querySelector("#Igamma").addEventListener("click", function () {
  if (image_objects != null && imagesElement.childNodes.length == 1) {

    var e = document.querySelector("#image_files");
      var child = e.lastElementChild;
      if (child!=null){
      DeleteImgResults();}
    
      var IGrate = document.getElementById('rate').value;
      
    if (IGrate ==='') { alert("Please enter the gamma value"); }   
    else if(IGrate < 0){
      alert("Please enter a non-negative number!")
    }else {
          document.getElementById('i_bar').style.display = 'block';
          document.getElementById('i_myBar').style.width = 0;
          
          runCommand_image("-i " + i_files_names[0] + " -vf lutyuv=y=gammaval(" + IGrate + ") image-000.jpeg");
      }
  } else alert("Please choose an image first!");
})
/**************************** */


/********************Delete the result ************************* */

function DeleteImgResults() {

  // document.getElementById('delImg_result');
  var e = document.querySelector("#image_files");
  //e.firstElementChild can be used. 
  var child = e.lastElementChild;
  if (child != null) {
      document.getElementById('i_bar').style.display = 'none';
      document.getElementById('i_myBar').style.width = 0;
      width = 0;
      while (child) {
          e.removeChild(child);
          child = e.lastElementChild;
      }
  } 
else{ alert ("No result to delete!"); }

}
document.querySelector("#delImg_result").addEventListener("click", function () {
  
  DeleteImgResults();
  
})

/***************************************************************** */

 
  function getAllImages() {
    
    if (document.getElementById("images-to-upload").value != "") {
      // you have a file
      if (checkImagesExtension() == 1) {
        deleteImages();
        var files = document.getElementById("images-to-upload").files;
  
        image_objects = new Array(files.length);
        i_files_names = new Array(files.length);
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
            var name = 'img-' + idx + "." + file.name.split('.').pop();
            i_files_names[i] = name;
  
            reader = new FileReader();
            reader.onload = function (e) {
              var data = e.target.result;
              var array = new Int8Array(data);
              var file_obj = { "name": name, "data": array };
              image_objects.push(file_obj);  
              imagesElement.appendChild(displayImage(data));
            }
            reader.readAsArrayBuffer(file);
          })(files[i]);
  
        }
      }
    }
    else { 
     
      alert ("The previous image(s) will be automatically deleted");
      deleteImages();
    }
    }
  
  function checkImagesExtension() {
    var files = document.getElementById("images-to-upload").files;
    for (var i = 0; i < files.length; i++) {
  
      // if (!files[i].name.match(/\.jpeg|\.jpg/)) {
        if (!files[i].name.match(/\.jpeg|\.jpg/)) {
        document.getElementById("images-to-upload").files = null;
        alert("Please choose *.jpeg/*.jpg  files")
        return 0;
      }
  
    }
    return 1;
  }
  
  function i_move(width) {
  
    var elem = document.getElementById("i_myBar");
    elem.style.width = width + '%';
  }
  
  /***************** Delete Previwe image/s ***************** */
  function deleteImages() {
    var e = document.querySelector("#images");
  
    document.getElementById('image_gamma').style.display = 'none';
    document.getElementById('image_crop').style.display = 'none';
    document.getElementById('image_scale').style.display = 'none'
    document.getElementById('image_convert').style.display = 'none';
    
    document.getElementById('i_bar').style.display = 'none';
    document.getElementById('i_myBar').style.width = 0;
      

    //e.firstElementChild can be used. 
    var child = e.lastElementChild;
    while (child) {
      e.removeChild(child);
      child = e.lastElementChild;
    }
  }
  document.querySelector("#remove_images").addEventListener("click", function () {
    if (document.getElementById("images-to-upload").value != "") {
      deleteImages();
      document.getElementById('images-to-upload').value = "";
  
      image_objects = null;
    } else alert("Nothing to delete!");
  })

/****************************************************************** */  

 

  function deleteChilds(selector) {
  
    var e = document.querySelector(selector);
  
    //e.firstElementChild can be used. 
    var child = e.lastElementChild;
    while (child) {
      e.removeChild(child);
      child = e.lastElementChild;
    }
  }
