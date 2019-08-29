// const handler = require('serve-handler');
// const http = require('http');
 
// const server = http.createServer((request, response) => {
//   // You pass two more arguments for config and middleware
//   // More details here: https://github.com/zeit/serve-handler#options
//   return handler(request, response);
// })
 
// server.listen(3000, () => {
//   console.log('Running at http://localhost:3000');
// });
var express = require('express'),
    upload = require('express-fileupload'),
   // http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 3000,
    mimeTypes = {
      "html": "text/html",
      "jpeg": "image/jpeg",
      "jpg": "image/jpeg",
      "png": "image/png",
      "js": "text/javascript",
      "css": "text/css"
    };
 const app= express();
 app.use(upload());
 app.use(express.static(__dirname + '/'));

 app.post("/", function(request,response){
  
  console.log(request.files);
  if(request.files){
     
     var file = request.files.filename,
         filename= file.name;
         file.mv("./upload/"+ filename,function(err){
if(err){console.log(err)
        response.send("Error occured")}
        else{
          response.send("Done")
        }

         })
    
         
   }
 })
//http.createServer(function(request, response) {
 app.get('/', function(request, response){
  var uri = url.parse(request.url).pathname, 
      filename = path.join(process.cwd(), uri);
  
  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.write("404 Not Found\n");
      response.end();
      return;
    }
 
    if (fs.statSync(filename).isDirectory()) 
      filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
      
      var mimeType = mimeTypes[filename.split('.').pop()];
      
      if (!mimeType) {
        mimeType = 'text/plain';
      }
      
      response.writeHead(200, { "Content-Type": mimeType });
      response.write(file, "binary");
      response.end();
    });
  });
})//.listen(parseInt(port, 10));
var http= require("http").Server(app).listen(parseInt(port, 10))
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");