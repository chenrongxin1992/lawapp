var utils = {
	//url:url
	get_req: function (url) {
		return $.ajax({
			url: base_path + url,
			type: "GET"
		})
	},
	//url:url
	//params:{key:value}
	//opt:{key:value}其他增加项
	post_req: function (url, params, opt) {
		var config = {
			url: base_path + url,
			type: "POST",
			data: params
		};
		if (opt) {
			for (var i in opt) {
				config[i] = opt[i];
			}
		}
		return $.ajax(config);
	},
	//url:url
	delete_req: function (url) {
		return $.ajax({
			url: base_path + url,
			type: "delete",
		})
	},
	form_submit: function (config) {      //form表单模拟ajax发请求   只需要传一个对象进去
		/*
		 * url:url
		 * tag_name:tag_name--_self  _blank
		 * form_data:{key:value}
		 * */
		var submitForm = document.createElement("FORM");
		document.body.appendChild(submitForm);
		submitForm.method = "POST";
		submitForm.className = "myForm"
		submitForm.action = base_path + config.url;
		if (config.tag_name && config.tag_name != "") {
			submitForm.target = config.tag_name;
		}
		var newElement;
		if (config.form_data) {
			for (var key in config.form_data) {
				var val = config.form_data[key];
				if (typeof config.form_data[key] !== "string") {
					val = JSON.stringify(config.form_data[key]);
				}
				newElement = document.createElement("input");
				newElement.setAttribute("name", key);
				newElement.setAttribute("type", "hidden");
				if (val) {
					newElement.setAttribute("value", val);
				}
				submitForm.appendChild(newElement);
			}
		}
		console.log('utils submitForm,',submitForm)
		//return false
		submitForm.submit();
		submitForm.parentNode.removeChild(submitForm);

	},
	//未获取到数据
	no_result: function (config) {      //没有数据的样式，传一个对象过去
		/*
		 * config:{
		 * class_name:-no_result 无结果 -no_contrast_case无对比案例 -no_condition无搜索条件 -no_report_case检索报告无案例
		 * img_name: no_result 无结果 -no_contrast_case无对比案例 -no_condition无搜索条件 -no_report_case检索报告无案例
		 * text:""  提示文本
		 * parent_elem:element
		 * }
		 *
		 */
		var html = [];
		html.push('<div class="no_result ' + (config.class_name ? config.class_name :
			"") + '">');
		html.push('<p><span>' + (config.ytj_text ? config.ytj_text : '') +
			'</span></p>');
		// html.push('<img src="' + base_path + '/www/public/img/' + config.img_name +
		// 	'.png" alt="">');
		html.push('<img src="/lawapp/img/' + config.img_name +
			'.png" alt="">');
		html.push('<p>');
		html.push('<span>' + config.text + '</span>');
		if (config.text_more) {
			html.push('<span>' + config.text_more + '</span>');
		}
		html.push('</p>');
		html.push('</div>');
		config.parent_elem.show().html(html.join('')).css("position", "relative");
		if (parseInt(config.parent_elem.height()) < 100) {
			config.parent_elem.addClass("no_result_elem");
		}
	},
	loading: function () {    //loading    用的时候用run方法    取消的时候直接掉       
		/*
		 * target_elem:element 放在哪一个容器
		 * new utils.loading(element)放入
		 * new utils.loading()移除
		 * */
		this.run = function (target_elem) {
			if (arguments.length) {
				//var html = '<div class="loading_gif_container"><img src="' + base_path +'/www/public/img/loading.gif"/*tpa=http://www.chineselaw.com/www/public/js/utils/' + base_path +'/www/public/img/loading.gif*//></div>';
				var html = '<div class="loading_gif_container"><img src="/lawapp/img/loading.gif"/></div>';
				target_elem.append(html).css("position", "relative");
				if (!parseInt(target_elem.height()) || parseInt(target_elem.height()) <
					300) {
					target_elem.addClass("loading_container");
				}
			} else {
				if ($(".loading_gif_container").length) {
					$(".loading_gif_container").eq(0).parent().removeClass(
						"loading_container");
					$(".loading_gif_container").eq(0).remove();
				}

			}
		}
	},
	load_more: function () {
		//同上
		this.run = function (target_elem) {
			if (arguments.length) {
				var html = '<div class="load_more_gif_container"><img src="' + base_path +'/www/public/img/load_more.gif"/*tpa=http://www.chineselaw.com/www/public/js/utils/' + base_path +'/www/public/img/load_more.gif*//></div>';
				target_elem.append(html).addClass("loading_more_container");
			} else {
				if ($(".load_more_gif_container").length) {
					$(".load_more_gif_container").eq(0).parent().removeClass(
						"loading_more_container");
					$(".load_more_gif_container").eq(0).remove();
				}

			}
		}
	},
	machine_loading: function () {
		this.run = function (target_elem) {
			if (arguments.length) {
				var html = '<div class="ytj_load_gif_container"><p>努力加载中</p><img src="' +base_path + '/www/public/img/ytj_loading.gif"/*tpa=http://www.chineselaw.com/www/public/js/utils/' +base_path + '/www/public/img/ytj_loading.gif*//></div>';
				target_elem.append(html).addClass("loading_more_container");
			} else {
				if ($(".ytj_load_gif_container").length) {
					/*$(".ytj_load_gif_container").eq(0).parent().removeClass("ytj_load_gif_container");*/
					$(".ytj_load_gif_container").eq(0).remove();
					$('.loading_more_container').removeClass('loading_more_container')
				}

			}
		}
	},
	change_json: function (json) { //字符串转数组
		if (typeof json == "string") {
			return JSON.parse(json);
		}

		return json;
	},
	//去除空格
	delete_space: function (str) {
		var resultStr = str.replace(/\ +/g, ""); //去掉空格
		resultStr = resultStr.replace(/[ ]/g, ""); //去掉空格
		resultStr = resultStr.replace(/[\r\n]/g, ""); //去掉回车换行
		return resultStr;
	},
	placeholder: function (arr) {       //ie8 placeholder兼容性问题
		//arr 数组
		if (!is_placeholder_support()) {
			$.each(arr, function (index, item) {
				var placeholder_value = $(this).attr("placeholder");
				var value = $(this).val();
				if (value) {
					if (value == placeholder_value) {
						$(this).addClass("placeholder");
						$(this).val(placeholder_value);
					} else {
						$(this).removeClass("placeholder");
					}
				} else {
					$(this).addClass("placeholder");
					$(this).val(placeholder_value);
				}
				$(this).get(0).onfocus = function () {
					if ($(this).val() == $(this).attr("placeholder")) {
						$(this).val('');
						$(this).removeClass("placeholder");
					}
				}
				$(this).get(0).onblur = function () {
					if ($(this).val() == $(this).attr("placeholder")) return;
					if ($(this).val() == '') {
						$(this).val($(this).attr("placeholder"));
						$(this).addClass("placeholder");
						return;
					}
					$(this).removeClass("placeholder");
				}
			})
		}

		function is_placeholder_support() {
			return 'placeholder' in document.createElement('input');
		}
	},
	//操作结果提示弹出框
	operation_hints: function (config) {       //提示框 传一个对象
		/*
		 * config:{
		 * status:-success -warn -fail
		 * text:""
		 * }
		 * */
		var elem = "",
			backDrop = "";
		var statusInfo = {
			success: {
				img: base_path + '/www/public/img/success.png',
				txt: config.text
			},
			fail: {
				img: base_path + '/www/public/img/fail.png',
				txt: config.text
			},
			warn: {
				img: base_path + '/www/public/img/warn.png',
				txt: config.text
			}
		};
		var ytj_status = {
			success: {
				img: base_path + '/www/public/img/ytj_success.png',
				txt: config.text
			},
			fail: {
				img: base_path + '/www/public/img/ytj_fail.png',
				txt: config.text
			},
			warn: {
				img: base_path + '/www/public/img/ytj_warn.png',
				txt: config.text
			}
		}
		backDrop = $('<div class="dialog_mask"></div>');
		elem = !config.source ? $('<div class="result_hint_dialog"><img src="' +
			statusInfo[config.status].img + '"/><span>' + config.text +
			'</span></div>') : $(
			'<div class = "one_machine_hint_dialog"><img src = "' + ytj_status[config
				.status].img + '"><span>' + config.text + '</span></div>')
		backDrop.appendTo("body");
		elem.appendTo("body");
		elem.animate({
			'top': 200
		}, 400, function () {
			setTimeout(function () {
				elem.animate({
					'top': 60
				}, 400, function () {
					backDrop.remove();
					elem.remove();
				})
			}, 2000)
		})

	},
	confirm_hints: function (config) {         //确认取消的提示窗    

		/*
		 * config:{
		 * hint_info:"",
		 * callback:function
		 * }
		 * */
		var html = '';
		if (config) {
			html += '<div class="confirm_hint_drop">';
			html += '<div class="confirm_hint">';
			html += '<p class="hint_info">' + config.hint_info + '</p>';
			html += '<div class="actions">';
			html += '<a href="javascript:;" class="confirm">确认</a>';
			html += '<a href="javascript:;" class="cancle">取消</a>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
		}

		function show() {
			$("body").addClass("dialog_open_class");
			$(html).off().appendTo("body").on("click", ".confirm", confirm).on("click",
				".cancle", remove);
		}

		function remove() {
			$(".confirm_hint_drop").eq(0).remove();
			if (!$(".dialog").length) {
				$("body").removeClass("dialog_open_class");
			}

		}

		function confirm() {
			config.callback();
			remove();
		}
		return {
			show: show,
			remove: remove
		}
	}

}