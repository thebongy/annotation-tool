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
    const fileList = $(".file-list");
    console.log("sending request");
    $.ajax({
            url: uploadFileForm.attr("action"),
            method: "POST",
            data: new FormData(uploadFileForm[0]),
            processData: false,
            contentType: false,
            success: function(data){
                const fileType = data["type"];
                let icon;
                if (fileType === "image") {
                    icon = "<i class='hover-icon far fa-image'></i>";
                } else {
                    icon = "<i class='hover-icon fas fa-video'></i>";
                }

                const newFileHTML = $(`<li class="list-group-item">
              <span class="list-file-name">
                ${icon}
                ${data["original"]}
              </span>
              </li>`)

                const delBtn = $(`<i data-ID="${data["id"]}" class="hover-icon list-del-icon far fa-trash-alt"></i>`);
                newFileHTML.append(delBtn);
                fileList.append(newFileHTML);
            },
            error: function(er){}
    });
};

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
