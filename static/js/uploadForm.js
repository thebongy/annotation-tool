$(function () {
    const fileList = $(".file-list");
    const delBtns = $(".list-del-icon");
    const addFileBtn = $("#addFileBtn");
    fileList.on("click", ".list-del-icon", function(event) {
        delFile($(this).parent(), $(this).attr("data-id"));
    });
    addFileBtn.change(function() {
        addFile();
    })
})

function addFile() {
    let uploadFileForm = $("#uploadFileForm");
    let addFileBtn = $("#addFileBtn");

    const fileName = addFileBtn[0].files[0].name;
    console.log(fileName);

    $.ajax({
      url: uploadFileForm.attr("data-add"),
      type: "get", //send it through get method
      data: { 
        file: fileName
      },
      success: function(response) {
        if (response === "Not Found") {
            uploadFile();
        } else {
            addToList(response);
        }
      },
      error: function(xhr) {
      }});
};

function uploadFile() {
    let uploadFileForm = $("#uploadFileForm");
    $.ajax({
            url: uploadFileForm.attr("data-upload"),
            method: "POST",
            data: new FormData(uploadFileForm[0]),
            processData: false,
            contentType: false,
            success: function(data){
                addToList(data);
            },
            error: function(er){}
    });
}

function addToList(data) {
    const fileList = $(".file-list");

    const fileType = data["type"];
    let icon;
    if (fileType === "image") {
        icon = "<i class='hover-icon far fa-image'></i>";
    } else {
        icon = "<i class='hover-icon fas fa-video'></i>";
    }

    const newFileHTML = $(`<li class="file-list-item list-group-item" data-original="${data["original"]}" data-ID="${data["id"]}" data-type="${fileType}">
  <span class="file-list-name">
    ${icon}
    ${data["original"]}
  </span>
  </li>`)

    const delBtn = $(`<i data-ID="${data["id"]}" class="hover-icon list-del-icon far fa-trash-alt"></i>`);
    newFileHTML.append(delBtn);
    fileList.append(newFileHTML);
}

function delFile(listElem, ID) {
    $.ajax({
            url: "/deleteFile/" + ID,
            method: "POST",
            success: function(data){
                console.log("deleted");
                listElem.remove();
            },
            error: function(er){}
    });
}
