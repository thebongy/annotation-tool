const START_FRAME_MSG = "Set the current frame as the first frame when the object appears";
const END_FRAME_MSG = "Set the current frame as the last frame when the object appears";


function Group(name, container) {
    this.name = name;
    this.container = container;
    this.count = 0;

    this.objects = [];

    this.ID = generateID();

    this.groupElem = $($.parseHTML(`
    <a href="#collapse${this.ID}" data-toggle="collapse" class="list-group-item list-group-item-action flex-column align-items-start">
        <div class="d-flex justify-content-between">
            <h5 class="w-100 mb-1 group-list-name">${name}</h5>
        </div>
    </a>
    <div class="collapse" id="collapse${this.ID}">
        <div class="card card-body">
        </div>
    </div>
    `));

    this.nameElem = this.groupElem.find(".group-list-name");
    this.objectsContainer = this.groupElem.find(".card-body");

    container.append(this.groupElem);

    this.newObject = function(listElem) {
        const index = listElem.obj.count;
        if (index != undefined) {
            if (index > this.count) {
                listElem.obj.setCount(index);
                this.count = index;
            }
        } else {
            listElem.obj.setCount(++this.count);
        }
        
        this.objects.push(listElem);
        this.objectsContainer.append(listElem.listElem);
    }

    this.deleteObject = function(listElem) {
        const ID = listElem.obj.ID;
        for (let i = 0; i<this.objects.length; i++) {
            if (this.objects[i].obj.ID === ID) {
                this.objects.splice(i,1);
                break;
            }
        }
    }

    this.viewUpdate = function(hideObjects) {
        let count = 0;
        this.objects.forEach(function (listElem) {
            if (listElem.obj.hidden) {
                if (hideObjects) {
                    listElem.hide();
                } else {
                    count++;
                    listElem.show();
                }
            } else {
                count++;
                listElem.show();
            }
        });

        this.nameElem.text(`${this.name} (${count})`);
    }
}

function ListElement() {
    this.listElem = $($.parseHTML(`
        <a href="#" class="list-group-item list-group-item-action flex-column align-items-start">
          <div class="d-flex justify-content-between">
            <h5 class="w-100 mb-1 object-list-name"></h5>
            <span class="edit-icon "data-toggle="tooltip" data-placement="top" title="Edit Object Name">
                <i class="fas fa-pen hover-icon"></i>
            </span>
            <span class="setStart-icon" data-toggle="tooltip" data-html="true" data-placement="top" title="<b>Set Start Frame</b><br>${START_FRAME_MSG}">
                <i class="fas fa-step-backward ml-2 hover-icon"></i>
            </span>
            <span class="setEnd-icon" data-toggle="tooltip" data-html="true" data-placement="top" title="<b>Set End Frame</b><br>${END_FRAME_MSG}">
                <i class="fas fa-step-forward ml-2 hover-icon setEnd-icon"></i>
            </span>
            <span class="delete-icon" data-toggle="tooltip" data-placement="top" title="Delete Object">
                <i class="fas fa-trash ml-2 hover-icon"></i>
            </span>
          </div>
          <div class="d-flex justify-content-between">
          <div class="object-list-frameStart">Start: <span class="frameStartNum"></span></div>
          <div class="object-list-frameEnd">End: <span class="frameEndNum"></span></div>
          </div>
        </a>
        `));
    // Text Fields of the element
    this.nameElement = this.listElem.find(".object-list-name");
    this.startFrameElem = this.listElem.find(".frameStartNum");
    this.endFrameElem = this.listElem.find(".frameEndNum");


    // Icon controls
    this.editIcon = this.listElem.find(".edit-icon");
    this.setStartIcon = this.listElem.find(".setStart-icon");
    this.setEndIcon = this.listElem.find(".setEnd-icon");
    this.deleteIcon = this.listElem.find(".delete-icon");

    // container.append(this.listElem);

    $('[data-toggle="tooltip"]').tooltip();

    this.init = function (obj) {
        this.obj = obj;
        
        this.updateName(obj.name);
        this.updateStartFrame(obj.startFrame);
        this.updateEndFrame(obj.endFrame);

        const self = this;

        this.editIcon.click(function() {
            self.obj.objectList.showGroupWindow(self.obj.ID);
        });

        this.setStartIcon.click(function() {
            self.obj.setStartFrame();
        });

        this.setEndIcon.click(function () {
            self.obj.setEndFrame();
        });

        this.deleteIcon.click(function () {
            self.obj.deleteObj();
        })

        this.listElem.click(function() {
            if (self.obj.hidden) {
                alert("Object isn't on view currently!");
            } else {
                self.obj.makeActiveSelection();
            }
        });
    }

    this.setGroup = function (group) {
        this.group = group;
        group.newObject(this);
    }

    this.updateName = function (name) {
        this.nameElement.text(name);
    }
    this.updateStartFrame = function (frame) {
        if (frame == null) {
            frame = "";
        }

        this.startFrameElem.text(frame);
    }

    this.updateEndFrame = function (frame) {
        if (frame == null) {
            frame = "";
        }

        this.endFrameElem.text(frame);
    }

    this.deleteObj = function() {
        this.listElem.remove();
    }

    this.hide = function() {
        this.listElem.hide();
        this.hidden = true;
    }

    this.show = function() {
        this.listElem.show();
        this.hidden = false;
    }

    this.select = function() {
        this.listElem.addClass("active");
    }

    this.unselect = function() {
        this.listElem.removeClass("active");
    }
}

function ObjectList() {
    this.objects = {};

    this.init = function (canvasHandler) {
        this.listContainer = $(".object-list");
        
        this.hideObjectsCheck = $("#hideObjectsCheck");
        this.hideObjectsCheck.prop("checked", true);
        this.hideObjects = true;

        this.nameOptionsModal = $("#nameOptionsModal");
        this.saveOptionBtn = $("#saveOptionNameBtn");

        this.saveDataBtn = $("#saveDataBtn");
        this.exportDataBtn = $("#exportDataBtn");

        this.canvasHandler = canvasHandler;

        this.nameOptions = $("#nameOptions");
        const groupNames = this.nameOptions.attr("data-options").split(",");

        this.groups = {};
        for (let i = 0; i < groupNames.length; i++) {
            this.groups[groupNames[i]] = new Group(groupNames[i], this.listContainer);
        }

        const self = this;


        this.hideObjectsCheck.change(function () {
            self.hideObjects = $(this).prop("checked");
            self.updateGroupViews();
        });

        this.saveOptionBtn.click(function () {
            const ID = $(this).attr("data-id");
            const name = $("input[name=nameOption]:checked").attr("value");
            if (name === undefined) {
                alert("Please select atleast one option!!");
            } else {
                self.objects[ID].setName(name);
                self.nameOptionsModal.modal("hide");
            }
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
            data = {
                name: "Object"
            }
        }

        if (this.groups[data.name] == undefined) {
            this.groups[data.name] = new Group(data.name, this.listContainer);
        }

        const ID = rect.get("OBJ_ID");
        
        const newListElem = new ListElement(this.listContainer);

        const newObject = new ObjectHandler();
        newObject.init(rect, data, this, newListElem);

        this.groups[data.name].newObject(newListElem);
        this.objects[ID] = newObject;

        this.updateGroupViews();
    }

    this.changeObjGroup = function (ID, oldGroup, newGroup) {
        const obj = this.objects[ID];
        const listElem = obj.listElem;

        this.groups[oldGroup].deleteObject(listElem);
        this.groups[newGroup].newObject(listElem);

        this.updateGroupViews();
    }

    this.deleteObj = function (ID) {
        const obj = this.objects[ID];
        const group = obj.name;
        this.groups[group].deleteObject(obj.listElem);

        this.canvasHandler.deleteObj(obj);
        delete this.objects[ID];
    }

    this.selectObject = function (ID) {
        const obj = this.objects[ID];
        const listElem = obj.listElem;

        if (this.currentSelected != null) {
            this.currentSelected.unselect();
        }

        listElem.select();
        this.currentSelected = listElem;
    }

    this.makeActiveSelection = function (obj) {
        this.canvasHandler.makeActiveSelection(obj.rect);

        this.selectObject(obj.ID);
    }

    this.unselectAll = function () {
        this.currentSelected.unselect();
        this.currentSelected = null;
    }

    this.getCurrentFrame = function () {
        return this.canvasHandler.currentFrame;
    }

    this.drawObjects = function (frame) {
        for (const obj in this.objects) {
            this.objects[obj].draw(frame);
        }

        this.updateGroupViews();
    }

    this.updateGroupViews = function() {
        for (const group in this.groups) {
            this.groups[group].viewUpdate(this.hideObjects);
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

                // Linear Interpolate, if required.
                if (previous !== null) {
                    for (let j = (previous.frame + 1); j < current.frame; j++) {
                        data = obj.linearInterpolate(previous, {
                            frame: j
                        }, current);
                        data.name = obj.name;
                        addFrameAnnotation(data);
                    }
                }

                // Add current Frame to data
                addFrameAnnotation(current);
                previous = current;
            }
        }

        return frames;
    }

    this.loadAnnotations = function (data) {
        for (const obj in this.objects) {
            this.objects[obj].deleteObj();
        }

        for (const group in this.groups) {
            this.groups[group].count = 0;
        }

        for (const obj in data) {
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

        this.canvasHandler.addNewObject(newRect, data);
    }

    this.loadFile = function (fileID, cb) {
        const self = this;
        this.fileID = fileID;
        $.getJSON(`/project/${fileID}/data`, function (data) {
            self.loadAnnotations(data);
            cb();
        })
    }

    this.showGroupWindow = function (ID) {
        const obj = this.objects[ID];
        this.saveOptionBtn.attr("data-id", ID);

        this.nameOptionsModal.modal("show");
    }
}

function ObjectHandler() {
    this.startFrame = null;
    this.endFrame = null;

    this.hidden = null;

    this.annotations = {};

    this.rect = null;

    this.init = function (rect, data, objectList, listElem) {
        this.rect = rect;

        this.name = data.name;

        this.count = data.count;
        this.startFrame = data.startFrame;
        this.endFrame = data.endFrame;

        if (data.annotations === undefined) {
            this.annotations = {};
        } else {
            this.annotations = data.annotations;
        }

        this.ID = this.rect.get("OBJ_ID");

        this.listElem = listElem;

        this.rect.set({
            "OBJ": this
        });

        this.objectList = objectList;

        this.listElem.init(this);
    }

    this.serialize = function () {
        let data = {
            name: this.name,
            count: this.count,
            annotations: this.annotations,
            startFrame: this.startFrame,
            endFrame: this.endFrame
        }
        return data;
    }

    this.makeActiveSelection = function () {
        this.objectList.makeActiveSelection(this);
    }

    this.draw = function (frame) {
        if (this.startFrame != null && frame < this.startFrame) {
            this.hide();
        } else if (this.endFrame != null && frame > this.endFrame) {
            this.hide();
        } else {
            if (this.hidden === true) {
                this.show();
            }

            const adjacent = this.getAdjacentAnnotations(frame);
            if (adjacent.left == null) {
                this.drawRect(adjacent.right);
            } else if (adjacent.right == null) {
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

    this.setCount = function (count) {
        this.count = count;
        this.listElem.updateName(`${this.name} #${count}`);
    }

    this.setStartFrame = function () {
        const frame = this.objectList.getCurrentFrame();
        this.startFrame = frame;
        this.listElem.updateStartFrame(frame);
    }

    this.setEndFrame = function () {
        const frame = this.objectList.getCurrentFrame();
        this.endFrame = frame;
        this.listElem.updateEndFrame(frame);
    }

    this.deleteObj = function () {
        this.objectList.deleteObj(this.ID);
        this.listElem.deleteObj();
    }

    this.setName = function (name) {
        const oldName = this.name;
        this.name = name;
        this.count = null;
        this.objectList.changeObjGroup(this.ID, oldName, name);
        // No need to update listElem as count isn't known.
    }

    this.setFramePosition = function (frame, position) {
        // TODO: Handle Start frame and end frame here?
        position.frame = frame;
        this.annotations[frame] = position;
    }

    this.getAdjacentAnnotations = function (frame) {
        if (this.startFrame != null && frame < this.startFrame) {
            return {
                hidden: true
            };
        }

        if (this.endFrame != null && frame > this.endFrame) {
            return {
                hidden: true
            };
        }

        if (this.annotations[frame] != undefined) {
            return {
                left: this.annotations[frame],
                right: this.annotations[frame]
            }
        }


        let left = null;
        let right = null;

        for (const f in this.annotations) {
            if (f < frame) {
                if (left == null || f > left.frame) {
                    left = this.annotations[f];
                }
            } else {
                if (right == null || f < right.frame) {
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

    this.makeActiveSelection = function (rect) {
        this.canvas.setActiveObject(rect);
        this.canvas.renderAll();
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
            } else {
                this.objectList.unselectAll();
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

    this.addNewObject = function (rect, data) {
        let newObjID = generateID();
        rect.set({
            OBJ_ID: newObjID
        });

        this.objectList.addNewObject(rect, data);

        if (data != undefined) {
            // Adding from data, rect not on canvas.
            this.canvas.add(rect);
        } else {
            this.updateObjectProperties(rect);
        }
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

    this.deleteObj = function (obj) {
        this.canvas.remove(obj.rect);
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