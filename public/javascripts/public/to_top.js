var float_tool_bar=$("#float_tool_bar");
$(window).on("scroll",to_top_toggle);//判断是否显示回到顶部
float_tool_bar.on("click",".to_top_btn",to_top);//回到顶部
//回到顶部显示消失
function to_top_toggle(){
	var cur_scroll_top=$(window).scrollTop();
	if(cur_scroll_top>300){
		float_tool_bar.find('.to_top_tool').show();
	}else{
		float_tool_bar.find('.to_top_tool').hide();
	}
}
//回到顶部
function to_top(){
	$("html,body").animate({
		scrollTop : 0
	}, 500);
}