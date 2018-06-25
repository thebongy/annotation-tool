function CanvasHandler(canvasElem, imageView, videoView) {
    this.type = undefined;
    this.videoPaused = true;
    
    this.video = undefined;
    
    this.selection = null;
    this.dragging = false;
    this.canvas = canvasElem;
    this.imageView = imageView;
    this.videoView = videoView;
    this.ctx = this.canvas[0].getContext("2d");

    this.loadFile = function (type, width, height)  {
        this.type=  type;
        this.canvas[0].width = width;
        this.canvas[0].height = height;
        this.imageView.hide();
        this.videoView.hide();
        console.log(this.type);
        if (this.type == "video") {
            this.pauseVideo();
            this.videoView.show();
            this.video = VideoFrame();
            
        } else if (this.type = "image") {
            this.imageView.show();
        }

        this.canvas.show();
    }
    
    this.playPauseVideo = function() {
      if (this.type === "video") {
        if (this.videoPaused) {
          this.playVideo()
        } else {
          this.pauseVideo();
        }
        return true;
      }
      return false;
    }
    
    this.playVideo = function () {
      this.videoPaused = false;
      this.videoView[0].play();
    }
    
    this.pauseVideo = function () {
      this.videoPaused = true;
      this.videoView[0].pause();
    }
    this.videoNextFrame = function () {
      if (this.type == "video") {
        console.log("NEXT");
        this.videoView[0].currentTime += (1/30.0);
      }
    }
    
    this.videoPreviousFrame = function () {
      if (this.type == "video") {
        this.video.seekBackward(1);
      }
    }
    
}

$(function() {
    const mainCanvas = $("#mainCanvas");
    const imageView = $("#imageView");
    const videoView = $("#videoView");
    
    const videoControls = $("#video-controls");
  
    const videoFrameBack = $("#videoFrameBackBtn");
    const videoFrameForward = $("#videoFrameForwardBtn");
    console.log(videoFrameForward);
    const canvasObj = new CanvasHandler(mainCanvas, imageView, videoView);
    
    videoControls.on("click", "#videoPlayPauseBtn", function () {
      console.log("ran");
      if (canvasObj.playPauseVideo()) {
        if (canvasObj.videoPaused) {
          $("#videoPlayPauseBtn").removeClass("fa-pause").addClass("fa-play");
        } else {
          $("#videoPlayPauseBtn").removeClass("fa-play").addClass("fa-pause");
        }
      }
    });
    
    videoFrameBack.click(function () {
      canvasObj.videoPreviousFrame();
    })
    
    videoFrameForward.click(function() {
      canvasObj.videoNextFrame();
    })
    
    videoView.on("timeupdate", function() {
      console.log(canvasObj.video.toSeconds())
    })
    
    videoFrameForward.click(function() {
      console.log("F");
      canvasObj.videoNextFrame();
    })
    
    videoFrameBack.click(function() {
      canvasObj.videoPreviousFrame();
    })

    mainCanvas.hide();
    imageView.hide();
    videoView.hide();

    imageView.on("load", function (event) {
        canvasObj.loadFile("image", this.width, this.height);
    });

    videoView.on("loadeddata", function() {
        canvasObj.loadFile("video", this.width, this.height);
    })
    
    const navFileName = $("#nav-filename");
    const fileList = $(".file-list");
    fileList.on("click", ".file-list-name", function (event) {
        const listItem = $(this).parent();
        const fileType = listItem.attr("data-type");
        const dataSrc = `/data/${listItem.attr("data-id")}`
        if (fileType == "image") {
            imageView.attr("src", dataSrc);
        } else {
            videoView.attr("src", dataSrc);
        }
    });
});
