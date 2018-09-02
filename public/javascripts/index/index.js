//获取新法速递提交参数
var get_new_law_request = null;
var get_new_law_data = {
	type: "",
	pageIndex: 1,
	source: "",
	pageSize: 6
}
var loading = new utils.loading();
console.log('loading',loading)
console.log('utils',utils)
//DOM元素
var search_container = $("#search_container");
var new_law_module = $("#new_law_module");
var court_module = $("#court_module");
var float_tool_bar = $("#float_tool_bar");
var to_Innocent_Map = $("#to_Innocent_Map");
var PAGE_WIDTH = 600 //一页的宽度
var TIME = 500 // 翻页的持续时间
var ITEM_TIME = 20 // 单元移动的间隔时间
var imgCount = 2
var points_index = 0 //当前下标
var moving = false // 标识是否正在翻页(默认没有)
// 计算出目标圆点的下标targetIndex
var targetIndex = 0;
var temp_case_type = cur_case_type;
var company_case_type = 'all';
var CUR_PROJECT_Arr = [];
var ever_CUR_PROJECT;
var hasApplied;
//启动
page_init();

var STEP_FORM_ONE = "<form action='' class='form form1'>\
	<h2 class='title'>企业调查内测申请</h2>\
	<div class='line'></div>\
	<p class='name info'>姓名<input type='text' class='username'></p>\
	<p class='phone info'>手机号码<input type='text' class='tel'></p>\
	<p>\
		<span class='job'>职业</span>\
		<span id='jobtype'>\
			<input type='radio' value='主办律师' id='first' name='job' ><label for='first'>主办律师</label><br>\
			<input type='radio' value='律师助理' id='second' name='job'><label for='second'>律师助理</label><br>\
			<input type='radio' value='合伙人律师' id='third' name='job'><label for='third'>合伙人律师</label><br>\
			<input type='radio' value='公司法务' name='job' id='forth'><label for='forth'>公司法务</label><br>\
			<input type='radio' value='法学院学生' name='job' id='fifth'><label for='fifth'>法学院学生</label><br>\
			<input type='radio' value='法官/检查官' name='job' id='sixth'><label for='sixth'>法官/检查官</label><br>\
			<input type='radio' value='其它' name='job' id='seventh'><label for='seventh'>其他职业</label>\
		</span>\
	</p>\
	<a><i class = 'icon-close close'></i></a>\
	<div class='dialog_footer one_btn'><a class = 'next confirm_btn'>下一步</a></div>\
</form>";

var STEP_FORM_TWO = function (type) {
	var n = type == "firstJob" ? "律所" : type == "secondJob" ? "公司" : "单位";
	return "<form action='' class='form form2'>\
			<h2 class='title'>企业调查内测申请</h2>\
			<a><i class = 'icon-close close'></i></a>\
			<div class='line'></div>\
			<p class='info name office'>" + n + "名称<input type='text' class='officename'></p>\
			<p class='os'>\
				<span class='job officeScale'>" + n + "规模</span>\
				<span id='jobtype'>\
					<input type='radio' name='scale' id='small'><label for='small'>10人以下</label><br>\
					<input type='radio' name='scale' id='ms'><label for='ms'>11-50人</label><br>\
					<input type='radio' name='scale' id='middle'><label for='middle'>51-100人</label><br>\
					<input type='radio' name='scale' id='large'><label for='large'>101人以上</label>\
				</span>\
			</p>\
			<p class='find'>\
				<i></i>您目前对企业开展初步调查会使用何种方式？\
			</p>\
			<p>\
				<input type='checkbox' name='method' id='fm'><label for='fm'>按照清单上网检索（企业信用信息公示系统、裁判文书网等）</label><br>\
				<input type='checkbox' name='method' id='sm'><label for='sm'>使用第三方调查工具（天眼查、企查查等）</label><br>\
				<input type='checkbox' name='method' id='tm'><label for='tm'>等待企业按照材料清单提供内部资料</label><br>\
				<input type='checkbox' name='method' id='formethod'><label for='formethod'>其他</label>\
			</p>\
			<div class='dialog_footer one_btn'><a class='next confirm_btn'>下一步</a></div>\
		</form>"
};
var STEP_FORM_THREE = "<form action='' class='form form3'>\
	<h2 class='title'>企业调查内测申请</h2>\
	<a><i class = 'icon-close close'></i></a>\
	<div class='line'></div>\
	<div class='message'>\
		<p>我们已收到您的申请，请扫描下方二维码联系客服元元，</p>\
		<p>元元会及时为您开通内测资格。感谢您的关注！</p>\
	</div>\
	<button class='know'>我知道了</button>\
</form>";
(function () {
	if (showInnocent) {
		var innoHTML =
			'<p class="innocent">' +
			'<span class="ntag">new</span>' +
			'<span>无罪案例库</span>' +
			'<i id="to_Innocent_Map" onclick="to_InnoTree()">点击查看</i>' +
			'</p>';
		$(".case_count").after(innoHTML);
	};
}());

function to_InnoTree() {
	var form = $('<form target="_self" method="post" action="' + base_path +
		'/innocent/caseDb"></form>');
	$("body").append(form);
	form.submit().remove();
};

function page_init() {
	getCookie("is_sixth");
	addCookie("is_sixth", "six");
	bind_events();
	//触发案例研判项目点击事件
	search_container.find(".search_project").eq(0).trigger("click");
	//触发热门法院渲染事件
	if (showFgfx) {
		court_module.find(".hot_court_tabbar").trigger("click");
	};
	//触发获取新法速递事件
	new_law_module.find(".law_status_tabbar").eq(0).trigger("click");
	//渲染用户数据
	render_user();
	//渲染案件类型
	render_case_type(search_container.find(".case_types_container"))
	//搜索框搜索fn
	search_event(search_container.find(".search_area"), search_container.find(
		".search_input"), search_container.find(".search_btn"));
	//获取案件，文书数量
	get_case_count();

}

function warn() {
	$("input[type='text']").each(function () {
		if (!reg.test(phone$) || (this).val() === '') {
			$(this).parent('p').css("color", 'red')
		}
	})
}
//绑定事件
function bind_events() {
	$(document).on("click", '.footer a', click_carousel)
		.on('click', '.close_img_btn', close_update_guide)
		.on('click', '.pre_btn', function () {
			nextPage(false)
		})
		.on('click', '.next_btn', function () {
			nextPage(true)
		})
	//		.on('mouseover ', '.update_guide', mouse_event)
	//		.on('mouseleave', '.update_guide', mouse_leave)
	search_container
		.on("click", ".search_project", change_index_project)
		.on("click", ".drop_btn", drop_menu_show)
		.on("click", ".case_types_item", change_index_case_type)
		.on("click", ".flfg_query_type", change_flfg_query_type)
		.on('click', ".company_query_type", change_qyfxfx_query_type)
		.on('click', ".lsls_query_type", change_lsls_query_type)
		.on("click", ".combination_search_btn", add_combination_search)



	if (showFgfx) {
		court_module
			.on("click", ".hot_court_tabbar", render_hot_court)
			.on("click", ".hot_search_court_tabbar", get_hot_search_court)
			.on('click', '.image_text_live', get_image_text_live)
			.on('click', '.court_video', get_court_video)
			.on('click', '.text_articles', get_text_articles)
			.on("click", ".to_court_detail", to_court_detail)
			.on("click", ".to_court_result", to_court_result)

	}

	new_law_module
		.on("click", ".law_status_tabbar", change_law_status)
		.on("click", ".law_source_item", change_law_source)
	float_tool_bar
		.on('click', '.tool_item', to_other_page)
	var over_data;
	$("body").on('click', '.form .close', function () {
		$.ajax({
			url: base_path + '/gnsy/qydp',
			success: function (data) {
				var data = JSON.parse(data)
				console.log(data);
				if (data.hasApplied && data.sqzt == 2) {
					search_container.find(".search_project").eq(3).trigger("click");
				} else {
					var project_arr = ['alyp', 'flfg', 'cpgd', 'qyfxfx'];
					var index = project_arr.indexOf(ever_CUR_PROJECT);
					search_container.find(".search_project").eq(index).trigger("click");
				}
			}
		});
		var w = $('body').width()
		$('.form').animate({
			top: 100,
			opacity: 'hide',
			width: 0,
			height: 0,
			left: w
		}, 500);

		setTimeout(function () {
			$('http://www.chineselaw.com/www/index/js/.mask, .form').fadeOut('fast');
			$('body').css('overflow', 'auto');
		}, 500);
	})
};

function insertData(cXm, cSjhm, cZy, cDwmc, cDwgm, cQydcfs) {
	$.ajax({
		type: 'post',
		async: false,
		data: {
			"cXm": cXm,
			"cSjhm": cSjhm,
			"cZy": cZy,
			"cDwmc": cDwmc,
			"cDwgm": cDwgm,
			"cQydcfs": cQydcfs
		},
		url: base_path + '/gnsy/qydp/insert',
		datatype: "json",
		success: function (data) {
			console.log(data);
		}
	})
}

// function accomplish_test() {
//   $('.sqnc').find('img').attr('src', base_path + '/www/index/img/ncjd.png'); // blue-image
//   $('.sqnc').find('span').text('内测阶段')
//   $('body').css({
//     'overflow': 'auto'
//   });
// };
// function approving() {
//   $('.sqnc').find('img').attr('src', base_path + '/www/index/img/sqnc.png'); // orange-image
//   $('.sqnc').find('span').text('审批中')
//   $('body').css({
//     'overflow': 'auto'
//   });
// };
function approved() {
	$('.sqnc').find('img').attr('src', base_path + '/www/index/img/ncjd.png'); // orange-image
	$('.sqnc').find('span').text('审批通过')
	$('body').css({
		'overflow': 'auto'
	});
};
// function not_Approved() {
//   $('.sqnc').find('img').attr('src', base_path + '/www/index/img/sqnc.png'); // orange-image
//   $('.sqnc').find('span').text('未通过')
//   $('body').css({
//     'overflow': 'auto'
//   });
// };
function warn() {
	if ($('.form input[type="text"]').val() === '') {
		$('.form input[type="text"]').css('border-color', 'red')
		$('.form input[type="text"]').parent('p').css('color', 'red')
	} else {
		$('.form input[type="text"]').css('border-color', '')
		$('.form input[type="text"]').parent('p').css('color', '')
	}
	if (!$("input[type='radio']:checked").length) {
		$("input[type='radio']").parent('span').prev('span').css('color', 'red')
	} else {
		$("input[type='radio']").parent('span').prev('span').css('color', '')
	}
	if (!$("input[type='checkbox']:checked").length) {
		$("input[type='checkbox']").parent('p').prev('p').css('color', 'red')
	} else {
		$("input[type='checkbox']").parent('p').prev('p').css('color', '')
	}
}


/*切换当前搜索的项目*/
function change_index_project() {
	CUR_PROJECT = $(this).attr("project_code");
	CUR_PROJECT_Arr.push(CUR_PROJECT)
	$(this).addClass("active").siblings().removeClass("active");
	search_container.find(".search_input").val('').attr("placeholder", "");
	if (CUR_PROJECT == "alyp") {
		search_container.find(".search_input_wrapper").css('margin-left', '131px');
		search_container.find(".case_types_container").show();
		search_container.find(".search_type_container").hide();
		search_container.find(".company_type_container").hide();
		search_container.find(".lsls_type_container").hide();
		search_container.find(".combination_search_btn").show();
		search_container.find(".search_input_wrapper").removeClass("cpgd").removeClass(
			'qyfxfx');
		search_container.find(".search_input").attr("placeholder",
			"请输入案情特征词、案由、要素，按回车键，支持多组条件同时检索");
		search_container.find(".case_count").show();
		search_container.find("p.innocent").show();
	} else {
		search_container.find(".case_types_container").hide();
		search_container.find(".combination_search_btn").hide();
		search_container.find(".case_count").hide();
		search_container.find("p.innocent").hide();
		if (CUR_PROJECT == "flfg") {
			search_container.find(".search_input_wrapper").css('margin-left', '131px');
			search_container.find(".search_type_container").show();
			search_container.find(".company_type_container").hide();
			search_container.find(".search_input_wrapper").removeClass("cpgd").removeClass(
				'qyfxfx');
			search_container.find(".lsls_type_container").hide();
			search_container.find(".search_input").attr("placeholder",
				"输入关键词，按回车键，支持多组条件同时检索");
		} else if (CUR_PROJECT == "cpgd") {
			search_container.find(".search_input_wrapper").css('margin-left', 0);
			search_container.find(".search_input_wrapper").addClass("cpgd").removeClass(
				'qyfxfx');
			search_container.find(".company_type_container").hide();
			search_container.find(".search_type_container").hide();
			search_container.find(".lsls_type_container").hide();
			search_container.find(".search_input").attr("placeholder",
				"输入法院、法官、案由，按回车键，支持多组条件同时检索");
		} else if (CUR_PROJECT == "qyfxfx") {
			search_container.find(".search_input_wrapper").css('margin-left', 0);
			var index = CUR_PROJECT_Arr.indexOf('qyfxfx');
			ever_CUR_PROJECT = CUR_PROJECT_Arr[index - 1];
			CUR_PROJECT_Arr = [];
			search_container.find(".search_input_wrapper").removeClass('cpgd');
			search_container.find(".company_type_container").show();
			search_container.find(".search_type_container").hide();
			search_container.find(".lsls_type_container").hide();
			search_container.find(".search_input").attr("placeholder",
				"请输入企业名称、法定代表人或核心成员姓名");
		} else if (CUR_PROJECT == "lsls") {
			search_container.find(".search_input_wrapper").css('margin-left', '131px');
			var index = CUR_PROJECT_Arr.indexOf('lsls');
			ever_CUR_PROJECT = CUR_PROJECT_Arr[index - 1];
			CUR_PROJECT_Arr = [];
			search_container.find(".search_input_wrapper").removeClass('cpgd');
			search_container.find(".company_type_container").hide();
			search_container.find(".lsls_type_container").show();
			search_container.find(".search_type_container").hide();
			search_container.find(".search_input").attr("placeholder",
				"输入名称进行检索");
		}
	}
	utils.placeholder([search_container.find(".search_input").eq(0)]);
	for (var key in publicSearchConfig) {
		if (key == "cpgd") {
			publicSearchConfig[key].screen_query = {
				fg: "",
				fy: "",
				ay: "",
				fgId: "",
				dq: ""
			};
		} else if (key == "qyfxfx") {
			publicSearchConfig[key].screen_query = []; //重置screen_query
		} else {
			publicSearchConfig[key].screen_query = [];
		}
		//去掉上屏
		if (publicSearchConfig[key].render_screen_query) {
			publicSearchConfig[key].render_screen_query(search_container.find(
				".search_area"));
		}
		//去掉suggest

	}
}
//切换案件类型
function change_index_case_type() {
	var _this = this;
	cur_case_type = $(_this).attr("case_type");
	temp_case_type = $(_this).attr("case_type");
	var text = $(_this).text();
	$(_this).closest(".case_types_container").find(".current_case_types span").html(
		text);
	$(_this).closest(".drop_menu").removeClass("show").hide(5, function () {
		$(document).off(".menu_hide");
	});
	if (INIT_PROJECT == "alyp") {
		query = [];
		filter = [];
		advs = [];
	} else if (INIT_PROJECT == "flfg") {
		query = [];
		filter = [];
	}
	reset_screen(search_container.find(".search_area"));
	if (INIT_PROJECT == "alyp" || INIT_PROJECT == "flfg") {
		empty_config();
	}
}
/*//组合检索
function add_combination_search(){
	var trigger=this;
	is_login(trigger,callback);
	function callback(){
		dialog({
			trigger:trigger,
			type:"combination_search",
			title:"组合检索",
			options : {
				relativeToWindow : true
			},
			query:publicSearchConfig["alyp"].query,
			filter:publicSearchConfig["alyp"].filter,
			advs:publicSearchConfig["alyp"].advs,
	  }).show();
	}

}*/
//获取文书案件数量
function get_case_count() {
	utils.get_req("/ajax/search/countCaseInfo").done(function (response) {
		render_case_count(utils.change_json(response));
	});

	function render_case_count(data) {
		var html = [];
		$.each(data, function (index, item) {
			html.push(item.cfield + '<span class="count" target_count="' + item.value +
				'">0</span>篇');
		});
		search_container.find(".case_count").html(html.join('，')).find(".count").each(
			function () {
				step_add_count($(this));
			})
	}

	function step_add_count(obj) {
		var target_count = obj.attr("target_count");
		var step = 100;
		var interval = 10;
		var start = 0;
		step = Math.ceil(target_count / step);
		obj.timer = setInterval(function () {
			start += step;
			obj.html(start);
			if (start >= target_count) {
				start = target_count;
				obj.html(start);
				clearInterval(obj.timer);
			}
		}, interval);

	}
}
/*更改法规状态获取新法*/
function change_law_status() {
	get_new_law_data.type = $(this).attr("type");
	get_new_law_data.pageIndex = 1;
	get_new_law_data.source = '';
	if ($(this).hasClass("active")) return;
	$(this).addClass("active").siblings().removeClass("active");
	get_new_law();
}
/*更改法规来源获取新法*/
function change_law_source() {
	get_new_law_data.source = $(this).attr("source");
	get_new_law_data.pageIndex = 1;
	get_new_law();
}
//获取新法
function get_new_law() {
	if (get_new_law_request != null) {
		get_new_law_request.abort();
	}
	loading.run(new_law_module.find(".new_law_info"));
	get_new_law_request = utils.post_req("/ftfx/newLawList", get_new_law_data);
	get_new_law_request.done(function (response) {
		loading.run();
		render_new_law_data(utils.change_json(response));
		get_new_law_request = null;
	});
}

//渲染新法速递数据
function render_new_law_data(data) {
	if (data.list.length == 0 && data.source.length == 0) return;
	var html = [],
		tempArr = [];
	html.push('<ul class="law_source_list">');
	$.each(data.source, function (index, item) {
		var active = item.mz ? "active" : "";
		if (active) {
			get_new_law_data.source = item.value;
		}
		html.push('<li class="law_source_item ' + active + '" source="' + item.value +
			'">' + item.hint + '</li>');
	});
	html.push('</ul>');
	html.push('<ul>');
	$.each(data.list, function (index, item) {
		var fg_url = base_path + '/flfg/' + item.library + '/' + item.Gid
		html.push('<li class="new_law_item">');
		html.push('<h5 gid="' + item.Gid + '" class="item_title" title="' + item.title +
			'"><a target="_blank" href="' + fg_url + '">' + replaceTitle(item.title) +
			'</a></h5>');
		item.documentNO ? tempArr.push('<span>' + item.documentNO + '</span>') : "";
		item.timelinessDic ? tempArr.push('<span>' + item.timelinessDic + '</span>') :
			"";
		item.issueDate ? tempArr.push('<span>' + item.issueDate + "发布" + '</span>') :
			"";
		item.implementDate ? tempArr.push('<span>' + item.implementDate + "实施" +
			'</span>') : "";
		var title = '';
		title += item.documentNO ? item.documentNO + "|" : "";
		title += item.timelinessDic ? item.timelinessDic + "|" : "";
		title += item.issueDate ? item.issueDate + "|" : "";
		title += item.implementDate ? item.implementDate : "";
		html.push('<p title="' + title + '">' + tempArr.join("|") + '</p>');
		html.push('</li>');
		tempArr = [];
	});
	delete tempArr;
	html.push('</ul>');
	html.push('<div class="new_law_pagination"></div>');
	new_law_module.find(".new_law_info").html(html.join(''));
	pagination({
		total_num: data.total,
		cur_page: get_new_law_data.pageIndex,
		page_size: 6,
		jump: true,
		elem: new_law_module.find(".new_law_pagination"),
		callback: callback
	})

	function replaceTitle(text) {
		if (/―/.test(text)) {
			return text.replace(/―/g, "—");
		}
		return text;
	}

	function callback(cur_index) {
		get_new_law_data.pageIndex = cur_index;
		get_new_law();
	}
}
//渲染热门法院
function render_hot_court() {
	if ($(this).hasClass("active")) return;
	$(this).addClass("active").siblings().removeClass("active");
	var data = [{
		fy: "北京市朝阳区人民法院",
		ay: "劳动争议"
	}, {
		fy: "浙江省杭州市中级人民法院",
		ay: "买卖合同纠纷"
	}, {
		fy: "天津市第一中级人民法院",
		ay: "侵害商标权纠纷"
	}, {
		fy: "上海市宝山区人民法院",
		ay: "民间借贷纠纷"
	}, {
		fy: "浙江省杭州市中级人民法院",
		ay: "盗窃罪"
	}, {
		fy: "广东省东莞市中级人民法院",
		ay: "走私、贩卖、运输、制造毒品罪"
	}, {
		fy: "山东省高级人民法院",
		ay: "故意杀人罪"
	}, {
		fy: "南京市江宁区人民法院",
		ay: "交通肇事罪"
	}, {
		fy: "北京知识产权法院",
		ay: "侵害外观设计专利权纠纷"
	}];
	var html = '';
	html += '<ul class="list clearfix">';
	$.each(data, function (index, item) {
		html += '<li class="to_court_detail"><div class="wrapper" title="法院：' +
			item.fy + '' + " 案由：" + '' + item.ay + '">';
		html += '<h3>' + item.fy + '</h3>';
		html += '<p>' + item.ay + '</p>';
		html += '</div>';
		html += '<img src="' + base_path +
			'/www/index/img/icon_card@2.jpg" alt="">';
		html += '</li>';
	})
	html += '</ul>';
	court_module.find(".court_info").empty().html(html);
}
//获取热搜法院
function get_hot_search_court() {
	if ($(this).hasClass("active")) return;
	$(this).addClass("active").siblings().removeClass("active");
	utils.get_req("/cpgdfx/getTopSearch").done(function (response) {
		render_hot_search_court(utils.change_json(response));
	});
}
//渲染热搜法院
function render_hot_search_court(data) {
	var html = '';
	html += '<ul class="list">';
	for (var i = 0; i < data.length; i++) {
		var count = parseInt(data[i].num) >= 10000 ? "9999+" : data[i].num;
		html += '<li class="to_court_result"><div class="wrapper" title="' + data[i].name +
			'（' + count + '）">';
		html += '<h3>' + data[i].name + '</h3>';
		html += '</div>';
		html += '<img src="' + base_path + '/www/index/img/icon_card@2.jpg" alt="">';
		html += '</li>';
	}
	html += '</ul>';
	court_module.find(".court_info").empty().html(html);
}
//获取庭审直播的数据
function get_court_video() {
	if ($(this).hasClass("active")) return;
	$(this).addClass("active").siblings().removeClass("active");
	loading.run($('.court_info'));
	utils.get_req("/cpgdfx/getNewestTrialVideos").done(function (response) {
		loading.run();
		if (JSON.parse(response).length == 0) {
			utils.no_result({
				img_name: "no_result",
				text: "暂无数据",
				parent_elem: $('.court_info.module_info')
			})
		}else {
			render_court_video(utils.change_json(response));
		}	
	});
}

//渲染庭审直播
function render_court_video(data) {
	var html = '';
	html += '<ul class="list">';
	$.each(data, function (index, item) {
		html += '<div class = "item" >'
		html += '<a href = ' + item.TSLXDZ + ' target = "_blank"><img src="' +
			base_path + '/www/index/img/tsspBg' + (index + 1) + '.jpg">'
		html +=
			'<div class="play_button" ><i class="icon-play"></i><span>播放</span></div>'
		html += '</a>'
		html += '<a href = ' + item.TSLXDZ + ' target = "_blank"><h5>' + item.AH +
			'</h5></a>'
		html += '</div>'
	})
	html += '</ul>'
	court_module.find(".court_info").empty().html(html);
}
//获取图文直播的数据
function get_image_text_live() {
	if ($(this).hasClass("active")) return;
	$(this).addClass("active").siblings().removeClass("active");
	loading.run($('.court_info'));
	utils.get_req("/cpgdfx/getNewestImageText").done(function (response) {
		loading.run();
		if (JSON.parse(response).length == 0) {
			utils.no_result({
				img_name: "no_result",
				text: "暂无数据",
				parent_elem: $('.court_info.module_info')
			})
		}else {
			render_image_text_live(utils.change_json(response));
		}

	});
}
//渲染图文直播的数据
function render_image_text_live(data) {
	var html = '';
	html += '<ul class = "live_list">'
	$.each(data, function (index, item) {
		var last = index == 5 ? 'last' : ''
		var url = base_path + '/cpgdfx/liveTrial/' + item.chat_id;
		html += '<li class = "live_item ' + last + '" >'
		html += "<a href = " + url + " target = '_blank'><h2>" + item.title +
			"</h2></a>"
		html += "<p>"
		html += item.court ? '<span>' + item.court + '</span>' : '';
		html += item.court ? "|" : '';
		html += '<span>' + item.live_date + '</span>'
		html += "</p>"
		html += "</li>"
	})
	html += '</ul>'
	court_module.find(".court_info").empty().html(html);
}

function to_court_detail() {
	var fy = $(this).find("h3").html();
	var ay = $(this).find("p").html();
	var form_data = {
		fy: fy,
		ay: ay,
		fg: "",
		fgId: "",
		dq: ""
	}
	utils.form_submit({
		url: '/cpgdfx/search',
		form_data: form_data,
		tag_name: "_blank"
	})
}
//获取文章观点的数据
function get_text_articles() {
	if ($(this).hasClass("active")) return;
	$(this).addClass("active").siblings().removeClass("active");
	loading.run($('.court_info'));
	utils.get_req("/cpgdfx/getNewestArticles").done(function (response) {
		loading.run();
		if (JSON.parse(response).length == 0) {
			utils.no_result({
				img_name: "no_result",
				text: "暂无数据",
				parent_elem: $('.court_info.module_info')
			})
		}else {
			render_text_articles(utils.change_json(response));
		}
		
	});
}

function render_text_articles(data) {
	var html = '';
	html += '<ul class = "live_list">'
	$.each(data, function (index, item) {
		var last = index == 5 ? 'last' : ''
		var url = base_path + '/cpgdfx/article/' + item.article_id;
		html += '<li class = "live_item ' + last + '" >'
		html += "<a href = " + url + " target = '_blank'><h2>" + item.title +
			"</h2></a>"
		html += "<p>"
		html += item.unit ? '<span>' + item.unit + '</span>' : '';
		html += item.unit ? "|" : '';
		html += item.writer.length ? '<span>' + item.writer + '</span>' : '';
		html += item.writer.length ? "|" : '';
		html += '<span>' + item.publishTime + '</span>'
		html += "</p>"
		html += "</li>"
	})
	html += '</ul>'
	court_module.find(".court_info").empty().html(html);
}

function to_court_result() {
	var fy = $(this).find("h3").html();
	var form_data = {
		fy: fy,
		ay: "",
		fg: "",
		fgId: "",
		dq: ""
	}
	utils.form_submit({
		url: '/cpgdfx/search',
		form_data: form_data,
		tag_name: "_blank"
	})
}

function to_other_page() {
	if ($(this).hasClass('to_top_tool')) {
		return
	}
	if ($(this).hasClass('to_zkld')) {
		window.open(base_path + "/zkHighlights");
	} else if ($(this).hasClass('to_userAction')) {
		window.open(base_path + "/instructions");
	} else if (user_status == 'guests') {
		window.open(lawyerUrl + "/index")
	} else if (user_status == '3') {
		window.open(lawyerUrl + "/form/040b0c57d41466a867cf546a9cab605d/insert")
	}



}

//渲染轮播图
function render_update_guide() {
	var html = '';
	html += '<div class = "dialog_back_drop">';
	html += '<div class = "dialog_update_guide_title" >'
	html += '<img src="' + base_path + '/www/index/img/title.png" >'
	html += '<a ><img class = "close_img_btn" src = "' + base_path +
		'/www/index/img/close.png""></a>'
	html += '</div>'
	html +=
		'<div class = "dialog update_guide show"  data-value = "update_guide">';
	html += '<ul id = "carousel_list">'
	html += render_list_item()
	html += '</ul>'
	//	html += '<div class = "left_shadow" ><img src = "' + base_path + '/www/index/img/left.png"></div>'
	//	html += '<div class = "right_shadow"><img src = "' + base_path + '/www/index/img/right.png"></div>'
	html +=
		'<div class = "footer"><a class = "first" data-index = "1" ><img src = "' +
		base_path + '/www/index/img/point_on.png""></a></div>'
	//	html += '<div class = "pre_btn"><img src = "' + base_path + '/www/index/img/C_left.png"></div>'
	//	html += '<div class = "next_btn"><img src = "' + base_path + '/www/index/img/C_right.png"></div>'
	html += '</div>';
	html += '</div>';
	$('body').append(html).addClass('dialog_open_class');
	//	var first_elem = $('.carousel_item')[0].outerHTML;
	//	var last_elem = $('.carousel_item')[1].outerHTML;
	//	$('#carousel_list').prepend(last_elem).append(first_elem);


}

function render_list_item() {
	var html = ''
	html += '<li class = "carousel_item ">'
	html += '<div class = "item_header"><img class = "header" src = "' + base_path +
		'/www/index/img/img1.png""></div>'
	html += '<ul class = "item_content">'
	html += '<div class = "details">'
	html += '<div class = "details_left">'
	html += '<img src = "' + base_path + '/www/index/img/icon1.png"">'
	html += '<p class = "details_footer">律师&律所名称检索</p>'
	html += '<p class = "details_footer">地域+案由组合筛选</p>'
	html += '</div>'
	html += '<div class = "details_right">'
	html += '<img src = "' + base_path + '/www/index/img/icon2.png"">'
	html += '<p class = "details_footer">律师律所基础信息展示+代理案件的裁判文书多维度分析及可视化展现</p>'
	html += '</div>'
	html += '</ul>'
	html += '</li>'

	//	for (var i = 0; i < 2; i++) {
	//		if (i == 0) {
	//			html += '<li class = "carousel_item ">'
	//		} else if (i == 1) {
	//			html += '<li class = "carousel_item last_item">'
	//		}
	//		html += '<div class = "item_header" >'
	//		html += '<div class = "item_header"><img class = "header" src = "' + base_path + '/www/index/img/img' + (i + 1) + '.jpg""></div>'
	//		html += '</div>'
	//		html += '<ul class = "item_content">'
	//		switch (i) {
	//		case 0:
	//			html += '<li>'
	//			html += '<div class = "details">'
	//			html += '<img class = "details_image" src = "' + base_path + '/www/index/img/icon1.png"">'
	//			html += '<div class = "details_section"><p> 视频记录，了解庭审风格，熟知话语节奏。</p></div>'
	//			html += '</div>'
	//			html += '</li>'
	//			html += '<li><div class = "details"><img class = "details_image" src = "' + base_path + '/www/index/img/icon2.png""><div class = "details_section"><p>真实诉辩，还原场景，有图有字有真相。</p></div></div></li>'
	//
	//			break;
	//		case 1:
	//			html += '<li>'
	//			html += '<div class = "details">'
	//			html += '<img class = "details_image" src = "' + base_path + '/www/index/img/icon3.png"">'
	//			html += '<div class = "details_section"><p>点选裁判观点详情页，左侧导航栏中文章观点栏目后，汇集法院法官的观点、看法、意见、论证等。</p></div>'
	//			html += '</div>'
	//			html += '</li>'
	//			break;
	//		}
	//
	//		html += '</ul>'
	//		html += '</li>'
	//	}
	return html



}

function nextPage(current) {
	if (moving) { //已经正在翻页中
		return
	}
	moving = true // 标识正在翻页
	var offset = 0;
	// 计算offset
	if (typeof current === 'boolean') {
		offset = current ? -PAGE_WIDTH : PAGE_WIDTH
	} else {
		offset = -(current - points_index) * PAGE_WIDTH
	}
	var itemOffset = offset / (TIME / ITEM_TIME)
	var currLeft = $('#carousel_list').position().left
	var targetLeft = currLeft + offset
	var intervalId = setInterval(function () {
		// 计算出最新的currLeft
		currLeft += itemOffset
		if (currLeft === targetLeft) {
			clearInterval(intervalId)
			// 标识翻页停止
			moving = false
			if (currLeft === -(imgCount + 1) * PAGE_WIDTH) {
				currLeft = -PAGE_WIDTH
			} else if (currLeft === 0) {
				currLeft = -imgCount * PAGE_WIDTH
			}
		}
		// 设置left
		$('#carousel_list').css('left', currLeft)
	}, ITEM_TIME)
	// 更新圆点
	updatePoints(current)

}

function updatePoints(current) {
	if (typeof current === 'boolean') {
		if (current) {
			targetIndex = points_index + 1 // [0, imgCount-1]
			if (targetIndex === imgCount) {
				targetIndex = 0
			}
		} else {
			targetIndex = points_index - 1
			if (targetIndex === -1) {
				targetIndex = imgCount - 1
			}
		}
	} else {
		targetIndex = current
	}
	$('.footer').find('img').attr('src', base_path + "/www/index/img/point.png")
	$('.footer').find('img').eq(targetIndex).attr('src', base_path +
		"/www/index/img/point_on.png")

	// 将index更新为targetIndex
	points_index = targetIndex
}

function click_carousel() {
	var targetIndex = $(this).index()
	// 只有当点击的不是当前页的圆点时才翻页
	if (targetIndex != points_index) {
		nextPage(targetIndex)
	}

}

function mouse_event(event) {
	var width = $(window).width();
	var offset_left = event.pageX - (width - 600) / 2
	if (offset_left <= 300) {
		$('.pre_btn').show()
		$('.left_shadow').show()
		$('.right_shadow').hide()
		$('.next_btn').hide()
	} else {
		$('.next_btn').show()
		$('.right_shadow').show()
		$('.left_shadow').hide()
		$('.pre_btn').hide()
	}

}

function close_update_guide() {
	$('.dialog_back_drop').remove()
	$('body').removeClass('dialog_open_class')
}


function addCookie(objName, objValue, objHours) { //添加cookie
	//  var str = objName + "=" + escape(objValue);
	//  if (objHours > 0) { //为0时不设定过期时间，浏览器关闭时cookie自动消失
	//    var date = new Date();
	//    var ms = objHours * 3600 * 1000;
	//    date.setTime(date.getTime() + ms);
	//    str += "; expires=" + date.toGMTString();
	//  }
	//  document.cookie = str;
	$.cookie(objName, objValue, {
		expires: 7
	});

}

function getCookie(objName) {
	//  var is_fourth = document.cookie.indexOf('fourth');
	//  if (is_fourth == -1) {
	//    render_update_guide();
	//  }
	var index = document.cookie.indexOf(objName);
	if (index == -1) {
		render_update_guide();
	}

}

function mouse_leave(event) {
	$('.next_btn').hide()
	$('.pre_btn').hide()
	$('.right_shadow').hide()
	$('.left_shadow').hide()
}

window.onload = function () {
	var refreshedId = document.getElementById("refreshed");
	if (refreshedId.value == "no") {
		refreshedId.value = "yes";
	} else {
		refreshedId.value = "no";
		location.reload();
	}
}
