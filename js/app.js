/**********************************
 * CONFIG
 **********************************/

var ENABLE_MAIN_NAV_MANUAL_TOGGLE = true;
var SHELL_BASE_PATH = "http://10.250.191.98/ExecutiveLens2/";
//var SHELL_BASE_PATH = "http://localhost/telkomsel/";

var CSS_BASE_PATH = SHELL_BASE_PATH + "css/";
var JS_BASE_PATH  = SHELL_BASE_PATH + "js/";
var iframeLoadedTimeOutId;
var iframeShowTimeOutId;

$(function(){
    $("#main-nav a").hover(function(){
        showPopNav($(this));
    });

    //when mouse leaves the menu we hide the pop navs
    $mainNavWrapper = $(".main-nav-wrapper");
    $mainNavWrapper.hover(
        function () {
            //do nothing
        },
        function () {
            closePopNav();
        }
    );

    //when the user clicks outside the menu it should hide the manu
    $doc = $('html');
    $doc.on("touchstart", onMainNavMouseOutside);

    //when the user clicks the level 1 menu item it should toggle the collapse
    $("#main-nav a[target='webplayer']").click(function(){
        activateMainMenuLevel1BySubmenuDataId($(this).attr("data-sub-menu"));
    });
    $(".collapse-toggle-icon").click(function(){
        toggleMainNavCollapse();
    });

    $(".pop-nav .list-group-item").click(function(e){

        if($(this).attr("data-toggle")=="collapse"){
            //this is a level 2 item
            //in the second level menu, the accordion toggle is making the loading of iframe stop
            //so we need to force this
            loadToContent($(this).attr("href"));
        }
        else{
            //this is a level 3 item
            //when third level menu item is clicked use the post form to load data in the iframe
            //this is to simulate button clicking in spotfire
            e.preventDefault();

            //TODO: change the params according to the clicked menu item
            var params = {
                args:'',
                nodeId:'id163',
                waid:'a2b8b2f626576244566fc-1615550e2bb6d0',
                callback:'SetActive'
            }
            postToContent($(this).attr("href"),params);
        }

        //when the user clicks the level 2 or level 3 menu item it should toggle the selected level 1 menu too
        var subMenuId = $(this).closest(".pop-nav").attr("id");
        activateMainMenuLevel1BySubmenuDataId(subMenuId);

    });

    //event handler when content iframe loads
    $('#webplayer').bind("load", function() {

        hideIframe();
        clearTimeout(iframeLoadedTimeOutId);
        iframeLoadedTimeOutId = setTimeout(function() { 
            checkIframeContent(); 
        }, 1000);
        
    });



    //initialize nice scroll
    $("#main-nav").slimScroll({
        height: 'auto',
        position: 'left',
        color: '#cccccc'
    });

    //initialize accordion
    initAccordion();

    //initialize spotfire
    initItializeSpotFireBridge();

    $(window).resize(function(){
        adjustAppDimension();
    });
    adjustAppDimension();

    //trigger home button click
    setTimeout(function(){
        loadToContent($('#linkHome').attr("href"));
    },1000);

});


/************************************
* Check for the loaded content
*************************************/
var checkIframeContent = function(){
    //check if the loaded page is an error page from spotfire
    //if it is replace it with our custom 404 page
    var isErrorPage = false;
    var isLoginPage = false;
    var action = $('#webplayer').contents().find('form').attr("action");
    if(typeof action === 'string'){
        if(action.indexOf("Error.aspx") >= 0){
            isErrorPage = true;
        }
        else if(action.indexOf("Login.aspx") >= 0){
	     isLoginPage = true;
	}
    }
    if(isErrorPage){
        loadToContent("404.html");
   	
    }
    else if(isLoginPage){
	hideMainNav();
        injectStylesInContent();
        injectJsInContent();  	
    }
    else{
        showMainNav();
        injectStylesInContent();
        injectJsInContent();
    }
    showIframe();

}


var hideIframe = function(){
    clearTimeout(iframeShowTimeOutId);
     $('#content').css("visibility","hidden");
}

var showIframe = function(){
    clearTimeout(iframeShowTimeOutId);
    iframeShowTimeOutId = setTimeout(function(){
        $('#content').css("visibility","visible");
    },1000);
}


var showMainNav = function(){
    $(".main-nav-wrapper").removeClass("hidden");
    $("#header-nav").removeClass("hidden");
}

var hideMainNav = function(){
    $(".main-nav-wrapper").addClass("hidden");
    $("#header-nav").addClass("hidden");
}




/***********************************
 * Adjust App Dimension
 ***********************************/
var adjustAppDimension = function(){
    var toH = $(window).height();
    var headerNavHeight = 53;
    $("#main-nav").height(toH);
    $("#content").height(toH - headerNavHeight);
}

/**********************************
 * Main Navigation Behavior
 **********************************/
var toggleMainNavCollapse = function(){
    if(ENABLE_MAIN_NAV_MANUAL_TOGGLE){
        $("#wrap").toggleClass("minimized");
    }
}
var onMainNavMouseOutside = function(e){

    $mainNavWrapper = $(".main-nav-wrapper");
    if (!$mainNavWrapper.is(e.target) && !$(e.target).closest('.main-nav-wrapper').length)
    {
        closePopNav();
    }
}

//Activate the selected level 1 item
//given a sub menu data id active the menu
var activateMainMenuLevel1BySubmenuDataId = function(subMenuId){
    if(subMenuId != undefined){
        if(subMenuId.indexOf("#") != 0){
            subMenuId = "#"+subMenuId;
        }
        var $container = $("#main-nav");
        var $item = $container.find('li a[data-sub-menu="'+subMenuId+'"]');
        if($item.length > 0){
            $parent = $item.parent();
            $container.find("li").removeClass("current");
            $parent.addClass("current");
        }
    }
}


//Force load to content Iframe
//Caution: only call this wen you cannot load the content by bootstrap 'target' attribute
//for anchors
var loadToContent = function(href){
    $("#webplayer").attr("src",href);
}



//Create an post to iframe
var postToContent = function(href, params){

    var $form = $("#main-nav-post-form");
    $form.attr("action", href);

    //clear all previous input fields
    $form.find("input[type='hidden']").remove();


    var addField = function( key, value ){
        $('<input>').attr({
            type: 'hidden',
            name: key,
            value: value
        }).appendTo($form);
    };

    //add hidden input fields
    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            if( params[key] instanceof Array ){
                for(var i = 0; i < params[key].length; i++){
                    addField( key, params[key][i] )
                }
            }
            else{
                addField( key, params[key] );
            }
        }
    }

    $form.submit();
}


//inject css in iframe
var injectStylesInContent = function(){
    $('#webplayer').contents().find('head').append('<link rel="stylesheet" href="'+CSS_BASE_PATH+'custom.css" type="text/css" />');
}


//inject js in iframe
var injectableJS= function(src, cb){
    d =  $('#webplayer')[0].contentWindow.document;
    script = d.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    if(cb){
        script.onload = function(){
	    alert("js loaded");
            $('#webplayer')[0].contentWindow.eval(cb);
        };
    }
    script.src = src;
    d.getElementsByTagName('head')[0].appendChild(script);
    
}
var selectStr = "\
        $('select').customSelect(); ";
var injectJsInContent = function(){

    //injectableJS(JS_BASE_PATH+"jquery.js");
    //injectableJS(JS_BASE_PATH+"jquery.customSelect.min.js", selectStr);
    //injectableJS(JS_BASE_PATH+"custom.js");

}



/*********************************
 * Accordion behavior
 *********************************/
var initAccordion = function(){
    $('.pop-nav .list-group > a').on('click',function(e){
        //console.log("id2:"+$(this).attr("data-target"));

        // You can also add preventDefault to remove the anchor behavior that makes
        // the page jump
        e.stopPropagation();
        e.preventDefault();

        expandAccordion($(this).closest(".pop-nav"), $(this).attr("data-target"));

    });
    //collapse all

}

//Activate the selected level 2 item
var expandAccordion = function($container, id){
    //console.log("id:"+id);
    if(id != undefined){
        if(id.indexOf("#") == 0){
            id = id.substr(1);
        }
        var $items = $container.find('div.sublinks');
        $items.each(function(index, el){
            //alert($(el).attr("class"));
            var $item = $(el);
            if($item.attr("id")==id){
                $item.collapse('show');
            }
            else{
                $item.collapse('hide');
            }
        });

        //update the current selection
        $container.find(".list-group>a").removeClass("current");
        $container.find(".list-group>a[data-target='#"+id+"']").addClass("current");
    }
}



/************************************
 *  Menu Popup Manangement
 ************************************/
var $activeSubMenu = null;
var showPopNav = function($this){

    $this.parent().parent().find("li").removeClass('active');
    $this.parent().addClass('active');
    var subMenuSel = $this.attr("data-sub-menu");

    //fadeout other pop-nav
    $(".pop-nav:not('"+subMenuSel+"')").stop(true, true).animate({"margin-left": '-300px'},500);

    $activeSubMenu = $(subMenuSel);

    //adjust the height of the popup based on the dimension of the screen
    var toH = $(window).height() - $("#header-nav").height() - 2;
    $activeSubMenu.height(toH);
    $activeSubMenu.show();

    var $scrollable = $activeSubMenu.find(".scrollable");
    $scrollable.css("max-height","");
    //$scrollable.slimscroll("destroy");
    //$scrollable.attr('style', '');
    $scrollable.slimscroll({
        height: 'auto',
        position: 'left',
        color: '#cccccc'
    });

    //if ($activeSubMenu.css('display') === 'none') {
    //$subMenu.css('left', ($this.offset().left + $this.width()))
    //$activeSubMenu.css({"margin-left": '-300px'});
    $activeSubMenu.show();
    $activeSubMenu.stop(true, true).animate({"margin-left": '0'},500);
    //}

    //expand the first item
    //setTimeout(function(){
        expandAccordion($activeSubMenu, $activeSubMenu.find(".sublinks").first().attr("id"));
    //},1000);

}
//force show popup nav
//showPopNav($("[data-sub-menu='#rhi-pop-nav']"));

var closePopNav = function(){
    $(".nav-primary li").removeClass('active');
    $(".pop-nav").stop(true, true).animate(
        {"margin-left": '-300px'},
        500,
        function(){
            $(this).hide();
        }
    );
}


/* ------------------------------------------------------------ * /



/***************************************************************************
 *  Spotfire Iframe Bridge
 ***************************************************************************/
var URL_SPOTFIREWEB  = 'http://10.250.191.98/SpotfireWeb/';
var URL_LOGOUT       = URL_SPOTFIREWEB + 'LoggedOut.aspx?logoutByUser=true';

//var URL_VIEWDXP      = URL_SPOTFIREWEB + 'ViewAnalysis.aspx?file=';
var URL_VIEWDXP      = URL_SPOTFIREWEB + 'Init.aspx?redirectUrl=/SpotfireWeb/ViewAnalysis.aspx%3Ffile=';

var URL_AJAXSERV = URL_SPOTFIREWEB + 'AjaxService.asmx/Request?waid=bbba98fb1bccfa2bc5b59-1809550e2bc6e2';
//http://reportpapp5/SpotfireWeb/AjaxService.asmx/Request?waid=db7dd614b23ad586dd7c1-1809550e2bc6e2

var URL_LENS_REVENUE     = URL_VIEWDXP + '/Visualization/LENS_REVENUE/';
var URL_LENS_ASSET       = URL_VIEWDXP + '/Visualization/LENS_ASSET/';
var URL_LENS_SUBS_HEALTH = URL_VIEWDXP + '/Visualization/LENS_SUBS_HEALTH/';

var URL_LENS_NETWORK = URL_VIEWDXP + '/Visualization/LENS_NETWORK/';
var URL_LENS_OPERATION = URL_VIEWDXP + '/Visualization/LENS_OPERATION/';
var URL_LENS_CUSTOMER = URL_VIEWDXP + '/Visualization/LENS_CUSTOMER/';
var URL_LENS_OVERALL = URL_VIEWDXP + '/Visualization/LENS_OVERALL/';
var URL_LENS_ENTERPRISE_REPORTING = URL_VIEWDXP + '/Enterprise%20Reporting/';

var DXP_LENS_REVENUE_PERFORMANCE = 'INFO_REV_OVERVIEW_1.0';
var DXP_LENS_REVENUE_OVERVIEW = 'INFO_REV_OVERVIEW_1.0';
var DXP_LENS_REVENUE_REGION = 'INFO_REV_REGION_0.9';
var DXP_LENS_REVENUE_BRAND = 'INFO_REV_BRAND_0.9';
var DXP_LENS_REVENUE_CLUSTER = 'INFO_REV_CLUSTER_0.9';
var DXP_LENS_REVENUE_SERVICE = 'INFO_REV_SERVICE_0.9';
var DXP_LENS_REVENUE_ALARM    = 'INFO_REV_ALARM_1.0';
var DXP_LENS_REVENUE_INSIGHT  = 'INFO_REV_INSIGHT_1.0';
var DXP_LENS_REVENUE_LEGACY  = 'INFO_REV_LEGACY_0.9';
var DXP_LENS_REVENUE_BROADBAND  = 'INFO_REV_BROADBAND_0.9';
var DXP_LENS_REVENUE_DIGITAL_SERVICE  = 'INFO_REV_DIGITAL_SERVICE_0.9';
var DXP_LENS_REVENUE_CHANGE_IMPACT_REVENUE  = 'INFO_REV_CHANGE_IMPACT_REVENUE_0.9';
var DXP_LENS_REVENUE_CHANGE_IMPACT_YIELD  = 'INFO_REV_CHANGE_IMPACT_YIELD_0.9';
var DXP_LENS_REVENUE_CCAM  = 'INFO_REV_CHANGE_CCAM_0.9';
//var DXP_LENS_REVENUE_OTHERS   = 'INFO_REV_OTHERS_0.9';


var DXP_LENS_SUBS_HEALTH_PERFORMANCE = 'Subscriber Health - Performance';
var DXP_LENS_SUBS_HEALTH_REGION = 'Subscriber Health - Region';
var DXP_LENS_SUBS_HEALTH_BRAND = 'Subscriber Health - Brand';
var DXP_LENS_SUBS_HEALTH_CHANNEL = 'Subscriber Health - Channel';
var DXP_LENS_SUBS_HEALTH_OVERALL = 'Subscriber Health - Overall';
var DXP_LENS_SUBS_HEALTH_ALARM = 'Subscriber Health - Alarm';
var DXP_LENS_SUBS_HEALTH_INSIGHTS = 'Subscriber Health - Insight';
var DXP_LENS_SUBS_HEALTH_CUSTOMER_ANALYSIS = 'Subscriber Health - Customer Analysis';
var DXP_LENS_SUBS_HEALTH_BROADBAND_TRENDS = 'Subscriber Health - Broadband Trends';
var DXP_LENS_SUBS_HEALTH_DIGITAL_SERVICE_TRENDS = 'Subscriber Health - Digital Service Trends';
var DXP_LENS_SUBS_HEALTH_BROADBAND_USE = 'Subscriber Health - Broadband Use';
var DXP_LENS_SUBS_HEALTH_ZERO_BASE_SUBS = 'Subscriber Health - Zero Base Subs';


var DXP_LENS_ASSET_PERFORMANCE = 'LensAssetPerformance';
var DXP_LENS_ASSET_ALERTS   = 'LensAssetAlerts';
var DXP_LENS_ASSET_INSIGHTS   = 'LensAssetInsights';
var DXP_LENS_ASSET_HOME   = 'LensAssetHome';
var DXP_LENS_ASSET_PERFORMANCE_TREND   = 'LensAssetPerformanceTrend';
var DXP_LENS_ASSET_DATA_TREND   = 'LensAssetDataTrend';
//var DXP_LENS_ASSET = 'LensAsset';

var DXP_NETWORK  = 'Network';
var DXP_OPERATION  = 'Operation';
var DXP_CUSTOMER  = 'Customer';
var DXP_OVERALL  = 'Overall';
var DXP_ENTERPRISE_REPORTING  = 'EnterpriseReportingDashboard';


var OPT_DEFAULT = '&options=7-0,8-0,9-0,10-0,11-0,12-0,13-0,14-0,1-0,2-0,3-0,4-0,5-0,6-0,15-0';

var buildViewUrl = function(dxpUrl, pageIndex, options, is404){
   var toUrl = dxpUrl + '&configurationBlock=SetPage%28pageIndex%3D' + pageIndex + '%29%3B' + ((options == undefined) ? OPT_DEFAULT : options);
   if(is404){
     toUrl = SHELL_BASE_PATH+"404.html";   
   }
   return toUrl;
}

var initItializeSpotFireBridge = function(){


    //
    //Test content
    //Comment this out
    //


    //
    //Header Navigation
    //
    //$('#linkLogout').attr('href', URL_LOGOUT);

    //
    //Main Navigation Level 1
    //
    $('#linkHome').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_OVERVIEW, 0));
    //$('#linkRevenue').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_PERFORMANCE, 0));
    //$('#linkSubscriberHealth').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_PERFORMANCE, 0));
    //$('#linkAssetsUtilitzation').attr('href', buildViewUrl(URL_LENS_ASSET + DXP_LENS_ASSET_PERFORMANCE, 0));
    $('#linkNetworkPerformance').attr('href', buildViewUrl(URL_LENS_NETWORK + DXP_NETWORK, 0, {}, true));
    $('#linkOperationPerformance').attr('href', buildViewUrl(URL_LENS_OPERATION + DXP_OPERATION, 0,  {}, true));
    $('#linkCustomerExperience').attr('href', buildViewUrl(URL_LENS_CUSTOMER + DXP_CUSTOMER, 0, {}, true));
    $('#linkOverallPerformance').attr('href', buildViewUrl(URL_LENS_OVERALL + DXP_OVERALL, 0, {}, true));
    $('#linkReports').attr('href', buildViewUrl(URL_LENS_ENTERPRISE_REPORTING + DXP_ENTERPRISE_REPORTING, 0, {}, true));
    //$('#pageEntOverview').attr('href', buildViewUrl(URL_LENS_ENTERPRISE_REPORTING + DXP_ENTERPRISE_REPORTING, 0));

    //
    //Main Navigation Level 2
    //

    //Revenu Sub Navigation
    $('#pageRevenuePerformance').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_OVERVIEW, 0));
    //$('#pageRevenueOverview').attr('href',  buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_OVERVIEW, 0));
    //$('#pageRevenueRegion').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_REGION, 0, {}, true));
    //$('#pageRevenueBrand').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_BRAND, 0, {}, true));
    //$('#pageRevenueCluster').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_CLUSTER, 0, {}, true));
    //$('#pageRevenueService').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_SERVICE, 0, {}, true));
    $('#pageRevenueAlarm').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_ALARM, 0));
    $('#pageRevenueInsights').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_INSIGHT, 0));
    //$('#pageRevenueLegacy').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_LEGACY, 0));
    //$('#pageRevenueBroadband').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_BROADBAND, 0, {}, true));
    //$('#pageRevenueDigitalService').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_DIGITAL_SERVICE, 0, {}, true));
    //$('#pageRevenueChangeImpactRevenue').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_CHANGE_IMPACT_REVENUE, 0, {}, true));
    //$('#pageRevenueChangeImpactYield').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_CHANGE_IMPACT_YIELD, 0, {}, true));
    //$('#pageRevenueCcam').attr('href', buildViewUrl(URL_LENS_REVENUE + DXP_LENS_REVENUE_CCAM, 0, {}, true));

    //Subscriber Health Sub Nav
    $('#pageSubscribersHealthPerformance').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_PERFORMANCE, 0, {}, true));
    //$('#pageSubscribersHealthRegion').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_REGION, 0));
    //$('#pageSubscribersHealthBrand').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_BRAND, 0));
    //$('#pageSubscribersHealthChannel').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_CHANNEL, 0));
    //$('#pageSubscribersHealthOverall').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_OVERALL, 0));
    $('#pageSubscribersHealthAlerts').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_ALARM, 0));
    $('#pageSubscribersHealthInsights').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_INSIGHTS, 0));
    //$('#pageSubscribersHealthCustomerAnalysis').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_CUSTOMER_ANALYSIS, 0));
    //$('#pageSubscribersHealthBroadbandTrends').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_BROADBAND_TRENDS, 0));
    //$('#pageSubscribersHealthDigitalServiceTrends').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_DIGITAL_SERVICE_TRENDS, 0));
    //$('#pageSubscribersHealthBroadbandUse').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_BROADBAND_USE, 0));
    //$('#pageSubscribersHealthZeroBaseSubs').attr('href', buildViewUrl(URL_LENS_SUBS_HEALTH + DXP_LENS_SUBS_HEALTH_ZERO_BASE_SUBS, 0));


    //Assets Utilization Sub Nav
    $('#pageAssetPerformance').attr('href', buildViewUrl(URL_LENS_ASSET + DXP_LENS_ASSET_PERFORMANCE, 0, {}, true));
    $('#pageAssetAlerts').attr('href', buildViewUrl(URL_LENS_ASSET + DXP_LENS_ASSET_ALERTS, 0, {}, true));
    $('#pageAssetInsights').attr('href', buildViewUrl(URL_LENS_ASSET + DXP_LENS_ASSET_INSIGHTS, 0, {}, true));
    //$('#pageAssetsHome').attr('href', buildViewUrl(URL_LENS_ASSET + DXP_LENS_ASSET_HOME, 0));
    //$('#pageAssetsPerformanceTrend').attr('href', buildViewUrl(URL_LENS_ASSET + DXP_LENS_ASSET_PERFORMANCE_TREND, 0));
    //$('#pageAssetsDataTrend').attr('href', buildViewUrl(URL_LENS_ASSET + DXP_LENS_ASSET_DATA_TREND, 0));
    //$('#pageAssetOverview').attr('href', buildViewUrl(URL_LENS_ASSET + DXP_LENS_ASSET, 0));

}

