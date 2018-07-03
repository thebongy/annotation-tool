const START_FRAME_MSG = "Set the current frame as the first frame when the object appears";
const END_FRAME_MSG = "Set the current frame as the last frame when the object appears";

function ObjectList() {
    this.objects = {};
    this.options = {"Object": 0};
    this.init = function (canvasHandler) {
        this.listContainer = $(".object-list");
        this.nameOptionsModal = $("#nameOptionsModal");
        this.saveDataBtn = $("#saveDataBtn");
        this.exportDataBtn = $("#exportDataBtn");

        const options = $("#nameOptions").attr("data-options").split(",");

        for (let i = 0; i < options.length; i++) {
            this.options[options[i]] = 0;
        }

        this.canvasHandler = canvasHandler;

        const self = this;

        this.nameOptionsModal.on("click", "#newNameOptionBtn", function () {
            let ID = $(this).attr("data-id");
            let name = prompt("Name of new annotation type:");
            if (name === "") {
                alert("Empty name not allowed!!");
            } else if (name) {
                self.setObjectName(ID, name);
                self.nameOptionsModal.modal("hide");
            }

        });
        this.nameOptionsModal.on("click", "#saveOptionNameBtn", function () {
            let ID = $(this).attr("data-id");

            const name = $("input[name=nameOption]:checked").attr("value");
            if (name === undefined) {
                alert("Please select atleast one option!!");
            } else {
                self.setObjectName(ID, name);
                self.nameOptionsModal.modal("hide");
            }
        });

        this.listContainer.on("click", ".edit-icon", function () {
            const listElem = $(this).parent().parent().parent();
            const dataID = listElem.attr("data-id");

            $("#saveOptionNameBtn").attr("data-id", dataID);
            $("#newNameOptionBtn").attr("data-id", dataID);
            self.nameOptionsModal.modal("show");
        });

        this.listContainer.on("click", ".setStart-icon", function () {
            const listElem = $(this).parent().parent().parent();
            const dataID = listElem.attr("data-id");
            self.objects[dataID].setStartFrame(self.canvasHandler.currentFrame);
            listElem.find(".frameStartNum").text(self.canvasHandler.currentFrame);
        });

        this.listContainer.on("click", ".setEnd-icon", function () {
            const listElem = $(this).parent().parent().parent();
            const dataID = listElem.attr("data-id");
            self.objects[dataID].setEndFrame(self.canvasHandler.currentFrame);
            listElem.find(".frameEndNum").text(self.canvasHandler.currentFrame);
        });

        this.listContainer.on("click", ".delete-icon", function () {
            $(this).parent().tooltip("hide");
            const listElem = $(this).parent().parent().parent();
            const dataID = listElem.attr("data-id");

            delete self.objects[dataID];
            canvasHandler.deleteObject(dataID);
            listElem.remove();
        });

        this.saveDataBtn.click(function () {
            self.saveAnnotations(function (data) {
                alert(data);
            })
        });

        this.exportDataBtn.click(function () {
            self.exportData();
        });
    }

    this.addNewObject = function (rect, data) {
        if (data === undefined) {
            data = {}
        }

        let text;
        if (data.name !== undefined) {
            if (data.index > this.options[data.name]) {
                this.options[data.name] = data.index;
            }
            text = data.name + " #" + data.index;
        } else {
            data.name = "Object"
            data.index = ++(this.options["Object"]);
            text = "Object #" + data.index;
        }

        let startFrame, endFrame;
        if (data.startFrame === null || data.startFrame === undefined) {
            data.startFrame = null;
            startFrame = "";
        } else {
            startFrame = data.startFrame;
        }

        if (data.endFrame === null || data.endFrame === undefined) {
            data.endFrame = null;
            endFrame = "";
        } else {
            endFrame = data.endFrame;
        }

        const ID = rect.get("OBJ_ID");
        this.listContainer.append(
            `
            <a href="#" class="list-group-item list-group-item-action flex-column align-items-start" data-id=${ID}>
              <div class="d-flex justify-content-between">
                <h5 class="w-100 mb-1 object-list-name">${text}</h5>
                <span data-toggle="tooltip" data-placement="top" title="Edit Object Name">
                    <i class="fas fa-pen hover-icon edit-icon"></i>
                </span>
                <span data-toggle="tooltip" data-html="true" data-placement="top" title="<b>Set Start Frame</b><br>${START_FRAME_MSG}">
                    <i class="fas fa-step-backward ml-2 hover-icon setStart-icon"></i>
                </span>
                <span data-toggle="tooltip" data-html="true" data-placement="top" title="<b>Set End Frame</b><br>${END_FRAME_MSG}">
                    <i class="fas fa-step-forward ml-2 hover-icon setEnd-icon"></i>
                </span>
                <span data-toggle="tooltip" data-placement="top" title="Delete Object">
                    <i class="fas fa-trash ml-2 hover-icon delete-icon"></i>
                </span>
              </div>
              <div class="d-flex justify-content-between">
              <div class="object-list-frameStart">Start: <span class="frameStartNum">${startFrame}</span></div>
              <div class="object-list-frameEnd">End: <span class="frameEndNum">${endFrame}</span></div>
              </div>
            </a>
            `);

        const newObject = new ObjectHandler();
        newObject.init(rect, data, this);

        this.objects[ID] = newObject;

        $('[data-toggle="tooltip"]').tooltip();
    }

    this.selectObject = function (ID) {
        this.listContainer.find("a").removeClass("active");
        this.listContainer.find(`[data-id='${ID}']`).addClass("active");
    }

    this.setObjectName = function (ID, name) {
        this.objects[ID].setName(name);
        this.listContainer
            .find(`[data-id='${ID}']`)
            .find(".object-list-name")
            .text(name);
    }
    this.drawObjects = function (frame) {
        for (const obj in this.objects) {
            this.objects[obj].draw(frame);
        }
    }

    this.serialize = function () {
        let data = {};

        for (const obj in this.objects) {
            data[obj] = this.objects[obj].serialize();
        }

        return data;
    }

    this.exportData = function () {
        let frames = {};

        function addFrameAnnotation(data) {
            if (frames[data.frame] === undefined) {
                frames[data.frame] = [data];
            } else {
                console.log(data);
                frames[data.frame].push(data);
            }
            return frames;
        }

        let data = null;

        // Loop through objects
        for (const ID in this.objects) {
            const obj = this.objects[ID];
            // Sort object annotation by frame index
            const frameData = Object.keys(obj.annotations);
            frameData.sort(function (a, b) {
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                if (aNum > bNum) {
                    return 1;
                } else if (aNum === bNum) {
                    return 0;
                } else {
                    return -1;
                }
            });
            let previous = null;

            // Loop throuogh sorted frame numbers
            for (let i = 0; i < frameData.length; i++) {
                const current = obj.annotations[frameData[i]];
                current.name = obj.name;
                current.index = obj.index;

                // Linear Interpolate, if required.
                if (previous !== null) {
                    for (let j = (previous.frame + 1); j < current.frame; j++) {
                        data = obj.linearInterpolate(previous, {
                            frame: j
                        }, current);
                        data.name = obj.name;
                        data.index = obj.index;
                        addFrameAnnotation(data);
                    }
                }

                // Add current Frame to data
                addFrameAnnotation(current);
                previous = current;
            }
        }

        console.log(frames);
        return frames;
    }

    this.loadAnnotations = function (data) {
        this.listContainer.empty();
        for (obj in data) {
            this.newRectFromData(data[obj]);
        }
    }

    this.saveAnnotations = function (cb) {
        $.ajax({
            type: 'POST',
            url: `/project/${this.fileID}/data`,
            data: JSON.stringify(this.serialize()),
            success: function (data) {
                cb(data);
            },
            contentType: "application/json"
        });
    }

    this.newRectFromData = function (data) {
        let newRect = new fabric.Rect({
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            angle: 0,
            stroke: "white",
            strokeWidth: 2,
            fill: 'rgba(0,0,0,0)'
        });

        this.canvasHandler.canvas.add(newRect);
        newRect.setCoords();
        this.addNewObject(newRect, data);
    }

    this.loadFile = function (fileID, cb) {
        const self = this;
        this.fileID = fileID;
        $.getJSON(`/project/${fileID}/data`, function (data) {
            self.loadAnnotations(data);
            console.log("Done loading");
            cb();
        })
    }
}

function ObjectHandler() {
    this.startFrame = null;
    this.endFrame = null;

    this.hidden = null;

    this.annotations = {};

    this.rect = null;

    this.init = function (rect, data, objectList) {
        this.rect = rect;

        this.name = data.name;
        this.index = data.index;

        this.ID = this.rect.get("OBJ_ID");

        this.rect.set({
            "OBJ": this
        });

        this.objectList = objectList;

        if (data.annotations === undefined) {
            this.annotations = {};
        } else {
            this.annotations = data.annotations;
        }

        this.startFrame = data.startFrame;
        this.endFrame = data.endFrame;

        console.log("Created object with annotations:");
        console.log(this.annotations);
    }

    this.serialize = function () {
        let data = {
            name: this.name,
            index: this.index,
            annotations: this.annotations,
            startFrame: this.startFrame,
            endFrame: this.endFrame
        }
        return data;
    }

    this.draw = function (frame) {
        if (this.startFrame !== null && frame < this.startFrame) {
            this.hide();
        } else if (this.endFrame !== null && frame > this.endFrame) {
            this.hide();
        } else {
            if (this.hidden === true) {
                this.show();
            }

            const adjacent = this.getAdjacentAnnotations(frame);
            if (adjacent.left === null) {
                this.drawRect(adjacent.right);
            } else if (adjacent.right === null) {
                this.drawRect(adjacent.left);
            } else {
                if (adjacent.left.frame === adjacent.right.frame) {
                    this.drawRect(adjacent.left);
                } else {
                    let current = {
                        t: null,
                        l: null,
                        b: null,
                        r: null,
                        frame: frame
                    }
                    current = this.linearInterpolate(adjacent.left, current, adjacent.right);
                    this.drawRect(current);
                }
            }
        }

        this.rect.setCoords();
    }

    this.drawRect = function (position) {
        const top = position.t;
        const left = position.l;
        const width = Math.abs(left - position.r);
        const height = Math.abs(top - position.b);
        this.rect.set({
            top: position.t,
            left: position.l,
            width: width,
            height: height,
            scaleX: 1,
            scaleY: 1
        });

    }

    this.hide = function () {
        this.rect.set({
            visible: false
        });
        this.hidden = true;
    }

    this.show = function () {
        this.rect.set({
            visible: true
        });
        this.hidden = false;
    }

    this.linearInterpolate = function (left, current, right) {
        const totalFrames = right.frame - left.frame;
        const topStep = (right.t - left.t) / totalFrames;
        const leftStep = (right.l - left.l) / totalFrames;
        const bottomStep = (right.b - left.b) / totalFrames;
        const rightStep = (right.r - left.r) / totalFrames;

        const frameDiff = current.frame - left.frame;

        current.t = left.t + (frameDiff * topStep);
        current.l = left.l + (frameDiff * leftStep);
        current.b = left.b + (frameDiff * bottomStep);
        current.r = left.r + (frameDiff * rightStep);

        return current
    }

    this.setStartFrame = function (frame) {
        this.startFrame = frame;
    }

    this.setEndFrame = function (frame) {
        this.endFrame = frame;
    }

    this.setName = function (name) {
        this.name = name;
    }

    this.setFramePosition = function (frame, position) {
        // TODO: Handle Start frame and end frame here?
        position.frame = frame;
        this.annotations[frame] = position;
    }

    this.getAdjacentAnnotations = function (frame) {
        if (this.startFrame !== null && frame < this.startFrame) {
            return {
                hidden: true
            };
        }

        if (this.endFrame !== null && frame > this.endFrame) {
            return {
                hidden: true
            };
        }

        if (this.annotations[frame] !== undefined) {
            return {
                left: this.annotations[frame],
                right: this.annotations[frame]
            }
        }


        let left = null;
        let right = null;

        for (const f in this.annotations) {
            if (f < frame) {
                if (left === null || f > left.frame) {
                    left = this.annotations[f];
                }
            } else {
                if (right === null || f < right.frame) {
                    right = this.annotations[f];
                }
            }
        }

        return {
            left: left,
            right: right
        }
    }

}

function CanvasHandler(canvasID) {
    this.canvasID = canvasID;
    this.canvasElem = $("#" + canvasID);

    this.canvasContainer = $(".canvasContainer");

    this.currentFrame = null;
    this.currentTool = undefined;
    this.cursor = "default";

    this.mouseIsDown = false;

    this.NEW_RECT_TOOL = 0;
    this.MOVE_RECT_TOOL = 1;

    this.init = function () {
        this.objectList = new ObjectList();
        this.objectList.init(this);

        this.canvas = new fabric.Canvas(this.canvasID, {
            uniScaleTransform: true,
            selection: false,
            width: 640,
            height: 480
        });

        this.xLine = new fabric.Line([0, 0, 0, 0], {
            stroke: "#cccccc",
            strokeWidth: 2
        });

        this.yLine = new fabric.Line([0, 0, 0, 0], {
            stroke: "#cccccc",
            strokeWidth: 2
        });

        this.canvas.add(this.xLine);
        this.canvas.add(this.yLine);

        const canvasObj = this;

        this.canvas.on("mouse:down", function (event) {
            canvasObj.mouseDown(event);
        });

        this.canvas.on("mouse:move", function (event) {
            canvasObj.mouseMove(event);
        });

        this.canvas.on("mouse:up", function (event) {
            canvasObj.mouseUp(event);
        });

        this.canvas.on("object:scaled", function (event) {
            canvasObj.objectScaled(event);
        });

        this.canvas.on("object:moved", function (event) {
            canvasObj.objectMoved(event);
        });

        const toolbar = $(".toolbar");

        toolbar.on("click", "#newRectBtn", function (event) {
            canvasObj.currentTool = canvasObj.NEW_RECT_TOOL;
            canvasObj.canvas.defaultCursor = "crosshair";
            $(".toolbar-icon").removeClass("hover-icon-active");
            $(this).addClass("hover-icon-active");
        });

        toolbar.on("click", "#moveRectBtn", function (event) {
            canvasObj.currentTool = canvasObj.MOVE_RECT_TOOL;
            canvasObj.canvas.defaultCursor = "default";

            canvasObj.hideCursorAxes();

            $(".toolbar-icon").removeClass("hover-icon-active");
            $(this).addClass("hover-icon-active");
        })
    }

    this.loadFile = function (width, height, fileID, cb) {
        this.canvasContainer
            .width(width)
            .height(height);
        this.objectList.loadFile(fileID, cb);

    }

    this.drawFrame = function (frame, videoPlaying) {
        if (frame !== this.currentFrame) {
            this.currentFrame = frame;
            this.objectList.drawObjects(frame);
            this.canvas.renderAll();
        }
    }

    this.mouseDown = function (event) {
        this.mouseIsDown = true;
        if (this.currentTool === this.NEW_RECT_TOOL) {
            let pointer = this.canvas.getPointer(event.e)
            this.startX = pointer.x
            this.startY = pointer.y
            this.newRect = new fabric.Rect({
                left: this.startX,
                top: this.startY,
                width: 0,
                height: 0,
                angle: 0,
                stroke: "white",
                strokeDashArray: [5, 5],
                strokeWidth: 2,
                fill: 'rgba(0,0,0,0)'
            });
            this.canvas.add(this.newRect);
        } else if (this.currentTool === this.MOVE_RECT_TOOL) {
            if (event.target) {
                this.objectList.selectObject(event.target.get("OBJ_ID"));
            }
        }
    }

    this.mouseMove = function (event) {
        if (this.currentTool === this.NEW_RECT_TOOL) {

            let pointer = this.canvas.getPointer(event.e);
            let currentX = pointer.x;
            let currentY = pointer.y;

            this.updateCursorAxes(currentX, currentY);

            if (this.mouseIsDown) {
                if (currentX < this.startX) {
                    this.newRect.set({
                        left: currentX
                    });
                }

                if (currentY < this.startY) {
                    this.newRect.set({
                        top: currentY
                    });
                }

                this.newRect.set({
                    width: Math.abs(this.startX - currentX)
                });
                this.newRect.set({
                    height: Math.abs(this.startY - currentY)
                });

            }

            this.canvas.renderAll();
        }
    }

    this.mouseUp = function (event) {
        if (this.currentTool === this.NEW_RECT_TOOL && this.mouseIsDown) {
            this.newRect.set({
                strokeDashArray: []
            });
            this.newRect.setCoords();
            this.addNewObject(this.newRect);
        }
        this.mouseIsDown = false;
    }

    this.addNewObject = function (rect) {
        let newObjID = generateID();
        rect.set({
            OBJ_ID: newObjID
        });

        this.objectList.addNewObject(rect);
        this.updateObjectProperties(rect);
    }
    this.updateCursorAxes = function (pointerX, pointerY) {
        this.xLine.set({
            x1: 0,
            y1: pointerY,
            x2: this.canvas.getWidth(),
            y2: pointerY
        });
        this.yLine.set({
            x1: pointerX,
            y1: 0,
            x2: pointerX,
            y2: this.canvas.getHeight()
        });
    }

    this.hideCursorAxes = function () {
        this.xLine.set({
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0
        });
        this.yLine.set({
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0
        });
        this.canvas.renderAll();
    }

    this.updateObjectProperties = function (rect) {
        rect.setCoords();
        const coords = rect.oCoords;
        const objID = rect.get("OBJ_ID");
        const obj = rect.get("OBJ");

        const t = coords.tl.y;
        const l = coords.tl.x;

        const b = coords.br.y - 2;
        const r = coords.br.x - 2;
        const width = Math.abs(r - l);
        const height = Math.abs(b - t);
        const position = {
            t: t,
            l: l,
            b: b,
            r: r,
            frame: this.currentFrame
        }

        rect.set({
            top: t,
            left: l,
            width: width,
            height: height,
            scaleX: 1,
            scaleY: 1
        });
        rect.setCoords();
        obj.setFramePosition(this.currentFrame, position);
    }

    this.deleteObject = function (ID) {
        console.log("deleting", ID);
        const objects = this.canvas.getObjects();
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].get("OBJ_ID") === ID) {
                const obj = objects[i].get("OBJ");
                obj.hide();
                this.canvas.remove(objects[i]);
                break;
            }
        }
    }

    this.objectScaled = function (event) {
        this.updateObjectProperties(event.target);
    }

    this.objectMoved = function (event) {
        this.updateObjectProperties(event.target);
    }
}


function generateID() {
    return '_' + Math.random().toString(36).substr(2, 9);
}