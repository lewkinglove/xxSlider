///jQuery.xxSlider.js
///作者: Refactoring
///版本:  v1.0
///发布时间: 2014年2月28日16:45:35
///联系方式: lewkinglove@gmail.com
///浏览器支持: 测试通过的浏览器有chrome/firefox/ie 6/7/8/9 , 其他均未进行测试, 如果有什么兼容性问题, 欢迎反馈
$.fn.extend({
    xxSlider: function (options) {
        var autoPlayHandler = null;     //焦点图自动播放的定时器句柄对象
        var sliderObject = $(this);         //当前Slider对象对应的Slider外层容器
        //系统默认设置集
        var settings = { 
            initPostion: 0,																	//初始化后第一屏显示的焦点图索引, 从0开始
            autoSlideTime: 3000,														//焦点图自动切换时间, 单位毫秒ms, 如果设置的值小于1, 则不进行自动切换
            autoSlideSort: 'ASC',														//自动切换的排序方向, 默认为ASC: 从小到大, 可选值 DESC:从大到小
            slideOutTime:300,															//焦点图切换出去的动画时间, 单位毫秒ms  
            slideInTime:200,																//焦点图切换进入的动画时间, 单位毫秒ms
            prevBtnID: "btnSliderPrev",											//点击后触发上一页的dom元素id
            nextBtnID: "btnSliderNext",										//点击后触发下一页的dom元素id  
            showNavBtns: true,														//是否显示导航的按钮
            showNavNumber: true,												//是否显示导航按钮的数字索引
            navContainerID: "sliderNavBtns",								//导航按钮的容器ID
            navBtnIdentifierCls: 'slider_nav_btns',					//导航按钮的标识状态Css Class Name
            navBtnNomalCls: 'slider_nav_btns_nomal',		//导航按钮的正常状态Css Class Name
            navBtnActiveCls: 'slider_nav_btns_active',			//导航按钮的悬浮激活状态Css Class Name
			slideActiveCls: 'slide_active',										//当焦点图被激活的时候要添加的CSS Class Name
            slideComplateCallback: function(data){}			 //每次发生切换动作时候的回调函数, 包含一个参数, 形如: {curIndex: 当前slide的索引, curItem: 当前slide对应的jQuery对象 }
         };
        options = options || {};            //如果用户调用Slider初始化的时候没有进行任何参数传递, 则初始化空参数集合
        $.extend(settings, options);        //将用户传入的参数集合和默认集合进行合并
        
        var totalSlidePageCount = $("a", sliderObject).size(); //焦点图总数
        var curSlidePageIndex = 0;  //当前显示的焦点图索引
       
         //是否已经指定要显示的页面, 如果已经指定
        if (settings.initPostion!=null && parseInt(settings.initPostion) >=0  && parseInt(settings.initPostion) < totalSlidePageCount )  
            curSlidePageIndex =  parseInt(settings.initPostion);    //则设置当前显示的页面为
        
        //如果需要显示导航按钮, 且dom中存在容器元素, 则创建导航按钮内容块
        if(settings.showNavBtns && $("#"+settings.navContainerID).length>0){
            var navHtml = "";
            for(var i=0; i<totalSlidePageCount; i++){
                var cssCls = settings.navBtnIdentifierCls +" " + ( i==curSlidePageIndex ? settings.navBtnActiveCls :settings.navBtnNomalCls );
                navHtml += '<li class="'+cssCls+'" value="'+(i+1)+'">'+ ( settings.showNavNumber ? (i+1) : '&nbsp;' )+'</li>';
            }
            navHtml = "<ul>"+navHtml+"</ul>";
            $("#"+settings.navContainerID).html(navHtml);
        }
        
        $("a", sliderObject).css("position","absolute").hide();        //给所有焦点图外层对象(a)添加绝对定位(为了实现同步淡入淡出). 然后默认隐藏所有焦点图
        $(sliderObject).children("a").eq(curSlidePageIndex).addClass(settings.slideActiveCls).show();     //仅仅展示当前页的的焦点图
		_slideComplateCallback();	//手动触发第一次显示Slide的ComplateCallback
        
        $("#"+settings.prevBtnID).click(_gotoPrevPage).hover(
            function () { clearInterval(autoPlayHandler) }, 
            function () { autoPlayHandler = setInterval(autoSlide, settings.autoSlideTime); }
         ); 
        $("#"+settings.nextBtnID).click(_gotoNextPage).hover(
            function () {  
                if(autoPlayHandler != null)
                    clearInterval(autoPlayHandler);
             }, 
            function () { 
                if(autoPlayHandler != null)
                    autoPlayHandler = setInterval(autoSlide, settings.autoSlideTime); 
            }
         ); 


        //给焦点图的导航按钮添加事件监听
        $("li."+settings.navBtnIdentifierCls).mouseover(function () {
            //如果当前悬浮的导航按钮就是正在显示的焦点图, 则
            if($(this).attr("value") - 1 == curSlidePageIndex)
                return;     //不进行切换, 直接返回
        
            curSlidePageIndex = $(this).attr("value") - 1;  //获取导航按钮的value属性(页码数字) -1 变成焦点图的索引
            //如果要显示的焦点图页码大于总数, 则直接返回, 不在继续处理
            if (curSlidePageIndex >= totalSlidePageCount) 
                return;
                
            //手动悬浮的时候, 清除焦点图的自动切换播放
            if(autoPlayHandler != null) //如果自动切换功能已经启用, 则
                clearInterval(autoPlayHandler); //清除焦点图的自动切换播放

             _gotoPage(curSlidePageIndex);
        }).mouseout(function () {       });
        
        //如果autoSlideTime设置的有值切大于0 ,则
        if(settings.autoSlideTime && settings.autoSlideTime>0){
            autoPlayHandler = setInterval(autoSlide, settings.autoSlideTime);       //初始化自动切换功能
            
            //鼠标悬浮到焦点图大图上面的时候, 停止焦点图的自动切换播放, 鼠标移出的时候恢复焦点图的自动切换播放
            sliderObject.hover(
                function () { clearInterval(autoPlayHandler) }, 
                function () { autoPlayHandler = setInterval(autoSlide, settings.autoSlideTime); }
             ); 
         }
         
         //获取当前页相对的上一焦点图页面的索引
         function _getPrevSlidePageIndex(){
            //如果已经到最后一页, 则返回第一页(0), 否则返回当前索引+1 页
            return curSlidePageIndex <= 0 ? (totalSlidePageCount - 1) : (curSlidePageIndex-1);
         }
         
         //获取当前页相对的下一焦点图页面的索引
         function _getNextSlidePageIndex(){
            //如果已经到最后一页, 则返回第一页(0), 否则返回当前索引+1 页
            return curSlidePageIndex >= (totalSlidePageCount - 1) ? 0 : (curSlidePageIndex+1);
         }
         
		 function _slideComplateCallback(){
			 if (typeof settings.slideComplateCallback != 'undefined' && settings.slideComplateCallback instanceof Function) {
				//{curIndex: 当前slide的索引, curItem: 当前slide对应的jQuery对象 }
				var dataPram = {curIndex:curSlidePageIndex, curItem: $(sliderObject).children().eq(curSlidePageIndex)};
				settings.slideComplateCallback(dataPram)
			 }
		 }
		 
         //动画跳转切换到指定索引的焦点图
         function _gotoPage(pageIndex){
                 $("a."+settings.slideActiveCls, sliderObject).removeClass(settings.slideActiveCls).fadeOut(settings.slideOutTime);
                 $(sliderObject).children().eq(pageIndex).addClass(settings.slideActiveCls).fadeIn(settings.slideInTime); 
                 
                //给非当前页对应的导航按钮移出激活样式并且显示正常的样式
                $("li."+settings.navBtnIdentifierCls+"[value!="+(pageIndex+1)+"]").removeClass(settings.navBtnActiveCls).addClass(settings.navBtnNomalCls);
                //给当前页对应的导航按钮添加激活样式
                $("li."+settings.navBtnIdentifierCls+"[value="+(pageIndex+1)+"]").addClass(settings.navBtnActiveCls);
				
				_slideComplateCallback();
         }
         
         function _gotoPrevPage(){
             curSlidePageIndex = _getPrevSlidePageIndex();
             //从当前页进行渐变切换到目标页面
             _gotoPage(curSlidePageIndex);
         }
         
         function _gotoNextPage(){
            curSlidePageIndex = _getNextSlidePageIndex();
             /**
             //从当前页进行渐变切换到目标页面
            $("a", sliderObject).filter(":visible").fadeOut(settings.slideOutTime, function () { 
                $(this).parent().children().eq(curSlidePageIndex).fadeIn(settings.slideInTime); 
             });
             **/
             _gotoPage(curSlidePageIndex); 
         }

         //焦点图的自动切换播放函数
        function autoSlide() {
            if(settings.autoSlideSort && settings.autoSlideSort=="ASC")
                _gotoNextPage();
            else
                _gotoPrevPage();
        }
        
    }
});
