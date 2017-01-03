/*jslint browser: true*/
/*global $, jQuery, alert, x3dom, console*/

var BASE = "";

function setEnv(path) {
    'use strict';
    BASE = path;
}

function startLoading() {
    'use strict';
}

function openLink(page) {
    'use strict';
    $("#content").load(page + " #content-data");
    //window.history.pushState(null, "", page);
}

function registerLinks() {
    'use strict';
    $("a").not(".link-anchor").not(".link-external").click(function (event) {
        event.preventDefault();
        var a = $(this),
            href = a.attr("href");

        // If a link has the no-action class, then do nothing
        if(a.hasClass("no-action"))
            return false;

        $('#content').hide(0);
        $('#progressbar').show(0);

        $("#content").load(href + " #content-data");
        return false;
    });
}

//Called when Form submit was submited
function showFormResponse(responseText, statusText, xhr, $form) {
    'use strict';
    $("#content").html($(responseText).find("#content-data")).fadeIn('slow');
}

function showRequest(formData, jqForm, options) {
    'use strict';
    if(!$(jqForm).hasClass("no-progbar")) {
        $('#content').hide(0);
        $('#progressbar').show(0);
    }
}

function registerForm() {
    'use strict';
    
    var data = {
        success:  showFormResponse,
        beforeSubmit: showRequest
    };
    $('form').ajaxForm(data);
}

function submitForm(form) {
    'use strict';
    var data = {
        success:  showFormResponse,
        beforeSubmit: showRequest
    };
    $(form).ajaxSubmit(data);
}

function registerHoverImages(form) {
    'use strict';
    $('img[rel=popover]').popover({
        html: true,
        trigger: 'hover',
        placement: 'auto',
        container: 'body',
        content: function () {
            return '<img class="img-responsive" src="' + this.src + '" />';
        }
    });
}

function onNodeSelected(event, data) {
    'use strict';
    $('#content').hide();
    $('#progressbar').show();

    //$('#content').fadeOut("fast");
    //$('#progressbar').show();

    //Check if the selected node is pointing on github, so we open the link in a new tab
    if(data.href.includes("github.com"))
    {
        window.open(data.href, '_blank');
    }
    else {
        $("#content").load(data.href + " #content-data");
    }
    $(this).treeview('toggleNodeExpanded',data.nodeId)
}

function tree_fill() {
    'use strict';
    $.getJSON(BASE + 'api_json.php?mode="tree_category"', function (tree) {
        $('#tree-categories').treeview({data: tree, enableLinks: false, showBorder: true, onNodeSelected: onNodeSelected}).treeview('collapseAll', { silent: true });
    });
    
    $.getJSON(BASE + 'api_json.php?mode="tree_devices"', function (tree) {
        $('#tree-devices').treeview({data: tree, enableLinks: false, showBorder: true, onNodeSelected: onNodeSelected}).treeview('collapseAll', { silent: true });
    });
    
    $.getJSON(BASE + 'api_json.php?mode="tree_tools"', function (tree) {
        $('#tree-tools').treeview({data: tree, enableLinks: false, showBorder: true, onNodeSelected: onNodeSelected}).treeview('collapseAll', { silent: true });
    });
}

function onModelNodeSelected(event, data)
{
    //$("#x3d-footprints > inline").attr("url", data.href);
    //x3dom.reload();

    if(data.href != $('#inlineBox').attr('url') && data.href!="")
    {
        $('#inlineBox').attr('url', data.href);
        $('#inlineBox2').attr('url', data.href);
    }

}

function fill_model_tree()
{
    //Check if the treemodel is existing and not initialized.
    if($("#tree-models").length && $("#tree-models").children().length == 0) {

        $.getJSON(BASE + 'api_json.php?mode="tree_models"', function (tree) {
            $('#tree-models').treeview({
                data: tree,
                enableLinks: false,
                showBorder: true,
                onNodeSelected: onModelNodeSelected
            }).treeview('collapseAll', {silent: true});
        });

        var search = function () {
            var term = $("#modelselect-search").val();
            if (term == "") {
                $("#tree-models").treeview('clearSearch');
            }
            else {
                $('#tree-models').treeview('search', [term, {
                    ignoreCase: true,     // case insensitive
                    exactMatch: false,    // like or equals
                    revealResults: true,  // reveal matching nodes
                    hideOthers: true
                }]);
            }
        };

        $("#modelselect-search").change(search);
        $("#modelselect-search-btn").click(search);

        $("#modelselect-search-clear").click(function(){
            $("#tree-models").treeview('clearSearch');
            $("#modelselect-search").val("");
        });

        $('#activate_headlight').change(function () {
            $("#head").attr("headlight", $("#activate_headlight").prop("checked"));
        })

        $('#bg-color').change(function() {
            $('#x3d-footprints').css('background-color', $('#bg-color').val());
            //x3dom.reload();
        });

        $('#speed-slider').change(function () {
            $("#head").attr("speed", $("#speed-slider").val());
        });
    }
}

function bbcode_edit() {
    // Create the editor
    $("textarea").sceditor({
        // Options go here

        // Option 1
        plugins: "bbcode",

        emoticonsEnabled: false,
        runWithoutWysiwygSupport: true
    });
}

function treeview_btn_init() {
    $(".tree-btns").click(function () {
        $(this).parents("div.dropdown").removeClass('open');
        var mode = $(this).data("mode");
        var target = $(this).data("target");

        if(mode==="collapse") {
            $('#' + target).treeview('collapseAll', { silent: true });
        }
        else if(mode==="expand") {
           $('#' + target).treeview('expandAll', { silent: true });
        }
    });
}

$(document).ready(function () {
    'use strict';
    var page = window.location.pathname;
    
    //Only load start page when on index.php (and no content is loaded already)!
    if (page.indexOf(".php") === -1 || page.indexOf("index.php") !== -1) {
        openLink("startup.php");
    }
    tree_fill();
    treeview_btn_init();
    registerForm();
    registerLinks();

    fill_model_tree();

    //bbcode_edit();
    
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });
    // scroll body to 0px on click
    $('#back-to-top').click(function () {
        $('#back-to-top').tooltip('hide');
        $('body,html').animate({
            scrollTop: 0
        }, 800);
        return false;
    }).tooltip('show');

    
});

function scrollUpForMsg()
{
    if($("#messages").length)
    {
        $('#back-to-top').tooltip('hide');
        $('body,html').animate({
            scrollTop: 0
        }, 400);
        return false;
    }
}

function makeSortTable() {
    'use strict';
    
    if (!$.fn.DataTable.isDataTable('.table-sortable')) {
        $('.table-sortable').DataTable({
            "paging":   false,
            "ordering": true,
            "info":     false,
            "searching":   false,
            "order": [],
            "columnDefs": [ {
                "targets"  : 'no-sort',
                "orderable": false
            }]
        });
        //$(".table-sortable").DataTable().fnDraw();
    }


}

function makeFileInput() {
    'use strict';
    $(".file").fileinput();
}

//Make back in the browser go back in history
window.onpopstate = function (event) {
    'use strict';
    var page = location.href;
    //Go back only when the the target isnt the empty index.
    if (page.indexOf(".php") !== -1 && page.indexOf("index.php") === -1) {
        $('#content').hide(0);
        $('#progressbar').show(0);

        $("#content").load(location.href + " #content-data");
    }
};


function x3dom_auto_width() {
    //$.each($("x3d > canvas"), function () {
    //   $(this).width($(this).parent().width());
    //});
    $("x3d > canvas").width($("x3d > canvas").parent().width());
}

$(document).ajaxComplete(function (event, xhr, settings) {
    'use strict';

    //Hide progressbar and show Result
    $('#progressbar').hide(0);
    //$('#content').show(0);
    $('#content').fadeIn("fast");


    makeSortTable();
    registerLinks();
    registerForm();
    makeFileInput();
    registerHoverImages();
    scrollUpForMsg();

    fill_model_tree();

    x3dom_auto_width();

    
    if ($("x3d").length) {
        try {
            x3dom.reload();
        }
        catch (ex)
        {

        }
    }
        
    //Push only if it was a "GET" request and requested data was an HTML
    if (settings.type.toLowerCase() !== "post" && settings.dataType !== "json" && settings.dataType !== "jsonp") {
        window.history.pushState(null, "", settings.url);
        
        //Set page title from response
        var regex = /<title>(.*?)<\/title>/gi,
            input = xhr.responseText;
        if (regex.test(input)) {
            var matches = input.match(regex);
            for(var match in matches) {
                document.title = $(matches[match]).text();
            }
        }
    }
});


//Called when an error occurs on loading ajax
$(document).ajaxError(function (event, request, settings) {
    'use strict';
    console.log(event);

});

function octoPart_success(response) {
    'use strict';
    $('#description_select').modal('show');
    $('#description').val(response.results[0].snippet);
}

function octoPart() {
    'use strict';
    
    var url = 'http://octopart.com/api/v3/parts/search?',
        part = $('#name').val();
    
    url += '&apikey=e418fbe2';
    
    $.ajax({
        url: url,
 
        // The name of the callback parameter
        jsonp: "callback",
 
        // Tell jQuery we're expecting JSONP
        dataType: "jsonp",
 
        //
        data: {
            q: part
        },
        
        // Work with the response
        success: octoPart_success
    });
}

