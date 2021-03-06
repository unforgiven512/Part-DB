//import {addURLparam, openInNewTab, openLink, scrollUpForMsg} from "./functions";

let BASE="";


/****************************************************************************************
 * **************************************************************************************
 *                                      AjaxUI Class
 * **************************************************************************************
 ****************************************************************************************/


class AjaxUI {

    private static singleton : AjaxUI;

    private _this = this;

    private ajax_complete_listeners : Array<() => void> = [];
    private start_listeners : Array<() => void> = [];

    private trees_filled : boolean = false;

    private xhrPool : Array<JQueryXHR> = [];

    /**
     * Creates a new AjaxUI object.
     */
    private constructor()
    {
        //Make back in the browser go back in history
        window.onpopstate = this.onPopState;
        $(document).ajaxError(this.onAjaxError.bind(this));
        $(document).ajaxComplete(this.onAjaxComplete.bind(this));
    }

    /****************************************************************************
     * Public functions
     ***************************************************************************/

    /**
     * Gets a instance of AjaxUI. If no instance exits, then a new one is created.
     * @returns {AjaxUI} A instance of AjaxUI.
     */
    public static getInstance() : AjaxUI
    {
        if(AjaxUI.singleton == null || AjaxUI.singleton == undefined)
        {
            AjaxUI.singleton = new AjaxUI();
        }
        return AjaxUI.singleton;
    }

    /**
     * Starts the ajax ui und execute handlers registered in addStartAction().
     * Should be called in a document.ready, after handlers are set.
     */
    public start()
    {
        let page : string = window.location.pathname;

        //Set base path
        BASE = getBasePath();

        let _this = this;

        $.ajaxSetup(
            {beforeSend: function(jqXHR) { _this.xhrPool.push(jqXHR); }
            });

        this.checkRedirect();

       /* //Only load start page when on index.php (and no content is loaded already)!
        if (page.indexOf(".php") === -1 || page.indexOf("index.php") !== -1) {
            openLink("startup.php");
        }*/

        this.tree_fill();
        this.registerForm();
        this.registerLinks();

        //Calls registered actions
        for (let entry of this.start_listeners)
        {
            entry();
        }
    }

    /**
     * Check if the Page should be redirected.
     */
    public checkRedirect()
    {
        if($("input#redirect_url").val() != null) {
            let redirect_url : string = $("input#redirect_url").val().toString();
            if(redirect_url != "") {
                openLink(redirect_url);
            }
        }
    }

    /**
     * Register a function, which will be executed every time, a ajax request was successful.
     * Should be used to register functions for elements in the #content div
     * @param {() => void} func The function which should be registered.
     */
    public addAjaxCompleteAction(func : ()=>void)
    {
        this.ajax_complete_listeners.push(func);
    }

    /**
     * Register a function, which will be called once, when start() is run.
     * Should be used to register functions for elements outside the #content div.
     * @param {() => void} func The function which should be registered.
     */
    public addStartAction(func: ()=>void)
    {
        this.start_listeners.push(func);
    }

    /*****************************************************************************
     * Form functions
     *****************************************************************************/

    /**
     * Registers all forms to use with jQuery.Form
     */
    private registerForm() {
        'use strict';

        let data : JQueryFormOptions = {
            success:  this.showFormResponse,
            beforeSubmit: this.showRequest,
            beforeSerialize: this.form_beforeSerialize
        };
        $('form').not(".no-ajax").ajaxForm(data);
    }



    /**
     * Called when Form submit was submited and we received a response.
     * We use it load the ajax content into the #content div and deactivate the loading bar.
     */
    private showFormResponse(responseText, statusText, xhr, $form) {
        'use strict';
        $("#content").html($(responseText).find("#content-data").html()).fadeIn('slow');
    }

    /**
     * Modify the form, so tristate checkbox values are submitted, even if the checkbox is not a succesfull control (value = checked)
     * @param $form
     * @param options
     */
    private form_beforeSerialize($form, options) {
        $form.find("input[type=checkbox].tristate").each(function(index)  {
                let name = $(this).attr("name");
                let value = $(this).val();
                $form.append('<input type="hidden" name="' + name + '" value="' + value + '">');
        });

        $form.find("input[type=checkbox].tristate").remove();

        return true;
    }

    /**
     * Called directly after a form was submited, and no content is requested yet.
     * We use it to show a progbar, if the form dont have a .no-progbar class.
     * @param formData Array<any>
     * @param jqForm
     * @param options
     */
    private showRequest(formData, jqForm: JQuery<HTMLElement>, options: JQueryFormOptions) : boolean {
        'use strict';
        if(!$(jqForm).hasClass("no-progbar")) {
            $('#content').hide(0);
            $('#progressbar').show(0);
        }
        return true;
    }

    /**
     * Unregister the form submit event on every button which has a "submit" class.
     * We need this, because when a form has multiple submit buttons, it is not specified, whose value is transmitted.
     * In that case, you has to call submitFormSubmitBtn() in onclick handler.
     */
    private registerSubmitBtn()
    {
        let _this = this;
        $("button.submit").unbind("click").click(function(){
            _this.submitFormSubmitBtn($(this).closest("form"), this);
        });
    }

    /**
     * Submit the given Form and shows a loading bar, if the form doesn't have a ".no-progbar" class.
     * @param form The Form which should be submited.
     */
    public submitForm(form) {
        'use strict';
        let data : JQueryFormOptions = {
            success: this.showFormResponse,
            beforeSubmit: this.showRequest
        };
        $(form).ajaxSubmit(data);
    }

    /**
     * Submit a form, via the given Button (it's value gets appended to request).
     * Needed when the submit buttons in the form has the "submit" class and we has to submit the form manually.
     * @param form The form which should be submited.
     * @param btn The button, which was pressed to submit the form.
     */
    public submitFormSubmitBtn(form, btn) {
        let name : string = $(btn).attr('name');
        let value : string = $(btn).attr('value');
        if(value === undefined)
            value = "";

        $(form).append('<input type="hidden" name="' + name + '" value="' + value + '">');
        this.submitForm(form);
    }

    /********************************************************************************
     * Link functions
     ********************************************************************************/

    /**
     * Registers every link (except the ones with .link-external or .link-anchor classes) for usage of Ajax.
     */
    private registerLinks() : void {
        'use strict';
        var _this = this;

        $("a").not(".link-anchor").not(".link-collapse").not(".link-external").not(".tree-btns")
            .not(".back-to-top").not(".link-datasheet").unbind("click").click(function (event) {
            event.preventDefault();
            let a = $(this);
            if(a.attr("href") != null) {
                let href : string = addURLparam(a.attr("href"), "ajax"); //We dont need the full version of the page, so request only the content
                _this.abortAllAjax();

                $('#content').hide(0).load(href + " #content-data");
                $('#progressbar').show(0);
                return true;
            }
        });
        
        $("a.link-anchor").unbind("click").click(function (event) {
            event.preventDefault();
            scrollToAnchor($(this).prop("hash"));
        })
    }

    /***********************************************************************************
     * TreeView functions
     ***********************************************************************************/

    /**
     * Called whenever a node from the TreeView is clicked.
     * We use it to start a ajax request, to expand the node and to close the sidebar div on mobile view.
     * When the link contains "github.com" the link is opened in a new tab: We use this for the help node.
     * @param event
     * @param {BootstrapTreeViewNodeData} data
     */
    private onNodeSelected(event, data : BootstrapTreeViewNodeData) {
        'use strict';
        if(data.href.indexOf("github.com") !== -1 || data.href.indexOf("phpdoc") !== -1)  //If the href points to github, then open it in new tab. TODO: Find better solution to detect external links.
        {
            openInNewTab(data.href);
            $(this).treeview('toggleNodeSelected',data.nodeId);
        }
        else
        {
            AjaxUI.getInstance().abortAllAjax();
            $('#content').hide().load(addURLparam(data.href, "ajax") + " #content-data");
            $('#progressbar').show();
        }

        $(this).treeview('toggleNodeExpanded',data.nodeId);

        $("#sidebar").removeClass("in");
    }

    /**
     * Called whenever a node from the TreeView is clicked.
     * We use it to start a ajax request, to expand the node and to close the sidebar div on mobile view.
     * When the link contains "github.com" the link is opened in a new tab: We use this for the help node.
     * @param event
     * @param {BootstrapTreeViewNodeData} data
     */
    private onNodeContextmenu(event, data : BootstrapTreeViewNodeData) {
        'use strict';

        if(data.href !== "") {
            openInNewTab(data.href);
        }
    }

    /**
     * Request JSON files describing the TreeView nodes and fill them with that.
     */
    private tree_fill() {
        'use strict';

        let node_handler = this.onNodeSelected;
        let contextmenu_handler = this.onNodeContextmenu;

        $.getJSON(BASE + 'api.php/1.0.0/tree/categories', function (tree : BootstrapTreeViewNodeData[]) {
            $("#tree-categories").treeview({data: tree, enableLinks: false, showIcon: false
                ,showBorder: true, onNodeSelected: node_handler, onNodeContextmenu: contextmenu_handler }).treeview('collapseAll', { silent: true });
        });

        $.getJSON(BASE + 'api.php/1.0.0/tree/devices', function (tree :BootstrapTreeViewNodeData[]) {
            $('#tree-devices').treeview({data: tree, enableLinks: false, showIcon: false,
                showBorder: true, onNodeSelected: node_handler, onNodeContextmenu: contextmenu_handler}).treeview('collapseAll', { silent: true });
        });

        $.getJSON(BASE + 'api.php/1.0.0/tree/tools', function (tree :BootstrapTreeViewNodeData[]) {
            $('#tree-tools').treeview({data: tree, enableLinks: false, showIcon: false,
                showBorder: true, onNodeSelected: node_handler, onNodeContextmenu: contextmenu_handler}).treeview('collapseAll', { silent: true });
        });

        this.trees_filled = true;
    }


    /**
     * Update the treeviews.
     */
    public updateTrees()
    {
        this.tree_fill();
    }

    /**
     * Aborts all currently active XHR requests.
     */
    public abortAllAjax()
    {
        let _this = this;
        $(this.xhrPool).each(function(i, jqXHR : JQueryXHR) {   //  cycle through list of recorded connection
            jqXHR.abort();  //  aborts connection
            _this.xhrPool.splice(i, 1); //  removes from list by index
        });
    }

    /********************************************************************************************
     * Common ajax functions
     ********************************************************************************************/

    /**
     * Called when an error occurs on loading ajax. Outputs the message to the console.
     */
    private onAjaxError (event, request, settings) {
        'use strict';
        //Ignore aborted requests.
        if (request.statusText =='abort') {
            return;
        }

        console.log(event);
        //If it was a server error and response is not empty, show it to user.
        if(request.status == 500 && request.responseText !== "")
        {
            console.log("Response:" + request.responseText);
        }
    }

    /**
     * This function gets called every time, the "back" button in the browser is pressed.
     * We use it to load the content from history stack via ajax and to rewrite url, so we only have
     * to load #content-data
     * @param event
     */
    private onPopState(event)
    {
        let page : string = location.href;
        //Go back only when the the target isnt the empty index.
        if (page.indexOf(".php") !== -1 && page.indexOf("index.php") === -1) {
            $('#content').hide(0).load(addURLparam(location.href, "ajax") + " #content-data");
            $('#progressbar').show(0);
        }
    }


    /**
     * Called whenever a Ajax Request was successful completed.
     * We use it to hide the progbar and show the requested content, register some elements on the page for ajax usage
     * and change the title of the tab. Also the functions registered via addAjaxCompleteAction() are executed here.
     * @param event
     * @param xhr
     * @param settings
     */
    private onAjaxComplete (event, xhr, settings)
    {
        //Remove the current XHR request from XHR pool.
        let i = this.xhrPool.indexOf(xhr);   //  get index for current connection completed
        if (i > -1) this.xhrPool.splice(i, 1); //  removes from list by index

        //Hide progressbar and show Result
        $('#progressbar').hide(0);
        $('#content').fadeIn("fast");

        this.registerForm();
        this.registerLinks();
        this.registerSubmitBtn();

        let url = settings.url;

        if(url.indexOf("#") != -1)
        {
            let hash = url.substring(url.indexOf("#"));
            scrollToAnchor(hash);
        }

        this.checkRedirect();

        //Execute the registered handlers.
        for(let entry of this.ajax_complete_listeners)
        {
            entry();
        }

        //Push only if it was a "GET" request and requested data was an HTML
        if (settings.type.toLowerCase() !== "post" && settings.dataType !== "json" && settings.dataType !== "jsonp") {

            //Push the cleaned (no ajax request) to history
            window.history.pushState(null, "", removeURLparam(settings.url, "ajax"));

            //Set page title from response
            let input : string = xhr.responseText;
            let title : string = extractTitle(input);

            if(title !== "")
            {
                document.title = title;
            }

            if(this.trees_filled) {
                //Maybe deselect the treeview nodes if, we are not on the site, that it has requested.
                let selected = $("#tree-categories").treeview("getSelected")[0];
                //If the current page, does not contain the url of the selected tree node...
                if (typeof selected !== 'undefined' && settings.url.indexOf(selected.href) == -1) {
                    $('#tree-categories').treeview('unselectNode', [selected.nodeId, {silent: true}]);
                }

                //The same for devices tree
                //Maybe deselect the treeview nodes if, we are not on the site, that it has requested.
                selected = $("#tree-devices").treeview("getSelected")[0];
                //If the current page, does not contain the url of the selected tree node...
                if (typeof selected !== 'undefined' && settings.url.indexOf(selected.href) == -1) {
                    $('#tree-devices').treeview('unselectNode', [selected.nodeId, {silent: true}]);
                }

                //The same for tools tree
                //Maybe deselect the treeview nodes if, we are not on the site, that it has requested.
                selected = $("#tree-tools").treeview("getSelected")[0];
                //If the current page, does not contain the url of the selected tree node...
                if (typeof selected !== 'undefined' && settings.url.indexOf(selected.href) == -1) {
                    $('#tree-tools').treeview('unselectNode', [selected.nodeId, {silent: true}]);
                }
            }
        }
    }
}

/*********************************************************************************
 * AjaxUI additions
 ********************************************************************************/

let ajaxui : AjaxUI = AjaxUI.getInstance();

/**
 * Register the events which has to be run in AjaxUI and start the execution.
 */
$(function(event){

    ajaxui.addStartAction(addCollapsedClass);
    ajaxui.addStartAction(treeviewBtnInit);
    ajaxui.addStartAction(registerJumpToTop);
    ajaxui.addStartAction(fixCurrencyEdits);
    ajaxui.addStartAction(registerAutoRefresh);
    ajaxui.addStartAction(scrollUpForMsg);
    ajaxui.addStartAction(rightClickSubmit);
    ajaxui.addStartAction(makeTriStateCheckbox);
    ajaxui.addStartAction(makeHighlight);


    ajaxui.addAjaxCompleteAction(addCollapsedClass);
    ajaxui.addAjaxCompleteAction(registerHoverImages);
    ajaxui.addAjaxCompleteAction(makeSortTable);
    ajaxui.addAjaxCompleteAction(makeFileInput);
    ajaxui.addAjaxCompleteAction(registerX3DOM);
    ajaxui.addAjaxCompleteAction(registerBootstrapSelect);
    ajaxui.addAjaxCompleteAction(fixCurrencyEdits);
    ajaxui.addAjaxCompleteAction(registerAutoRefresh);
    ajaxui.addAjaxCompleteAction(scrollUpForMsg);
    ajaxui.addAjaxCompleteAction(rightClickSubmit);
    ajaxui.addAjaxCompleteAction(makeTriStateCheckbox);
    ajaxui.addAjaxCompleteAction(makeHighlight);

    ajaxui.start();
});

function makeTriStateCheckbox() {
    $(".tristate").tristate( {
        checked:            "true",
        unchecked:          "false",
        indeterminate:      "indeterminate",
    });
}

/**
 * Registers the popups for the hover images in the table-
 */
function registerHoverImages() {
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

/**
 * Activate the features of Datatables for the .table-sortable tables on the page.
 */
function makeSortTable() {
    'use strict';

    if (!$.fn.DataTable.isDataTable('.table-sortable')) {
        let table = $('.table-sortable').DataTable({
            "paging":   false,
            "ordering": true,
            "info":     false,
            "searching":   false,
            "select":   $(".table-sortable").hasClass("table-selectable") ? {style: "os", selector: "td:not(.no-select)"} : false,
            "order": [],
            "columnDefs": [
                {
                "targets": [1], type: "natural-nohtml"
                }, {
                    targets: 'no-sort', orderable: false
                }]
        });

        if($("#auto_sort").val() == true) {
            table.columns(".order-default").order('asc').draw();
        }

        table
            .on( 'select deselect', function ( e, dt, type, indexes ) {
                let data = table.rows( { selected: true } );
                let count = data.count();
                let tmp = [];
                //Show The select action bar only, if a element is selected.
                if(count > 0) {
                    $(".select_actions").show();
                    $(".selected_n").text(count);
                    //Build a string containing all parts, that should be modified
                    for (let n of data[0]) {
                        tmp.push($(data.row(n).node()).find("input").val());
                    }
                } else {
                    $(".select_actions").hide();
                }

                //Combine all selected IDs into a string.
                let str = tmp.join();
                $("input[name='selected_ids']").val(str);
            } );

    }
}

/**
 * Use jQuery.fileinput for fileinputs.
 */
function makeFileInput() {
    'use strict';
    $(".file").fileinput();
}

/**
 * Register the button, to jump to the top of the page.
 */
function registerJumpToTop() {
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
}

/**
 * This function add a hidden input element, if a button with the class ".rightclick" is rightclicked.
 */
function rightClickSubmit()
{
    let _ajaxui = AjaxUI.getInstance();

    $("button.rightclick").off("contextmenu").contextmenu(function (event) {
        event.preventDefault();

        let form = $(this).closest("form");
        form.append('<input type="hidden" name="rightclicked" value="true">');
        _ajaxui.submitFormSubmitBtn(form, this);

        return false;
    });
}

/**
 * Registers the collapse/expand all buttons of the TreeViews
 */
function treeviewBtnInit() {
    $(".tree-btns").click(function (event) {
        event.preventDefault();
        $(this).parents("div.dropdown").removeClass('open');
        let mode = $(this).data("mode");
        let target = $(this).data("target");

        if(mode==="collapse") {
            $('#' + target).treeview('collapseAll', { silent: true });
        }
        else if(mode==="expand") {
            $('#' + target).treeview('expandAll', { silent: true });
        }
        return false;
    });
}

/**
 * Activates the X3Dom library on all x3d elements.
 */
function registerX3DOM() {
    if ($("x3d").length) {
        x3dom.reload();
    }
}

/**
 * Activates the Bootstrap-selectpicker.
 */
function registerBootstrapSelect() {
    $(".selectpicker").selectpicker();
}

/**
 * Add collapsed class to a before a collapse panel body, so the icon is correct.
 */
function addCollapsedClass() {
    $('div.collapse.panel-collapse').siblings("div.panel-heading")
        .children('a[data-toggle="collapse"]').addClass("collapsed");
}

/**
 * Fix price edit fields. HTML wants prices with a decimal dot, Part-DB gives sometime commas.
 */
function fixCurrencyEdits() {
    let inputs = $('input[type=number]').each(function(index, element){
       let e = $(element);
       if(e.val() == "" && e.prop("defaultValue").indexOf(",") !== -1)
       {
           let newval: string = e.prop("defaultValue").replace(",", ".");
           e.val(newval);
       }
    });
}

/**
 * Register the autorefresh
 */
function registerAutoRefresh() {
    let val : number =  $("#autorefresh").val() as number;
    if(val > 0)
    {
        window.setTimeout(reloadPage, val);
    }
}

/**
 * Close the #searchbar div, when a search was submitted on mobile view.
 */
$("#search-submit").click(function (event) {
    $("#searchbar").removeClass("in");
});

/**
 * Implements the livesearch for the searchbar.
 * @param object
 * @param {int} threshold
 */
function livesearch(event, object : any, threshold : int) {
    //Ignore enter key.
    if(event.key == "Enter") {
        return;
    }

    let $obj = $(object);
    let q = <string> $obj.val();
    let form = $obj.closest("form");
    //Dont show progbar on live search.
    form.addClass("no-progbar");
    let xhr = form.data('jqxhr');
    //If an ajax operation is already ongoing, then stop it.
    if(typeof xhr !== "undefined") {
        xhr.abort();
    }
    if(q.length >= threshold) {
        submitForm(form);
    }
    else {
        //Only show link, if the text is shorter than before.
        if(event.key == "Backspace") {
            openLink(BASE + "show_search_parts.php?hint");
        }
    }
    //Show progbar, when user presses submit button.
    form.removeClass("no-progbar");
}


function makeHighlight() {
    let highlight = $("#highlight").val();
    if(typeof highlight !== "undefined" && highlight != "") {
        $("table").highlight(highlight, {
            element: "span"
        });
    }
}

//Need for proper body padding, with every navbar height
$(window).resize(function () {
    $('body').css('padding-top', parseInt($('#main-navbar').css("height"))+10);
    $('#fixed-sidebar').css('top', parseInt($('#main-navbar').height()) + 10);
});

$(window).on('load', function () {
    $('body').css('padding-top', parseInt($('#main-navbar').css("height"))+10);

    $('#fixed-sidebar').css('top', parseInt($('#main-navbar').height()) + 10);
});
