function CanvasHandler(canvasElem, imageView, videoView) {
    this.type = undefined;
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
            this.videoView.show();
        } else if (this.type = "image") {
            this.imageView.show();
        }

        this.canvas.show();
    }
}

$(function() {
    const mainCanvas = $("#mainCanvas");
    const imageView = $("#imageView");
    console.log(imageView);
    const videoView = $("#videoView");

    mainCanvas.hide();
    imageView.hide();
    videoView.hide();

    imageView.on("load", function (event) {
        canvasObj.loadFile("image", this.width, this.height);
    });

    videoView.on("loadeddata", function() {
        canvasObj.loadFile("video", this.width, this.height);
    })
    const canvasObj = new CanvasHandler(mainCanvas, imageView, videoView);
    
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
