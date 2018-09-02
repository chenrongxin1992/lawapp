var layout_header = $("#layout_header"); //头部元素
var query_result_container = $("#query_result_container");
//定义变量
var SHOW_FLAG = "";
var CUR_PROJECT = "";
var company_name = null;
var company_id = null;
var temp_case_type = cur_case_type; //临时的案件类别
var company_case_type = 'all';
var lsls_type = 'lawyer';
var cate //企业风险分析需要的参数
var suggestStartTime = 0;
var publicSearchConfig = {
	alyp: new PublicSearchConfig("alyp"),
	flfg: new PublicSearchConfig("flfg"),
	cpgd: new PublicSearchConfig("cpgd"),
	qyfxfx: new PublicSearchConfig("qyfxfx"),
	lsls: new PublicSearchConfig("lsls")
};
layout_header
	.on("click", ".search_project", change_search_project)
	.on("click", ".drop_btn", drop_menu_show)
	.on("click", ".case_types_item", change_case_type)
	.on("click", ".flfg_query_type", change_flfg_query_type)
	.on('click', ".company_query_type", change_qyfxfx_query_type)
	.on('click', ".lsls_query_type", change_lsls_query_type)
	.on("click", ".combination_search_btn", add_combination_search)
	.on("click", ".login_btn", login)
	.on("click", ".sign_out", sign_out)
	.on('click', '.pricing_item', pricing)

function header_init() {
	render_public_header(layout_header);
	//渲染用户数据
	render_user();
	//渲染案件类型
	render_case_type(layout_header.find(".case_types_container"));
};
//渲染公共头部
function render_public_header(elem) {
	var html = '';
	html += render_header_project_list();
	html += render_header_search();
	elem.empty().html(html)
	if (INIT_PROJECT) {
		elem.find(".search_project").each(function () {
			if ($(this).attr("project_code") == INIT_PROJECT) {
				$(this).trigger("click");
			}
		});
	} else {
		elem.find(".search_project").eq(0).trigger("click");
	}
	search_event(layout_header.find(".search_area"), layout_header.find(
		".search_input"), layout_header.find(".search_btn"), layout_header.find(
		".again_search_btn"));
}



//搜索框搜索
function search_event(wrapper, input_ele, search_btn, again_btn) {
	var cur_index = -1, //当前选中的项的索引
		search_value = ""; //搜索的内容
	//删除当前的suggest
	function remove_suggest() {
		if (wrapper.find(".suggest_container").length) {
			wrapper.find(".suggest_container").remove();
			$(document).off(".suggest_hide");
		}
	}
	//点击suggest上屏
	function click_suggest_to_screen() {
		var obj = $(this);
		if (CUR_PROJECT == 'qyfxfx') {
			if (publicSearchConfig[CUR_PROJECT].check_screen_query() != 0) {
				var mark = $(this).attr('belong');
				publicSearchConfig[CUR_PROJECT].delete_screen_query_item(mark);
				publicSearchConfig[CUR_PROJECT].render_screen_query(wrapper);
			}
			//添加到详情页的方法
			publicSearchConfig[CUR_PROJECT].add_screen_query(obj);
			var company_id = $(this).attr('data_id');
			var company_name = $(this).attr('data_company');
			var type = $('.current_qyfxfx_query_type').find('span').text();
			switch (type) {
				case '全部':
					type = 'all'
					break;
				case '公司名称':
					type = 'company'
					break;
				case '法定代表人':
					type = 'legalPerson'
					break;
				case '核心成员':
					type = 'coreMember'
					break;
			}
			var config = {
				form_data: {
					d: company_id,
					cn: company_name,
					source: type,
					cate: cate
				},
				url: '/retrieval/detail',
				tag_name: "_self"
			}
			utils.form_submit(config)
		} else if (CUR_PROJECT == 'lsls') {
			var type = $('.current_lsls_query_type').find('span').text();
			switch (type) {
				case '律师':
					listType = 'lawyer'
					break;
				case '律所':
					listType = 'ls'
					break;
				default:
					break;
			};
			var config = {
				form_data: {
					type: listType,
					lawyerName: listType == 'lawyer' ? obj.data().lawyer : '',
					lsName: obj.data().ls
				},
				url: '/lsls/getLslsInfo',
				tag_name: "_blank"
			};
			utils.form_submit(config);
		} else {
			publicSearchConfig[CUR_PROJECT].add_screen_query(obj);
			publicSearchConfig[CUR_PROJECT].render_screen_query(wrapper);
		}

		remove_suggest();
		input_ele.val('');
	}
	//回车上屏
	function enter_input_to_screen(text) {
		if (CUR_PROJECT == 'qyfxfx') {
			/*utils.operation_hints({status:"warn",text:"跳到列表页"});*/
			publicSearchConfig[CUR_PROJECT].add_screen_query(text);
			publicSearchConfig[CUR_PROJECT].submit();

		} else {
			publicSearchConfig[CUR_PROJECT].add_screen_query(text);
			publicSearchConfig[CUR_PROJECT].render_screen_query(wrapper);
		}

		remove_suggest();
		input_ele.val('');
	}

	//删除上屏的某一项
	function delete_screen_query_item() {
		var mark = $(this).parent().attr("mark");
		publicSearchConfig[CUR_PROJECT].delete_screen_query_item(mark);
		publicSearchConfig[CUR_PROJECT].render_screen_query(wrapper);
	}
	//点击显示二级suggest
	function second_level_suggest_show() {
		var index = $(this).attr("index");
		render_second_level_suggest(index, wrapper.find(".suggest_container"));
		wrapper.find(".suggest_container").scrollTop(0);
	}
	//隐藏二级suggest
	function second_level_suggest_hide(e) {
		console.log(wrapper)
		wrapper.find(".suggest_container").removeClass('active')
		wrapper.find(".suggest_container .first_level_suggest_list").show();
		wrapper.find(".suggest_container .second_level_suggest_container").hide();
	}
	//渲染二级suggest菜单
	function render_second_level_suggest(index, wrapper) {
		if (wrapper.find(".second_level_suggest_container").length) {
			wrapper.find(".second_level_suggest_container").remove();
		}
		var html = '';
		html += '<div class="second_level_suggest_container">';
		html += '<h3 class="title">请选择您要搜索的要素</h3>';
		html += '<a href="javascript:;" class="to_first_suggest">返回</a>';
		html += '<div class="second_level_suggest_list">';
		html += '<ul>';
		$.each(publicSearchConfig["alyp"].second_level_suggest[index], function (index,
			item) {
			html += '<li class="second_level_suggest_item" value="' + item.value +
				'" cfield="' + item.cfield + '" title="' + item.show +
				'"><span class="checkbox_bg"></span><span class="words">' + item.show +
				'</span></li>'
		});
		html += '</ul>';
		html += '</div>';
		html += '<a href="javascript:;" class="confirm_add_query">确认</a>';
		html += '</div>';
		wrapper
			.addClass('active')
			.append(html)
			.find(".first_level_suggest_list")
			.hide();
		console.log(wrapper)
		if (parseInt(wrapper.find(".second_level_suggest_list ul").height()) >
			parseInt(wrapper.find(".second_level_suggest_list").height())) {
			wrapper.find(".second_level_suggest_list").css("height", 320).xb_scroll({
				"childPanel": "ul"
			})
		}
	}
	//选中二级suggest
	function select_second_level_suggest_item() {
		if ($(this).hasClass("active")) {
			$(this).removeClass("active");
		} else {
			$(this).addClass("active");
		}
	}
	//添加二级suggest上屏
	function add_second_suggest_screen_query() {
		if (wrapper.find(".second_level_suggest_item.active").length == 0) {
			utils.operation_hints({
				status: "warn",
				text: "请至少选择一项要素"
			});
			return;
		}
		var temp_arr = [];
		wrapper.find(".second_level_suggest_item.active").each(function () {
			var tempObj = {};
			tempObj.value = $(this).attr("value");
			tempObj.cfield = $(this).attr("cfield");
			tempObj.field = "all";
			temp_arr.push(tempObj);
		});
		$.each(publicSearchConfig[CUR_PROJECT].screen_query, function (index, item) {
			var old_cfield = item.cfield;
			for (var i = 0; i < temp_arr.length; i++) {
				var cur_cfield = temp_arr[i].cfield;
				if (old_cfield == cur_cfield) {
					temp_arr.splice(i, 1);
					i--;
				}
			}
		})
		publicSearchConfig[CUR_PROJECT].screen_query = publicSearchConfig[CUR_PROJECT]
			.screen_query.concat(temp_arr);
		publicSearchConfig[CUR_PROJECT].render_screen_query(wrapper);
		second_level_suggest_hide();
		wrapper.find(".suggest_container").remove();
		input_ele.val('').focus();
	}
	//上下键改变当前选中的index
	function change_cur_index(event) {
		var length = wrapper.find(".suggest_container .suggest_item").length;
		//光标键"↓"
		if (event.keyCode == 40) {
			++cur_index;
			if (cur_index > length - 1) {
				cur_index = -1;
			}
		}
		//光标键"↑"
		else if (event.keyCode == 38) {
			cur_index--;
			if (cur_index < -1) {
				cur_index = length - 1;
			}
		}
		change_classname(cur_index);
	}
	//上下键更改列表项的样式
	function change_classname(cur_index) {
		wrapper.find(".suggest_container .suggest_item").each(function (index, item) {
			if (cur_index != index) {
				$(this).removeClass("active");
			} else {
				$(this).addClass("active");
			}
		})
	}
	//处理获取suggest的data
	function create_data(search_words) {
		var data = {};
		SHOW_FLAG = Math.random();
		data.showFlag = SHOW_FLAG;
		data.searchKey = search_words;
		if (CUR_PROJECT == "alyp") {
			if (temp_case_type == cur_case_type) {
				data.query = JSON.stringify(publicSearchConfig[CUR_PROJECT].screen_query.concat(
					publicSearchConfig[CUR_PROJECT].query));
			} else {
				data.query = JSON.stringify([]);
			}
			data.filter = JSON.stringify(publicSearchConfig[CUR_PROJECT].filter.concat(
				publicSearchConfig[CUR_PROJECT].filter));
			data.advs = JSON.stringify(publicSearchConfig[CUR_PROJECT].advs.concat(
				publicSearchConfig[CUR_PROJECT].advs));
			data.nAjlx = temp_case_type;
		} else if (CUR_PROJECT == "flfg") {
			data.query = JSON.stringify(publicSearchConfig[CUR_PROJECT].screen_query.concat(
				publicSearchConfig[CUR_PROJECT].query));
			data.filter = JSON.stringify(publicSearchConfig[CUR_PROJECT].filter.concat(
				publicSearchConfig[CUR_PROJECT].filter));
		} else if (CUR_PROJECT == "cpgd") {
			data.fy = publicSearchConfig[CUR_PROJECT].screen_query.fy;
			data.fg = publicSearchConfig[CUR_PROJECT].screen_query.fg;
			data.ay = publicSearchConfig[CUR_PROJECT].screen_query.ay;
		} else if (CUR_PROJECT == "qyfxfx") {
			var type = $('.current_qyfxfx_query_type').find('span').text();
			switch (type) {
				case '全部':
					type = 'all'
					break;
				case '公司名称':
					type = 'company'
					break;
				case '法定代表人':
					type = 'legalPerson'
					break;
				case '核心成员':
					type = 'coreMember'
					break;
			}
			data.source = type;
		} else if (CUR_PROJECT == "lsls") {
			var type = $('.current_lsls_query_type').find('span').text();
			switch (type) {
				case '律师':
					type = 'lawyer'
					break;
				case '律所':
					type = 'ls'
					break;
			}
			data.type = type;
		}
		return data;
	}
	//搜索
	function search() {
		cur_index = -1;
		remove_suggest();
		var key = utils.delete_space(input_ele.val()).length == 0 ? "" : input_ele.val();
		if (key == "") {
			remove_suggest();
			return;
		}
		var i = new Date().getTime()
		if (publicSearchConfig[CUR_PROJECT].suggest_url) {
			SHOW_FLAG = Math.random();
			setTimeout(function () {
				if (new Date().getTime() - suggestStartTime < 50) {
					//        			console.log("不请求");
					return;
				} else {
					//        			console.log("疯狂请求");
				}
				utils.post_req(publicSearchConfig[CUR_PROJECT].suggest_url, create_data(key)).done(function (data) {
					if (data) {
						if (utils.change_json(data).showFlag == SHOW_FLAG) {
							publicSearchConfig[CUR_PROJECT].render_suggest_fn(utils.change_json(data), wrapper);
							if (publicSearchConfig[CUR_PROJECT].analyze_data) {
								publicSearchConfig[CUR_PROJECT].analyze_data = utils.change_json(data).result //企业风险分析的数据
							};
						};
						// 律师律所的，suggest里面没有showflag
						if (CUR_PROJECT == 'lsls') {
							publicSearchConfig[CUR_PROJECT].render_suggest_fn(utils.change_json(data), wrapper);
						}
					} else {
						console.log('没有suggest');
					}
				})
			}, 50)
		}
	}

	function input_click_event() {
		if ($(this).val() == '输入名称进行检索') {
			$(this).val('');
		};
		if ($(this).val() && $(this).val() != $(this).attr("placeholder")) {
			search();
		};
	}

	function enter_event() {
		var value = utils.delete_space(input_ele.val()).length == 0 ? "" : input_ele.val();
		if (value.length == 0 || value == input_ele.attr("placeholder")) {
			if (!publicSearchConfig[CUR_PROJECT].check_screen_query()) {
				input_ele.blur();
				utils.operation_hints({
					status: "warn",
					text: "请输入正确的检索条件"
				});
				return;
			} else {
				if (CUR_PROJECT == "cpgd") {
					if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg == "") {
						utils.operation_hints({
							status: "warn",
							text: "请输入法院"
						});
						return;
					} else if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg != "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.ay != "") {
						utils.operation_hints({
							status: "warn",
							text: "法官+案由不在检索范围之内"
						});
						return;
					}
				}
				publicSearchConfig[CUR_PROJECT].submit();
			}
		} else if (value.length != 0 && value != input_ele.attr("placeholder")) {
			if (cur_index == -1) {
				if (CUR_PROJECT == "cpgd") {
					if (!publicSearchConfig[CUR_PROJECT].check_screen_query()) {
						input_ele.blur();
						utils.operation_hints({
							status: "warn",
							text: "请选择法院/法官/案由进行检索"
						});
						return;
					} else {
						if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
							publicSearchConfig[CUR_PROJECT].screen_query.fg == "") {
							utils.operation_hints({
								status: "warn",
								text: "请输入法院"
							});
							input_ele.blur();
							return;
						} else if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
							publicSearchConfig[CUR_PROJECT].screen_query.fg != "" &&
							publicSearchConfig[CUR_PROJECT].screen_query.ay != "") {
							utils.operation_hints({
								status: "warn",
								text: "法官+案由不在检索范围之内"
							});
							input_ele.blur();
							return;
						}
						input_ele.val('');
						remove_suggest();
						publicSearchConfig[CUR_PROJECT].submit();
						return;
					}
				}
				enter_input_to_screen(value);
			} else if (cur_index != -1) {
				var cur_suggest_item = wrapper.find(".suggest_container .suggest_item").eq(
					cur_index);
				if (cur_suggest_item.hasClass("common_suggest_item")) {
					if (CUR_PROJECT == 'qyfxfx') {
						publicSearchConfig[CUR_PROJECT].add_screen_query(cur_suggest_item);
						var company_id = $(cur_suggest_item).attr('data_id');
						var company_name = $(cur_suggest_item).attr('data_company');
						var type = $('.current_qyfxfx_query_type').find('span').text();
						switch (type) {
							case '全部':
								type = 'all'
								break;
							case '公司名称':
								type = 'company'
								break;
							case '法定代表人':
								type = 'legalPerson'
								break;
							case '核心成员':
								type = 'coreMember'
								break;
						}
						var config = {
							form_data: {
								d: company_id,
								cn: company_name,
								source: type,
								cate: cate
							},
							url: '/retrieval/detail',
							tag_name: "_self"
						}
						utils.form_submit(config)

					} else {
						publicSearchConfig[CUR_PROJECT].add_screen_query(cur_suggest_item);
						publicSearchConfig[CUR_PROJECT].render_screen_query(wrapper);
					}
					remove_suggest();
					input_ele.val('');
				} else if (cur_suggest_item.hasClass("guide_suggest_item")) {
					var index = cur_suggest_item.attr("index");
					render_second_level_suggest(index, wrapper.find(".suggest_container"));
				}
			}
		}
	}
	//重搜功能
	function again_btn_click_event() {
		var value = utils.delete_space(input_ele.val()).length == 0 ? "" : input_ele.val();
		if (value.length == 0 || value == input_ele.attr("placeholder")) {
			if (!publicSearchConfig[CUR_PROJECT].check_screen_query()) {
				input_ele.blur();
				utils.operation_hints({
					status: "warn",
					text: "请输入正确的检索条件"
				});
				return;
			} else {
				if (CUR_PROJECT == "cpgd") {
					if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg == "") {
						utils.operation_hints({
							status: "warn",
							text: "请输入法院"
						});
						return;
					} else if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg != "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.ay != "") {
						utils.operation_hints({
							status: "warn",
							text: "法官+案由不在检索范围之内"
						});
						return;
					}
				}
				empty_config();
				publicSearchConfig[CUR_PROJECT].submit();
			}
		} else if (value.length != 0 && value != input_ele.attr("placeholder")) {
			if (!publicSearchConfig[CUR_PROJECT].check_screen_query()) {
				if (CUR_PROJECT == "cpgd") {
					utils.operation_hints({
						status: "warn",
						text: "请选择法院/法官/案由进行检索"
					});
					return;
				} else if (CUR_PROJECT == "qyfxfx") {
					utils.operation_hints({
						status: "warn",
						text: "请选择公司/法人进行检索"
					});
					return;
				}
				empty_config();
				enter_input_to_screen(value);
				publicSearchConfig[CUR_PROJECT].submit();
			} else if (publicSearchConfig[CUR_PROJECT].check_screen_query()) {
				if (CUR_PROJECT == "cpgd") {
					if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg == "") {
						utils.operation_hints({
							status: "warn",
							text: "请输入法院"
						});
						return;
					} else if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg != "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.ay != "") {
						utils.operation_hints({
							status: "warn",
							text: "法官+案由不在检索范围之内"
						});
						return;
					}
					input_ele.val('');
					remove_suggest();
				} else {
					enter_input_to_screen(value);
				}
				empty_config();
				publicSearchConfig[CUR_PROJECT].submit();
			}
		}
	}
	//检索按钮点击事件
	function search_btn_click_event() {
		var value = utils.delete_space(input_ele.val()).length == 0 ? "" : input_ele.val();
		console.log('in search_btn_click_event fn---->value && length',value,value.length)
		console.log('publicSearchConfig---->',publicSearchConfig)
		console.log('publicSearchConfig[CUR_PROJECT]---->',publicSearchConfig[CUR_PROJECT])
		console.log('CUR_PROJECT---->',CUR_PROJECT)
		if (value.length == 0 || value == input_ele.attr("placeholder")) {
			if (!publicSearchConfig[CUR_PROJECT].check_screen_query()) {
				input_ele.blur();
				utils.operation_hints({
					status: "warn",
					text: "请输入正确的检索条件"
				});
				return;
			} else {
				if (CUR_PROJECT == "cpgd") {
					if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg == "") {
						utils.operation_hints({
							status: "warn",
							text: "请输入法院"
						});
						return;
					} else if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg != "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.ay != "") {
						utils.operation_hints({
							status: "warn",
							text: "法官+案由不在检索范围之内"
						});
						return;
					}
				}
				publicSearchConfig[CUR_PROJECT].submit();
			}
		} else if (value.length != 0 && value != input_ele.attr("placeholder")) {
			console.log('check_screen_query---->',publicSearchConfig[CUR_PROJECT].check_screen_query())
			if (!publicSearchConfig[CUR_PROJECT].check_screen_query()) {
				if (CUR_PROJECT == "cpgd") {
					utils.operation_hints({
						status: "warn",
						text: "请选择法院/法官/案由进行检索"
					});
					return;
				} else if (CUR_PROJECT == "qyfxfx") {
					var elem = $('.search_input')
					publicSearchConfig[CUR_PROJECT].add_screen_query(elem)
					publicSearchConfig[CUR_PROJECT].click_search_analyze(elem);
					publicSearchConfig[CUR_PROJECT].submit();
					return;
				}
				enter_input_to_screen(value);
				console.log('here to submit')
				publicSearchConfig[CUR_PROJECT].submit();
			} else if (publicSearchConfig[CUR_PROJECT].check_screen_query()) {
				if (CUR_PROJECT == "cpgd") {
					if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg == "") {
						utils.operation_hints({
							status: "warn",
							text: "请输入法院"
						});
						return;
					} else if (publicSearchConfig[CUR_PROJECT].screen_query.fy == "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.fg != "" &&
						publicSearchConfig[CUR_PROJECT].screen_query.ay != "") {
						utils.operation_hints({
							status: "warn",
							text: "法官+案由不在检索范围之内"
						});
						return;
					}
					input_ele.val('');
					remove_suggest();
				} else if (CUR_PROJECT == "qyfxfx") {
					return

				} else {
					//console.log('check value--->',value)
					enter_input_to_screen(value);
					//return false
				}

				publicSearchConfig[CUR_PROJECT].submit();
			}
		}
	}
	//按键事件
	function press_key(event) {
		// 回车 上箭头 下箭头
		if (event.keyCode != 13 && event.keyCode != 38 && event.keyCode != 40) {
			suggestStartTime = new Date().getTime();
			search();
		}
		change_cur_index(event);
		if (event.keyCode == 13) {
			enter_event(event);
		}
	}

	function init() {
		input_ele.off().on("keyup", press_key).on("click", input_click_event)
		search_btn.on("click", search_btn_click_event);
		if (again_btn) {
			again_btn.on("click", again_btn_click_event);
		}
		wrapper
			.off()
			.on("click", ".common_suggest_item", click_suggest_to_screen)
			.on("click", ".delete_screen_query_item", delete_screen_query_item)
			.on("click", ".guide_suggest_item", second_level_suggest_show)
			.on("click", ".to_first_suggest", second_level_suggest_hide)
			.on("click", ".second_level_suggest_item", select_second_level_suggest_item)
			.on("click", ".confirm_add_query", add_second_suggest_screen_query);
		/*        submitButton.on("click",clickSubmit);*/
	}
	init();//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
}
//切换项目
function change_search_project() {
	if ($(this).hasClass("active")) return;
	var search_container = layout_header.find(".search_container");
	CUR_PROJECT = $(this).attr("project_code");
	$(this).addClass("active").siblings().removeClass("active");
	search_container.find(".search_input").val('').attr("placeholder", "").blur();
	if (CUR_PROJECT == "alyp") {
		search_container.find(".search_input_wrapper").css('margin-left', '100px');
		search_container.find(".case_types_container").show();
		search_container.find(".search_type_container").hide();
		search_container.find(".company_type_container").hide();
		search_container.find(".lsls_type_container").hide();
		search_container.find(".combination_search_btn").show();
		search_container.find(".search_input_wrapper").removeClass("cpgd");
		if (INIT_PROJECT == 'alyp' && INIT_List != '') {
			search_container.find(".search_btn_wrapper").removeClass("cpgd");
		} else {
			search_container.find(".search_btn_wrapper").addClass("cpgd");
		}
		search_container.find(".search_input").attr("placeholder",
			"输入检索内容，按回车键，可多组条件同时检索");
	} else {
		search_container.find(".case_types_container").hide();
		search_container.find(".combination_search_btn").hide();
		if (CUR_PROJECT == "flfg") {
			search_container.find(".search_input_wrapper").css('margin-left', '100px');
			search_container.find(".search_type_container").show();
			search_container.find(".company_type_container").hide();
			search_container.find(".lsls_type_container").hide();
			search_container.find(".search_input_wrapper").removeClass("cpgd");
			if (INIT_PROJECT == 'flfg' && INIT_List != '') {
				search_container.find(".search_btn_wrapper").removeClass("cpgd");
			} else {
				search_container.find(".search_btn_wrapper").addClass("cpgd");
			}
			search_container.find(".search_input").attr("placeholder",
				"输入关键词，按回车键，支持多组条件同时检索");
		} else if (CUR_PROJECT == "cpgd") {
			search_container.find(".search_input_wrapper").css('margin-left', 0);
			search_container.find(".search_btn_wrapper").addClass("cpgd");
			search_container.find(".search_input_wrapper").addClass("cpgd");
			search_container.find(".company_type_container").hide();
			search_container.find(".lsls_type_container").hide();
			search_container.find(".search_type_container").hide();
			search_container.find(".search_input").attr("placeholder",
				"输入法院、法官、案由，按回车键，支持多组条件同时检索");
		} else if (CUR_PROJECT == "qyfxfx") { //企业风险分析
			search_container.find(".search_input_wrapper").css('margin-left', 0);
			search_container.find(".search_input_wrapper").removeClass('cpgd');
			search_container.find(".company_type_container").show();
			search_container.find(".search_btn_wrapper").addClass("cpgd");
			/*search_container.find(".search_input_wrapper").addClass("cpgd");*/
			search_container.find(".lsls_type_container").hide();
			search_container.find(".search_type_container").hide();
			search_container.find(".search_input").attr("placeholder",
				"请输入企业名称、法定代表人或核心成员姓名");
		} else if (CUR_PROJECT == "lsls") { //企业风险分析
			search_container.find(".search_input_wrapper").css('margin-left', '100px');
			search_container.find(".search_input_wrapper").removeClass('cpgd');
			search_container.find(".company_type_container").hide();
			search_container.find(".lsls_type_container").show();
			search_container.find(".search_btn_wrapper").addClass("cpgd");
			/*search_container.find(".search_input_wrapper").addClass("cpgd");*/
			search_container.find(".search_type_container").hide();
			search_container.find(".search_input").attr("placeholder",
				"输入名称进行检索");
			$('.current_lsls_query_type.drop_btn span').html('律所');
		}
	}
	//模拟placeholder
	utils.placeholder([layout_header.find(".search_input").eq(0)]);
	reset_screen(layout_header.find(".search_area"));
};

function hideArrow() {
	if (case_type_list.length <= 1 && $("li.search_project.active").attr(
			"project_code") == "alyp") {
		$(".current_case_types").css("cursor", "default");
		if (window.location.href == base_path + "/") {
			$(".current_case_types").css("padding-left", "20px");
		} else {
			$(".current_case_types").css("padding-left", "34px");
		};
		$(".case_types_container i").hide();
	};
};
setTimeout(function (params) {
	hideArrow();
}, 100);
//下拉菜单显示
function drop_menu_show(e) {
	if (case_type_list.length <= 1 &&
		$("li.search_project.active").attr("project_code") == "alyp" &&
		!$(e.target || e.srcElement).parents("div").hasClass("user_info")) {
		return;
	};
	layout_header.find(".drop_menu").removeClass("show").hide(5, function () {
		$(document).off(".menu_hide");
	});
	var _this = this;
	if ($(_this).next().hasClass("show")) {
		$(_this)
			.next()
			.removeClass("show")
			.hide(5, function () {
				$(document).off(".menu_hide");
			});

	} else {
		$(_this)
			.next()
			.addClass("show")
			.show(5, drop_menu_hide);
	}
	//点击菜单外菜单消失
	function drop_menu_hide() {
		$(document).on("click.menu_hide", function (e) {
			if ($(e.target).closest(".drop_menu").length == 0) {
				$(_this).next().removeClass("show").hide(5, function () {
					$(document).off(".menu_hide");
				});
			}
		})
	}
}
//切换案件类型
function change_case_type() {
	var _this = this;
	/*cur_case_type=$(_this).attr("case_type");*/
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
	}
	reset_screen(layout_header.find(".search_area"));
	/*if(INIT_PROJECT=="alyp"){
		empty_config();
		publicSearchConfig["alyp"].render_query({
			element:query_result_container,
		});
	}*/

}
//切换法律法规类型
function change_flfg_query_type() {
	var type = $(this).html();
	publicSearchConfig["flfg"].query_type = type ? type : queryType;
	if (this == window) {
		$(".search_type_container").find(".current_flfg_query_type span")
			.html(publicSearchConfig["flfg"].query_type);
	} else {
		$(this).closest(".search_type_container").find(".current_flfg_query_type span")
			.html(type);
	}
	$(this).closest(".search_area").find(".drop_menu").removeClass("show").hide(5,
		function () {
			$(document).off(".menu_hide");
		});

}
//切换企业风险分析

function change_qyfxfx_query_type() {
	var type = $(this).html();
	//这里还差一点逻辑
	switch (type) {
		case '全部':
			company_case_type = 'all'
			break;
		case '公司名称':
			company_case_type = 'company'
			break;
		case '法定代表人':
			company_case_type = 'legalPerson'
			break;
		case '核心成员':
			company_case_type = 'coreMember'
			break;
	}
	$(this).closest(".company_type_container").find(
		".current_qyfxfx_query_type span").html(type)
	$(this).closest(".search_area").find(".drop_menu").removeClass("show").hide(5,
		function () {
			$(document).off(".menu_hide");
		});
}

function change_lsls_query_type() {
	var type = $(this).html();
	switch (type) {
		case '律师':
			lsls_type = 'lawyer'
			break;
		case '律所':
			lsls_type = 'ls'
			break;
	}
	$(this).closest(".lsls_type_container").find(
		".current_lsls_query_type span").html(type)
	$(this).closest(".search_area").find(".drop_menu").removeClass("show").hide(5,
		function () {
			$(document).off(".menu_hide");
		}
	);
	$('.search_input_wrapper input').attr('placeholder', '输入' + (lsls_type == 'lawyer' ? '姓名' : '名称') + '进行检索');
}
//初始化企业分析类型

function init_qyfxfx_query_type() {
	if (INIT_PROJECT == 'qyfxfx') {
		var type;
		switch (source) {
			case 'all':
				type = '全部'
				break;
			case 'company':
				type = '公司名称'
				break;
			case 'legalPerson':
				type = '法定代表人'
				break;
			case 'coreMember':
				type = '核心成员'
				break;
		}
		$(".current_qyfxfx_query_type span").html(type);
	}
}



//组合检索
function add_combination_search() {
	var trigger = this;
	is_login(trigger, callback);

	function callback() {
		dialog({
			trigger: trigger,
			type: "combination_search",
			title: "增加组合条件",
			options: {
				relativeToWindow: true
			},
			query: publicSearchConfig["alyp"].query,
			filter: publicSearchConfig["alyp"].filter,
			advs: publicSearchConfig["alyp"].advs,
			includeJcy: init_includeJcy ? "1" : 0,
			nAjlx: temp_case_type
		}).show();
	}

}
//登陆
function login() {
	var trigger = this;
	if (user_status === "guests" && bswz == '3') {
		utils.get_req('/hasLogged').done(function (response) {
			var data = utils.change_json(response);
			if (data.hasLogged) {
				user_photo_src = data.user.image;
				user_status = data.user.status;
				user_manage_url = data.user.manageUrl;
				user_name = data.user.name;
				render_user()
			} else {
				dialog({
					trigger: trigger,
					type: "login",
					options: {
						relativeToWindow: true
					},
					render_user_callback: render_user,
				}).show();
			}
		})
	}

}
//退出
function sign_out() {
	utils.post_req("/logout", {})
		.done(function (response) {
			var data = utils.change_json(response);
			window.location.href = data.url;
		})
}

function is_login(trigger, callback, close_callback_data) {
	if (bswz == '3') {
		var trigger = trigger;
		utils.get_req('/hasLogged').done(function (response) {
			var data = utils.change_json(response);
			if (data.hasLogged) {
				user_photo_src = data.user.image;
				user_status = data.user.status;
				user_manage_url = data.user.manageUrl;
				user_name = data.user.name;
				render_user()
				callback()

			} else {
				render_login_out()
				dialog({
					trigger: trigger,
					type: "login",
					options: {
						relativeToWindow: true
					},
					render_user_callback: render_user,
					action_callback: callback,
					close_callback_data: close_callback_data
				}).show();

			}


		})

	} else {
		callback();
	}
}
//搜索渲染 //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function PublicSearchConfig(project) {
	switch (project) {
		case "alyp":
			this.suggest_url = "/alyp/alypSuggest";
			this.query = [];
			this.filter = [];
			this.advs = [];
			this.screen_query = [];
			this.second_level_suggest = {};
			this.delete_screen_query_item = function (mark) {
				var index = mark;
				publicSearchConfig["alyp"].screen_query.splice(index, 1);
				delete index;
			}
			this.add_screen_query = function (obj) {
				console.log('   obj   ',obj,typeof(obj))
				var tempObj = {};
				if (typeof obj == "object") {
					tempObj.value = obj.attr("value");
					tempObj.cfield = obj.attr("cfield");
					tempObj.field = "all";
				} else {
					tempObj.value = obj;
					tempObj.cfield = obj;
					tempObj.field = "all";
				}
				console.log('publicSearchConfig["alyp"].screen_query.length',publicSearchConfig["alyp"].screen_query.length)
				if (publicSearchConfig["alyp"].screen_query.length) {
					for (var i = 0; i < publicSearchConfig["alyp"].screen_query.length; i++) {
						var item_cfield = publicSearchConfig["alyp"].screen_query[i].cfield;
						if (item_cfield == tempObj.cfield) {
							publicSearchConfig["alyp"].screen_query.splice(i, 1);
							i--;
						}
					}
				}

				publicSearchConfig["alyp"].screen_query.push(tempObj);
				delete tempObj;
			}
			this.render_screen_query = function (wrapper) {
				if (publicSearchConfig["alyp"].screen_query.length == 0) {
					wrapper.find(".screen_query_container").remove();
					return;
				}
				wrapper.find(".screen_query_container").remove();
				var html = '';
				html += '<div class="screen_query_container">';
				html += '<div class="screen_query_list">';
				html += '<ul class="clearfix">';
				$.each(publicSearchConfig.alyp.screen_query, function (index, item) {
					html += '<li class="screen_query_item" mark="' + index + '">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="' + item.cfield + '">' + item.cfield + '</span>';
					html += '</li>'
				});
				html += '</ul>';
				html += '</div>';
				html += '</div>';
				wrapper.append(html);
				$('.screen_query_container').show();
				set_custom_scroll_bar(wrapper);
			}
			this.render_suggest_fn = function (data, wrapper) {
				if (!data.result.suggests.length) {
					return;
				}
				var html = [];
				var suggest_info = [];
				var guide_suggest_info = [];
				var innocent_info = [];
				html.push('<div class="suggest_container">');
				html.push('<div class="first_level_suggest_list">');
				$.each(data.result.suggests, function (index, item) {
					if (item.title !== "引导项") {
						if (item.title == "无罪原因") {
							innocent_info.push(item);
						} else {
							suggest_info.push(item);
						}

					} else {
						guide_suggest_info.push(item)
					}
				});
				if (suggest_info.length) {
					$.each(suggest_info, function (index, item) {
						html.push('<div class="suggest_info">');
						html.push('<h2 class="suggest_title">' + item.title + '</h2>');
						html.push('<ul>');
						$.each(item.ary, function (index, item) {
							html.push('<li class="common_suggest_item suggest_item" value="' +
								item.value + '" cfield="' + item.cfield + '" title="' + item.show +
								'">' + item.show + '</li>');
						});
						html.push('</ul>');
						html.push('</div>');
					})
				}
				if (guide_suggest_info.length) {
					$.each(guide_suggest_info, function (index, item) {
						html.push('<div class="guide_suggest_info">');
						html.push('<h2 class="suggest_title">' + item.title + '</h2>');
						html.push('<ul>');
						$.each(item.ary, function (index, item) {
							html.push('<li class="guide_suggest_item suggest_item" index="' +
								index + '" title="' + item.show +
								'"><i class="icon-linear-arrow-right"></i><span>' + item.show +
								'</span></li>');
							publicSearchConfig["alyp"].second_level_suggest[index] = item.ary;
						});
						html.push('</ul>');
						html.push('</div>');
					})
				}
				if (innocent_info.length) {
					$.each(innocent_info, function (index, item) {
						html.push('<div class="suggest_info">');
						html.push('<h2 class="suggest_title">' + item.title + '</h2>');
						html.push('<ul>');
						$.each(item.ary, function (index, item) {
							html.push('<li class="common_suggest_item suggest_item" value="' +
								item.value + '" cfield="' + item.cfield + '" title="' + item.show +
								'">' + item.show + '</li>');
						});
						html.push('</ul>');
						html.push('</div>');
					})
				}
				html.push('</div>');
				html.push('</div>');
				$(html.join('')).appendTo(wrapper);
				$(document).on("click.suggest_hide", function (e) {
					if ($(e.target).closest(".suggest_container").length == 0) {
						wrapper.find(".suggest_container").hide();
						$(document).off(".suggest_hide");
					}
				})
			}
			this.check_screen_query = function () {
				var count = 0;
				if (publicSearchConfig["alyp"].screen_query.length) {
					count += 1
				}
				return count;
			}
			this.create_new_query = function () {
				$.each(query, function (index, item) {
					publicSearchConfig.alyp.query.push(item);
				});

				$.each(filter, function (index, item) {
					publicSearchConfig.alyp.filter.push(item);
				});
				$.each(advs, function (index, item) {
					publicSearchConfig.alyp.advs.push(item);
				})
			}
			this.render_query = function (config) {
				if (publicSearchConfig.alyp.query.length == 0 && publicSearchConfig.alyp.advs
					.length == 0) {
					query = [];
					advs = [];
					filter = [];
					publicSearchConfig.alyp.query = [];
					publicSearchConfig.alyp.fliter = [];
					publicSearchConfig.alyp.advs = [];
					config.element.empty();
					utils.no_result({
						text: "请输入检索条件查询",
						parent_elem: config.element,
						img_name: "no_condition"
					});
					return;
				};
				var html = '';
				html += '<div class="query_container">';
				html += '<div class="container">';
				html += '<h3 class="title">检索条件：</h3>';
				// html +=
				// 	'<a href="javascript:;" class="store_query"><i class="icon-linear-collection"></i><span>收藏条件</span></a>';
				html += '<div class="query_list">';
				html += '<ul>';
				$.each(publicSearchConfig.alyp.query, function (index, item) {
					html += '<li class="query_item">';
					html +=
						'<i class="delete_query_item icon-close" belong="query" index="' +
						index + '"></i>';
					html += '<span title="' + item.cfield + '">' + item.cfield + '</span>';
					html += '</li>';
				});
				$.each(publicSearchConfig.alyp.filter, function (index, item) {
					html += '<li class="query_item">';
					html +=
						'<i class="delete_query_item icon-close" belong="filter" index="' +
						index + '"></i>';
					html += '<span title="' + item.cfield + '">' + item.cfield + '</span>';
					html += '</li>';
				});
				$.each(publicSearchConfig.alyp.advs, function (index, item) {
					html += '<li class="query_item">';
					html += '<i class="delete_query_item icon-close" belong="advs" index="' +
						index + '"></i>';
					html += '<span title="' + item.cfield + '">' + item.cfield + '</span>';
					html += '</li>';
				});
				html += '</ul>';
				html += '</div>';
				html += '</div>';
				html += '</div>';
				html += '<div class="container">';
				html += '<div class="case_selection">';
				html += '<h3 class="title">案例选择：</h3>';
				html += '<div class="case_selection_list">';
				html +=
					'<a href="javascript:;" search_type="QWAL" count="0" class="case_selection_item"><span>权威案例</span><span class="count">（0）</span></a>';
				html +=
					'<a href="javascript:;" search_type="PTAL" count="0" class="case_selection_item"><span>普通案例</span><span class="count">（0）</span></a>';
				html += '</div>';
				/*if(bswz==1){
					if(cur_case_type==1){
						html+='<a href="javascript:;"class="is_has_document '+(init_includeJcy?"active":"")+'"><span class="bg"></span><span>含检察院文书</span></a>';
					}
				}else{
					if(cur_case_type==1){
						html+='<a href="javascript:;"class="is_has_document '+(init_includeJcy?"active":"")+'"><span class="bg"></span><span>含检察院文书</span></a>';
					}
				}*/
				if (cur_case_type == 1) {
					html += '<a href="javascript:;"class="is_has_document ' + (
							init_includeJcy ? "active" : "") +
						'"><span class="bg"></span><span>含检察院文书</span></a>';
				}
				html += '</div>';
				html += '<div class="list_result_container">';
				html += '</div>';
				html += '</div>';
				config.element.empty().html(html);
				if (config.get_fn) {
					config.get_fn();
				}
			}
			this.handing_repeat = function () {
				console.log('in handing_repeat fn---->publicSearchConfig["alyp"].query',publicSearchConfig["alyp"].query)
				$.each(publicSearchConfig["alyp"].query, function (index, item) {
					var new_cfield = item.cfield;
					for (var i = 0; i < publicSearchConfig["alyp"].screen_query.length; i++) {
						var cur = publicSearchConfig["alyp"].screen_query[i];
						if (new_cfield == cur.cfield) {
							publicSearchConfig["alyp"].screen_query.splice(i, 1);
							i--;
						}
					}
				})
				console.log('in handing_repeat fn---->publicSearchConfig["alyp"].filter',publicSearchConfig["alyp"].filter)
				$.each(publicSearchConfig["alyp"].filter, function (index, item) {
					var new_cfield = item.cfield;
					for (var i = 0; i < publicSearchConfig["alyp"].screen_query.length; i++) {
						var cur = publicSearchConfig["alyp"].screen_query[i];
						if (new_cfield == cur.cfield) {
							publicSearchConfig["alyp"].screen_query.splice(i, 1);
							i--;
						}
					}
				})
			}
			this.submit = function (search_container) {
				publicSearchConfig["alyp"].handing_repeat();
				console.log('publicSearchConfig["alyp"].query,publicSearchConfig["alyp"].screen_query--->',publicSearchConfig["alyp"].query,publicSearchConfig["alyp"].screen_query)
				var config = {
					form_data: {
						query: publicSearchConfig["alyp"].query.concat(publicSearchConfig[
							"alyp"].screen_query),
						filter: publicSearchConfig["alyp"].filter,
						advs: publicSearchConfig["alyp"].advs,
						searchType: init_searchType ? init_searchType : "",
						includeJcy: init_includeJcy ? init_includeJcy : "",
						nAjlx: temp_case_type,
					},
					url: "/basicSearch/search",
					tag_name: "_self"
				}
				console.log('final submit data---->',config)
				//return false
				utils.form_submit(config)
				reset_screen(layout_header.find(".search_area"));
			}
			break;
		case "flfg":
			this.suggest_url = "";
			this.query = [];
			this.screen_query = [];
			this.filter = [];
			this.query_type = "标题";
			this.delete_screen_query_item = function (mark) {
				var index = mark;
				publicSearchConfig["flfg"].screen_query.splice(index, 1);
				delete index;
			}
			this.add_screen_query = function (text) {
				var tempObj = {};
				tempObj.field = "keywords";
				tempObj.cfield = text;
				tempObj.value = text;
				if (publicSearchConfig["flfg"].screen_query.length) {
					for (var i = 0; i < publicSearchConfig["flfg"].screen_query.length; i++) {
						var item_cfield = publicSearchConfig["flfg"].screen_query[i].cfield;
						if (item_cfield == tempObj.cfield) {
							publicSearchConfig["flfg"].screen_query.splice(i, 1);
							i--;
						}
					}
				}
				publicSearchConfig["flfg"].screen_query.push(tempObj);

				delete tempObj;
			}
			this.render_screen_query = function (wrapper) {
				if (publicSearchConfig["flfg"].screen_query.length == 0) {
					wrapper.find(".screen_query_container").remove();
					return;
				}

				wrapper.find(".screen_query_container").remove();
				var html = '';
				html += '<div class="screen_query_container">';
				html += '<div class="screen_query_list">';
				html += '<ul class="clearfix">';
				$.each(publicSearchConfig.flfg.screen_query, function (index, item) {
					html += '<li class="screen_query_item" mark="' + index + '">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="' + item.cfield + '">' + item.cfield + '</span>';
					html += '</li>'
				});
				html += '</ul>';
				html += '</div>';
				html += '</div>';
				wrapper.append(html);
				$('.screen_query_container').show()
				set_custom_scroll_bar(wrapper);
			}
			this.render_suggest_fn = function (data, wrapper) {

			}
			this.handing_repeat = function () {
				$.each(publicSearchConfig["flfg"].query, function (index, item) {
					var new_cfield = item.cfield;
					for (var i = 0; i < publicSearchConfig["flfg"].screen_query.length; i++) {
						var cur = publicSearchConfig["flfg"].screen_query[i];
						if (new_cfield == cur.cfield) {
							publicSearchConfig["flfg"].screen_query.splice(i, 1);
							i--;
						}
					}
				})
				$.each(publicSearchConfig["flfg"].filter, function (index, item) {
					var new_cfield = item.cfield;
					for (var i = 0; i < publicSearchConfig["flfg"].screen_query.length; i++) {
						var cur = publicSearchConfig["flfg"].screen_query[i];
						if (new_cfield == cur.cfield) {
							publicSearchConfig["flfg"].screen_query.splice(i, 1);
							i--;
						}
					}
				})
			}
			this.submit = function () {
				publicSearchConfig["flfg"].handing_repeat();
				var config = {
					form_data: {
						query: publicSearchConfig["flfg"].query.concat(publicSearchConfig[
							"flfg"].screen_query),
						filter: publicSearchConfig["flfg"].filter,
						queryType: publicSearchConfig["flfg"].query_type
					},
					url: "/ftfx/searchList",
					tag_name: "_self"
				}
				utils.form_submit(config)
				reset_screen(layout_header.find(".search_area"));
			}
			this.create_new_query = function () {
				$.each(query, function (index, item) {
					publicSearchConfig.flfg.query.push(item);
				});
				$.each(filter, function (index, item) {
					publicSearchConfig.flfg.filter.push(item);
				});
				if (queryType) {
					publicSearchConfig["flfg"].query_type = queryType;
				}

			}
			this.render_query = function (config) {
				if (publicSearchConfig.flfg.query.length == 0) {
					query = [];
					advs = [];
					filter = [];
					publicSearchConfig.alyp.query = [];
					publicSearchConfig.alyp.fliter = [];
					config.element.empty();
					utils.no_result({
						text: "请输入检索条件查询",
						parent_elem: config.element,
						img_name: "no_condition"
					});
					return;
				};
				var html = '';
				html += '<div class="query_container">';
				html += '<div class="container">';
				html += '<h3 class="title">检索条件：</h3>';
				// html +=
				// 	'<a href="javascript:;" class="store_query"><i class="icon-linear-collection"></i><span>收藏条件</span></a>';
				// html += '<div class="query_list">';
				html += '<ul>';
				$.each(publicSearchConfig.flfg.query, function (index, item) {
					html += '<li class="query_item">';
					html +=
						'<i class="delete_query_item icon-close" belong="query" index="' +
						index + '"></i>';
					html += '<span title="' + item.cfield + '">' + item.cfield + '</span>';
					html += '</li>';
				});
				$.each(publicSearchConfig.flfg.filter, function (index, item) {
					html += '<li class="query_item">';
					html +=
						'<i class="delete_query_item icon-close" belong="filter" index="' +
						index + '"></i>';
					html += '<span title="' + item.cfield + '">' + item.cfield + '</span>';
					html += '</li>';
				});
				html += '</ul>';
				html += '</div>';
				html += '</div>';
				html += '</div>';
				html += '<div class="relative_search"></div>';
				html += '<div class="all_result_container">';
				html += '<div class="container">';
				html += '<div class="source_result_container">';

				var text = config.queryType == "标题" ? "全文" : "标题";
				html += '<a href="javascript:;" class="change_query_type">试试以' + text +
					'搜索</a>';
				html += '<ul></ul>';
				html += '</div>';
				html += '</div>';
				html += '<div class="list_result_container">';
				html += '</div>';
				html += '</div>';
				config.element.empty().html(html);
				change_flfg_query_type()
				if (config.get_fn) {
					config.get_fn();
				}
			}
			this.check_screen_query = function () {
				var count = 0;
				if (publicSearchConfig["flfg"].screen_query.length) {
					count += 1
				}
				return count;
			}
			break;
		case "cpgd":
			this.suggest_url = "/cpgdfx/cpgdSuggest";
			this.query = {
				fg: "",
				fy: "",
				ay: "",
				fgId: "",
				dq: [],
				startTime: ""
			};
			this.screen_query = {
				fg: "",
				fy: "",
				ay: "",
				fgId: "",
				dq: [],
				startTime: ""
			};
			this.filter = [];
			this.delete_screen_query_item = function (mark) {
				publicSearchConfig["cpgd"].screen_query[mark] = "";
			}
			this.add_screen_query = function (obj) {
				var belong = obj.attr("belong");
				var value = obj.html();
				publicSearchConfig["cpgd"].screen_query[belong] = value;
				delete belong;
				delete value;
			}
			this.render_screen_query = function (wrapper) {
				if (publicSearchConfig["cpgd"].check_screen_query() == 0) {
					wrapper.find(".screen_query_container").remove();
					return;
				}
				wrapper.find(".screen_query_container").remove();
				var html = '';
				html += '<div class="screen_query_container">';
				html += '<div class="screen_query_list">';
				html += '<ul class="clearfix">';
				if (publicSearchConfig["cpgd"].screen_query.fg) {
					html += '<li class="screen_query_item" mark="fg">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="法官：' + publicSearchConfig["cpgd"].screen_query.fg +
						'">法官：' + publicSearchConfig["cpgd"].screen_query.fg + '</span>';
					html += '</li>'
				}
				if (publicSearchConfig["cpgd"].screen_query.fy) {
					html += '<li class="screen_query_item" mark="fy">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="法院：' + publicSearchConfig["cpgd"].screen_query.fy +
						'">法院：' + publicSearchConfig["cpgd"].screen_query.fy + '</span>';
					html += '</li>'
				}
				if (publicSearchConfig["cpgd"].screen_query.ay) {
					html += '<li class="screen_query_item" mark="ay">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="案由：' + publicSearchConfig["cpgd"].screen_query.fg +
						'">案由：' + publicSearchConfig["cpgd"].screen_query.ay + '</span>';
					html += '</li>'
				}
				html += '</ul>';
				html += '</div>';
				html += '</div>';
				wrapper.append(html);
				$('.screen_query_container').show()
				set_custom_scroll_bar(wrapper);
			}
			this.render_suggest_fn = function (data, wrapper) {
				var html = '';
				if (!data.fg.length && !data.fy.length && !data.ay.length) return;
				html += '<div class="suggest_container">';
				html += '<div class="suggest_list">';
				if (data.ay.length) {
					html += '<div class="suggest_info">';
					html += '<h2 class="suggest_title">案由</h2>';
					html += '<ul>';
					$.each(data.ay, function (index, item) {
						html += '<li class="common_suggest_item suggest_item" title="' + item +
							'" belong="ay">' + item + '</li>';
					});

					html += '</ul>';
					html += '</div>'
				}
				if (data.fy.length) {
					html += '<div class="suggest_info">';
					html += '<h2 class="suggest_title">法院</h2>';
					html += '<ul>';
					$.each(data.fy, function (index, item) {
						html += '<li class="common_suggest_item suggest_item" title="' + item +
							'" belong="fy">' + item + '</li>';
					});

					html += '</ul>';
					html += '</div>';
				}
				if (data.fg.length) {
					html += '<div class="suggest_info">';
					html += '<h2 class="suggest_title">法官</h2>';
					html += '<ul>';
					$.each(data.fg, function (index, item) {
						html += '<li class="common_suggest_item suggest_item" title="' + item +
							'" belong="fg">' + item + '</li>';
					});

					html += '</ul>';
					html += '</div>'
				}
				html += '</div>';
				html += '</div>';
				wrapper.append(html);
				$(document).on("click.suggest_hide", function (e) {
					if ($(e.target).closest(".suggest_container").length == 0) {
						wrapper.find(".suggest_container").remove();
						$(document).off(".suggest_hide");
					}
				})
			}
			this.submit = function (data, target) {
				var config = {
					form_data: {
						isCheck: true,
					},
					url: "/cpgdfx/search",
					tag_name: "_self"
				}
				for (var i in publicSearchConfig["cpgd"].screen_query) {
					config.form_data[i] = publicSearchConfig["cpgd"].screen_query[i];
				}
				utils.form_submit(config)
				reset_screen(layout_header.find(".search_area"));
			}
			this.create_new_query = function () {
				for (var key in query) {
					publicSearchConfig["cpgd"].query[key] = query[key]
				}
			}
			this.render_query = function (elem, no_condition_elem, callback) {

			}
			this.check_screen_query = function () {
				var count = 0;
				if (publicSearchConfig["cpgd"].screen_query.ay || publicSearchConfig[
						"cpgd"].screen_query.fy || publicSearchConfig["cpgd"].screen_query.fg) {
					count += 1;
				}
				return count;
			}
			break;
			//企业风险分析
		case "qyfxfx":
			this.suggest_url = "/retrievalSuggest/suggest";
			this.screen_query = [];
			this.analyze_data = [];
			this.query = [];
			this.filter = [];
			this.result_query = [];
			this.create_new_query = function () {
				$.each(JSON.parse(query), function (index, item) {
					publicSearchConfig.qyfxfx.query.push(item);
				});
				$.each(JSON.parse(filter), function (index, item) {
					publicSearchConfig.qyfxfx.filter.push(item);
				});

			}
			this.render_suggest_fn = function (data, wrapper) {
					var html = '';
					html += '<div class="suggest_container">';
					html += '<div class="suggest_list">';
					//法人 legalPerson  公司  company
					if (!data.result.length) return;
					html += '<div class="suggest_info">'
					html += '<ul>'
					$.each(data.result, function (index, item) {
						var source = item.source
						cate = item.cate
						switch (source) {
							case 'legalPerson':
								source = '法定代表人'
								break;
							case 'company':
								source = '公司'
								break;
							case 'coreMember':
								source = '核心成员'
								break;
						}

						html +=
							'<li class="common_suggest_item suggest_item  qyfxfx_item" title="' +
							item.company + '" belong = ' + item.source + ' data_id = ' + item.id +
							' data_company = ' + item.company + '><span>' + item.company +
							'</span><span class = "suggest_source" >' + source + '</span></li>';
					})
					html += '</ul>'
					html += '</div>'
					html += '</div>';
					html += '</div>';
					wrapper.append(html);
					//去掉suggest
					$(document).on("click.suggest_hide", function (e) {
						if ($(e.target).closest(".suggest_container").length == 0) {
							wrapper.find(".suggest_container").remove();
							$(document).off(".suggest_hide");
						}
					})
				},
				//添加上屏的条件
				this.add_screen_query = function (obj) {
					var tempObj = {};
					if (typeof obj == "object") {
						tempObj.value = obj.val();
						tempObj.cfield = obj.val();
						tempObj.field = "all";
					} else {
						tempObj.cfield = obj;
						tempObj.field = "all";
						tempObj.value = obj;
					}
					if (publicSearchConfig["qyfxfx"].screen_query.length) {
						for (var i = 0; i < publicSearchConfig["qyfxfx"].screen_query.length; i++) {
							var item_cfield = publicSearchConfig["qyfxfx"].screen_query[i].cfield;
							if (item_cfield == tempObj.cfield) {
								publicSearchConfig["qyfxfx"].screen_query.splice(i, 1);
								i--;
							}
						}
					}
					publicSearchConfig["qyfxfx"].screen_query.push(tempObj);
					delete tempObj;
				}
			//渲染上屏条件
			this.render_screen_query = function (wrapper) {
				if (publicSearchConfig["qyfxfx"].check_screen_query() == 0) {
					wrapper.find(".screen_query_container").remove();
					return;
				}
				wrapper.find(".screen_query_container").remove();
				var html = '';
				html += '<div class="screen_query_container">';
				html += '<div class="screen_query_list">';
				html += '<ul class="clearfix">';
				if (publicSearchConfig["qyfxfx"].screen_query.gs) {
					html += '<li class="screen_query_item" mark="company">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="公司：' + publicSearchConfig["qyfxfx"].screen_query.company +
						'">公司：' + publicSearchConfig["qyfxfx"].screen_query.gs + '</span>';
					html += '</li>'
				}
				if (publicSearchConfig["qyfxfx"].screen_query.legalPerson) {
					html += '<li class="screen_query_item" mark="legalPerson">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="法人：' + publicSearchConfig["qyfxfx"].screen_query.legalPerson +
						'">法人：' + publicSearchConfig["qyfxfx"].screen_query.fr + '</span>';
					html += '</li>'
				}
				html += '</ul>';
				html += '</div>';
				html += '</div>';
				wrapper.append(html);
				set_custom_scroll_bar(wrapper);
			}
			this.delete_screen_query_item = function (mark) {
				publicSearchConfig["qyfxfx"].screen_query[mark] = "";
			}
			this.check_screen_query = function () {
				/* var count = 0;
				 if (publicSearchConfig["qyfxfx"].screen_query.legalPerson || publicSearchConfig["qyfxfx"].screen_query.company || publicSearchConfig["qyfxfx"].screen_query.coreMember) {
					 count += 1;
				 }
				 return count;*/
			}
			//点击检索分析
			this.click_search_analyze = function (elem) {
					var val = elem.val();
					var count = 0;
					$.each(publicSearchConfig["qyfxfx"].analyze_data, function (index, item) {
						if (item.name == val) {
							count += 1;
							publicSearchConfig["qyfxfx"].screen_query[item.source] = item.name;
						}
					})
					return count;
				},
				this.submit = function (search_container) {
					var type = $('.current_qyfxfx_query_type').find('span').text();
					switch (type) {
						case '全部':
							type = 'all'
							break;
						case '公司名称':
							type = 'company'
							break;
						case '法定代表人':
							type = 'legalPerson'
							break;
						case '核心成员':
							type = 'coreMember'
							break;
					}
					var config = {
						form_data: {
							query: publicSearchConfig["qyfxfx"].result_query.concat(
								publicSearchConfig["qyfxfx"].screen_query),
							filter: [],
							source: type
						},
						url: "/retrieval/result",
						tag_name: "_self",
					};
					utils.form_submit(config);
					/*reset_screen(layout_header.find(".search_area"));*/
				}
			break;
		case 'lsls':
			this.suggest_url = "/lsls/getSuggest";
			this.query = {
				fg: "",
				fy: "",
				ay: "",
				fgId: "",
				dq: [],
				startTime: "",
				type: "",
				searchKey: ""
			};
			this.screen_query = {
				fg: "",
				fy: "",
				ay: "",
				fgId: "",
				dq: [],
				startTime: "",
				type: "",
				searchKey: ""
			};
			this.filter = [];
			this.delete_screen_query_item = function (mark) {
				publicSearchConfig["lsls"].screen_query[mark] = "";
			}
			this.add_screen_query = function (obj) {
				var type = $('.current_lsls_query_type span').text();
				var lslsType;
				switch (type) {
					case '律师':
						lslsType = 'lawyer'
						break;
					case '律所':
						lslsType = 'ls'
						break;
					default:
						break;
				};
				var inputKeys = $('.search_input_wrapper input').val();
				var config = {
					form_data: {
						type: lslsType,
						ay: '',
						dy: '',
						inputKeys: inputKeys,
						pageNo: 1
					},
					url: "/lsls/getLslsList",
					tag_name: "_self"
				};
				utils.form_submit(config);

				// var belong = obj.attr("belong");
				// var value = obj.html();
				// publicSearchConfig["lsls"].screen_query[belong] = value;
				// delete belong;
				// delete value;
			}
			this.render_screen_query = function (wrapper) {
				if (publicSearchConfig["lsls"].check_screen_query() == 0) {
					wrapper.find(".screen_query_container").remove();
					return;
				}
				wrapper.find(".screen_query_container").remove();
				var html = '';
				html += '<div class="screen_query_container">';
				html += '<div class="screen_query_list">';
				html += '<ul class="clearfix">';
				if (publicSearchConfig["cpgd"].screen_query.fg) {
					html += '<li class="screen_query_item" mark="fg">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="法官：' + publicSearchConfig["cpgd"].screen_query.fg +
						'">法官：' + publicSearchConfig["cpgd"].screen_query.fg + '</span>';
					html += '</li>'
				}
				if (publicSearchConfig["cpgd"].screen_query.fy) {
					html += '<li class="screen_query_item" mark="fy">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="法院：' + publicSearchConfig["cpgd"].screen_query.fy +
						'">法院：' + publicSearchConfig["cpgd"].screen_query.fy + '</span>';
					html += '</li>'
				}
				if (publicSearchConfig["cpgd"].screen_query.ay) {
					html += '<li class="screen_query_item" mark="ay">';
					html += '<i class="delete_screen_query_item icon-close"></i>';
					html += '<span title="案由：' + publicSearchConfig["cpgd"].screen_query.fg +
						'">案由：' + publicSearchConfig["cpgd"].screen_query.ay + '</span>';
					html += '</li>'
				}
				html += '</ul>';
				html += '</div>';
				html += '</div>';
				wrapper.append(html);
				$('.screen_query_container').show()
				set_custom_scroll_bar(wrapper);
			}
			this.render_suggest_fn = function (data, wrapper) {
				var type = $('.current_lsls_query_type span').text();
				var lslsType;
				switch (type) {
					case '律师':
						lslsType = 'lawyer'
						break;
					case '律所':
						lslsType = 'ls'
						break;
					default:
						break;
				};
				var html = '';
				if (!data.suggest.length) return;
				html += '<div class="suggest_container">';
				html += '<div class="suggest_list">';
				html += '<div class="suggest_info">';
				html += '<ul>';
				if (lslsType == 'lawyer') {
					$.each(data.suggest, function (index, item) {
						html += '<li class="common_suggest_item suggest_item" data-lawyer="' + item.NAME + '" data-ls="' + item.XZLS + '" title="' + item.NAME + '    |    ' + item.XZLS + '">' + item.NAME + '&nbsp;&nbsp;|&nbsp;&nbsp;' + item.XZLS + '</li>';
					});
				} else {
					$.each(data.suggest, function (index, item) {
						html += '<li class="common_suggest_item suggest_item" data-ls="' + item.XZMC + '" title="' + item.XZMC + '">' + item.XZMC + '</li>';
					});
				}

				html += '</ul>';
				html += '</div>'
				html += '</div>';
				html += '</div>';
				wrapper.append(html);
				$(document).on("click.suggest_hide", function (e) {
					if ($(e.target).closest(".suggest_container").length == 0) {
						wrapper.find(".suggest_container").remove();
						$(document).off(".suggest_hide");
					}
				})
			}
			this.submit = function (data, target) {
				// var config = {
				// 	form_data: {
				// 		isCheck: true,
				// 	},
				// 	url: "/cpgdfx/search",
				// 	tag_name: "_self"
				// }
				// for (var i in publicSearchConfig["cpgd"].screen_query) {
				// 	config.form_data[i] = publicSearchConfig["cpgd"].screen_query[i];
				// }
				// utils.form_submit(config)
				// reset_screen(layout_header.find(".search_area"));
			}
			this.create_new_query = function () {
				for (var key in query) {
					publicSearchConfig["lsls"].query[key] = query[key]
				}
			}
			this.render_query = function (elem, no_condition_elem, callback) {

			}
			this.check_screen_query = function () {
				var count = 0;
				if (publicSearchConfig["lsls"].screen_query.ay || publicSearchConfig[
						"lsls"].screen_query.fy || publicSearchConfig["lsls"].screen_query.fg) {
					count += 1;
				}
				return count;
			}
			break;
	}
}
//渲染用户
function render_user() {
	layout_header.find(".user_container").empty();
	var html = [];
	if (bswz == 1 || bswz == 2) {
		html.push('<div class="law_review_user_container clearfix">' +
			'<a href="https://passport.legalmind.cn//ssologin?originUrl=http%3A%2F%2Fwww.chineselaw.com%2Fwww%2Fpublic%2Fjs%2Fcomponents%2F%27%2520%2B%2520base_path%2520%2B%2520%27%2Fmanage&loginPath=login/index&appId=ajypfx" class="a_btn law_review_user" title="' +
			user_name + '">' + user_name + '的智库</a>' +
			'<a href="javascript:;" class="a_btn sign_out">退出</a> ' +
			'</div>');
	} else {
		if (user_status == "guests") {
			html.push('<div class="userInfo">');
			// html.push('<a class="login_btn a_btn" href="javascript:;">登录</a>');
			// html.push('<a class="reg_btn a_btn" href="' + reg_url + '">注册</a>');
			html.push('</div>');
		} else {
			if (user_status == 3) {
				html.push('<div class="user_photo_container"><img class="photo" src="' +
					user_photo_src + '" alt="">');
				html.push('<div class="user_photo_shade">');
				html.push('<img src="' + base_path +
					'/www/public/img/user_photo_shade.png" alt="">');
				html.push('</div></div>');
			}
			html.push('<div class="user_info">');
			html.push('<a class="user_name a_btn drop_btn" href="javascript:;"><ul class = "list">');
			html.push('<li  class = "name" title="' + user_name + '" >' + user_name + '</li>')
			$.each(userLevel, function (index, item) {
				if (index == category) {
					html.push('<li class = "userLevel  ' + (category ? 'yx' : 'sx') + ' "><span>' + item.value + '</span></li>')
					return false;
				}
			})
			html.push('</ul><i class="icon-drop-down"></i></a>');
			html.push('<ul class="user_operation drop_menu">');
			if (user_status == 3) {
				html.push('<li><a class="order" target="_blank" href="' + orderUrl + '">我的订单</a></li>')
				html.push('<li><a class="setting" target="_blank" href="' + user_manage_url +
					'">我的设置</a></li>');
			}
			html.push('<li><a href="https://passport.legalmind.cn//ssologin?originUrl=http%3A%2F%2Fwww.chineselaw.com%2Fwww%2Fpublic%2Fjs%2Fcomponents%2F%27%2520%2B%2520base_path%2520%2B%2520%27%2Fmanage&loginPath=login/index&appId=ajypfx">我的智库</a></li>');
			html.push(
				'<li class="last"><a class="sign_out" href="javascript:;">退出</a></li>');
			html.push('</ul>');
			html.push('</div>');
		}
	}
	layout_header.find(".user_container").html(html.join(''));
}
//渲染未登陆的用户

function render_login_out() {
	layout_header.find(".user_container").empty();
	var html = '';
	html += '<div class="userInfo">'
	html += '<a class="login_btn a_btn" href="javascript:;">登录</a>'
	html += '<a class="reg_btn a_btn" href="' + reg_url + '">注册</a>'
	html += '</div>'
	layout_header.find(".user_container").append(html);

}


//渲染案件类型
function render_case_type(elem) {
	var html = '';
	var cur_case_type_name = "";
	if (case_type_list) {
		html += '<ul class="case_types_list drop_menu">';
		$.each(case_type_list, function (index, item) {
			var last = index == case_type_list.length - 1 ? "last" : "";
			if (!INIT_List && INIT_PROJECT == 'alyp') { //案例研判详情页
				if (nAjlx == item.nDm) {
					cur_case_type_name = item.cMc;
				} else if (nAjlx == null && cur_case_type == item.nDm) {
					cur_case_type_name = item.cMc;
				}
			} else {
				if (cur_case_type == item.nDm) {
					cur_case_type_name = item.cMc;
				}
			}

			html += '<li class="' + last + '"><a href="javascript:;" case_type="' +
				item.nDm + '" class="case_types_item">' + item.cMc + '</span></a></li>';
		});
		html += '</ul>';
		var cur_case_type_str =
			'<a href="javascript:;" class="current_case_types drop_btn"><span>' +
			cur_case_type_name + '</span><i class="icon-drop-down"></i></a>';
		elem.html(cur_case_type_str + html);
	}
	init_qyfxfx_query_type()

}
//渲染头部项目list
function render_header_project_list() {
	var html = '';
	html += '<div class="header_project_list">';
	html += '<div class="container clearfix">';
	html += '<h1 class="header_title">法律应用</h1>';
	html += '<div class="search_project_list">';
	html += '<ul class="clearfix">';
	html +=
		'<li class="search_project" project_code="alyp"><i class="icon-project-bg"></i><span>案例研判</span></li>';
	// html +=
	// 	'<li class="search_project" project_code="flfg"><i class="icon-project-bg"></i><span>法律法规</span></li>';
	// if (showFgfx) {
	// 	html +=
	// 		'<li class="search_project" project_code="cpgd"><i class="icon-project-bg"></i><span>裁判观点</span></li>';
	// };
	// if (showLsls) {
	// 	html += '<li class="search_project" project_code="lsls"><i class="icon-project-bg"></i><span>律师律所</span></li>';
	// };
	// if (showRetrieval) {
	// 	html +=
	// 		'<li class="search_project" project_code="qyfxfx"><i class="icon-project-bg"></i><span>企业调查</span></li>';
	// };
	html += '</ul>';
	html += '</div>';
	html += '<div class = "product_activities_list" >'
	if (bswz === '3') { //法检版没有这部分
		html += '<ul>'
		//html += '<li class = "product_activities  pricing_item" >产品定价'
		html += '</li>'
		html += '</ul>'
	}
	html += '</div>'
	html += '</div>'

	html += '</div>';
	html += '</div>';
	return html;
}
//渲染头部搜索区域
function render_header_search() {
	var html = '';
	html += '<div class="clearfix container">';
	html += '<div class="operation_area">';
	html += '<a href="' + base_path + '" class="header_logo">';
	//html += '<img src="' + base_path + '/lawapp/stylesheets/index/img/logo.png" alt="法律应用">';
	html += '<img src="/lawapp/stylesheets/index/img/logo.png" alt="法律应用">';
	html += '</a>';
	html += '<div class="header_nav">';
	// html += '<div class = "business_activity">'
	// html += '<ul>'
	// html += '<li class = "activity_item">产品活动'
	// html += '</li>'
	// html += '</ul>'
	// html += '</div>'
	html += '<div class="user_container">';
	html += '</div>';
	html += '</div>';
	html += '<div class="search_container">';
	//html += '<a href="javascript:;" class="combination_search_btn">增加组合条件</a>';
	html += '<div class="search_inner">';
	html += '<div class="search_btn_wrapper">';
	html += '<input type="button" value="搜索" class="search_btn">';
	html += '<input type="button" value="重搜" class="again_search_btn">';
	html += '</div>';
	html += '<div class="search_area">';
	html += '<div class="case_types_container">';
	html += '</div>';
	html += '<div class="search_type_container">';
	html += '<a href="javascript:;" class="current_flfg_query_type drop_btn">';
	if (INIT_PROJECT == "flfg") {
		if (typeof queryType != undefined) {
			html += '<span>' + queryType + '</span>';
		} else {
			html += '<span>标题</span>';
		}
	} else {
		html += '<span>标题</span>';
	}
	html += '	<i class="icon-drop-down"></i></a>';
	html += '	<ul class="drop_menu">';
	html += '		<li><a class="flfg_query_type" href="javascript:;">标题</a></li>';
	html += '		<li class="last"><a class="flfg_query_type" href="javascript:;">全文</a></li>';
	html += '	</ul>';
	html += '</div>';
	// 企业风险分析
	html += '<div class="company_type_container" >';
	html += '	<a href="javascript:void(0)" class="current_qyfxfx_query_type drop_btn"><span>全部</span><i class="icon-drop-down"></i></a>';
	html += '	<ul class="search_type_list drop_menu">';
	html += '		<li><a class="company_query_type" href="javascript:void(0)">全部</a></li>';
	html += '		<li><a class="company_query_type" href="javascript:void(0)">公司名称</a></li>';
	html += '		<li><a class="company_query_type" href="javascript:void(0)">核心成员</a></li>';
	html += '		<li class="last company_query_type"><a class="company_query_type" href="javascript:void(0)">法定代表人</a></li>';
	html += '	</ul>';
	html += '</div>';
	// 律师律所
	html += '<div class="lsls_type_container" >';
	html += '	<a href="javascript:void(0)" class="current_lsls_query_type drop_btn"><span>律师</span><i class="icon-drop-down"></i></a>';
	html += '	<ul class="search_type_list drop_menu">';
	html += '		<li><a class="lsls_query_type" href="javascript:void(0)">律所</a></li>';
	html += '		<li class="last lsls_query_type"><a class="lsls_query_type last" href="javascript:void(0)">律师</a></li>';
	html += '	</ul>';
	html += '</div>';
	html += '<div class="search_input_wrapper">';
	html += '<input type="text" class="search_input" placeholder="">';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	return html;
}

function reset_screen(elem) {
	for (var key in publicSearchConfig) {
		if (key == "cpgd") {
			publicSearchConfig[key].screen_query = {
				fg: "",
				fy: "",
				ay: "",
				fgId: "",
				dq: [],
				startTime: ""
			};
		} else if (key == 'qyfxfx') {
			publicSearchConfig[key].screen_query = [];
		} else {
			publicSearchConfig[key].screen_query = [];
		}
		if (publicSearchConfig[key].render_screen_query) {
			publicSearchConfig[key].render_screen_query(elem);
		}
	}
}

function empty_config() {
	for (var key in publicSearchConfig) {
		if (key == "alyp") {
			publicSearchConfig[key].query = [];
			publicSearchConfig[key].filter = [];
			publicSearchConfig[key].advs = [];
		} else if (key == "flfg") {
			publicSearchConfig[key].query = [];
			publicSearchConfig[key].filter = [];
		} else if (key == 'qyfxfx') {
			publicSearchConfig[key].query = [];
			publicSearchConfig[key].filter = [];
		}
	}
}

function set_custom_scroll_bar(wrapper) {
	if (parseInt(wrapper.find(".screen_query_container ul").height()) > parseInt(
			wrapper.find(".screen_query_container .screen_query_list").height())) {
		wrapper.find(".screen_query_container .screen_query_list").css("height", 84).xb_scroll({
			"childPanel": "ul"
		});
	}
}

function pricing() { //产品定价
	window.open(base_path + '/pricing');
}