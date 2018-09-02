var float_tool_bar = $("#float_tool_bar");


var wxcallback = window.location.href + "?query=" + JSON.stringify(query) +
	"&filter=" + JSON.stringify(filter) + "&advs=" + JSON.stringify(advs);
var joined_contrast_ids = [];
var queryData, ysContainCode;
//定义获取数据的所需要的参数
var get_data_config = {
	searchType: init_searchType,
	pageNo: 1,
	sortOrder: '[]',
	query: [],
	filter: [],
	advs: [],
	includeJcy: init_includeJcy ? "1" : 0
};
//渲染数据方法

var render_obj = {
	QWAL: new Render("QWAL"),
	PTAL: new Render("PTAL")
}
var get_result_req = null;
var get_local_data_req = null;
var loading_status = new utils.loading();
var loading_more_status = new utils.load_more();

//启动
page_init();
$("#txtSkip").on('keyup', function () {
	console.log(1);
})
function page_init() {
	//绑定事件
	bind_event();
	//渲染头部
	header_init();
	//创建  案例研判的query
	publicSearchConfig["alyp"].create_new_query();
	//渲染案例研判的query，并且获取数据
	publicSearchConfig["alyp"].render_query({
		element: query_result_container,
		get_fn: get_result_fn,
	});
	//获取检索报告的案件数量
	if (user_status != "guests") {
		get_report();
		get_contrast_count();
	};
}
//绑定事件
function bind_event() {
	//阻止a标签回车事件
	document.onkeydown = function (event) {
		var e = event || (event = window.event);
		var target = e.srcElement ? e.srcElement : e.target;
		if (target.tagName == "a" || target.tagName == "A") {
			var keyCode = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;
			if (keyCode == 13) {
				return false;
			}
		}
	}
	query_result_container
		.on("click", ".store_query", store_query) //收藏条件
		.on("click", ".delete_query_item", delete_query_item) //删除条件的某一项
		.on("click", ".case_selection_item", change_case_selection) //切换案件的选项
		.on("click", ".is_has_document", filter_has_document_result) //筛选是否含检察院文书结果
		.on("click", ".sort_type", change_sort_type) //更换排序方式
		.on("click", ".law_analysis_btn", law_analysis) //引用法条分析
		.on("click", ".store_case_btn", store_case) //收藏案例
		.on("click", ".add_case_to_report", add_case_to_report) //添加案件到检索报告
		.on("click", ".join_contrast_btn", join_contrast) //加入对比
		.on("click", ".down_load_btn", down_load_case)
		.on("click", ".page_link", to_case_detail_page) //跳转到案件详情页面
		.on("click", ".load_more_btn", load_more) //加载更多
		.on("click", ".process_tabbar_item", process_tabs) //切换进度选项卡
		.on("click", ".process_control_left.abled", process_chart_to_left) //案件进度向左移动
		.on("click", ".process_control_right.abled", process_chart_to_right) //案件进度向右移动
		.on('click', '.measurement_btn', enter_judge) //点击量刑
		.on('click', '.attribute_tags .zhongshen', remove_zhongshen_icon);
	float_tool_bar
		.on("click", ".show_report_btn", show_selected_report) //展示当前加入到检索报告的案件
		.on("click", ".show_contrast_case_btn", contrast_case_popup_show); //展示当前加入对比的案件
};
// 跳转到统计图表页面
function jumpToChart() {
	var isJcy = $(".is_has_document").is(".active") ? 1 : 0;
	var f = $("<form method='post' target='_blank' action='" + base_path +
		"/innocent/getAnalyzeData'></form>");
	$("body").append(f);
	var ipt1 = $("<input name='query' value='" + JSON.stringify(publicSearchConfig["alyp"].query) + "'/>");
	var ipt2 = $("<input name='filter' value='" + JSON.stringify(publicSearchConfig["alyp"].filter) + "'/>");
	var ipt3 = $("<input name='advs' value='" + JSON.stringify(publicSearchConfig["alyp"].advs) + "'/>");
	var ipt4 = $("<input name='includeJcy' value='" + isJcy + "'/>");
	f.append(ipt1).append(ipt2).append(ipt3).append(ipt4);
	f.submit().remove();
};
//获取所有数据
function get_result_fn() {
	if (get_result_req != null) {
		get_result_req.abort();
	}
	set_query();
	reset_render_obj();
	get_data_config.sortOrder = "[]";
	get_data_config.pageNo = 1;
	query_result_container.find(".list_result_container").empty();
	query_result_container.find(".case_selection_item").each(function () {
		$(this).attr("count", 0).removeClass("active").find(".count").html("（0）");
	});
	loading_status.run(query_result_container);
	get_data_config.nAjlx = cur_case_type; //不是临时的
	console.log('search_result fn--->get_data_config',get_data_config)
	return false
	get_result_req = utils.post_req("/basicSearch/result", get_data_config)
	get_result_req.done(function (response) {
		var data = utils.change_json(response);
		queryData = data.queryData;
        containNoincent = data.containInnocent;
        showInnocentAnalyse =data.showInnocentAnalyse;
		lxfxCon = data.lxfxCon;
		loading_status.run();
		create_to_fb_tool(data.fb);
		init_searchType = get_data_config.searchType = data.searchType;
		if (data.QWAL && data.QWAL.result) {
			render_obj.QWAL.result = data.QWAL.result;
			render_obj.QWAL.aggs = data.QWAL.aggs;
			render_obj.QWAL.page = data.QWAL.page;
			render_obj.QWAL.count = data.QWAL.count;
		} else {
			render_obj.QWAL.result = [];
			render_obj.QWAL.aggs = [];
			render_obj.QWAL.page = {};
			render_obj.QWAL.count = 0;
		}
		if (data.PTAL && data.PTAL.result) {
			render_obj.PTAL.result = data.PTAL.result;
			render_obj.PTAL.aggs = data.PTAL.aggs;
			render_obj.PTAL.page = data.PTAL.page;
			render_obj.PTAL.count = data.PTAL.resultCount;
			queryData = data.queryData;
		} else {
			render_obj.PTAL.result = [];
			render_obj.PTAL.aggs = [];
			render_obj.PTAL.count = 0;
			render_obj.PTAL.page = {};
		}
		if (!data.QWAL && !data.PTAL) {
			utils.no_result({
				parent_elem: query_result_container.find(".list_result_container"),
				img_name: "no_result",
				text: "抱歉，没有搜索到相关案例，请您输入新的检索条件再试一次吧"
			});
			return;
		} else {
			set_case_count(data)
			query_result_container.find(".case_selection_item")
				.each(function () {
					if ($(this).attr("search_type") == get_data_config.searchType) {
						$(this).trigger("click");
					}
				});
		}

	}).fail(function () {
		loading_status.run();
		utils.no_result({
			parent_elem: query_result_container.find(".list_result_container"),
			img_name: "no_result",
			text: "获取失败，请更换条件"
		});
	})
}

//跳到量刑
function enter_judge() {

	var form_data = {
		queryData: queryData,
		ay: lxfxCon.ay,
		ys: lxfxCon.ys,
		keyword: lxfxCon.keyword,
		writAnalyzerId: "",
		nSclx: 7
	}
	var form_obj = {
		form_data: form_data,
		url: "/liangxing/graphAnalysis",
		tag_name: "_blank"
	}
	var trigger = this;
	is_login(trigger, callback)
	function callback() {
		var times_data = {
			featureName: "lxfx",
			param: '',
		};
		utils.post_req('/getFreeTimes', times_data).done(function (res) {
			var data = JSON.parse(res);
			if (data.useDirectly) {   //可以直接使用
				utils.form_submit(form_obj)				//直接请求接口
			} else {
				if (data.remainingTimes > 0) {  //弹出消耗弹窗
					dialog({
						trigger: trigger,
						title: "量刑分析",
						type: "store_consume",
						options: {
							relativeToWindow: true
						},
						form_obj: form_obj
					}).show();
				} else {
					//弹出免费使用提示框（购买框）  //非会员
					dialog({
						trigger: trigger,
						title: "量刑分析",
						type: "free_trial",
						options: {
							relativeToWindow: true
						},
						url: "/liangxing/graphAnalysis",
						member_info: {
							is_member: false,
							remainingFreeTimes: data.remainingFreeTimes,     //剩余免费次数
							usageCount: data.usageCount,     //已免费使用次数
						},
						featureName: "lxfx",
						form_obj: form_obj,
						list: data.featureList,
						times_data: times_data,
						changeAddress : data.changeAddress
					}).show();
				}
			}



		})











	}

}

//删除当前条件的某一项
function delete_query_item() {
	var index = $(this).attr("index");
	var belong = $(this).attr("belong");
	publicSearchConfig["alyp"][belong].splice(index, 1);
	if (belong == "query" || belong == "advs") {
		if (publicSearchConfig["alyp"].query.length == 0 && publicSearchConfig["alyp"]
			.advs.length == 0) {
			publicSearchConfig["alyp"].query = [];
			publicSearchConfig["alyp"].filter = [];
			publicSearchConfig["alyp"]["advs"] = [];
		}
	}
	publicSearchConfig["alyp"].render_query({
		element: query_result_container,
		get_fn: get_result_fn,
	});
}

function set_case_count(data) {
	query_result_container.find(".case_selection_item").each(function () {
		if (data[$(this).attr("search_type")]) {
			if (data[$(this).attr("search_type")]) {
				$(this).attr("count", data[$(this).attr("search_type")].resultCount).find(
					".count").html("（" + data[$(this).attr("search_type")].resultCount +
						"）")
			} else {
				$(this).attr("count", 0).find(".count").html(0)
			}
		}

	});
}
/*切换权威案例和普通案例*/
function change_case_selection() {
	if ($(this).hasClass("active")) return;
	if ($(this).attr("count") == "0") {
		utils.operation_hints({
			status: "warn",
			text: "无相关案例"
		});
		return;
	};
	init_searchType = get_data_config.searchType = $(this).attr("search_type");
	if (get_data_config.searchType == "PTAL") {
		query_result_container.find(".is_has_document").show();
	} else {
		query_result_container.find(".is_has_document").hide();
	}
	$(this).addClass("active").siblings().removeClass("active");
	var html = '';
	html += '<div class="tree_list_container">';
	html += '</div>';
	/*右侧*/
	html += '<div class="judgement_list_container">';

	html += '</div>';
	query_result_container.find(".list_result_container").html(html).find(
		".judgement_list_container").show()
		.html(render_obj[get_data_config.searchType].render_frame())
		.find(".judgements")
		.html(render_obj[get_data_config.searchType].render_item(render_obj[
			get_data_config.searchType].result));
	tree(
		render_obj[get_data_config.searchType].aggs,
		query_result_container.find(".tree_list_container"),
		add_filter
	).init();

	if (!render_obj[get_data_config.searchType].aggs.length) {
		query_result_container.find(".tree_list_container").hide()
		query_result_container.find('.judgement_list_container').addClass('no_aggs')
	}


	if (get_data_config.searchType == "PTAL") {
		set_process_style();
		set_contrast_style();
	}
}
//tree中添加filter回调
function add_filter() {
	var new_filter = arguments[0];
	if (new_filter[0].field == "all") {
		detele_filter_repeat({
			old_data: publicSearchConfig["alyp"].query,
			new_data: new_filter,
			repeat_content: "cfield",
			attach_repeat_content: ""
		})
		publicSearchConfig["alyp"].query = publicSearchConfig["alyp"].query.concat(
			new_filter);
	} else {
		detele_filter_repeat({
			old_data: publicSearchConfig["alyp"].query,
			new_data: new_filter,
			repeat_content: "cfield",
			attach_repeat_content: ""
		})
		detele_filter_repeat({
			old_data: publicSearchConfig["alyp"].filter,
			new_data: new_filter,
			repeat_content: "cfield",
			attach_repeat_content: "field"
		})
		publicSearchConfig["alyp"].filter = publicSearchConfig["alyp"].filter.concat(
			new_filter);
	}
	publicSearchConfig["alyp"].render_query({
		element: query_result_container,
		get_fn: get_result_fn,
	});
}

//筛选是否含检察院文书的结果
function filter_has_document_result() {
	if ($(this).hasClass("active")) {
		$(this).removeClass("active");
		render_obj["PTAL"].includeJcy = 0;
	} else {
		$(this).addClass("active");
		render_obj["PTAL"].includeJcy = 1;
	}
	init_includeJcy = get_data_config.includeJcy = render_obj["PTAL"].includeJcy;
	get_result_fn();
}
//切换排序类型
function change_sort_type() {
	if (get_local_data_req != null) {
		get_local_data_req.abort();
	}
	if ($(this).hasClass("active")) return;
	$(this).addClass("active").siblings().removeClass("active");
	set_query();
	render_obj[get_data_config.searchType].sort = $(this).attr("sort_key");
	get_data_config.sortOrder = JSON.stringify([{
		"field": render_obj[get_data_config.searchType].sort,
		"value": "desc"
	}]);
	get_data_config.pageNo = 1;
	get_data_config.includeJcy = render_obj[get_data_config.searchType].includeJcy;
	//loading_status.run(query_result_container);
	get_local_data_req = utils.post_req("/ajax/search", get_data_config)
	get_local_data_req.done(function (response) {
		get_local_data_req = null;
		//loading_status.run();
		var data = utils.change_json(response);
		handling_result({
			data: data,
			data_count: "single",
			render_tree: false,
			render_judgements: true
		})
	});
	if (user_status != "guests" && get_data_config.searchType == "PTAL") {
		set_contrast_style();
	}
}
//加载更多
function load_more() {
	if (get_local_data_req != null) {
		get_local_data_req.abort();
	}
	var _this = this;
	set_query();
	get_data_config.sortOrder = JSON.stringify([{
		"field": render_obj[get_data_config.searchType].sort,
		"value": "desc"
	}]);
	get_data_config.pageNo = render_obj[get_data_config.searchType].page.currentPageNo +
		1;
	get_data_config.includeJcy = render_obj[get_data_config.searchType].includeJcy;
	loading_more_status.run($(this).parent());
	get_local_data_req = utils.post_req("/ajax/search", get_data_config)
	get_local_data_req.done(function (response) {
		get_local_data_req = null;
		loading_more_status.run();
		var data = utils.change_json(response);
		if (!data.outOfPageLimit) {
			if (data.result.result) {
				handling_result({
					data: data,
					concat: true,
					data_count: "single",
					render_tree: false,
					render_judgements: true
				})
				//获取当前案件对比的案例
				if (user_status != "guests" && get_data_config.searchType == "PTAL") {
					set_contrast_style();
				}
			} else {
				utils.operation_hints({
					status: "fail",
					text: "加载数据失败"
				});
			}

		} else {
			utils.operation_hints({
				status: "warn",
				text: "页数已达上限"
			});
			$(_this).remove();
		}

	});
	get_local_data_req.fail(function (response) {
		utils.operation_hints({
			status: "fail",
			text: "获取失败，请刷新重试"
		});
		$(_this).remove();
	})
}
//收藏条件
function store_query() {
	var trigger = this;
	is_login(trigger, callback);

	function callback() {
		if (publicSearchConfig["alyp"].query.length == 0 && publicSearchConfig["alyp"]
			.advs.length == 0) return;
		var query_string = get_query_string();

		dialog({
			trigger: trigger,
			type: "store_query",
			query_string: query_string,
			nSsmk: 2,
			title: "收藏条件",
			options: {
				relativeToWindow: true
			},
			cJstj: create_submit_condition()
		}).show();
	}
}
//收藏案件
function store_case() {
	var trigger = this;
	is_login(trigger, callback);

	function callback() {
		var index = $(trigger).attr("index");
		if ($(trigger).attr("store_id") != "undefined" && !$(trigger).hasClass(
			"active")) {
			var store_id = $(trigger).attr("store_id");
			utils.post_req("/collection/delete2", {
				cId: store_id
			}).done(function (response) {
				$(trigger).addClass("active").attr("is_store", "false").attr("store_id",
					"").find("i").get(0).className = "icon-linear-collection";
				$(trigger).find("span").html("收藏");
				delete render_obj[get_data_config.searchType].result[index].store_id;
				var status = {
					status: "success",
					text: "取消收藏成功"
				};

				utils.operation_hints(status);
			})
		} else {
			var data = {
				cId: "",
				cMc: render_obj[get_data_config.searchType].result[index].TITLE,
				cJstj: create_submit_condition(),
				nAjlx: cur_case_type ? cur_case_type : ""
			}

			if (get_data_config.searchType == "QWAL") {
				data.nSclx = 4;
				data.cScnr = JSON.stringify({
					alId: render_obj[get_data_config.searchType].result[index]._id,
					ALZL: render_obj[get_data_config.searchType].result[index].ALZL,
					JBFY: render_obj[get_data_config.searchType].result[index].JBFY,
					SOURCE: render_obj[get_data_config.searchType].result[index].SOURCE,
				});
			} else {
				data.nSclx = 3;
				data.ajJbxx = true;
				var document_arr = [];

				$.each(render_obj[get_data_config.searchType].result[index].caseProcess,
					function (index, item) {
						var obj = {};
						if (item.flag) {
							obj.wsid = item.wsid;
							obj.ah = item.ah
							document_arr.push(obj)
						}
					})


				data.cScnr = JSON.stringify({
					scWsId: document_arr,
					ajId: render_obj[get_data_config.searchType].result[index]._id
				});

			}
			utils.post_req("/collection/updateWdsc", data).done(function (response) {
				var data = utils.change_json(response);
				var status = {};
				if (data.message == "success") {
					status = {
						status: "success",
						text: "收藏成功"
					};
					$(trigger).removeClass("active").attr("is_store", "true").attr(
						"store_id", data.cId).find("i").get(0).className =
						"icon-fill-collection";
					$(trigger).find("span").html("已收藏");
					render_obj[get_data_config.searchType].result[index].store_id = data.cId;
				} else if (data.message == "repeat") {
					status = {
						status: "warn",
						text: "请勿重复收藏"
					};
					$(trigger).removeClass("active").attr("is_store", "true").attr(
						"store_id", data.cId).find("i").get(0).className =
						"icon-fill-collection";
					$(trigger).find("span").html("已收藏");
					render_obj[get_data_config.searchType].result[index].store_id = data.cId;
				} else if (data.message == "fail") {
					status = {
						status: "fail",
						text: "收藏失败"
					};
				}
				utils.operation_hints(status);
			})
		}
	}
}
//法条分析
function law_analysis() {
	var trigger = this;
	is_login(trigger, callback)

	function callback() {
		dialog({
			trigger: trigger,
			type: "law_analysis",
			title: "引用法条分析",
			query: JSON.stringify(publicSearchConfig["alyp"].query),
			filter: JSON.stringify(publicSearchConfig["alyp"].filter),
			advs: JSON.stringify(publicSearchConfig["alyp"].advs),
			nAjlx: cur_case_type,
			options: {
				relativeToWindow: true
			},
			attach_condition: create_submit_condition()
		}).show();
	}

}

//获取对比案件数
function get_contrast_count() {
	utils.get_req("/comparison/header/").done(function (response) {
		var data = utils.change_json(response);
		if (typeof data.result != "string") {
			if (data.result.length >= 1) {
				float_tool_bar.find(".contrast_tool .count").show().html(data.result.length);
				$.each(data.result, function (index, item) {
					joined_contrast_ids.push(item.id);
				})
			} else {
				float_tool_bar.find(".contrast_tool .count").hide().html(0);
			}
		} else {
			float_tool_bar.find(".contrast_tool .count").hide().html(0);
		}
	})
}

function set_contrast_style() {
	$.each(query_result_container.find(".join_contrast_btn"), function (index, item) {
		if ($.inArray($(this).attr("case_id"), joined_contrast_ids) >= 0) {
			$(this).removeClass("active");
			render_obj["PTAL"].result[index].is_contrast = "contrast";
		}
	})
}
//加入对比
function join_contrast() {
	if (!$(this).hasClass("active")) return;
	var trigger = this;
	is_login(trigger, callback)

	function callback() {
		var case_id = $(trigger).attr("case_id");
		var ajlb = $(trigger).attr("ajlb");
		var cur_count = float_tool_bar.find(".contrast_tool .count").html();
		contrast({
			trigger: trigger,
			case_id: case_id,
			ajlb: ajlb,
			cur_count: cur_count,
			count_parent_elem: float_tool_bar,
			data: render_obj["PTAL"].result,
			callback: join_contrast_callback
		});
	}

	function join_contrast_callback() {
		var result = arguments[0];
		joined_contrast_ids = [];
		$.each(result, function (index, item) {
			joined_contrast_ids.push(item.id);
		})
	}
}
//对比案例popup显示
function contrast_case_popup_show() {
	var trigger = this;
	is_login(trigger, callback)

	function callback() {
		show_join_contrast_case({
			elem: float_tool_bar,
			callback: {
				delete_callback: delete_callback,
			}
		});
	}

	function delete_callback(case_id_arr) {
		$.each(query_result_container.find(".join_contrast_btn"), function (index,
			item) {
			if ($.inArray($(this).attr("case_id"), case_id_arr) >= 0) {
				$(this).addClass("active");
				render_obj["PTAL"].result[index].is_contrast = "";
			}
		})
		if (case_id_arr.length == parseInt(float_tool_bar.find(
			".contrast_tool .count").html())) {
			float_tool_bar.find(".contrast_tool .count").hide().html("0");
		} else {
			float_tool_bar.find(".contrast_tool .count").html(parseInt(float_tool_bar.find(
				".contrast_tool .count").html()) - 1)
		}
	}
}
//下载
function down_load_case() {
	var trigger = this;
	is_login(trigger, callback);

	function callback() {
		var source = $(trigger).attr("source");
		var case_id = $(trigger).attr("case_id");
		var cfg = {
			SOURCE: source,
			id: case_id
		};
		utils.form_submit({
			url: "/writDownload",
			tag_name: '_self',
			form_data: cfg
		})
	}
}
//添加到检索报告
function add_case_to_report() {
	var trigger = this;
	var index = $(trigger).attr("index");
	if (parseInt(float_tool_bar.find(".report_tool .count").html()) >= 15) {
		utils.operation_hints({
			status: "warn",
			text: "已达上限，请生成检索报告后再添加"
		});
		return;
	}
	is_login(trigger, callback);

	function callback() {
		if (!$(trigger).hasClass("active")) {
			return;
		};
		if ($(trigger).attr("js_id")) return;
		var submit_data = {
			nLx: 4,
			cMc: render_obj[get_data_config.searchType].result[index].TITLE,
			cJstj: create_submit_condition(),
			cNrzj: render_obj[get_data_config.searchType].result[index]._id,
			nAjlx: cur_case_type,

		}
		if (get_data_config.searchType == "QWAL") {
			submit_data.cNr = JSON.stringify({
				ALZL: render_obj[get_data_config.searchType].result[index].ALZL,
				JBFY: render_obj[get_data_config.searchType].result[index].JBFY,
				SOURCE: render_obj[get_data_config.searchType].result[index].SOURCE,
			});
			add_authoritative_case_to_report({
				submit_data: submit_data,
				trigger: trigger,
				target_ele: float_tool_bar,
				data: render_obj[get_data_config.searchType].result
			})

		} else {
			var cNrzj = render_obj[get_data_config.searchType].result[index]._id;
			var case_name = render_obj[get_data_config.searchType].result[index].TITLE;
			var document_arr = render_obj[get_data_config.searchType].result[index].caseProcess;
			var dailog_config = {
				trigger: trigger,
				case_name: case_name,
				document_arr: document_arr,
				cNrzj: cNrzj,
				attach_condition: create_submit_condition(),
				title: "添加检索报告",
				type: "add_case_to_report",
				options: {
					relativeToWindow: true
				},
			}
			add_general_case_to_report({
				dialog_config: dailog_config,
				trigger: trigger,
				target_ele: float_tool_bar,
				data: render_obj[get_data_config.searchType].result
			});
		}
	}
}
//查看当前选择的检索报告案件
function show_selected_report(e) {
	var trigger = this;
	is_login(trigger, callback)

	function callback() {
		var times_data = {
			featureName: "jsbg",
			param: "",
		}
		dialog({
			trigger: trigger,
			title: "检索报告",
			type: "create_report",
			options: {
				relativeToWindow: true
			},
			callback: {
				delete_case_callback: delete_report_case_callback,
				create_callback: create_callback,
				reset_count : reset_count 
			},
			count_elem: float_tool_bar.find(".report_tool .count"),
			times_data: times_data,
		}).show();

	}

	function create_callback() {
		var ids_arr = arguments[0];
		$.each(query_result_container.find(".add_case_to_report"), function () {
			if ($.inArray($(this).attr("js_id"), ids_arr >= 0)) {
				$(this).attr("js_id", '').addClass("active");
			}
		})
		$.each(render_obj["PTAL"].result, function (index, item) {
			if ($.inArray(item.jsbgCid, ids_arr >= 0)) {
				item.jsbgCid = "";
			}

		})
		$.each(render_obj["QWAL"].result, function (index, item) {
			if ($.inArray(item.jsbgCid, ids_arr >= 0)) {
				item.jsbgCid = "";
			}
		})
	}
	function reset_count () {
		float_tool_bar.find(".report_tool .count").hide().html(0);
	}
	function delete_report_case_callback() {
		var js_id = arguments[0];
		var current_count = parseInt(float_tool_bar.find(".report_tool .count").html());
		if (current_count - 1 == 0) {
			float_tool_bar.find(".report_tool .count").html(0).hide();
		} else {
			float_tool_bar.find(".report_tool .count").html(current_count - 1).show();
		}
		$.each(query_result_container.find(".add_case_to_report"), function () {
			if ($(this).attr("js_id") == js_id) {
				$(this).attr("js_id", '').addClass("active");
			}
		})
		$.each(render_obj["PTAL"].result, function (index, item) {
			if (item.jsbgCid == js_id) {
				item.jsbgCid = "";
			}
		})
		$.each(render_obj["QWAL"].result, function (index, item) {
			if (item.jsbgCid == js_id) {
				item.jsbgCid = "";
			}
		})
	}
}


//设置案件进程的样式
function set_process_style() {
	$.each(query_result_container.find(".process_chart_container"), function () {
		$(this).find(".process").css("width", $(this).find("li").length * 150 - 55);
		if (parseInt($(this).find(".process").width()) > parseInt($(this).width())) {
			$(this).find(".process_control").show().addClass("abled").removeClass(
				"disabled");
		} else {
			$(this).find(".process_control").show().addClass("disabled").removeClass(
				"abled");
		}
	})
}
//案件进程选项卡
function process_tabs() {
	if ($(this).hasClass("active")) return;
	var index = $(this).index();
	$(this).addClass("active").siblings().removeClass("active");
	$(this).closest(".process_tab").find(".process_tab_content_item").eq(index).addClass(
		"active").siblings().removeClass("active");
}
//案件进程向左
function process_chart_to_left() {
	var _this = this;
	var active_elem = $(_this).parent().find(".process");
	var cur_distance = parseInt(active_elem.css("margin-left"));
	if (cur_distance >= 0) {
		return;
	}
	$(_this).addClass("disabled").removeClass("abled");
	active_elem.eq(0).stop().animate({
		marginLeft: cur_distance + 132
	}, 300, function () {
		$(_this).addClass("abled").removeClass("disabled");
	});
}
//案件进程向右
function process_chart_to_right() {
	var _this = this;
	var active_elem = $(_this).parent().find(".process");
	var limit_elem = $(_this).parent().find(".process_wrapper");
	var cur_distance = parseInt(active_elem.css("margin-left"));
	if (Math.abs(cur_distance) + parseInt(limit_elem.width()) >= parseInt(
		active_elem.css("width"))) {
		return;
	}
	$(_this).addClass("disabled").removeClass("abled");
	active_elem.eq(0).stop().animate({
		marginLeft: cur_distance - 132
	}, 300, function () {
		$(_this).addClass("abled").removeClass("disabled");
	})
}
//跳转到案例详情页
function to_case_detail_page() {
	var case_mark = $(this).attr("case_mark");
	var url = "";
	var form_data = {};
	switch (case_mark) {
		case "common_case":
			var zsws = $(this).closest(".judgement_item").find(
				".process_tabbar_item.active").attr("zsws");
			var case_id = $(this).attr("_id");
			url = "/case/" + case_id + "/" + zsws;
			var index = $(this).attr("index");
			form_data.highlightWS = render_obj.PTAL.result[index].highlightWS;
			break;
		case "combined_search_case":
			var ZSWS = $(this).attr("ZSWS");
			var case_id = $(this).attr("_id");
			url = "/case/" + case_id + "/" + ZSWS;
			var index = $(this).attr("index");
			form_data.highlightWS = render_obj.PTAL.result[index].highlightWS;
			break;
		case "document":
			var ws_id = $(this).attr("ws_id");
			var case_id = $(this).attr("_id");
			url = "/casews/" + case_id + "/" + ws_id;
			var index = $(this).attr("index");
			form_data.highlightWS = render_obj.PTAL.result[index].highlightWS;
			break;
		default:
			var case_id = $(this).attr("_id");
			url = "/alcase/" + case_id;
	}
	form_data.condition = create_submit_condition()
	form_data.queryData = queryData;
	form_data.ysContainCode = ysContainCode;
	var config = {
		url: url,
		tag_name: '_blank',
		form_data: form_data
	}
	utils.form_submit(config);
}
//获取当前检索报告中的案件个数
function get_report() {
	utils.post_req("/jsbg/get", {}).done(function (response) {
		var data = utils.change_json(response);
		if (data.ptal.length + data.qwal.length >= 1) {
			float_tool_bar.find(".report_tool .count").show().html(data.ptal.length +
				data.qwal.length);
		} else {
			float_tool_bar.find(".report_tool .count").hide().html(0);
		}
	})
}

function handling_result(config) {
	if (config.data_count == "single") {
		if (config.concat) {
			render_obj[get_data_config.searchType].result = render_obj[get_data_config.searchType]
				.result.concat(config.data.result.result);
		} else {
			render_obj[get_data_config.searchType].result = config.data.result.result;
		}
		//render_obj[get_data_config.searchType].aggs=config.data.result.aggs;
		render_obj[get_data_config.searchType].page = config.data.result.page;
	}
	if (config.render_tree) {
		console.log(render_obj[get_data_config.searchType].aggs);
		tree(
			render_obj[get_data_config.searchType].aggs,
			query_result_container.find(".tree_list_container"),
			add_filter
		).init();
	}
	if (config.render_judgements) {
		query_result_container
			.find(".judgements")
			.html(render_obj[get_data_config.searchType].render_item(render_obj[
				get_data_config.searchType].result));
		if (get_data_config.searchType == "PTAL") {
			set_process_style();
		}
	}
}
//获取所有query的sting
function get_query_string() {
	var temp_arr = [];
	var condition_arr = ["query", "filter", "advs"];
	$.each(condition_arr, function (index, item) {
		$.each(publicSearchConfig["alyp"][item], function (index, item) {
			temp_arr.push('<span>' + item.cfield + '</span>')

		})
	})
	return temp_arr.join('|');
}

function create_submit_condition() {
	return JSON.stringify({
		//sortOrder:[],
		query: publicSearchConfig["alyp"].query,
		filter: publicSearchConfig["alyp"].filter,
		advs: publicSearchConfig["alyp"].advs
		//searchType:get_data_config.searchType,
		//includeJcy:render_obj[get_data_config.searchType]?render_obj[get_data_config.searchType].includeJcy:""
	});
}
//add_filter去重
function detele_filter_repeat(config) {
	var old_data = config.old_data;
	var new_data = config.new_data;
	var repeat_content = config.repeat_content;
	var attach_repeat_content = config.attach_repeat_content ? config.attach_repeat_content :
		"";
	$.each(old_data, function (index, item) {
		for (var i = 0; i < new_data.length; i++) {
			if (item[repeat_content] == new_data[i][repeat_content] && (
				attach_repeat_content ? new_data[i][attach_repeat_content] == item[
					attach_repeat_content] : "1")) {
				new_data.splice(i, 1);
				i--;
			}
		}
	})
}
//设置获取数据的query
function set_query() {
	get_data_config.query = JSON.stringify(publicSearchConfig["alyp"].query);
	get_data_config.filter = JSON.stringify(publicSearchConfig["alyp"].filter);
	get_data_config.advs = JSON.stringify(publicSearchConfig["alyp"].advs);
}
//跳转北大法宝
function create_to_fb_tool(fb) {
	if (!fb) {
		return;
	}
	if (float_tool_bar.find(".to_fb_tool").length) {
		float_tool_bar.find(".to_fb_tool").remove();
	}
	var html = "";
	html += '<div class="tool_item to_fb_tool">';
	html += '<div class="charge">';
	html += '<img src="' + base_path + '/www/alyp/img/fb_logo.png"/>';
	if (fb.js.length == 1) {
		html += '<a target="_blank" href="' + fb.js[0].url + '">罪名精释</a>';
	} else {
		html += '<a href="javascript:;" class="show_all_charge">罪名精释</a>';
	}
	html += '</div>';
	html += '<a target="_blank" href="' + fb.fg + '">刑事法规</a>';
	html += '</div>';
	float_tool_bar.prepend(html)
	if (fb.js.length > 1) {
		float_tool_bar.off(".show_all_charge").on("click.show_all_charge",
			".show_all_charge", show_all_charge)
	}

	function show_all_charge() {
		var trigger = this;
		is_login(trigger, callback);

		function callback() {
			dialog({
				trigger: trigger,
				type: "show_all_charge",
				title: "罪名精释",
				options: {
					relativeToWindow: true
				},
				charge_data: fb.js
			}).show();
		}

	}
};

function reset_render_obj() {
	for (var i in render_obj) {
		render_obj[i].includeJcy = 0;
		render_obj[i].page = {};
		render_obj[i].aggs = [];
		render_obj[i].result = [];
		render_obj[i].sort = "_score";
	}
}

//删除终审图标
function remove_zhongshen_icon() {
	$('.zhongshen').remove()
}
//数据渲染逻辑
function Render(name) {
	this.includeJcy = 0;
	this.page = {};
	this.aggs = [];
	this.result = [];
	this.sort = "_score";
	this.render_frame = function () {
		var html = '';
		html += '<div class="sort_area">';
		html += '<h4>排序：</h4>';
		html += '<ul>';
		html += '<li class="sort_type ' + (this.sort == "_score" ? "active" : "") +
			'" sort_key="_score"><span>相关性</span><i class="icon-fill-arrow-down"></i></li>';
		html += '<li class="sort_type ' + (this.sort == "timeDate" ? "active" : "") +
			'" sort_key="timeDate"><span>裁判日期</span><i class="icon-fill-arrow-down"></i></li>';
		html += '</ul>';
		if (showInnocent && showInnocentAnalyse) {
			html += '<div class="toInnocentChart" onclick="jumpToChart()">无罪分析</div>';
		};
		if (name == "PTAL") {
			if (parseInt(this.count) < 5000) {
				html +=
					'<a href="javascript:;" class="law_analysis_btn"><i class="icon-ft-analysis"></i><span>引用法条分析</span></a>';
			}
			if (showLiangXing && !containNoincent) {
				if (category != 4) {
					if (category == 0) {
						html +=
							'<a href="javascript:;" class="measurement_btn"><img class = "lx_icon"  src="' +
							base_path +
							'/www/alyp/img/inactive_vip.png"/><i class="icon-data"></i><span>量刑分析</span></a>'
					}else {
						html +=
						'<a href="javascript:;" class="measurement_btn"><img class = "lx_icon"  src="' +
						base_path +
						'/www/alyp/img/vip.png"/><i class="icon-data"></i><span>量刑分析</span></a>'
					}
				}

			}
		}
		html += '</div>';
		html += '<div class="judgements">';
		html += '</div>';
		html += '<div class="load_more">';
		if (this.page.currentPageNo < 10) {
			html += '<a href="javascript:;" class="load_more_btn">点击查看更多</a>';
		}
		html += '</div>';
		return html;
	};
	if (name == "QWAL") {
		this.render_item = function (data) {
			if (this.page.currentPageNo == this.page.totalPageCount) {
				query_result_container.find(".load_more_btn").remove();
			}
			var html = '';
			$.each(data, function (index, item) {
				html += '<div class="judgement_item">';
				//状态
				if (item.wszl || item.SPCX) {
					html += '<div class="attribute_tags_container">';

					html += '<ul class="attribute_tags">';
					item.WSZL ? html += '<li class="attribute_tag_item" title="文书种类:' +
						item.WSZL + '">' + item.WSZL + '</li>' : ""; //文书种类
					item.SPCX ? html += '<li class="attribute_tag_item" title="审判程序:' +
						item.SPCX + '">' + item.SPCX + '</li>' : ""; //结案方式
					html += '</ul>';
					html += '</div>';
				}


				//案件名称
				html += '<h2 class="title">';
				html += '<span class="mark">' + item.ALZL + '</span>';
				html += '<a href="javascript:;" class="page_link" index="' + index +
					'" case_mark="authoritative_case" _id="' + item._id + '" title="' +
					item.TITLE + '">' + item.TITLE_H + '</a>';
				html += '</h2>';
				/*附加信息*/
				html += '<div class="attached_info">';
				var tempArr = [];
				item.JBFY ? tempArr.push('<span title=' + utils.delete_space(item.JBFY) +
					' class="first">' + item.JBFY + '</span>') : "";
				item.AH ? tempArr.push('<span title=' + utils.delete_space(item.AH) +
					'>' + item.AH + '</span>') : "";
				item.LY ? tempArr.push('<span title=' + utils.delete_space(item.LY) +
					'>' + item.LY + '</span>') : "";
				html += tempArr.join('<span>|</span>');

				html += '</div>';
				/*信息*/
				if (item.caseOutline.length) {
					html += '<div class="search_info authoritative_case">';
					$.each(item.caseOutline, function (index, item) {
						$.each(item.paragraph, function (index, item) {
							html += '<div class="search_info_item">';
							html += '<div class="title">';
							html += '<h4>' + item.name + '</h4>';
							html += '<ul class="keywords_frequency ">';
							var wordFreq = item.wordFreq;
							if (item.wordFreq.length > 5) {
								wordFreq = wordFreq.slice(0, 4);
							}
							$.each(wordFreq, function (index, item) {
								html += '<li>';
								html += '<span class="words">' + item.name + '</span>';
								html += '<span class="count">' + item.feq + '</span>';
								html += '</li>';
							});
							html += '</ul>';
							html += '</div>';
							html += '<p>' + item.value + '</p>';
							html += '</div>';
						})
					});
					html += '</div>';
				}

				html += '<div class="actions">';
				var active = item.jsbgCid ? "" : "active";
				html += '<a href="javascript:;" index="' + index +
					'" class="case_action add_case_to_report ' + active + '" js_id="' +
					item.jsbgCid + '"  case_id="' + item._id +
					'"><i class="icon-report"></i><span>添加检索报告</span></a>';
				if (item.store_id) {
					html += '<a href="javascript:;"  index="' + index +
						'" class="case_action store_case_btn" store_id="' + item.store_id +
						'" case_id="' + item._id +
						'"><i class="icon-fill-collection"></i><span>已收藏</span></a>';
				} else {
					html += '<a href="javascript:;"  index="' + index +
						'" class="case_action store_case_btn active" store_id="' + item.store_id +
						'" case_id="' + item._id +
						'"><i class="icon-linear-collection"></i><span>收藏</span></a>';
				}
				html += '<a href="javascript:;"  index="' + index + '" source="' + item.SOURCE +
					'" class="case_action down_load_btn active" case_id="' + item._id +
					'"><i class="icon-down-load"></i><span>下载</span></a>';
				html += '</div>';
				html += '</div>';
			});
			return html;
		}
	} else {
		this.render_item = function (data) {
			if (render_obj.PTAL.page.currentPageNo == render_obj.PTAL.page.totalPageCount) {
				query_result_container.find(".load_more_btn").remove();
			}
			var html = '';
			$.each(data, function (index, item) {
				var cur_index = index;
				var case_id = item._id;
				html += '<div class="judgement_item">';
				/*状态*/
				if (item.wszl || item.JAFS) {
					html += '<div class="attribute_tags_container">';
					html += '<ul class="attribute_tags">';
					html +=
						'<li class = "zhongshen" title = "终审结果"><a><i class ="icon-zhongshen"></i></a></li>';
					item.JAFS ? html += '<li class="attribute_tag_item" title="结案方式:' +
						item.JAFS + '">' + item.JAFS + '</li>' : ""; //结案方式
					item.wszl ? html += '<li class="attribute_tag_item" title="文书种类:' +
						item.wszl + '">' + item.wszl + '</li>' : ""; //文书种类

					html += '</ul>';
					html += '</div>';
				}

				//案件名称
				html += '<h2 class="title general">';
				if (showInnocent && item.WZ_TAG_WRITID) {
					html += '<span class="mark" name="' + item.WZ_TAG_WRITID +
						'" style="margin-right:12px;">无罪案例</span>'
				};
				var case_mark = item.type == "common" ? "common_case" :
					"combined_search_case";
				html += '<a href="javascript:;" _id="' + case_id + '" index="' +
					cur_index + '" ZSWS="' + item.ZSWS + '" case_mark="' + case_mark +
					'" class="page_link" title="' + item.TITLE + '">' + item.TITLE_H +
					'</a>';
				html += '</h2>';
				if (item.type == "common") {
					html += '<div class="search_info common_case">';
					//选项卡
					html += '<div class="process_tab">';
					var tabbar_html = '';
					var tab_content_html = '';
					$.each(item.caseOutline, function (index, item) {
						var active = item.showFlag ? "active" : "";
						tabbar_html += '<li class="process_tabbar_item ' + active +
							'" zsws="' + item.zsws + '">' + item.title + '</li>';
						tab_content_html += '<div class="process_tab_content_item ' + active +
							'">';
						$.each(item.paragraph, function (index, item) {
							tab_content_html += '<div class="search_info_item">';
							tab_content_html += '<div class="title">';
							tab_content_html += '<h4>' + item.name + '</h4>';
							tab_content_html += '<ul class="keywords_frequency ">';
							$.each(item.wordFreq, function (index, item) {
								tab_content_html += '<li>';
								tab_content_html += '<span class="words">' + item.name +
									'</span>';
								tab_content_html += '<span class="count">' + item.feq +
									'</span>';
								tab_content_html += '</li>';
							});
							tab_content_html += '</ul>';
							tab_content_html += '</div>';
							tab_content_html += '<p>' + item.value + '</p>';
							tab_content_html += '</div>';
						});
						tab_content_html += '</div>';
					});
					html += '<ul class="process_tabbar">';
					html += tabbar_html;
					html += '</ul>';
					html += '<div class="process_tab_content">';
					html += tab_content_html;
					html += '</div>';

					html += '</div>';
				} else {
					html += '<div class="search_info combined_search_case">';
					html += '<ul class="case_line_list">';
					$.each(item.caseOutline, function (index, item) {
						html += ' <li class="case_line_item">';
						html += '<h3 class="case_line_item_title">' + item.title + '</h3>';
						html += '<ul class="case_line_detail_list">';
						var paragraph = item.paragraph;
						$.each(item.paragraph, function (index, item) {
							var last = index == paragraph.length - 1 ? "last" : "";
							html += '<li class="case_line_detail_item ' + last + '">';
							html += '<div class="title">';
							html += '<h4>' + item.name + '</h4>';
							if (item.wordFreq.length) {
								html += '<ul class="keywords_frequency ">';
								$.each(item.wordFreq, function (index, item) {
									html += '<li>';
									html += '<span class="words">' + item.name + '</span>';
									html += '<span class="count">' + item.feq + '</span>';
									html += '</li>';
								});
								html += '</ul>';
							}
							html += '</div>';
							html += '<p>' + item.value + '</p>';
							html += '<span class="case_line_node"></span>';
							html += '</li>';
						});

						html += '</ul>';
						html += '</li>';
					});
					html += '</ul>';
				}
				/*进程*/
				html += '<div class="process_preview">';
				html += '<h4 class="title">本案进程</h4>';
				html += '<div class="process_chart_container">';
				html += '<div class="process_wrapper">'
				html += '<ul class="process">';
				var length = item.caseProcess.length;
				$.each(item.caseProcess, function (index, item) {
					var last = length - 1 == index ? "last" : "";
					var active = item.flag ? "active" : "";
					html += '<li class="case_process_item ' + last + '" title=' + item.ah +
						'>';
					if (item.flag) {
						html += '<a href="javascript:;" case_mark="document" ws_id="' + item
							.wsid + '" _id="' + case_id + '" index="' + cur_index +
							'" class="page_link ' + active + '">';
					}
					html += '<span class="process_name ' + active + '">' + item.casePeriod +
						'</span>';
					if (item.jasj) {
						html += '<span class="process_time">' + item.jasj + '</span>';
					}
					if (item.flag) {
						html += '</a>';
					}
					html += '</li>';
				});
				html += '</ul>';
				html += '</div>'
				html +=
					'<a href="javascript:;" class="process_control process_control_left abled"><i class="icon-drop-left"></i></a>';
				html +=
					'<a href="javascript:;" class="process_control process_control_right abled"><i class="icon-drop-right"></i></a>';
				html += '</div>';
				html += '</div>';



				html += '</div>';
				/*操作*/
				html += '<div class="actions">';
				var active = item.jsbgCid ? "" : "active";
				html += '<a href="javascript:;"  index="' + index +
					'" class="case_action add_case_to_report ' + active + '" js_id="' +
					item.jsbgCid + '" case_id="' + item._id +
					'"><i class="icon-report"></i><span>添加检索报告</span></a>';
				if (item.store_id) {
					html += '<a href="javascript:;"  index="' + index +
						'" class="case_action store_case_btn" store_id="' + item.store_id +
						'" case_id="' + item._id +
						'"><i class="icon-fill-collection"></i><span>已收藏</span></a>';
				} else {
					html += '<a href="javascript:;" index="' + index +
						'" class="case_action store_case_btn active" store_id="' + item.store_id +
						'" case_id="' + item._id +
						'"><i class="icon-linear-collection"></i><span>收藏</span></a>';
				}
				html += '<a href="javascript:;" index="' + index + '" source="' + item.SOURCE +
					'" class="case_action down_load_btn active" case_id="' + item._id +
					'"><i class="icon-down-load"></i><span>下载</span></a>';
				html += '<a href="javascript:;" index="' + index +
					'" class="case_action join_contrast_btn ' + (item.is_contrast ? "" :
						"active") + '" case_id="' + item._id + '" ajlb="' + item.AJLB +
					'"><i class="icon-combine"></i><span>加入对比</span></a>';
				html += '</div>';
				html += '</div>';
			});
			return html;
		}
	}
}
