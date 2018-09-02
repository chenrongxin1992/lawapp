
//案件对比
function contrast(options){
	//判断
	var limit_count=options.limit_count||4;
	if(options.cur_count>=limit_count){
		utils.operation_hints({status:"warn",text:"对比案例请勿超过4个"});
		return;
	}
	utils.post_req("/comparison/"+options.case_id,{wszl:options.ajlb}).done(function(response){
		var data=utils.change_json(response);
		if(data.success){
			if($(".contrast_case_popup").length){
				render_contrast_case(data);
			}
			add_count(options.count_parent_elem.find(".contrast_tool"),data.result.length,function(){
				$(options.trigger).removeClass("active");
				if ($(options.trigger).attr("index")) {
					var index=$(options.trigger).attr("index");
				    options.data[index].is_contrast="contrast";
				}
				
			});
		}else{
			if(data.result.length>4){
				options.count_parent_elem.find(".contrast_tool .count").html(4);
				utils.operation_hints({status:"warn",text:"对比案例已超过4个"});
				return;
			}else{
				var temp_arr=[];
				$.each(data.result,function(index,item){
					temp_arr.push(item.id);
				})
				if($.inArray(options.case_id,temp_arr)>=0){
					utils.operation_hints({status:"warn",text:"请勿重复添加"});
					options.count_parent_elem.find(".contrast_tool .count").show().html(data.result.length);
					$(options.trigger).removeClass("active");
					var index=$(options.trigger).attr("index");
					options.data[index].is_contrast="contrast";
				}
			}
		}
		if(options.callback){
			options.callback(data.result);
		}
	}).fail(function(response){
		utils.operation_hints({status:"warn",text:"添加失败"});
	})
}
function show_join_contrast_case(config){
	if(!$(".contrast_case_popup").length){
		var html='';
		html+='<div class="contrast_case_popup">';
		html+='<div class="popup_header">';
		html+='<h3 class="title">参与对比案例</h3>';
		html+='<a href="javascript:;" class="close close_contrast_popup"><i class="icon-close"></i></a>';
		html+='</div>';
		html+='<div class="popup_body">';
		html+='<div class="contrast_case_list">';
		html+='</div>';
		html+='</div>';
		html+='<div class="popup_footer">';
		html+='<a  target="_blank" class="confirm_btn confirm_contrast disabled">对比</a>';
		html+='<a  class="cancle_btn clear_contrast_case">清空数据</a>';
		html+='</div>'
		html+='<div>';
		$(html)
			.appendTo("body")
			.animate({bottom:0},500)
			.on("click",".delete_drop",delete_contrast_case)
			.on("click",".clear_contrast_case",clear_contrast_case)
			.on("click",".close_contrast_popup",close_contrast_popup)
			.on("click",".confirm_contrast.abled",confirm_contrast);
	};
	utils.get_req("/comparison/header/").done(function(response){
		var data=utils.change_json(response);
		if(data.success== true){
			render_contrast_case(data);
			config.elem.find(".contrast_tool .count").show().html(data.result.length);
		}else{
			config.elem.find(".contrast_tool .count").html(0).hide();
			$(".contrast_case_popup").find(".confirm_contrast").addClass("disabled").removeClass("abled");
			utils.no_result({img_name:"no_contrast_case",class_name:"no_contrast_case",text:"请添加对比的案例",parent_elem:$(".contrast_case_popup").find(".contrast_case_list")});
		}
		
	}).fail(function(){
		$(".contrast_case_popup").find(".confirm_contrast").addClass("disabled").removeClass("abled");
		utils.no_result({img_name:"no_contrast_case",class_name:"no_contrast_case",text:"请添加对比的案例",parent_elem:$(".contrast_case_popup").find(".contrast_case_list")});
	})
	function delete_contrast_case(){
		var case_id=$(this).closest(".contrast_case_item").attr("case_id");
		utils.confirm_hints({hint_info:"您确定要删除吗？",callback:callback}).show();
		function callback(){
			utils.delete_req("/comparison/"+case_id).done(function(response){
				var data=utils.change_json(response);
				render_contrast_case(data);
				utils.confirm_hints().remove();
				if(config.callback.delete_callback){
					config.callback.delete_callback([case_id]);
				}
			})
		}
	}
	//清空数据
	function clear_contrast_case(){
		if(!$(".contrast_case_popup .contrast_case_item").length)return;
		utils.confirm_hints({hint_info:"您确定要清空吗？",callback:callback}).show();
		function callback(){
			utils.delete_req("/comparison/all/").done(function(response){
				var tempArr=[];
				$.each($(".contrast_case_popup .contrast_case_item"),function(){
					tempArr.push($(this).attr("case_id"));
				})
				if(config.callback.delete_callback){
					config.callback.delete_callback(tempArr);
				}
				delete tempArr;
				$(".contrast_case_popup").find(".contrast_case_list").empty();
				utils.no_result({img_name:"no_contrast_case",class_name:"no_contrast_case",text:"请添加对比的案例",parent_elem:$(".contrast_case_popup").find(".contrast_case_list")});
				$(".contrast_case_popup").find(".confirm_contrast").addClass("disabled").removeClass("abled");
			})
		}	
	}
	function close_contrast_popup(){
		$(".contrast_case_popup").animate({bottom:-300},500,function(){$(this).remove()});
	}
	function confirm_contrast(){
		close_contrast_popup();
		$(this).attr("href",base_path+"/comparison/list");
	}
}
//渲染对比案例
function render_contrast_case(data){
	var html='';
	if(data.result.length){
		html+='<ul class="clearfix">';
		$.each(data.result,function(index,item){
			html+='<li class="contrast_case_item" case_id="'+item.id+'">';
			html+='<h4 class="case_name" title ='+item.TITLE+'>'+item.TITLE+'</h4>';
			html+='<div class="delete_drop" title="'+item.TITLE+'"><i class="icon-delete"></i><span>删除案例</span></div>';
			html+='</li>';
		})
		html+='</ul>';
		$(".contrast_case_popup").find(".contrast_case_list").html(html).removeClass("no_result_elem").find(".no_result").remove();
		if(data.result.length>=2){
			$(".contrast_case_popup").find(".confirm_contrast").addClass("abled").removeClass("disabled");
		}else {
			$(".contrast_case_popup").find(".confirm_contrast").addClass("disabled").removeClass("abled");
		}
	}else{
		utils.no_result({img_name:"no_contrast_case",class_name:"no_contrast_case",text:"请添加对比的案例",parent_elem:$(".contrast_case_popup").find(".contrast_case_list")});
	}
	
}

//添加个数
function add_count(target_elem,target_count,callback){
	var html='<span class="add_count">+1</span>';
	var target_left=target_elem.find(".count").get(0).offsetLeft;
	var target_top=target_elem.find(".count").get(0).offsetTop;
	target_elem.append(html).find(".add_count").animate({
		left:target_left,
		top:target_top,
		width:20,
		height:20,
		opacity:0
	},500,function(){
		target_elem.find(".add_count").remove();
		target_elem.find(".count").show().html(target_count);
		if(callback){
			callback()
		}
	})
}
function add_authoritative_case_to_report(config){
	utils.post_req("/jsbg/add",config.submit_data).done(function(response){
		var response_obj=utils.change_json(response);
		if(response_obj.message=="success"){
			add_count(float_tool_bar.find(".report_tool"),response_obj.jsbgSize,function(){
				$(config.trigger).attr("js_id",response_obj.jsbgCid).removeClass("active");
			})
			var index=$(config.trigger).attr("index");
			if(config.data){
				config.data[index].jsbgCid=response_obj.jsbgCid;
			}
		}else if(response_obj.message=="repeat"){
			utils.operation_hints({status:"warn",text:"请勿重复添加"});
			config.target_ele.find(".report_tool .count").show().html(response_obj.jsbgSize);
			$(config.trigger).attr("js_id",response_obj.jsbgCid).removeClass("active");
			var index=$(config.trigger).attr("index");
			if(config.data){
				config.data[index].jsbgCid=response_obj.jsbgCid;
			}
		}else if(response_obj.message=="limit"){
			config.target_ele.find(".report_tool .count").show().html(response_obj.jsbgSize)
			utils.operation_hints({status:"warn",text:"已达上限，请生成检索报告后再添加"})
		}
		
	})
}
function add_general_case_to_report(config){
	config.dialog_config.callback=add_report_callback;
	dialog(config.dialog_config).show();
	function add_report_callback(){
		var jsbgCid=arguments[0];
		var jsbgSize=arguments[1];
		var status=arguments[2];
		if(status=="success"){
			add_count(config.target_ele.find(".report_tool"),jsbgSize,function(){
				$(config.trigger).attr("js_id",jsbgCid).removeClass("active");
			})
			var index=$(config.trigger).attr("index");
			if(config.data){
				config.data[index].jsbgCid=jsbgCid;
			}
		}else if(status=="repeat"){
			utils.operation_hints({status:"warn",text:"请勿重复添加"});
			config.target_ele.find(".report_tool .count").html(jsbgSize);
			$(config.trigger).attr("js_id",jsbgCid).removeClass("active");
			var index=$(config.trigger).attr("index");
			if(config.data){
				config.data[index].jsbgCid=jsbgCid;
			}
		}else if(status=="limit"){
			config.target_ele.find(".report_tool .count").show().html(jsbgSize)
			utils.operation_hints({status:"warn",text:"已达上限，请生成检索报告后再添加"})
		}
		
	}
}
//获取分享图片id

function get_image_path (wsid) {
	
	utils.get_req('/wechat/getCodeByDocId/'+wsid).done(function(res){
		var data=utils.change_json(res);
		var share_elem = float_tool_bar.find('.show_share');
		var pic_url = '';
		if (data.exist && wsid == data.docId) {
			pic_url = data.picPath + data.docId + '.png';
			
			
		}else {
			console.info('没有pics');
		}
		var html = '';
		pic_url = pic_url ? pic_url:base_path+"/www/public/img/qy_code.png";
		html += '<img src = "'+pic_url+'" style="width: 150px">';
		html += '<p>微信扫一扫</p>'
		html += '<p>分享至好友和朋友圈</p>'	
		share_elem.html(html);
		
	})
}


//设置自定义滚动条
function set_scrollBar (content_elem) {
	content_elem.niceScroll({
		cursorcolor:"#4194F2",
		cursorwidth: "15px",
		cursorborderradius: "3px",
		cursorborder:'none'
	})
}
//打开笔记
function open_text(ev) {
	close_all_window()
	ev.stopPropagation();
	$('.note_list').remove();
	var that = this;
	utils.post_req('/wdbj/showListDetails',{
		cId: $(that).attr("data-val")
	}).done(function(res){
		var html = '';
			html += '<div class = "note_list">'
			html += '<div class = "note_title">'	
			html += '<span>笔记列表</span>'
			html += '<a class = "close_note"><i class = "icon-close"></i></a>'
			html += '</div>'
			html += '<div class = "note_wrapper">'
			html += '<div class = "note_content">'	
		var data = utils.change_json(res).result;
		$.each(data,function(index,item){
			html += '<div class = "note_item">'
				html += '<div class = "note_cBz">'
					html += '<p title = "'+item.cBz+'">'+item.cBz+'</p>'
					html += '<div class = "look_more">'
					html += '<span>查看更多</span>'
					html += '<img  src = "'+base_path+'/www/alyp/img/turn_bottom.png/">'	
				html += '</div></div>'
				html += '<div class = "note_bq">'
					html += '<p title = "'+item.cBq+'">'+item.cBq+'</p>'
					html += '<p><span>'+item.dtZhxgsj+'</span><span class = "remove" data-val = '+item.cId+'>删除</span></p>'
				html += '</div>'	
			html += '</div>'	
		})
			html += '</div></div>'
		html += '</div>'
		html += '</div>'
	    $('body').append(html).css({
	    	'overflow' : 'hidden'
	    });	
		set_scrollBar($('.note_content'));
		set_note_style();
		var note_list = $('.note_list');
		appear_animate(note_list);
		note_list.on('click','.look_more',look_more)
				 .on('click','.remove',remove_note)
				 .on('click','.close_note',close_note)
				
		$('.look_more').hover(handlerIn,handlerOut)
	})
}

function set_note_style () {
	$.each($('.note_cBz').find('p'),function(index,item){
		if ($(item).height() <= 84) {
			$(item).next('.look_more').hide();
		}else {
			$(item).addClass('collapsed');
		}
	})
}

function handlerIn () {
	var trigger = this;
	hover_style(trigger,true);
}
function handlerOut () {
	var trigger = this;
	hover_style(trigger);
}
function hover_style (trigger,flag) {
	var url = flag ? base_path+ '/www/alyp/img/hover_note.png'  : base_path + '/www/alyp/img/turn_bottom.png';
	if (flag) {
		$(trigger).find('span').addClass('hover_style')
	}else {
		$(trigger).find('span').removeClass('hover_style')
	}
	$(trigger).find('img').attr('src',url)
}

function look_more () {
	if ($(this).prev('p').hasClass('collapsed')) {
		$(this).find('span').text('收起')
		$(this).find('img').attr('src',''+base_path+'/www/alyp/img/arrow_top.png');
	}else {
		$(this).find('span').text('查看更多')
		$(this).find('img').attr('src',''+base_path+'/www/alyp/img/turn_bottom.png');
	}
	$(this).prev('p').toggleClass('collapsed');
}
function remove_note () {
//	utils.confirm_hints({,callback:callback}).show();
	var target = this;
	var hint_info_left = $(this).offset().left;
	var hint_info_top = $(this).offset().top;
	var config = {
		hint_info:"确认删除这条笔记吗？"	
	}
	var html = ''
		html += '<div class = "confirm_hint_note" >'
		html += '<div class="confirm_hint">';
		html += '<img src = "'+base_path+'/www/alyp/img/explain.png">';
		html += '<span class="hint_info">' + config.hint_info + '</span>';
		html += '<div class="actions">';
		html += '<a href="javascript:;" class="confirm">确认</a>';
		html += '<a href="javascript:;" class="cancle">取消</a>';
		html += '</div>';
		html += '</div>';
		html += '</div>';
		$('body').append(html).css('position','relative')
							  .on("click", ".confirm", confirm)
							  .on("click",".cancle", remove)
		function remove() {
			$(".confirm_hint_note").eq(0).remove();
		}
		function confirm () {
			callback()
			remove()
		}
		if ($(window).width() - hint_info_left <= 600) {
			$('.confirm_hint_note').css({
				"right": '20px',
				"top": hint_info_top - $('.confirm_hint_note').outerHeight() - 10
			})
		} else {
			$('.confirm_hint_note').css({
				"left": hint_info_left,
				"top": hint_info_top - $('.confirm_hint_note').outerHeight() - 10
			})
		}
		
	var note_index = $(this).parents('.note_item').index();
	function callback () {
		var cId = $(target).attr('data-val');
		utils.post_req('/wdbj/delBJ2',{cId: cId}).done(function(res){
			var data = utils.change_json(res);
		 if (data.isSuccess) {		 
			 if (isIE()) {
				 document.querySelectorAll('.note_item')[note_index].removeNode(true);
			 }else {
				  $('.note_item')[note_index].remove();
			 }
	            $.each($(".bjBackground"), function(index, item) {
	                var arr = $(item)
	                  .attr("data-val")
	                  .split(",");
	                var flag = false;
	                $.each(arr, function(key, value) {
	                  if (value == cId) {
	                	arr.splice(arr.indexOf(value), 1);
	                	if (arr.length) {
	                		var count = arr.length > 99 ? "99+" :'('+arr.length+')';
	                		$(item).attr("data-val", arr.join(","));
	                		$(item).text(count);
	                	}else {
	                		if (isIE()) {
	                			item.removeNode(true);
	                		}else {
	                			item.remove();
	                		}
	                		
	                		close_note();
	                		//删除动画;
	                	}
	                    flag = true;
	                    return false;
	                  }
	                });
	                if (flag) {
	                  return false;
	                }
	              });
			 
		 }
			
		})
	}
}

function appear_animate (elem) {
	if (!elem.hasClass('active')) {
		elem.addClass('active').animate({
			'right' : '0',
		},500)
	}
}

function close_note (elem) {
	$('.note_list').animate({
		'right' : '-350px',
		'opacity': '0'
	},500)
	$('body').css('overflow','auto');
}

function set_scrollBar (content_elem) {
	content_elem.niceScroll({
		cursorcolor:"#4194F2",
		cursorwidth: "15px",
		cursorborderradius: "3px",
		cursorborder:'none',
		autohidemode : "hidden"
	})
}

function isIE() { //ie?
	 if (!!window.ActiveXObject || "ActiveXObject" in window)
	  return true;
	  else
	  return false;
	 }

