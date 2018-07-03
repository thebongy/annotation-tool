function ViewHandler(imageView, videoView) {
    this.type = undefined;
    
    this.videoPaused = true;
    this.video = undefined;
    
    this.imageView = $("#imageView");
    this.videoView = $("#videoView");
    this.currentView = undefined;

    this.frameCountElem = $("#frameCount");
    this.fileNameElem = $("#nav-filename");

    this.videoSeekElem = $("#videoSeek");

    this.previousSeek = undefined;
    const self = this;
    this.videoSeekElem.on("input", function(event) {
      const value = this.value
      if (self.previousSeek === undefined || self.previousSeek !== value) {
        self.previousSeek = value;
        if (self.videoPaused) {
          self.seekVideo(value);
        }
      }
    });

    this.videoSeekElem.rangeslider({
      polyfill: false
    });

    this.canvas = new CanvasHandler("myCanvas");
    this.canvas.init();
    this.loadFile = function (type, fileID, originalFileName)  {
        this.type = type;
        this.imageView.hide();
        this.videoView.hide();

        const self = this;
        if (this.type == "video") {
            this.video = new VideoFrame({
              id: "videoView",
              frameRate: 30,
              callback: function(response, format) {
                if (format === "frame") {
                  self.drawCurrentFrame();
                }
              }
            });

            this.pauseVideo();

            this.videoView[0].currentTime = this.videoView[0].duration;
            const totalFrames = this.video.get();

            this.videoSeekElem.attr({
              max: totalFrames
            });

            this.videoSeekElem.rangeslider("update", true);
            this.seekVideo(1);

            this.video.listen("frame");
            this.currentView = this.videoView;
        } else if (this.type = "image") {
            this.currentView = this.imageView;
        }
        
        this.canvas.loadFile(this.currentView.width(), this.currentView.height(), fileID, function () {
          if (self.type === "video") {
            self.seekVideo(1);
          }
          self.fileNameElem.text(originalFileName);
          self.currentView.show();
        });
    }
    
    this.drawCurrentFrame = function () {
      const self = this;
      const frame = this.video.get();
      
      this.frameCountElem.text(frame);

      this.videoSeekElem.val(frame).change();
      window.requestAnimationFrame(function () {
        self.canvas.drawFrame(frame);
      })
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

      this.seekVideo(this.video.get());
    }

    this.videoNextFrame = function (step) {
      if (this.type == "video") {
        this.video.seekForward(step);
        this.drawCurrentFrame();
      }
    }
    
    this.videoPreviousFrame = function (step) {
      if (this.type == "video") {
        this.video.seekBackward(step);
        this.drawCurrentFrame();
      }
    }
    
    this.seekVideo = function (frame) {
      if (this.type == "video") {
        this.video.seekTo({ frame:frame });
        this.drawCurrentFrame();
      }
    }
    
}


$(function() {
    $('[data-toggle="tooltip"]').tooltip();
    const mainCanvas = $("#mainCanvas");
    
    const imageView = $("#imageView");
    const videoView = $("#videoView");

    const videoControls = $("#video-controls");
  
    const videoFrameBack = $("#videoFrameBackBtn");
    const videoFrameFastBack = $("#videoFrameFastBackBtn");
    const videoFrameForward = $("#videoFrameForwardBtn");
    const videoFrameFastForward = $("#videoFrameFastForwardBtn");
    
    const viewHandler = new ViewHandler();

    videoControls.on("click", "#videoPlayPauseBtn", function () {
      if (viewHandler.playPauseVideo()) {
        if (viewHandler.videoPaused) {
          $("#videoPlayPauseBtn").removeClass("fa-pause").addClass("fa-play");
        } else {
          $("#videoPlayPauseBtn").removeClass("fa-play").addClass("fa-pause");
        }
      }
    });
    
    videoFrameBack.click(function () {
      viewHandler.videoPreviousFrame(1);
    });
    
    videoFrameForward.click(function() {
      viewHandler.videoNextFrame(1);
    });
    
    videoFrameFastBack.click(function() {
        viewHandler.videoPreviousFrame(5);
    });

    videoFrameFastForward.click(function () {
        viewHandler.videoNextFrame(5);
    });

    mainCanvas.hide();
    imageView.hide();
    videoView.hide();

    imageView.on("load", function (event) {
        viewHandler.loadFile("image", $(this).attr("data-id"), $(this).attr("data-original"));
    });

    videoView.on("loadeddata", function() {
        viewHandler.loadFile("video", $(this).attr("data-id"), $(this).attr("data-original"));
    })
    
    const navFileName = $("#nav-filename");
    const fileList = $(".file-list");
    fileList.on("click", ".file-list-name", function (event) {
        const listItem = $(this).parent();
        const fileType = listItem.attr("data-type");

        const ID = listItem.attr("data-id");
        const originalFileName = listItem.attr("data-original");

        const dataSrc = `/data/${ID}`;
        if (fileType == "image") {
            imageView.attr("data-id", ID);
            imageView.attr("data-original", originalFileName);
            imageView.attr("src", dataSrc);
        } else {
            videoView.attr("data-id", ID);
            videoView.attr("data-original", originalFileName);
            videoView.attr("src", dataSrc);
        }
    });
});
