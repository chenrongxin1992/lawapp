var DIALOG_CLOSE = "";
//dialog
function dialog(config) {
  var isSupportedBrowser = (function () {
    // Firefox doesn't have `ontransitionend` on window. Hence we check for
    // `transition`
    // key in style object to check for unprefixed transition support.
    return window.ontransitionend !== undefined || document.documentElement
      .style.transition !== undefined;
  })();
  // Credits to angular-animate for the nice animation duration detection
  // code.
  // Detect proper transitionend/animationend event names.
  var TRANSITION_PROP, ANIMATION_PROP;
  var DURATION_KEY = 'Duration';
  var PROPERTY_KEY = 'Property';
  var DELAY_KEY = 'Delay';
  var ONE_SECOND = 1000;

  if (window.ontransitionend === undefined && window.onwebkittransitionend !==
    undefined) {
    TRANSITION_PROP = 'WebkitTransition';
  } else {
    TRANSITION_PROP = 'transition';
  }

  if (window.onanimationend === undefined && window.onwebkitanimationend !==
    undefined) {
    ANIMATION_PROP = 'WebkitAnimation';
  } else {
    ANIMATION_PROP = 'animation';
  }

  function parseMaxTime(str) {
    var maxValue = 0,
      value;
    var values = typeof (str) === 'string' ? str.split(/\s*,\s*/) : [];
    for (var i = values.length; i--;) {
      value = values[i];
      maxValue = Math.max(parseFloat(value) || 0, maxValue);
    }
    return maxValue;
  }

  function getAnimationTime(element) {
    var transitionDuration = 0;
    var transitionDelay = 0;
    var animationDuration = 0;
    var animationDelay = 0;
    var elementStyles = window.getComputedStyle(element) || {};

    var transitionDurationStyle = elementStyles[TRANSITION_PROP + DURATION_KEY];
    transitionDuration = Math.max(parseMaxTime(transitionDurationStyle),
      transitionDuration);

    var transitionDelayStyle = elementStyles[TRANSITION_PROP + DELAY_KEY];
    transitionDelay = Math.max(parseMaxTime(transitionDelayStyle),
      transitionDelay);

    var animationDelayStyle = elementStyles[ANIMATION_PROP + DELAY_KEY];
    animationDelay = Math.max(parseMaxTime(elementStyles[ANIMATION_PROP +
      DELAY_KEY]), animationDelay);

    var aDuration = parseMaxTime(elementStyles[ANIMATION_PROP + DURATION_KEY]);

    if (aDuration > 0) {
      aDuration *= parseInt(elementStyles[ANIMATION_PROP +
        ANIMATION_ITERATION_COUNT_KEY], 10) || 1;
    }
    animationDuration = Math.max(aDuration, animationDuration);

    return animationDuration || transitionDuration;
  }

  function getBackgroundStyle(element) {
    var computedStyle = window.getComputedStyle(element);
    // Need to fallback to `backgroundColor` as `background` return nothing
    // in Firefox.
    return computedStyle.background || computedStyle.backgroundColor;
  }

  var defaults = {
    duration: 0.7, // Duration for the animation to happen (seconds)

    // Duration in which the target will become visible, (seconds)
    targetShowDuration: 0,

    // Extra time just to ensure continuity between dummy element and target
    // (seconds)
    extraTransitionDuration: 1,

    // Whether to position the dummy animating element relative to window
    // (fixed positioned) or not.
    relativeToWindow: false
  };

  function cta(trigger, target, options, callback) {
    // Support optional arguments
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (!isSupportedBrowser) {
      if (callback) {
        callback(target);
      }
      return;
    }

    var targetBackground, triggerBackground, targetBounds, triggerBounds, dummy;
    options = options || {};
    options.duration = options.duration || defaults.duration;
    options.targetShowDuration = options.targetShowDuration || getAnimationTime(
      target) || defaults.targetShowDuration;
    options.relativeToWindow = options.relativeToWindow || defaults.relativeToWindow;
    options.extraTransitionDuration = options.extraTransitionDuration ||
      defaults.extraTransitionDuration;

    // Set some properties to make the target visible so we can get its
    // dimensions.
    // Set `display` to `block` only when its already hidden. Otherwise
    // changing an already visible
    // element's `display` property can lead to its position getting
    // changed.
    if (window.getComputedStyle(target).display === 'none') {
      target.style.setProperty('display', 'block', 'important');
    }

    // Calculate some property differences to animate.
    targetBackground = getBackgroundStyle(target);
    triggerBackground = getBackgroundStyle(trigger);
    //triggerBackground = "black";

    targetBounds = target.getBoundingClientRect();
    triggerBounds = trigger.getBoundingClientRect();
    var scaleXRatio = triggerBounds.width / targetBounds.width;
    var scaleYRatio = triggerBounds.height / targetBounds.height;
    var diffX = triggerBounds.left - targetBounds.left;
    var diffY = triggerBounds.top - targetBounds.top;

    // Remove the props we put earlier.
    target.style.removeProperty('display');

    // Create a dummy element for transition.
    dummy = document.createElement('div');
    dummy.style.setProperty('pointer-events', 'none', 'important');
    dummy.style.setProperty('position', (options.relativeToWindow ? 'fixed' :
      'absolute'), 'important');
    dummy.style.setProperty('-webkit-transform-origin', 'top left',
      'important');
    dummy.style.setProperty('transform-origin', 'top left', 'important');
    dummy.style.setProperty('transition', options.duration + 's ease');

    // Set dummy element's dimensions to final state.
    dummy.style
      .setProperty('width', targetBounds.width + 'px', 'important');
    dummy.style.setProperty('height', targetBounds.height + 'px',
      'important');
    dummy.style.setProperty('left', (targetBounds.left + (options.relativeToWindow ?
      0 : window.pageXOffset)) + 'px', 'important');
    dummy.style.setProperty('top', (targetBounds.top + (options.relativeToWindow ?
      0 : window.pageYOffset)) + 'px', 'important');
    dummy.style.setProperty('background', triggerBackground, 'important');

    // Apply a reverse transform to bring back dummy element to the
    // dimensions of the trigger/starting element.
    // Credits: This technique is inspired by Paul Lewis:
    // http://aerotwist.com/blog/flip-your-animations/ He is amazing!
    dummy.style.setProperty('-webkit-transform', 'translate(' + diffX + 'px, ' +
      diffY + 'px) scale(' + scaleXRatio + ', ' + scaleYRatio + ')',
      'important');
    dummy.style.setProperty('transform',
      'translate(' + diffX + 'px, ' + diffY + 'px) scale(' + scaleXRatio +
      ', ' + scaleYRatio + ')', 'important');
    document.body.appendChild(dummy);

    // Trigger a layout to let styles apply.
    var justReadIt = dummy.offsetTop;

    // Change properties to let things animate.
    dummy.style.setProperty('background', targetBackground, 'important');

    // Remove the reverse transforms to get the dummy transition back to its
    // normal/final state.
    dummy.style.removeProperty('-webkit-transform');
    dummy.style.removeProperty('transform');

    dummy
      .addEventListener(
        'transitionend',
        function transitionEndCallback() {
          dummy.removeEventListener('transitionend',
            transitionEndCallback);

          if (callback) {
            callback(target);
          }
          // Animate the dummy element to zero opacity while
          // the target is
          // getting rendered.
          dummy.style.transitionDuration = (options.targetShowDuration +
            options.extraTransitionDuration) + 's';
          dummy.style.opacity = 0;
          setTimeout(
            function () {
              dummy.parentNode.removeChild(dummy);
            }, (options.targetShowDuration + options.extraTransitionDuration) *
            1000);
        });

    // Return a reverse animation function for the called animation.
    return function (options, callback) {
      cta(target, trigger, options, callback);
    };
  }


  var elem = "";
  var store = {};
  var loading = new utils.loading();
  var show_flag = "";
  var render_fn = {
    render_combination_search_data: function (data, level) {
      var html = '';
      html += '<div class="option ' + level + '">';
      html += '<label class="option_label">' + data[0].title + '</label>';
      html += '<div class="option_content ' + level + '_level_content">';
      html += '<ul class="clearfix">';
      $.each(data, function (index, item) {
        html += '<li class="level_option_item ' + level + ' radio_select" field="' + item.field +
          '" value="' + item.value + '" index="' + index + '">' + item.name + '</li>';
      })
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      return html;
    },
    render_report_al_case: function (data) { //渲染检索报告的案例
      var html = '';
      $.each(data, function (index, item) {
        html += '<div class="report_case_item al" js_id="' + item.qwalItem.id + '">';
        if (item.qwalItem.alzl) {
          html += '<h4 class="mark">' + item.qwalItem.alzl + '</h4>';
        }
        html += '<p class="case_name" title="' + item.qwalItem.almc + '">' + item.qwalItem.almc + '</p>';
        html += '<a href="javascript:;" js_id="' + item.qwalItem.id + '" class="delete_report_case_btn al" index="' +
          index + '"><i class="icon-delete"></i></a>'
        html += '</div>';
      })
      return html;
    },
    render_report_aj_case: function (data) {
      var html = '';
      $.each(data, function (index, item) {
        html += '<div class="report_case_item aj" js_id="' + item.ptalItem.id + '">';
        html += '<p class="case_name" title="' + item.ptalItem.almc + '">' + item.ptalItem.almc + '</p>';
        html += '<a href="javascript:;" js_id="' + item.ptalItem.id + '" class="delete_report_case_btn aj" index="' +
          index + '"><i class="icon-delete"></i></a>'
        html += '<ul>';
        $.each(item.ptalItem.ws, function (index, item) {
          html += '<li class="document_item" title="' + item.wsah + '" ws_id="' + item.wsid + '">' + item.wsah + '</li>';
        })
        html += '</ul>';
        html += '</div>';
      })
      return html;
    },
    render_report_stored_al_case: function (data) {
      var html = '';
      $.each(data, function (index, item) {
        html += '<div class="report_stored_case_item al" store_id="' + item.qwalItem.id + '">';
        html += '<span class="stored_mark">已收藏</span>';
        if (item.qwalItem.alzl) {
          html += '<h4 class="mark">' + item.qwalItem.alzl + '</h4>';
        }
        html += '<p class="case_name" title="' + item.qwalItem.almc + '">' + item.qwalItem.almc + '</p>';
        html += '<a href="javascript:;" type="stored_case" class="delete_report_case_btn al" index="' +
          index + '"><i class="icon-delete"></i></a>'
        html += '</div>';
      })
      return html;
    },
    render_report_stored_aj_case: function (data) {
      var html = '';
      $.each(data, function (index, item) {
        html += '<div class="report_stored_case_item aj" store_id="' + item.ptalItem.id + '">';
        html += '<span class="stored_mark">已收藏</span>';
        html += '<p class="case_name" title="' + item.ptalItem.almc + '">' + item.ptalItem.almc + '</p>';
        html += '<a href="javascript:;" type="stored_case" class="delete_report_case_btn aj" index="' +
          index + '"><i class="icon-delete"></i></a>'
        html += '<ul>';
        $.each(item.ptalItem.ws, function (index, item) {
          html += '<li class="document_item" title="' + item.wsah + '" ws_id="' + item.wsid + '">' + item.wsah + '</li>';
        })
        html += '</ul>';
        html += '</div>';
      })
      return html;
    },
    render_exist_theme: function (data) {
      var html = '';
      $.each(data, function (index, item) {
        if (item.C_AJXMMC != null && item.C_AJXMMC != '' && item.C_AJXMMC != undefined) {
          html += '<li class="theme_item" source="' + (item.ly ? item.ly : "") + '" theme_id="' +
            (item.C_AJXM ? item.C_AJXM : "") + '" title="' + item.C_AJXMMC + '">';
          var source_class = "";
          if (item.ly == 1) {
            source_class = "icon-source-lspt";
          } else if (item.ly == 2) {
            source_class = "icon-source-sjzx";
          }
          html += '<i class="' + source_class + '"></i>';
          html += '<span>' + item.C_AJXMMC + '</span>';
          html += '</li>';
        }
      })
      return html;
    },
    render_other_theme: function (data) {
      var html = '';
      var source_class = "";
      if (data.ly == 1) {
        source_class = "icon-source-lspt";
      } else if (data.ly == 2) {
        source_class = "icon-source-sjzx";
      }
      if (data.result.length) {
        $.each(data.result, function (index, item) {
          html += '<li class="theme_item" source="' + (data.ly ? data.ly : "") + '" theme_id="' +
            (item.caseId ? item.caseId : "") + '" title="' + item.caseName + '">';
          html += '<i class="' + source_class + '"></i>';
          html += '<span>' + item.caseName + '</span>';
          html += '</li>';
        })
      }
      return html;
    },
    render_store_case_slider: function () {
      var html = '';
      html += '<div class="slider_item">';
      html += '<div class="dialog_body">';
      html += '<div class="stored_case_container">';
      html += '<h4 class="title">添加已收藏案例</h4>';
      html += '<div class="filter_theme">';
      html += '<span class="label">从主题中筛选</span>';
      html += '<a href="javascript:;" class="filter_theme_btn"><span title="全部">全部</span><i class="icon-drop-down"></i></a>';
      html += '<div class="drop_menu filter_theme_menu">'
      html += '<ul>';
      html += '</ul>';
      html += '</div>'
      html += '</div>';
      html += '<div class="stored_case_list">';
      html += '</div>'
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer two_btn">';
      html += '<a class="confirm_add_stored_case confirm_btn" href="javascript:;">确认</a>';
      html += '<a class="cancle_add_stored_case" href="javascript:;">取消</a>';
      html += '</div>';
      html += '</div>';
      return html;
    },
    render_stored_case_item: function (data) {
      var html = '';
      $.each(data.qwal, function (index, item) {
        html += '<div class="stored_case_item al" index="' + index + '" store_id="' + item.qwalItem.id +
          '" title="' + item.qwalItem.almc + '">';
        html += '<span class="bg"></span>';
        if (item.qwalItem.alzl) {
          html += '<span class="mark">' + item.qwalItem.alzl + '</span>';
        }
        html += '<span class="case_name">' + item.qwalItem.almc + '</span>';
        html += '</div>';
      })
      $.each(data.ptal, function (index, item) {
        html += '<div class="stored_case_item aj" index="' + index + '" store_id="' + item.ptalItem.id +
          '" title="' + item.ptalItem.almc + '">';
        html += '<span class="bg"></span>';
        html += '<span class="case_name">' + item.ptalItem.almc + '</span>';
        html += '</div>';
      })
      return html;
    },
    render_law_data: function (cur_page) {
      var html = '';
      $.each(store.data[cur_page], function (index, item) {
        var active = item.active ? "active" : "";
        html += '<li class="law_item ' + active + '" page="' + cur_page + '" index="' + index + '">';
        if (typeof item.data_index == "number") {
          html += '<span class="bg" index="' + item.data_index + '"></span>';
        } else {
          html += '<span class="bg"></span>';
        }
        html += '<span class="law_count">（' + item.count + '）</span>';
        html += '<span class="law_name" title="' + item.value + '">' + item.value + '</span>';
        html += '<li>';
      })
      elem.find(".law_list ul").empty().html(html);
      pagination({
        total_num: store.data_count,
        cur_page: cur_page,
        page_size: 10,
        jump: false,
        elem: elem.find(".law_pagination"),
        callback: render_fn.render_law_data
      })
    },
    render_law_detail: function (data) {
      var html = '';
      html += '<div class="slider_item">';
      html += '<div class="dialog_body">';
      html += '<div class="law_detail">';
      html += '<a href="javascript:;" class="back_to_law_list"><i class="icon-linear-arrow-left"></i></a>';
      html += '<h4 class="law_name_title" title="' + data.wzftmc + '">' + data.wzftmc + '</h4>';
      html += '<p class="law_content">' + data.content + '</p>'
      html += '</div>';
      html += '<div class="store_law_area">';
      html += '<h4 class="title">收藏法条</h4>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input required_input" placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      html += '<a href="javascript:;" class="confirm_btn confirm_store_analysis_law abled">收藏法条</a>';
      html += '</div>';
      html += '</div>';
      return html;
    },
    render_report_theme: function (data) {
      var html = '';
      $.each(data, function (index, item) {
        if (item.C_AJXM || item.C_AJXMMC) {
          html += '<div class="report_theme_item" source="' + (item.ly ? item.ly : "") +
            '" theme_id="' + (item.C_AJXM ? item.C_AJXM : "") + '" title="' + item.C_AJXMMC + '">';
          var source_class = "";
          if (item.ly == 1) {
            source_class = "icon-source-lspt";
          } else if (item.ly == 2) {
            source_class = "icon-source-sjzx";
          }
          html += '<i class="' + source_class + '"></i>';
          html += '<span>' + item.C_AJXMMC + '</span>';
          html += '</div>';
        }
      });
      return html;
    },
    render_create_new_report_slider: function () {
      var html = '';
      html += '<div class="slider_item">';
      html += '<div class="dialog_body clearfix">';
      html += '<div class="create_new_report_case_list">';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer two_btn">';  // confirm_create_new_report
      html += '<a href="javascript:;" class="confirm_btn  confirm_free_trial  disabled">一键生成检索报告</a>';
      html += '<a href="javascript:;" class="back_to_report_theme">返回</a>';
      html += '</div>';
      html += '</div>';
      return html;
    },
    render_create_new_report_case: function (data) {
      var html = '';
      if (data.qwal.length) {
        html += '<h3>选择权威案例</h3>';
        $.each(data.qwal, function (index, item) {
          html += '<div class="create_new_report_case_item al active" case_id="' + item.qwalItem.id + '">';
          html += '<span class="bg"></span><span class="case_name">' + item.qwalItem.almc + '</span>';
          html += '</div>';
        })
      }
      if (data.ptal.length) {
        html += '<h3>选择普通案例</h3>';
        $.each(data.ptal, function (index, item) {
          html += '<div class="create_new_report_case_item aj active" case_id="' + item.ptalItem.id + '">';
          html += '<span class="bg"></span><span class="case_name">' + item.ptalItem.almc + '</span>';
          html += '</div>';
        })
      }
      if (data.ft.length) {
        html += '<h3>选择法条</h3>';
        $.each(data.ft, function (index, item) {
          html += '<div class="create_new_report_case_item ft active" ft_id="' + item.ftItem.id + '">';
          html += '<span class="bg"></span><span class="case_name">' + item.ftItem.flfg + '</span>';
          html += '</div>';
        })
      }
      return html;

    },
    render_trial_video_case: function (data) {
      var html = '';
      $.each(data, function (index, item) {
        html += '<li class="trial_video_item">';
        html += '<a class="trial_video_name" title="' + utils.delete_space(item.AH) + '" target="_blank" href="' +
          item.TSLXDZ + '">' + utils.delete_space(item.AH) + '</a>';;
        html += '</li>';
      })
      return html;
    },
    render_pay_feedback: function (data) {
      var html = '';
      html += '<div class = "free_trial_item">'
      html += '<div class = "dialog_header zk " >'
      html += '<h2 class="dialog_title">支付反馈</h2>'
      html += '</div>'
      html += '<div class = "dialog_body">'
      html += '<div class = "new_hint">请在新打开的窗口中完成支付</div>'
      html += '<div class = "pay">'
      html += '<span class = "variety" >' + data.unit_price + ' / ' + data.unit + '</span>'
      html += '<span class = "time">' + data.expire_time + '</span>'
      html += '<span class = "type_payment">' + data.pattern_payment + '</span>'
      html += '<span class = "price">¥' + data.price + '</span>'
      html += '</div>'
      html += '</div>'
      html += '<div class = "dialog_trial_footer">'
      html += '<input type = "button" value = "支付成功" class = "pay_succeed">'
      html += '<span class = "payment_failure ">支付失败</span>'
      html += '</div>'
      html += '</div>'
      return html;
    },
    render_change_feedback: function () {
      var html = '';
      html += '<div class = "free_trial_item">'
      html += '<div class = "dialog_header zk" >'
      html += '<h2 class="dialog_title">支付反馈</h2>'
      html += '</div>'
      html += '<div class = "dialog_body">'
      html += '<div class = "new_hint">请在新打开的窗口中完成兑换</div>'
      html += '</div>'
      html += '<div class = "dialog_trial_footer">'
      html += '<input type = "button" value = "兑换成功" class = "pay_succeed">'
      html += '<span class = "payment_failure ">兑换失败</span>'
      html += '</div>'
      html += '</div>'
      return html;
    },
    render_use_tips: function () {
      var html = '';
      html += '<div class = "free_trial_item">'
      html += '<div class = "dialog_header zk">'
      html += '<h2 class = "dialog_title" >付费功能使用提示</h2>'
      html += '</div>'
      html += '<div class = "dialog_body">'
      html += '<div class = "use_tips">确认消耗' + config.title + '使用权限</div>'
      html += '</div>'
      html += '<div class = "dialog_trial_footer">'
      html += '<input type = "button" value = "确认消耗" class = " confirm_consumption">'
      html += '<span class = "payment_failure ">稍后在用</span>'
      html += '</div>'
      html += '</div>'
      return html;
    },




  }
  var content = {
    login: function () {
      var html = '';
      html += '<div class="dialog login_dialog"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="sLoginWrap">';
      html += '<h3 class="sLoginTitle"><span>智库登录</span></h3>';
      html += '<div class="sLoginWay">';
      html += '<p class="wxlogin chioseWay clicked">微信登录/注册</p>';
      html += '<p class="zhlogin chioseWay">账号密码登录</p>';
      html += '</div>';
      html += '<div class="wxewmWrap">';
      html += '<div class="codeLogin" id="wxcode" style="text-align:center"></div>';
      html += '</div>';
      html += '<div class="zhloginWrap" style="display:none;">';
      html += '<p class="loginTip"><span class="tipWord"><img src="' + base_path + '/www/login/img/red.png" alt="" class="wram"/><b></b></span></p>';
      html += '<div class="inputWrap">';
      html += '<label for="zhanghao">';
      html += '<span class="inputTip">账号</span>';
      html += '<input type="text" id="zhanghao" class="zh username" maxlength="47"/>';
      html += '</label>';
      html += '</div>';
      html += '<div class="inputWrap">';
      html += '<label for="mima">';
      html += '<span class="inputTip">密码</span>';
      html += '<input type="password" id="mima" class="mm pwd" maxlength="18" autocomplete="off"/>';
      html += '</label>';
      html += '</div>';
      html += '<div class="yanzhengWrap login_test" id="dom_id"></div>';
      html += '<p class="mlogin">';
      html += '<label for="mdlcheckbox" class="mdl" data-value="false">';
      html += '<img src ="' + base_path + '/www/login/img/checked1.png" alt="" class="mdlcheck"/>一周免登录';
      html += '</label>';
      html += '<a href="javascript:void(0)" class="wjmm">忘记密码？</a>';
      html += '</p>';
      html += '<input type="button" value="登录" class="loginBtn"/>';
      html += '<input type="hidden" value="0" id="hidd"/>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    show_all_charge: function (title) {
      var html = '';
      html += '<div class="dialog show_all_charge"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<h3 class="title">选择罪名：</h3>'
      html += '<ul class="charge_list">';
      $.each(config.charge_data, function (index, item) {
        html += '<li class="charge_item" title="' + item.zm + '" _href="' + item.url + '">' + item.zm + '</a>'
      })
      html += '</ul>';
      html += '</div>'
      html += '<div class="dialog_footer one_btn">';
      html += '<a href="javascript:;" class="confirm_btn confirm_select_charge disabled">确定罪名</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    combination_search: function (title) {
      var html = '';
      html += '<div class="dialog combination_search"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="combination_search_content">';
      html += '<div class="option">';
      html += '<label class="option_label">包含内容</label>';
      html += '<div class="option_content include_content_wrapper">';
      html += '<input type="text" class="include_content" placeholder="输入检索内容；如只搜索结案方式，请输入“？”并回车"/>';
      html += '</div>';
      html += '</div>';
      html += '<div class="option last">';
      html += '<div class="option_label"><span>不包含内容</span><span class="caption">（针对全案）</span></div>';
      html += '<div class="option_content not_include_content_wrapper">';
      html += '<input type="text" class="not_include_content" placeholder="请输入检索内容，“按回车”，可同时多重条件组合检索"/>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      html += '<a href="javascript:;" class="confirm_btn confirm_combination_search abled">立即检索</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    // 更新指南
    update_guide: function () {
      var html = '';
      html += '<div class="dialog law_analysis"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '</div>';
      return $(html);
    },
    law_analysis: function (title) {
      var html = '';
      html += '<div class="dialog law_analysis"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="slider_container">';
      html += '<div class="slider_item">';
      html += '<div class="dialog_body">';
      html += '<div class="law_list">';
      html += '<ul></ul>';
      html += '<div class="law_pagination"></div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      html += '<a href="javascript:;" class="confirm_btn confirm_analysis_law disabled">开始检索</a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>'
      return $(html);
    },
    add_case_to_report: function (title, case_name, document_arr) {
      var html = '';
      html += '<div class="dialog add_report"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<p class="cue_word">请选择案例下的文书，添加到检索报告</p>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<h3 class="case_name_title" title=' + case_name + '>' + case_name + '</h3>';
      html += '<ul>';
      $.each(document_arr, function (index, item) {
        if (item.wsid) {
          html += '<li class="document_item active" index="' + index + '"><span class="bg"></span><span>' + item.ah + '</span></li>'
        }
      })
      html += '</ul>'
      html += '</div>';
      html += '<div class="dialog_footer two_btn">';
      html += '<a href="javascript:;" class="confirm_btn confirm_add_report abled">确认</a>';
      html += '<a href="javascript:;" class="cancle_btn">取消</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    create_report: function (title) {
      var html = '';
      html += '<div class="dialog create_report" id = "confirm_free_trial"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="slider_container">';
      html += '<div class="slider_item">';
      html += '<div class="dialog_body">';
      html += '<div class="form_item no_label clearfix">';
      html += '<div class="single_value_container">';
      html += '<div class="single_label_wrapper selected_label_wrapper">';
      html += '<input type="text" class="report_name required_input" placeholder="请输入检索报告名称">';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="report_case_container">';
      html += '<h4 class="title">已选案例</h4>';
      html += '<div class="report_case_list">';
      html += '</div>'
      html += '</div>';
      html += '<a href="javascript:;" class="show_store_case"><span>添加已收藏案例</span><i class="icon-linear-arrow-right"></i></a>'
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      html += '<a href="javascript:;" class="confirm_btn confirm_free_trial disabled">一键生成检索报告</a>';
      html += '</div>';
      html += '</div>';
      html += '</div></div>';
      return $(html);
    },
    create_new_report: function (title) {
      var html = '';
      html += '<div class="dialog create_new_report" id = "confirm_free_trial" ><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="slider_container">';
      html += '<div class="slider_item">';
      html += '<div class="dialog_body clearfix">';
      html += '<div class="theme_filter"><input type="text" class="theme_filter_input" placeholder="输入主题快速搜索"/></div>';
      html += '<h3 class="title"><span>选择主题</span><span class="hint_word">选择下列主题，以便生成检索报告</span></h3>';
      html += '<div class="report_theme_list">';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">'; //confirm_select_theme
      html += '<a href="javascript:;" class="confirm_btn  confirm_select_theme  disabled">确定</a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_query: function (title, query_string) {
      var html = '';
      html += '<div class="dialog"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">搜索条件：</label>';
      html += '<div class="single_value_container">';
      var str_arr = [];
      $.each(query_string.split("|"), function (index, item) {
        str_arr.push($(item).html());
      })
      html += '<div class="no_label_wrapper" title="' + str_arr.join(" | ") + '">' + query_string + '</div>';
      delete str_arr;
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input required_input" source="' +
        (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") +
        '" theme_id="' + (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") +
        '" value="' + (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '" placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">条件名称：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="single_label_wrapper"><input type="text" class="condition_name required_input" value="' +
        (config.condition_name ? config.condition_name : "") + '" placeholder="请输入条件名称"></div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "收藏条件";
      html += '<a href="javascript:;" class="confirm_btn store_query abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    time_line: function (title, Sjx_List) {
      var html = '';
      html += '<div class="dialog time_line"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="time_line_wrapper">';
      html += '<ul>';
      $.each(Sjx_List, function (index, item) {
        var last = index == Sjx_List.length - 1 ? "last" : "";
        html += '<li class="time_item ' + last + '">';
        html += '<h4 class="title">' + item.dl + '</h4>';
        html += '<p class="time">' + item.sj + '</p>';
        html += '<p class="content">' + item.yw + '</p>';
        html += '</li>'
      })
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      html += '<a href="javascript:;" class="confirm_btn confirm_export_time_line abled">导出</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_general_case: function (title, case_name) {
      var html = '';
      html += '<div class="dialog store_general_case"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">案例名称：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="no_label_wrapper" title="' + case_name + '">' + case_name + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">本案文书：</label>';
      html += '<div class="multiple_value_container clearfix">';
      html += '<ul class="document_list">';
      var document_active_count = 0;
      if (config.document_list) {
        $.each(config.document_list, function (index, item) {
          if (item.wsid) {
            document_active_count += 1;
            html += '<li class="document_item active" document_id="' + item.wsid + '" title = ' + item.ah + '>' + item.ah + '</li>';
          }
        })
      }
      html += '</ul>';
      if (config.document_list) {
        if (document_active_count > 4) {
          html += '<a class="show_more_document" href="javascript:;">更多</a>'
        }
      }
      delete document_active_count;
      html += '</div>';
      html += '</div>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input" source="' + (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") +
        '" theme_id="' + (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") +
        '" value="' + (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '" placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "收藏案例";
      html += '<a href="javascript:;" class="confirm_btn confirm_store_general_case abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_authoritative_case: function (title, case_name) {
      var html = '';
      html += '<div class="dialog store_authoritative_case"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">案例名称：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="no_label_wrapper" title = ' + case_name + '>' + case_name + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input" source="' + (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") +
        '" theme_id="' + (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") +
        '" value="' + (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '" placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "收藏案例";
      html += '<a href="javascript:;" class="confirm_btn confirm_store_authoritative_case abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_judge: function (title, judge_name, court_name) {
      var html = '';
      html += '<div class="dialog store_judge"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">法官：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="no_label_wrapper"><span>' + judge_name + '</span><span class="court_name">' + court_name + '</span></div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input required_input" source="' +
        (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") + '" theme_id="' +
        (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") + '" value="' +
        (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '" placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "收藏法官";
      html += '<a href="javascript:;" class="confirm_btn confirm_store_judge abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    get_trial_video_case: function (title) {
      var html = '';
      html += '<div class="dialog get_trial_video_case"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="trial_video_case_list">';
      html += '<ul></ul>';
      html += '<div class="pagination_container">';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_court: function (title, court_name, cause_name) {
      var html = '';
      html += '<div class="dialog store_court"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">法院：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="no_label_wrapper" title = ' + (utils.delete_space(court_name)) + ' ><span>' + court_name +
        '</span><span class="cause_name">' + cause_name + '</span></div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input required_input" source="' +
        (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") +
        '" theme_id="' + (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") +
        '" value="' + (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '" placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "收藏法院";
      html += '<a href="javascript:;" class="confirm_btn confirm_store_court abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_court_video: function (title) {
      var html = '';
      html += '<div class="dialog store_court"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">' + config.bt + '</label>';
      html += '<div class="single_value_container">';
      html += '<div class="no_label_wrapper" title = ' + (config.AH ? utils.delete_space(config.AH) : utils.delete_space(config.cMc)) + ' >' +
        (config.AH ? config.AH : config.cMc) + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input " source="' + (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") +
        '" theme_id="' + (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") +
        '" value="' + (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '"  placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "收藏视频";
      html += '<a href="javascript:;" class="confirm_btn confirm_store_video abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    add_note: function (title, content) {
      var html = '';
      html += '<div class="dialog add_note"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<lable class="hint_info">智库提示：最多只可以截取200个字</lable>';
      html += '<p class="note_content">' + content + '</p>';
      html += '<div class="form_item no_label clearfix">';
      html += '<div class="single_value_container">';
      html += '<div class="single_label_wrapper single_textarea_wrapper">';
      if (config.cBz) {
        html += '<textarea class="note required_input" value="' + config.cBz + '" placeholder="请输入理解与心得" maxlength="300">' + config.cBz + '</textarea>';
      } else {
        html += '<textarea class="note required_input" placeholder="请输入理解与心得" maxlength="300 "></textarea>';
      }
      html += '</div>';
      html += '</div>';
      html += '</div>'
      html += '<div class="form_item no_label clearfix">';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper selected_label_wrapper">';
      if (config.cBq) {
        html += '<input type="text" placeholder="输入或选择标签" value="' + config.cBq + '" class="selected_label required_input" maxlength="20">';
      } else {
        html += '<input type="text" placeholder="输入或选择标签" class="selected_label " maxlength="20">';
      }
      html += '<a href="javascript:;" class="show_all_lable drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="lable_list drop_menu">';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "保存笔记";
      html += '<a href="javascript:;" class="confirm_btn confirm_add_note abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_law: function (title, law_name) {
      var html = '';
      html +=
        '<div class="dialog"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">法条名称：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="no_label_wrapper" title="' + law_name + '">' + law_name + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input required_input" source="' +
        (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") +
        '" theme_id="' + (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") +
        '" value="' + (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '" placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "收藏法条";
      html += '<a href="javascript:;" class="confirm_btn confirm_store_law abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    get_same_type_judge: function (title) {
      var html = '';
      html += '<div class="dialog get_same_type_judge"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="judge_list">';
      html += '<ul></ul>';
      html += '<div class="pagination_container">';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    look_other_court: function (title) {
      var html = '';
      html += '<div class="dialog look_other_court"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="court_list">'
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    look_case_with_basic: function (_title) {
      var html = '';
      html += '<div class="dialog look_case"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + _title + '-相关案例</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="case_list">';
      html += '<ul></ul>';
      html += '<div class="pagination_container">';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    look_case_with_relation: function (title) {
      var html = '';
      html += '<div class="dialog look_case"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="case_list">';
      html += '<ul></ul>';
      html += '<div class="pagination_container">';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },

    //
    all_case: function (title) {
      var html = '';
      html += '<div class="dialog all_case">';
      html += '<div class="dialog_header clearfix">';
      html += '<div class = "fymc_content" ><h2 class = "fymc">' + config.cMc +
        ' </h2><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a></div>'
      html += '<div class="dialog_body">'
      html += '<div class = "all_cause_info">'
      html += '<div class = " clearfix">'
      html += '<div class = "render_court_title">'
      html += '<h2>' + title + '</h2>'
      html += '</div>'
      html += '<div class = "render_crumbs"></div>'
      html += '<div class = "theme_filter">'
      if (title == '全部视频') {
        html += '<input type="text" class="theme_filter_input" placeholder = "请输入案由" >'
      } else if (title == '全部图文直播') {
        html += '<input type="text" class="theme_filter_input" placeholder = "请输入关键字" >'
      }
      html += '<i class="icon-search filter_btn"></i>'
      html += '</div>'
      html += '</div>'
      html += '<div class = "main-inner">'
      html += '<ul class = "nav" >'
      $.each(config.nav_arr, function (index, item) {
        html += '<li>' + item + '</li>'
      })
      html += '</ul>'
      html += '<ul class = "nav_list" >'
      html += '</ul>'
      html += '<div class = "pagination_container">'
      html += '</div>'
      html += '</div>'
      html += '</div>'
      html += '</div>'
      html += '</div>'
      html += '</div>'
      return $(html)
    },

    //全部图文直播
    all_live_image: function (title, list) {
      var html = '';
      html += '<div class="dialog all_live_image">';
      html += '<div class="dialog_header clearfix">';
      html += '<h2 title="' + title + '">' + title + '</h2>';
      html += '<a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>'
      html += '</div>'
      html += '<div class="dialog_body">';
      html += '<div class="images_list">';
      html += '<ul>'
      html += '</ul>'
      html += '<div class = "look_large_images" ><img>'
      html += '<div class = "control_button" >'
      html += '<input type="button" class="confirm_pre_page" value="上一张">'
      html += '<input type="button" class="confirm_next_page" value="下一张">'
      html += '<input type="button" class="confirm_close_live" value="返回">'
      html += '</div>'
      html += '</div>'
      html += '</div>'
      html += '<div id="pagination_container">';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    to_judge_measure: function (title) {

    },
    free_trial: function () {
      var html = '';
      html += '<div class="dialog " id = "confirm_free_trial">';
      html += '<a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>'
      html += '<div class = "free_trial_container" >'
      html += '<div class = "free_trial_item">'
      html += '<div class="dialog_header zk"><h2 class="dialog_title ">付费后使用高级功能</h2></div>'
      html += '<div class = "dialog_body">'
      html += '<div class = "details">'
      if (config.member_info.remainingFreeTimes) {
        html += '<div class = "hint">'
        html += '<span class = "hint_time" >您剩余' + config.member_info.remainingFreeTimes + '次"' + config.title + '"试用机会，已试用' + config.member_info.usageCount + '次。</span>'
        html += '<input type = "button" value = "免费体验" class = "confirm_free_button" />'
        html += '</div>'
      }
      html += '<ul class = "price">'
      html += '<li class = "unit_price">'
      html += '<span class = "key blue">商品名称</span>'
      html += '<div class = "commodity" >'
      $.each(config.list, function (index, item) {
        html += '<span class = " ' + (item.featureName == "vip" ? "vip active" : item.featureName) + ' confirm_kind" data-val = "' + item.featureName + '">' + item.cname + '</span>'
      })
      html += '<a class = "commodity_describe" href = "http://www.chineselaw.com/www/public/js/components/' + base_path + '/pricing" target = "_blank">'
      html += '<p class = "learn_more">智库全线功能无限次使用 了解更多</p>'
      html += '</a>'
      html += '</div>'
      html += '</li>'
      html += '<li class = "expire_time">'
      html += '<span class = "blue">到期时间</span>'
      html += '<span>' + config.list[1].expireDate + '</span>'
      html += '</li>'
      html += '<li class = "actual_payment ">'
      html += '<span class = "last_key blue">实际支付</span>'
      html += '<span class = "last">¥<span class = "big_price">' + config.list[1].price + '</span>/<span class = "unit">' + config.list[1].unit + '</span></span>'
      html += '</li>'
      html += '</ul>'
      html += '<div class = "pattern_payment">'
      html += '<span class = "float_elem">支付方式</span>'
      html += '<div class = "float_elem mode confirm_change_pattern_payment active" data-val = "wx"><a><img src = "' + base_path + '/www/public/img/wx.png"/*tpa=http://www.chineselaw.com/www/public/js/components/' + base_path + '/www/public/img/wx.png*/ /></a> 微信支付</div>'
      html += '<div class = "float_elem mode confirm_change_pattern_payment" data-val = "zfb"><a><img src = "' + base_path + '/www/public/img/zfb.png"/*tpa=http://www.chineselaw.com/www/public/js/components/' + base_path + '/www/public/img/zfb.png*/ /><span></a> 支付宝</span></div>'
      html += '<div class = "float_elem  confirm_change_pattern_payment" data-val = "dhm"><span>兑换码</span></div>'
      html += '</div>'
      html += '</div>'
      html += '</div>'
      html += '<div class = "dialog_footer one_btn zf_button" >'
      html += '<a href="javascript:;" class="confirm_btn confirm_pay  ">去支付</a>'
      html += '</div>'
      html += '</div></div>';
      return $(html);

    },
    pay_vip: function () {    //智库vip
      var html = '';
      html += '<div class="dialog zk" id = "confirm_free_trial">';
      html += '<a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>'
      html += '<div class = "free_trial_container" >'
      html += '<div class = "free_trial_item">'
      html += '<div class="dialog_header zk"><h2 class="dialog_title">购买智库VIP</h2></div>'
      html += '<div class = "dialog_body" >'
      html += '<div class = "details">'
      html += '<ul class = "price">'
      html += '<li class = "expire_time" >'
      html += '<span class = "blue">到期时间</span>'
      html += '<span>' + config.featureList[0].expireDate + '</span>'
      html += '</li>'
      html += '<li class = "actual_payment" >'
      html += '<span class = "last_key blue">实际支付</span>'
      html += '<span class = "last">¥<span class = "big_price"> ' + config.featureList[0].price + '</span>/<span class = "unit">' + config.featureList[0].unit + '</span></span>'
      html += '</li>'
      html += '</ul>'
      html += '<div class = "pattern_payment">'
      html += '<span class = "float_elem">支付方式</span>'
      html += '<div class = "float_elem mode confirm_change_pattern_payment active" data-val = "wx"><a><img src = "' + base_path + '/www/public/img/wx.png"/*tpa=http://www.chineselaw.com/www/public/js/components/' + base_path + '/www/public/img/wx.png*/ /></a> 微信支付</div>'
      html += '<div class = "float_elem mode confirm_change_pattern_payment" data-val = "zfb"><a><img src = "' + base_path + '/www/public/img/zfb.png"/*tpa=http://www.chineselaw.com/www/public/js/components/' + base_path + '/www/public/img/zfb.png*/ /><span></a> 支付宝</span></div>'
      html += '<div class = "float_elem  confirm_change_pattern_payment" data-val = "dhm"><span>兑换码</span></div>'
      html += '</div>'
      html += '</div>'
      html += '</div>'
      html += '<div class = "dialog_footer one_btn zf_button" >'
      html += '<a href="javascript:;" class="confirm_btn confirm_pay">去支付</a>'
      html += '</div>'
      html += '</div>'
      html += "</div>"
      html += '</div>'
      html += '</div>'



      return $(html);
    },
    store_judge_case: function (title) {
      //量刑的收藏
      var html = '';
      html += '<div class="dialog store_judge_case"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">名称：</label>';
      html += '<div class="single_value_container">';
      if (title == '收藏量刑分析' || title == '编辑量刑分析') {
        html += '<div class="single_label_wrapper"><input type="text" class="condition_name required_input" value="' +
          (config.condition_name ? config.condition_name : "") + '" placeholder="请输入量刑分析名称"></div>';
      } else if (title == '收藏对比分析' || title == '编辑对比分析') {
        html += '<div class="single_label_wrapper"><input type="text" class="condition_name required_input" value="' +
          (config.condition_name ? config.condition_name : "") + '" placeholder="请输入对比分析名称"></div>';
      }
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input required_input" source="' +
        (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") +
        '" theme_id="' + (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") +
        '" value="' + (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '" placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '<div class="form_item clearfix">';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      if (title == '收藏量刑分析') {
        var btn_html = config.btn_html ? config.btn_html : "收藏量刑分析";
      } else if (title == '收藏对比分析') {
        var btn_html = config.btn_html ? config.btn_html : "收藏对比分析";
      }
      html += '<a href="javascript:;" class="confirm_btn store_judge_case abled">' + config.btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_company: function (title) {
      var html = '';
      html += '<div class="dialog store_company"><a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>';
      html += '<div class="dialog_header">';
      html += '<h2 class="dialog_title">' + title + '</h2>';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">' + config.bt + '</label>';
      html += '<div class="single_value_container">';
      html += '<div class="no_label_wrapper" title = ' + config.cMc + '>' + config.cMc + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_body">';
      html += '<div class="form_item clearfix">';
      html += '<label class="label">主题：</label>';
      html += '<div class="single_value_container">';
      html += '<div class="multiple_label_wrapper theme_container">';
      html += '<input type="text" class="theme_input " source="' +
        (config.theme_info ? config.theme_info.source ? config.theme_info.source : "" : "") +
        '" theme_id="' + (config.theme_info ? config.theme_info.theme_id ? config.theme_info.theme_id : "" : "") +
        '" value="' + (config.theme_info ? config.theme_info.theme_name ? config.theme_info.theme_name : "" : "") +
        '"  placeholder="请输入主题名称，或点击右侧箭头选择已有主题"/>';
      html += '<a href="javascript:;" class="show_existed_theme drop_btn"><i class="icon-drop-down"></i></a>';
      html += '<div class="existed_theme_list drop_menu">';
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '<div class="other_theme_list drop_menu">';
      html += '<h3>选择案件／项目</h3>';
      html += '<a class="close close_drop_menu" href="javascript:;"><i class="icon-close"></i></a>'
      html += '<div class="theme_list_wrapper">';
      html += '<ul>';
      html += '</ul>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<a href="javascript:;" class="show_other_theme"></a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="dialog_footer one_btn">';
      var btn_html = config.btn_html ? config.btn_html : "收藏视频";
      html += '<a href="javascript:;" class="confirm_btn confirm_store_company abled">' + btn_html + '</a>';
      html += '</div>';
      html += '</div>';
      return $(html);
    },
    store_consume: function () {
      var html = '';
      html += '<div class = "dialog zk show" id="confirm_free_trial">'
      html += '<a class="dialog_close_btn" href="javascript:;">'
      html += '<i class = "icon-close"></i>'
      html += '</a>'
      html += '<div class = "free_trial_item">'
      html += '<div class = "dialog_header zk" >'
      html += '<h2 class = "dialog_title" >付费功能使用提示</h2>'
      html += '</div>'
      html += '<div class = "dialog_body">'
      html += '<div class = "use_tips">确认消耗' + config.title + '使用权限</div>'
      html += '</div>'
      html += '<div class = "dialog_trial_footer">'
      html += '<input type = "button" value = "确认消耗" class = "confirm_consumption ">'
      html += '<span class = "payment_failure use_later">稍后在用</span>'
      html += '</div>'
      html += '</div>'
      html += '</div>'
      return $(html);
    }
  };
  var actions = {
    //页面操作
    drop_menu_hide: function (menu_class) {
      $(document).on("click.menu_hide", function (e) {
        if ($(e.target).closest(".drop_menu").length == 0) {
          elem.find(menu_class).hide().parent().removeClass("open");
          $(document).off(".menu_hide");
        }
      })
    },
    off_menu_hide: function (e) {
      e.stopPropagation();
      elem.find(".drop_menu").hide().parent().removeClass("open");
      $(document).off(".menu_hide");
    },
    //展示已存在的主题
    show_existed_theme: function (e) {
      actions.off_menu_hide(e);
      if (elem.find(".existed_theme_list.drop_menu .theme_item").length == 0) {
        return;
      }
      $(this).parent().addClass("open").find(
        ".existed_theme_list.drop_menu").show(5, function () {
          actions.drop_menu_hide(".existed_theme_list.drop_menu");
        });
    },
    //展示来源主题菜单
    show_other_theme: function (e) {
      actions.off_menu_hide(e);
      if (elem.find(".other_theme_list.drop_menu .theme_item").length == 0) {
        var source = $(this).attr("source");
        var text = "请到数据中心添加案件";
        if (source == "hlw") {
          var text = "请到律师平台添加案件"
        }
        utils.operation_hints({
          status: "warn",
          text: text
        });
        return;
      }
      elem.find(".theme_container").addClass("open").find(
        ".other_theme_list.drop_menu").show(5, function () {
          actions.drop_menu_hide(".other_theme_list.drop_menu")
        });
    },
    close_drop_menu: function () {
      $(this).closest(".drop_menu").hide();
      $(document).off(".menu_hide");
    },
    //选择某一个主题
    select_theme: function () {
      var theme_input = elem.find(".theme_input");
      var source = $(this).attr("source"),
        theme_id = $(this).attr("theme_id"),
        theme_name = $(this).attr("title");
      theme_input
        .attr("source", source)
        .attr("theme_id", theme_id)
        .val(theme_name)
        .removeClass("placeholder")
        .parent(".theme_container").removeClass("required");
      $(this).closest(".drop_menu").hide().parent().removeClass("open");
      $(document).off(".menu_hide");
    },
    //重置主题框
    reset_theme: function () {
      var val = $(this).val();
      $(this).removeClass("placeholder");
      if (!val && $(this).hasClass("required_input")) {
        $(this).parent(".theme_container").addClass("required");
      } else {
        $(this).parent(".theme_container").removeClass("required");
        if (val.length > 100) {
          $(this).val(val.substr(0, 100)).attr("theme_id", "").attr(
            "source", "");
        }
        $(this).attr("theme_id", "").attr("source", "");
      }
    },
    //输入框的提示状态
    required_input: function () {
      var value = utils.delete_space($(this).val())
      if (!value || value == $(this).attr("placeholder")) {
        $(this).parent().addClass("required");

      } else {
        $(this).parent().removeClass("required");
      }
    },
    //获取必选框是否有值得状态
    get_required_status: function () {
      var status = 0;
      $.each(elem.find(".required_input"), function () {
        if ($(this).val() == "" || $(this).val() == $(this).attr(
          "placeholder") || utils.delete_space($(this).val()).length == 0) {
          $(this).parent().addClass("required");
          status += 1;
        }
      })
      return status;
    },
    //文书选择
    document_select: function () {
      if ($(this).hasClass("active")) {
        $(this).removeClass("active");
      } else {
        $(this).addClass("active");
      }
    },
    checkbox_select: function () {
      $(this).addClass("active").siblings().removeClass("active");
    },
    //显示检索报告主题菜单
    filter_theme_menu_show: function (e) {
      if ($(this).next(".drop_menu").find("li").length > 0) {
        $(this).next(".drop_menu").addClass("show").show(5, function () {
          actions.drop_menu_hide(".filter_theme_menu.drop_menu")
        });
      }
    },
    //选择法条
    law_select: function () {
      if (!store.selcted_law) {
        store.selcted_law = [];
      }
      var page = $(this).parent().attr("page");
      var page_index = $(this).parent().attr("index")
      if ($(this).parent().hasClass("active")) {
        var index = $(this).attr("index");
        if (index) {
          store.selcted_law.splice(index, 1);
          delete store.data[page][page_index].data_index;
        }
        $(this).removeAttr("index").parent().removeClass("active");
        var page = $(this).parent().attr("page");
        var page_index = $(this).parent().attr("index")
        store.data[page][page_index].active = false;
      } else {
        store.selcted_law.push($(this).parent().find(".law_name").html());
        $(this).attr("index", store.selcted_law.length - 1).parent().addClass(
          "active");
        store.data[page][page_index].active = true;
        store.data[page][page_index].data_index = store.selcted_law.length - 1;
      }
      if (store.selcted_law.length == 0) {
        elem.find(".confirm_analysis_law").removeClass("abled").addClass("disabled");
      } else {
        elem.find(".confirm_analysis_law").addClass("abled").removeClass("disabled");
      }
    },
    //显示所有主题
    show_all_lable: function (e) {
      actions.off_menu_hide(e);
      $('body').css('overflow', 'hidden');
      if (elem.find(".lable_list.drop_menu .lable_item").length == 0) {
        return;
      }
      $(this).parent().addClass("open").find(".lable_list.drop_menu").show(5,
        function () {
          actions.drop_menu_hide(".lable_list.drop_menu");
        });
    },
    //选择标签
    select_lable: function () {
      elem.find(".selected_label").val($(this).html());
      $(this).closest(".drop_menu").hide().parent().removeClass("open");
      $(document).off(".menu_hide");
    },
    //显示所有文书
    show_more_document: function () {
      if ($(this).prev().hasClass("open")) {
        $(this).html("更多").prev().removeClass("open");
      } else {
        $(this).html("收起").prev().addClass("open");
      }
    },
    //组合检索显示下级数据
    select_first_level: function () {
      var index = $(this).attr("index");
      var html = render_fn.render_combination_search_data(store.data[index]
        .children, "second");
      $(this).closest(".option.first").next(".option.second").remove();
      $(this).closest(".option.first").next(".option.third").remove();
      $(this).closest(".option.first").after(html);
      $(this).addClass("active").removeClass("required").siblings().removeClass("active").removeClass("required");
    },
    select_second_level: function () {
      var index = $(this).attr("index");
      var parent_index = elem.find(".level_option_item.first.active").attr("index");
      var html = render_fn.render_combination_search_data(store.data[parent_index].children[index].children, "third");
      $(this).closest(".option.second").next(".option.third").remove();
      $(this).closest(".option.second").after(html);
      $(this).addClass("active").removeClass("required").siblings().removeClass("active").removeClass("required");
    },
    select_third_level: function () {
      if ($(this).hasClass("active")) {
        $(this).removeClass("active")
      } else {
        $(this).addClass("active");
      }
    },
    select_theme_item: function () {
      elem.find(".confirm_select_theme").removeClass("disabled").addClass("abled");
      elem.find('.confirm_free_trial').removeClass("disabled").addClass("abled");
      $(this).addClass("active").siblings().removeClass("active");
    },
    select_charge_item: function () {
      elem.find(".confirm_select_charge").removeClass("disabled").addClass("abled");
      $(this).addClass("active").siblings().removeClass("active");
    },
    theme_filter_event: function (input_ele) {
      input_ele.on("keyup", function () {
        var value = $(this).val();
        var temp_arr = [];
        if (value.length == 0 || value == $(this).attr("placeholder")) {
          temp_arr = store.report_theme;
        } else {
          $.each(store.report_theme, function (index, item) {
            var reg = new RegExp(value);
            if (reg.test(item.C_AJXMMC)) {
              temp_arr.push(item);
            }
          })
        }
        if (temp_arr.length) {
          elem.find(".report_theme_list").empty().html(render_fn.render_report_theme(temp_arr));
        }
      })
    },
    select_create_new_report_case: function () {
      if ($(this).hasClass("active")) {
        $(this).removeClass("active");
        if (elem.find(".create_new_report_case_item.active").length == 0) {
          elem.find(".confirm_create_new_report").removeClass("abled").addClass("disabled");
          elem.find(".confirm_free_trial ").removeClass("abled").addClass("disabled");
        }
      } else {
        $(this).addClass("active");
        elem.find(".confirm_create_new_report").addClass("abled").removeClass("disabled");
        elem.find(".confirm_free_trial ").addClass("abled").removeClass("disabled");
      }
    },
    //交互操作
    //保存搜索条件
    store_query: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var submit_data = {
        cId: config.cId ? config.cId : "",
        cMc: elem.find(".condition_name").val(),
        ly: elem.find(".theme_input").attr("source"),
        nSclx: 1,
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        cScnr: typeof config.cJstj == "string" ? config.cJstj : JSON.stringify(config.cJstj),
        cJstj: typeof config.cJstj == "string" ? config.cJstj : JSON.stringify(config.cJstj),
        nSsmk: config.nSsmk,
        nAjlx: config.nAjlx ? config.nAjlx : cur_case_type
      }
      utils.post_req("/collection/updateWdsc", submit_data).done(function (response) {
        var data = utils.change_json(response);
        var status = {};
        if (config.cId) {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "编辑成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "同一检索条件不能收藏在相同主题下"
            };
          } else {
            status = {
              status: "fail",
              text: "编辑失败"
            };
          }
        } else {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "收藏成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "请勿重复收藏"
            };
          } else if (data.message == "fail") {
            status = {
              status: "fail",
              text: "收藏失败"
            };
          }
        }

        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        if (config.cId) {
          status = {
            status: "fail",
            text: "编辑失败"
          };
        } else {
          status = {
            status: "fail",
            text: "收藏失败"
          };
        }

        utils.operation_hints(status);
        remove();
      })

    },
    //保存量刑
    store_judge_case: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var submit_data = {
        cId: config.cId ? config.cId : "",
        ly: elem.find(".theme_input").attr("source"),
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cMc: elem.find(".condition_name").val(),
        nSclx: config.nSclx, //可选
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        cScnr: typeof config.cScnr == "string" ? config.cScnr : JSON.stringify(config.cScnr),
        nAjlx: cur_case_type
      }
      utils.post_req("/collection/updateWdsc", submit_data).done(function (
        response) {
        var data = utils.change_json(response);
        var status = {};
        if (config.cId) {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "编辑成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            if (config.nSclx == 7) {
              status = {
                status: "warn",
                text: "同一量刑分析不能收藏在同一主题下"
              };
            } else if (config.nSclx == 8) {
              status = {
                status: "warn",
                text: "同一对比分析不能收藏在同一主题下"
              };
            }

          } else {
            status = {
              status: "fail",
              text: "编辑失败"
            };
          }
        } else {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "收藏成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "请勿重复收藏"
            };
          } else if (data.message == "fail") {
            status = {
              status: "fail",
              text: "收藏失败"
            };
          }
        }

        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        if (config.cId) {
          status = {
            status: "fail",
            text: "编辑失败"
          };
        } else {
          status = {
            status: "fail",
            text: "收藏失败"
          };
        }

        utils.operation_hints(status);
        remove();
      })

    },
    confirm_store_court: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var submit_data = {
        cMc: config.cJstj.fy,
        nSclx: 5,
        /*ly:,*/ //换成nZtly
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        cScnr: config.cJstj.ay,
        nZtly: elem.find(".theme_input").attr("source"),
        cJstj: typeof config.cJstj == "string" ? config.cJstj : JSON.stringify(config.cJstj)
      }
      utils.post_req("/cpgdfx/operateSc", submit_data).done(function (
        response) {
        var data = utils.change_json(response);
        var status = {};
        if (data.msg == "收藏成功") {
          status = {
            status: "success",
            text: "收藏成功"
          };
          if (config.callback) {
            config.callback(submit_data);
          }
        } else if (data.msg == "重复收藏") {
          status = {
            status: "warn",
            text: "请勿重复收藏"
          };
        } else {
          status = {
            status: "fail",
            text: "收藏失败"
          };
        }
        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        status = {
          status: "fail",
          text: "收藏失败"
        };
        utils.operation_hints(status);
        remove();
      })
    },
    //收藏公司
    confirm_store_company: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var submit_data = {
        cMc: (config.AH ? config.AH : config.cMc),
        nSclx: config.nSclx,
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        nZtly: elem.find(".theme_input").attr("source"),
        ly: elem.find(".theme_input").attr("source"),
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cScnr: config.cScnr,
        nAjlx: cur_case_type
      }

      utils.post_req("/collection/updateWdsc", submit_data).done(function (response) {
        var data = utils.change_json(response);
        var status = {};
        if (config.cId) {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "编辑成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "同一检索条件不能收藏在相同主题下"
            };
          } else {
            status = {
              status: "fail",
              text: "编辑失败"
            };
          }
        } else {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "收藏成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "请勿重复收藏"
            };
          } else if (data.message == "fail") {
            status = {
              status: "fail",
              text: "收藏失败"
            };
          }
        }

        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        if (config.cId) {
          status = {
            status: "fail",
            text: "编辑失败"
          };
        } else {
          status = {
            status: "fail",
            text: "收藏失败"
          };
        }

        utils.operation_hints(status);
        remove();
      })

    },
    confirm_store_judge: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var submit_data = {
        cMc: config.cJstj.fg,
        nSclx: 6,
        ly: elem.find(".theme_input").attr("source"),
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        cScnr: config.cJstj.fgId,
        nZtly: elem.find(".theme_input").attr("source"),
        cJstj: typeof config.cJstj == "string" ? config.cJstj : JSON.stringify(config.cJstj)
      }
      utils.post_req("/cpgdfx/operateSc", submit_data).done(function (response) {
        var data = utils.change_json(response);
        var status = {};
        if (data.msg == "收藏成功") {
          status = {
            status: "success",
            text: "收藏成功"
          };
          if (config.callback) {
            config.callback(submit_data);
          }
        } else if (data.msg == "重复收藏") {
          status = {
            status: "warn",
            text: "请勿重复收藏"
          };
        } else {
          status = {
            status: "fail",
            text: "收藏失败"
          };
        }
        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        status = {
          status: "fail",
          text: "收藏失败"
        };
        utils.operation_hints(status);
        remove();
      })
    },
    change_judge: function () {
      config.condition.fg = $(this).html();
      config.condition.fgId = $(this).attr("fgId");
      config.condition.startTime = "";
      public_submit(config.condition, "false", "_blank");
      config.callback();
    },
    change_court: function () {
      config.condition.fy = $(this).html();
      config.condition.startTime = "";
      public_submit(config.condition, "false", "_blank");
      config.callback();
    },
    //添加普通案例到检索报告
    add_case_to_report: function () {
      var document_id_arr = [];
      var document_arr = []; //选中的数组
      $.each(config.document_arr, function (index, item) {
        var obj = {}
        obj.ah = item.ah
        obj.wsid = item.wsid
        document_id_arr.push(obj)
      })
      $.each(elem.find(".document_item"), function (index, item) {
        if ($(this).hasClass("active")) {
          var index = $(this).attr("index");
          document_arr.push(document_id_arr[index]);
        }
      })
      var data = {
        cMc: config.case_name,
        nLx: 3,
        cNrzj: config.cNrzj,
        cJstj: config.attach_condition,
        nAjlx: cur_case_type
      }
      data.ptalWsInfo = JSON.stringify({
        scWsId: document_arr
      });


      utils.post_req("/jsbg/add", data).done(function (response_text) {
        var response = utils.change_json(response_text);
        var status = "";
        if (response.message == "success") {
          status = "success";
        } else if (response.message == "repeat") {
          status = "repeat";
        } else if (response.message == "limit") {
          status = "limit";
        }
        remove();
        if (config.callback) {
          config.callback(response.jsbgCid, response.jsbgSize, status);
        }
      })
    },
    //删除添加到报告中的案例
    delete_report_case: function () {
      var _this = this;
      var index = $(this).attr("index");
      var js_id = $(this).attr("js_id");

      utils.confirm_hints({
        hint_info: "您确定要删除吗？",
        callback: callback
      }).show();

      function callback() {
        if ($(_this).attr("type") == "stored_case") {
          if ($(_this).hasClass("al")) {
            store.report_stored_case.al.splice(index, 1);
          } else {
            store.report_stored_case.aj.splice(index, 1);
          }
          $(_this).parent(".report_stored_case_item").remove();
          set_result();
        } else {
          utils.post_req("/jsbg/delete", {
            cId: js_id
          }).done(function (response) {
            var data = utils.change_json(response);
            if ($(_this).hasClass("al")) {
              store.report_case.qwal.splice(index, 1)
            } else {
              store.report_case.ptal.splice(index, 1)
            }
            if (data) {
              if (config.callback.delete_case_callback) {
                config.callback.delete_case_callback(js_id);
              }
            }
            var html = '';
            if (store.report_case && store.report_case.qwal) {
              html += render_fn.render_report_al_case(store.report_case.qwal);
            }
            if (store.report_case && store.report_case.ptal) {
              html += render_fn.render_report_aj_case(store.report_case.ptal);
            }
            if (store.report_stored_case && store.report_stored_case.qwal) {
              html += render_fn.render_report_stored_al_case(store.report_stored_case.qwal);
            }
            if (store.report_stored_case && store.report_stored_case.ptal) {
              html += render_fn.render_report_stored_aj_case(store.report_stored_case.ptal);
            }
            elem.find(".report_case_list").empty().removeClass("no_result_elem").html(html);
            set_result();
          })
        }
      }


      function set_result() {
        if (elem.find(".report_case_item").length == 0 && elem.find(".report_stored_case_item").length == 0) {
          elem.find(".confirm_create_report").removeClass("abled").addClass("disabled");
          elem.find(".confirm_free_trial ").removeClass("abled").addClass("disabled");
          utils.no_result({
            parent_elem: elem.find(".report_case_list"),
            img_name: "no_case",
            text: "您还没有添加案例，请点击“添加检索报告”添加案例",
            text_more: "或直接选择已收藏案例进行添加"
          });
        }
      }
    },
    //显示已经收藏的案例
    show_store_case: function () {
      elem.find(".slider_container").append(render_fn.render_store_case_slider())
        .find(".slider_item").eq(0).animate({ marginLeft: -600 }, 500);
      elem.find(".slider_container").find(".slider_item").eq(1).animate({ marginLeft: 0 }, 500);
      var data = {
        cAjxmmc: "",
        cAjxm: ""
      }
      actions.get_stored_case(data);
      utils.post_req("/collection/getBXAjxm", {
        lyWy: "jgyJsbg"
      }).done(function (response) {
        var data = utils.change_json(response);
        var html = '';
        html += '<li><a class="filter_theme_item active" theme_id=""  href="javascript:;">全部</a></li>';
        $.each(data, function (index, item) {
          if (item.C_AJXMMC != '' && item.C_AJXMMC != null && item.C_AJXMMC != undefined) {
            html += '<li><a class="filter_theme_item" theme_id="' + item.C_AJXM + '" href="javascript:;">' +
              item.C_AJXMMC + '</a></li>';
          }
        });
        elem.find(".filter_theme_menu ul").html(html);
      })

    },
    //更换主题获取已收藏的案例
    change_theme_get_case: function () {
      if ($(this).hasClass("active")) {
        elem.find(".filter_theme_menu").hide(5, function () {
          $(document).off(".menu_hide");
        })
        return;
      }
      var data = {
        cAjxmmc: $(this).html() == "全部" ? "" : $(this).html(),
        cAjxm: $(this).attr("theme_id")
      }
      elem.find(".filter_theme_item").removeClass("active");
      $(this).addClass("active");
      elem.find(".filter_theme_btn span").html($(this).html()).attr("title", $(this).html());
      elem.find(".filter_theme_menu").hide(5, function () {
        $(document).off(".menu_hide");
      })
      actions.get_stored_case(data);
    },
    confirm_enter_judge_measure: function () {

      var url = config.url;
      // var new_search_form = $(
      //   '<form method="post" target="_blank" display="none" action=' + url + '></form>')
      // for (key in config.form_data) {
      //   var new_input = $('<input name=' + key + ' display="none"></input>')
      //   if (typeof config.form_data[key] == 'string') {
      //     new_input.attr('value', config.form_data[key])
      //   } else {
      //     new_input.attr('value', JSON.stringify(config.form_data[key]))
      //   }
      //   new_search_form.append(new_input).appendTo('body')
      // }

      var obj = {
        form_data: config.form_data,
        tag_name: '_blank',
        url: url
      };
      if (config.member_info.is_member) {
        utils.form_submit(obj)
        remove()
      } else {
        return obj
      }

    }, //获取已收藏的案例
    get_stored_case: function (data) {
      loading.run(elem.find(".stored_case_list"));
      utils.post_req("/jsbg/Wdscnr", data).done(function (response) {
        loading.run();
        var data = utils.change_json(response);
        if (data.ptal.length + data.qwal.length == 0) {
          utils.no_result({
            parent_elem: elem.find(".stored_case_list"),
            img_name: "no_case",
            text: "您还没有收藏案例，请收藏案例"
          });
          return;
        }
        store.stored_case = data; //存储已收藏的案例
        elem.find(".stored_case_list").removeClass("no_result").empty().html(render_fn.render_stored_case_item(data));
      })
    },
    //确定添加已收藏的案例到检索报告
    confirm_add_stored_case: function () {
      if (!store.report_stored_case) {
        store.report_stored_case = {};
      }
      if (!store.report_stored_case.al) {
        store.report_stored_case.al = [];
      }
      if (!store.report_stored_case.aj) {
        store.report_stored_case.aj = [];
      }
      $.each(elem.find(".stored_case_item.al.active"), function () {
        var _index = $(this).attr("index");
        var store_id = $(this).attr("store_id");
        if (store.report_stored_case.al.length == 0) {
          store.report_stored_case.al.push(store.stored_case.qwal[_index]);
        } else {
          var tempArr = [];
          $.each(store.report_stored_case.al, function (index, item) {
            tempArr.push(item.qwalItem.alid)
          })
          if ($.inArray(store_id, tempArr) < 0) {
            store.report_stored_case.al.push(store.stored_case.qwal[_index]);
            delete tempArr;
          }
        }
      })

      $.each(elem.find(".stored_case_item.aj.active"), function () {
        var store_id = $(this).attr("store_id");
        var _index = $(this).attr("index");
        if (store.report_stored_case.aj.length == 0) {
          store.report_stored_case.aj.push(store.stored_case.ptal[_index]);
        } else {
          var tempArr = [];
          $.each(store.report_stored_case.aj, function (index, item) {
            tempArr.push(item.ptalItem.alid)
          })
          if ($.inArray(store_id, tempArr) < 0) {
            store.report_stored_case.aj.push(store.stored_case.ptal[_index]);
            delete tempArr;
          }
        }
      })
      if (store.report_stored_case.al.length >= 1 || store.report_stored_case.aj.length >= 1) {
        var html = '';
        html += render_fn.render_report_al_case(store.report_case.qwal);
        html += render_fn.render_report_aj_case(store.report_case.ptal);
        html += render_fn.render_report_stored_al_case(store.report_stored_case.al);
        html += render_fn.render_report_stored_aj_case(store.report_stored_case.aj);
        elem.find(".report_case_list").empty().removeClass("no_result_elem").html(html);
      }
      elem.find(".slider_container").find(".slider_item").eq(1).animate({
        marginLeft: 600
      }, 500, function () {
        $(this).remove()
      });
      elem.find(".slider_container").find(".slider_item").eq(0).animate({
        marginLeft: 0
      }, 500);
      elem.find(".confirm_create_report").removeClass("disabled").addClass("abled");
      elem.find(".confirm_free_trial").removeClass("disabled").addClass("abled");
    },
    cancle_add_stored_case: function () {
      elem.find(".slider_container").find(".slider_item").eq(1).animate({
        marginLeft: 600
      }, 500, function () {
        $(this).remove()
      });
      elem.find(".slider_container").find(".slider_item").eq(0).animate({
        marginLeft: 0
      }, 500);
      if (elem.find(".report_case_item").length > 0 || elem.find(".report_stored_case_item").length > 0) {
        elem.find(".confirm_create_report").removeClass("disabled").addClass("abled");
        elem.find(".confirm_free_trial").removeClass("disabled").addClass("abled");

      }
    },
    //确定生成检索报告
    confirm_create_report: function () {
      if (config.member_info.is_member) {
        if (actions.get_required_status() != 0) {
          return false;
        }
      }
      var report_name = elem.find(".report_name").val();
      var al_ids = [];
      var aj_ids = [];
      var al_store_ids = [];
      var aj_store_ids = [];
      $.each(elem.find("http://www.chineselaw.com/www/public/js/components/.report_case_item.al"), function () {   //选中的普通案例
        al_ids.push($(this).attr("js_id"));
      })
      $.each(elem.find("http://www.chineselaw.com/www/public/js/components/.report_case_item.aj"), function () {   //选中的权威案例
        aj_ids.push($(this).attr("js_id"));
      })
      $.each(elem.find("http://www.chineselaw.com/www/public/js/components/.report_stored_case_item.al"), function () {   //已收藏的权威案例
        al_store_ids.push($(this).attr("store_id"));
      })
      $.each(elem.find("http://www.chineselaw.com/www/public/js/components/.report_stored_case_item.aj"), function () {   //已收藏的普通案例
        aj_store_ids.push($(this).attr("store_id"));
      })

      if (al_ids.length == 0 && aj_ids.length == 0 && al_store_ids.length == 0 && aj_store_ids.length == 0 && config.member_info.is_member) {
        return;
      }
      var form_config = {
        form_data: {
          jgyJsbg: "jgyJsbg",
          cMc: report_name,
          al: {
            wdscCid: al_store_ids.join(","),
            jsbgxCid: al_ids.join(",")
          },
          aj: {
            wdscCid: aj_store_ids.join(","),
            jsbgxCid: aj_ids.join(",")
          }
        },
        url: "/jsbg?jsbgLy=jgyJsbg",
        tag_name: "_blank"
      }
      if (config.callback.create_callback) {
        config.callback.create_callback(al_ids.concat(aj_ids));
      }
      if (!config.member_info.is_member) {    //传了会员信息
        config.form_obj = config.form_obj ? config.form_obj : form_config;
        return form_config;
      } else {
        config.callback.reset_count();
        utils.form_submit(form_config);
        remove();
      }
    },
    confirm_select_theme: function () {
      var cAjxm = elem.find(".report_theme_item.active").attr("theme_id");
      var cAjxmmc = elem.find(".report_theme_item.active").find("span").html();
      var nZtly = elem.find(".report_theme_item.active").attr("source");
      var submit_data = {
        cAjxm: cAjxm,
        cAjxmmc: cAjxmmc,
        nZtly: nZtly,
        isExport: false
      }
      store.create_new_report_data = submit_data;
      config.form_obj = submit_data;
      if (elem.find(".slider_container .slider_item").length > 1) {
        elem.find(".slider_container .slider_item").eq(1).remove();
      }
      elem.find(".slider_container .slider_item").eq(0).animate({
        marginLeft: -600
      }, 500);
      elem.find(".slider_container").find(".slider_item").eq(1).animate({
        marginLeft: 0
      }, 500);
      content_data.get_create_new_report_case(submit_data);
      elem.find(".slider_container").append(render_fn.render_create_new_report_slider());

    },
    back_to_report_theme: function () {
      elem.find(".slider_container .slider_item").eq(1).animate({
        marginLeft: 600
      }, 500);
      elem.find(".slider_container").find(".slider_item").eq(0).animate({
        marginLeft: 0
      }, 500);
      if (elem.find(".create_new_report_case_item.active").length == 0) {
        elem.find(".confirm_create_new_report").removeClass("abled").addClass("disabled");
        elem.find(".confirm_free_trial  ").removeClass("abled").addClass("disabled");

      } else {
        elem.find(".confirm_create_new_report").removeClass("disabled").addClass("abled");
        elem.find(".confirm_free_trial").removeClass("disabled").addClass("abled");
      }
    },
    confirm_create_new_report: function () {
      var _this = this;
      if (config.member_info.is_member) {
        if (elem.find(".create_new_report_case_item.active").length == 0) {
          utils.operation_hints({
            status: "warn",
            text: "请选择案件"
          });
          return;
        }
      }
      var al_arr = [],
        aj_arr = [],
        ft_arr = [];

      $.each(elem.find(".create_new_report_case_item.al.active"), function () {
        al_arr.push($(this).attr("case_id"));
      })
      $.each(elem.find(".create_new_report_case_item.aj.active"), function () {
        aj_arr.push($(this).attr("case_id"));
      })
      $.each(elem.find(".create_new_report_case_item.ft.active"), function () {
        ft_arr.push($(this).attr("ft_id"));
      })
      store.create_new_report_data.al = al_arr.join(",");
      store.create_new_report_data.aj = aj_arr.join(",");
      store.create_new_report_data.ft = ft_arr.join(",");
      store.create_new_report_data.isExport = "";
      config.form_obj = store.create_new_report_data;
      if (config.member_info.is_member) {
        actions.confirm_produce_report_data(_this, store.create_new_report_data);
      } else {
        return config.form_obj
      }
    },
    confirm_produce_report_data: function (trigger, data) {
      $(this).addClass("disabled").html("正在生成检索报告...").removeClass("abled").next().hide();
      utils.post_req("/SearchReport/createJsbg", data).done(function (response) {
        var data = utils.change_json(response);
        if (data.message == "success") {
          config.callback.create_report_callback(data);
          remove()
        } else {
          utils.operation_hints({
            status: "fail",
            text: "新建报告失败"
          });
          $(trigger).addClass("abled").html("一键生成检索报告").removeClass("disabled").next().show();
        }
      }).fail(function () {
        utils.operation_hints({
          status: "fail",
          text: "新建报告失败"
        });
        remove();
      })
    },
    //查看法条详情
    look_law_detail: function () {
      var law_name = $(this).html();
      utils.post_req("/getFtxq", {
        wzftmc: law_name
      }).done(function (response) {
        var data = utils.change_json(response);
        store.law_detail = data;
        elem.find(".slider_container .slider_item").eq(0).animate({ marginLeft: -600 }, 500);
        elem.find(".slider_container").append(render_fn.render_law_detail(data)).find(".slider_item").eq(1).animate({
          marginLeft: 0
        }, 500);
        content_data.get_theme_list_fn();
        utils.placeholder(elem.find("input[placeholder]"));
      })
    },
    //返回发料列表
    back_to_law_list: function () {
      elem.find(".slider_container .slider_item").eq(1).remove();
      elem.find(".slider_container .slider_item").eq(0).animate({ marginLeft: 0 }, 500);
    },
    //确定收藏法条分析中的法条
    confirm_store_analysis_law: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var data = {
        cId: config.cId ? config.cId : "",
        cMc: store.law_detail.wzftmc,
        ly: elem.find(".theme_input").attr("source"),
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() == elem.find(".theme_input").attr("placeholder") ?
          "" : elem.find(".theme_input").val()),
        nSclx: 2,
        cScnr: "",
        cJstj: config.attach_condition,
        nSsmk: 2,
        nAjlx: cur_case_type
      }
      utils.post_req("/collection/updateWdsc", data).done(function (response) {
        var data = utils.change_json(response);
        var status = {};
        if (config.cId) {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "编辑成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "同一法条不能收藏在相同主题下"
            };
          } else {
            status = {
              status: "fail",
              text: "编辑失败"
            };
          }
        } else {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "收藏成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "请勿重复收藏"
            };
          } else if (data.message == "fail") {
            status = {
              status: "fail",
              text: "收藏失败"
            };
          }
        }

        utils.operation_hints(status);
      }).fail(function () {
        status = {
          status: "fail",
          text: "收藏失败"
        };
        utils.operation_hints(status);
        elem.find(".slider_container .slider_item").eq(1).animate({ marginLeft: 600 }, 500, function () {
          $(this).remove();
        });
        elem.find(".slider_container .slider_item").eq(0).animate({ marginLeft: 0 }, 500);
      })
    },
    //确定分析法条
    confirm_analysis_law: function () {
      var tempArr = [];
      $.each(store.selcted_law, function (index, item) {
        tempArr.push({
          field: store.field,
          cfield: "法条：" + item,
          value: item
        })
      })
      var form_config = {
        form_data: {
          query: tempArr,
          filter: [],
          advs: [],
          nAjlx: cur_case_type
        },
        url: "/basicSearch/search",
        tag_name: "_blank"
      }
      remove();
      utils.form_submit(form_config);
      delete temp_arr;
    },
    //收藏普通案例
    confirm_store_general_case: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var document_ids = [];
      $.each(elem.find(".document_item.active"), function () {
        var obj = {}
        var ah = $(this).text()
        var document_id = $(this).attr('document_id')
        obj.ah = ah
        obj.wsid = document_id
        document_ids.push(obj)
      })
      var submit_data = {
        cId: config.cId ? config.cId : "",
        cMc: config.case_name,
        nSclx: 3,
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        ly: elem.find(".theme_input").attr("source"),
        cScnr: JSON.stringify({
          ajId: config.ajId,
          scWsId: document_ids
        }),
        cJstj: typeof config.cJstj == "string" ? config.cJstj : JSON.stringify(config.cJstj),
        nAjlx: config.nAjlx ? config.nAjlx : cur_case_type
      }
      utils.post_req("/collection/updateWdsc", submit_data).done(function (response) {
        var data = utils.change_json(response);
        var status = {};
        if (config.cId) {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "编辑成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "同一案例不能收藏在相同主题下"
            };
          } else {
            status = {
              status: "fail",
              text: "编辑失败"
            };
          }
        } else {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "收藏成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "请勿重复收藏"
            };
          } else if (data.message == "fail") {
            status = {
              status: "fail",
              text: "收藏失败"
            };
          }
        }

        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        status = {
          status: "fail",
          text: "收藏失败"
        };
        utils.operation_hints(status);
        remove();
      })

    },
    //收藏权威案例
    confirm_store_authoritative_case: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var document_ids = [];
      var submit_data = {
        cId: config.cId ? config.cId : "",
        cMc: config.case_name,
        nSclx: config.gid ? 13 : 4,   //13是法规
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        ly: elem.find(".theme_input").attr("source"),
        cScnr: typeof config.cScnr == "string" ? config.cScnr : JSON.stringify(config.cScnr),
        cJstj: typeof config.cJstj == "string" ? config.cJstj : JSON.stringify(config.cJstj),
        nAjlx: config.nAjlx ? config.nAjlx : cur_case_type,
        gid: config.gid,   //法规的参数
        library: config.library   //法规的参数
      }
      utils.post_req("/collection/updateWdsc", submit_data).done(function (response) {
        var data = utils.change_json(response);
        var status = {};
        if (config.cId) {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "编辑成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "同一案例不能收藏在相同主题下"
            };
          } else {
            status = {
              status: "fail",
              text: "编辑失败"
            };
          }
        } else {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "收藏成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "请勿重复收藏"
            };
          } else if (data.message == "fail") {
            status = {
              status: "fail",
              text: "收藏失败"
            };
          }
        }

        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        status = {
          status: "fail",
          text: "收藏失败"
        };
        utils.operation_hints(status);
        remove();
      })

    },
    //添加笔记
    confirm_add_note: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      if (!$(this).hasClass('abled')) {
        return false;
      }
      $(this).removeClass('abled');
      var bz = elem.find(".note").val() == elem.find(".note").attr(
        "placeholder") ? "" : elem.find(".note").val().length > 300 ?
          elem.find(".note").val().substring(0, 300) : elem.find(".note").val();
      var bq = elem.find(".selected_label").val() == elem.find(
        ".selected_label").attr("placeholder") ? "" : elem.find(
          ".selected_label").val().length > 20 ? elem.find(
            ".selected_label").val().substring(0, 20) : elem.find(
              ".selected_label").val();
      var submit_data = {
        cLy: config.cLy,
        cBq: bq,
        cYynr: config.content,
        cBz: bz,
        cAjid: config.cAjid,
        cWsid: config.cWsid,
        cAjmc: config.cAjmc,
        cId: config.cId ? config.cId : ""
      }
      var url = config.url ? config.url : "/wdbj/insertBJ";
      utils.post_req(url, submit_data).done(function (response) {
        var data = utils.change_json(response);
        $(this).addClass('abled');
        if (config.cId) {
          if (data.isSuccess) {
            status = {
              status: "success",
              text: "保存成功"
            };
            if (config.callback) {
              config.callback(data.source);
            }
          } else {
            status = {
              status: "fail",
              text: "保存失败"
            };
          }
        } else {
          var status = {};
          if (data.msg == "保存成功") {
            if (config.callback) {
              config.callback(data.cId);
            }
            status = {
              status: "success",
              text: "保存成功"
            };
          } else {
            status = {
              status: "fail",
              text: "保存失败"
            };
          }
        }
        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        status = {
          status: "fail",
          text: "保存失败"
        };
        utils.operation_hints(status);
        remove();
      })
    },
    //收藏法条
    confirm_store_law: function () {
      if (actions.get_required_status() != 0) {
        return false;
      }
      var submit_data = {
        cId: config.cId ? config.cId : "",
        cMc: config.law_name,
        nSclx: 2,
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        cScnr: typeof config.cScnr == "string" ? config.cScnr : JSON.stringify(config.cScnr),
        cJstj: typeof config.cJstj == "string" ? config.cJstj : JSON.stringify(config.cJstj),
        ly: elem.find(".theme_input").attr("source"),
        flfgrq: config.flfgrq,
        nAjlx: cur_case_type
      }
      utils.post_req("/collection/updateWdsc", submit_data).done(function (response) {
        var data = utils.change_json(response);
        var status = {};
        if (config.cId) {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "编辑成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "同一法条不能收藏在相同主题下"
            };
          } else {
            status = {
              status: "fail",
              text: "编辑失败"
            };
          }
        } else {
          if (data.message == "success") {
            status = {
              status: "success",
              text: "收藏成功"
            };
            if (config.callback) {
              config.callback(submit_data);
            }
          } else if (data.message == "repeat") {
            status = {
              status: "warn",
              text: "请勿重复收藏"
            };
          } else if (data.message == "fail") {
            status = {
              status: "fail",
              text: "收藏失败"
            };
          }
        }

        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        status = {
          status: "fail",
          text: "收藏失败"
        };
        utils.operation_hints(status);
        remove();
      })
    },
    //导出时间线
    confirm_export_time_line: function () {
      var time_line_arr = []
      $.each($('.time_line_wrapper:first .time_item'), function (index, item) {
        var time_line_obj = {};
        time_line_obj.sj = $(item).find('.time').text();
        time_line_obj.yw = $(item).find('.content').text();
        time_line_obj.dl = $(item).find('.title').text();
        time_line_arr.push(time_line_obj);
      })
      var temp_obj = {
        sjxStr: time_line_arr,
        title: config.document_name,
        progressKey: config.progressKey
      };
      var form_config = {
        form_data: temp_obj,
        url: "/sjxExport",
        tag_name: "_self"
      };
      remove();
      setTimeout(function () {
        utils.form_submit(form_config);
        $('.myForm').remove();     //删除表单

      }, 600)
    },
    //组合检索的搜索suggest
    combination_search_suggest: function (input_ele, wrapper) {
      var cur_index = -1, //当前选中的项的索引
        search_value = ""; //搜索的内容
      //删除当前的suggest
      function remove_suggest() {
        if (wrapper.find(".suggest_container").length) {
          wrapper.find(".suggest_container").remove();
          $(document).off(".suggest_hide");
        }
      }
      //suggest显示
      //点击suggest上屏
      function click_suggest_to_screen() {
        enter_input_to_screen($(this));
        remove_suggest();
        input_ele.val('');
      }
      //删除上屏的某一项
      function delete_include_content() {
        var index = $(this).attr("index");
        store.include_data.splice(index, 1);
        render_include_content(store.include_data);
      }
      //点击显示二级suggest
      function second_level_suggest_show() {
        var index = $(this).attr("index");
        render_second_level_suggest(index, wrapper.find(
          ".suggest_container"));
      }
      //隐藏二级suggest
      function second_level_suggest_hide(e) {
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
        $.each(store.second_level_data[index], function (index, item) {
          html += '<li class="second_level_suggest_item" value="' +
            item.value + '" cfield="' + item.cfield + '" title="' + item.show +
            '"><span class="checkbox_bg"></span><span class="words">' + item.show + '</span></li>'
        });
        html += '</ul>';
        html += '</div>';
        html += '<a href="javascript:;" class="confirm_add_query">确认</a>';
        html += '</div>';
        wrapper.append(html).find(".first_level_suggest_list").hide();
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
        if (!store.include_data) {
          store.include_data = [];
        }
        $.each(elem.find(".second_level_suggest_item.active"), function () {
          var obj = {};
          obj.field = [];
          obj.cfield = "";
          obj.field.push({
            field: elem.find(".level_option_item.first.active").attr("field"),
            value: elem.find(".level_option_item.first.active").attr("value")
          })
          obj.cfield += elem.find(".level_option_item.first.active").html() + "：";
          obj.field.push({
            field: elem.find(".level_option_item.second.active").attr("field"),
            value: elem.find(".level_option_item.second.active").attr("value")
          })
          obj.cfield += elem.find(".level_option_item.second.active").html() + "：";
          var temp_arr = []
          $.each(elem.find(".level_option_item.third.active"), function () {
            obj.field.push({
              field: $(this).attr("field"),
              value: $(this).attr("value")
            })
            temp_arr.push($(this).html());
          })

          obj.value = $(this).attr("value");
          if (temp_arr.length) {
            obj.cfield += temp_arr.join("/");
            obj.cfield += '：';
          }
          obj.cfield += $(this).attr("cfield");
          elem.find(".level_option_item.third.active").removeClass("active");
          store.include_data.push(obj);
        })
        render_include_content(store.include_data);
        second_level_suggest_hide();
        wrapper.find(".suggest_container").remove();
        input_ele.val('').focus();
      }

      function render_include_content(data) {
        wrapper.find(".combination_search_screen_container").remove();
        if (!data.length) return;
        var html = '';
        html += '<div class="combination_search_screen_container">'
        $.each(data, function (index, item) {
          html += '<div class="combination_search_screen_item">';
          html += '<i class="icon-close delete_include_content" index="' + index + '"></i>';
          html += '<span class="text" title="' + item.cfield + '">' + item.cfield + '</span>';
          html += '</div>'
        })
        html += '</div>';
        wrapper.append(html);
      }

      function enter_input_to_screen(value) {
        if (!store.include_data) {
          store.include_data = [];
        }
        var obj = {};
        obj.field = [];
        obj.field = obj.field.concat(store.default_data);
        obj.cfield = "";
        obj.field.push({
          field: elem.find(".level_option_item.first.active").attr("field"),
          value: elem.find(".level_option_item.first.active").attr("value")
        })
        obj.cfield += elem.find(".level_option_item.first.active").html() + "：";
        obj.field.push({
          field: elem.find(".level_option_item.second.active").attr("field"),
          value: elem.find(".level_option_item.second.active").attr("value")
        })
        obj.cfield += elem.find(".level_option_item.second.active").html() + "：";
        var cfield_arr = [];
        if (typeof value == "object") {
          if (!/案由：/.test(value.attr("cfield"))) {
            $.each(elem.find(".level_option_item.third.active"), function () {
              obj.field.push({
                field: $(this).attr("field"),
                value: $(this).attr("value")
              })
              cfield_arr.push($(this).html());
            })
            obj.cfield += cfield_arr.join("/");
          }
        } else {
          $.each(elem.find(".level_option_item.third.active"), function () {
            obj.field.push({
              field: $(this).attr("field"),
              value: $(this).attr("value")
            })
            cfield_arr.push($(this).html());
          })
          obj.cfield += cfield_arr.join("/");
        }

        if (cfield_arr.length) {
          obj.cfield += "：";
        }
        if (typeof value == "string") {
          obj.value = value;
          obj.cfield += value;
        } else {
          obj.value = value.attr("value");
          obj.cfield += value.attr("cfield");
        }
        input_ele.val("").focus();
        elem.find(".level_option_item.third.active").removeClass("active");
        if (is_cfield_repeat(obj.cfield) != 0) {
          return;
        }
        store.include_data.push(obj);
        render_include_content(store.include_data);
      }

      function is_cfield_repeat(cur_cfield) {
        var count = 0;
        $.each(store.include_data, function (index, item) {
          if (cur_cfield == item.cfield) {
            count += 1;
          }
        })
        return count;
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
        wrapper.find(".suggest_container .suggest_item").each(function (
          index, item) {
          if (cur_index != index) {
            $(this).removeClass("active");
          } else {
            $(this).addClass("active");
          }
        })
      }

      function render_suggest_data(data) {
        if (!data.length) {
          return;
        }
        var html = '';
        store.second_level_data = {};
        html += '<div class="suggest_container">';
        html += '<div class="first_level_suggest_list">';
        $.each(data, function (index, item) {
          if (item.title != "引导项") {
            html += '<div class="suggest_info">';
            html += '<h2 class="suggest_title">' + item.title + '</h2>';
            html += '<ul>';
            $.each(item.ary, function (index, item) {
              html += '<li class="common_suggest_item suggest_item" value="' + item.value + '" cfield="' +
                item.cfield + '" title="' + item.show + '">' + item.show + '</li>';
            });
            html += '</ul>';
            html += '</div>'
          } else {
            html += '<div class="guide_suggest_info">';
            html += '<h2 class="suggest_title">' + item.title + '</h2>';
            html += '<ul>';
            $.each(item.ary, function (index, item) {
              html += '<li class="guide_suggest_item suggest_item" index="' + index + '" title="' + item.show +
                '"><i class="icon-linear-arrow-right"></i><span>' + item.show + '</span></li>';
              store.second_level_data[index] = item.ary;
            });
            html += '</ul>';
            html += '</div>';
          }

        });
        html += '</div>';
        html += '</div>';
        wrapper.append(html);
        $(document).on("click.suggest_hide", function (e) {
          if ($(e.target).closest(".suggest_container").length == 0) {
            wrapper.find(".suggest_container").hide();
            $(document).off(".suggest_hide");
          }
        })
      }
      //搜索
      function search() {
        cur_index = -1;
        remove_suggest();
        var key = utils.delete_space(input_ele.val());
        if (key == "") {
          return;
        }
        if (elem.find(".level_option_item.first.active").length == 0) {
          elem.find(".level_option_item.first").addClass("required");
          input_ele.val('').blur();
          return;
        }
        if (elem.find(".level_option_item.second.active").length == 0) {
          elem.find(".level_option_item.second").addClass("required");
          input_ele.val('').blur();
          return;
        }
        show_flag = Math.random();
        var temp_arr = [];
        $.each(elem.find(".level_option_item.third.active"), function () {
          temp_arr.push($(this).attr("value"));
        })
        var data = {
          showFlag: show_flag,
          searchKey: key,
          query: JSON.stringify(config.query),
          filter: JSON.stringify(config.filter),
          advs: JSON.stringify(config.advs),
          ssjd: elem.find(".level_option_item.first.active").attr("value"),
          wszl: elem.find(".level_option_item.second.active").attr("value"),
          fd: JSON.stringify(temp_arr),
          nAjlx: config.nAjlx
        }
        utils.post_req("/ajax/advs/suggest", data).done(function (response) {
          delete temp_arr;
          var data = utils.change_json(response);

          if (data != {}) {
            if (show_flag == data.showFlag) {
              render_suggest_data(data.result.suggests)
            }
          }
        })
      }

      function enter_event() {
        var value = input_ele.val();
        if (utils.delete_space(input_ele.val()).length == 0 || value == input_ele.attr("placeholder")) {
          input_ele.blur();
          utils.operation_hints({
            status: "warn",
            text: "请输入正确的检索条件"
          });
        } else if (value.length != 0 && value != input_ele.attr("placeholder")) {
          if (cur_index == -1) {
            if (value == "?" || value == "？") {
              input_ele.val("结案方式：").focus();
              return;
            } else {
              enter_input_to_screen(value);
              remove_suggest();
            }
          } else if (cur_index != -1) {
            var cur_suggest_item = wrapper.find(".suggest_container .suggest_item").eq(cur_index);
            if (cur_suggest_item.hasClass("common_suggest_item")) {
              enter_input_to_screen(cur_suggest_item);
              input_ele.val('');
              remove_suggest();
            } else if (cur_suggest_item.hasClass("guide_suggest_item")) {
              var index = cur_suggest_item.attr("index");
              render_second_level_suggest(index, wrapper.find(".suggest_container"));
            }
          }
        }
      }
      //按键事件
      function press_key(event) {
        input_ele.removeClass("required");
        if (event.keyCode != 13 && event.keyCode != 38 && event.keyCode != 40) {
          search();
        }
        change_cur_index(event);
        if (event.keyCode == 13) {
          enter_event(event);
        }
      }

      function init() {
        input_ele.on("keyup", press_key);
        wrapper
          .off()
          .on("click", ".common_suggest_item", click_suggest_to_screen)
          .on("click", ".delete_include_content", delete_include_content)
          .on("click", ".guide_suggest_item", second_level_suggest_show)
          .on("click", ".to_first_suggest", second_level_suggest_hide)
          .on("click", ".second_level_suggest_item", select_second_level_suggest_item)
          .on("click", ".confirm_add_query", add_second_suggest_screen_query);
      }

      init();
    },
    //组合检索不包含内容
    not_include_content_event: function (event) {
      $(this).removeClass("required");
      var key = $(this).val();
      if (!key) return;
      if (event.keyCode == 13) {
        $.each(config.query, function (index, item) {
          if (("-" + key) == item.cfield) {
            config.query.splice(index, 1)
          }
        })

        var arr = key.trim().split(/\s+/);
        for (var i = 0; i < arr.length; i++) {
          if (store.not_include_data.length == 0) {
            store.not_include_data.push({
              field: "all",
              cfield: "-" + arr[i],
              value: "-" + arr[i]
            });
          } else {
            var repeat = false;
            for (var j = 0; j < store.not_include_data.length; j++) {
              if (store.not_include_data[j].cfield == ("-" + arr[i])) {
                repeat = true;
                break;
              }
            }
            if (!repeat) {
              store.not_include_data.push({
                field: "all",
                cfield: "-" + arr[i],
                value: "-" + arr[i]
              });
            }
          }
        }
        $(this).val("");
        render_not_include_content(store.not_include_data);
      }

      function render_not_include_content(data) {
        elem.find(".not_include_content_wrapper").find(".combination_search_screen_container").remove();
        var html = '';
        if (!data.length) return;
        html += '<div class="combination_search_screen_container">'
        $.each(data, function (index, item) {
          html += '<div class="combination_search_screen_item">';
          html += '<i class="icon-close delete_not_include_content"></i>';
          html += '<span class="text" title="' + item.cfield + '" index="' + index + '">' + item.cfield + '</span>';
          html += '</div>'
        })
        html += '</div>';
        elem.find(".not_include_content_wrapper").append(html).off('click')
          .on("click", ".delete_not_include_content",
            delete_not_include_content)

        function delete_not_include_content() {
          var index = $(this).next('span').attr("index");
          store.not_include_data.splice(index, 1);
          render_not_include_content(store.not_include_data);
        }
      }

    },
    confirm_combination_search: function () {
      if (elem.find(".include_content").val() && elem.find(
        ".include_content").val() != elem.find(".include_content").attr("placeholder")) {
        var value = elem.find(".include_content").val();
        if (!store.include_data) {
          store.include_data = [];
        }
        var obj = {};
        obj.field = [];
        obj.field = obj.field.concat(store.default_data);
        obj.cfield = "";
        obj.field.push({
          field: elem.find(".level_option_item.first.active").attr("field"),
          value: elem.find(".level_option_item.first.active").attr("value")
        })
        obj.cfield += elem.find(".level_option_item.first.active").html() + "：";
        obj.field.push({
          field: elem.find(".level_option_item.second.active").attr("field"),
          value: elem.find(".level_option_item.second.active").attr("value")
        })
        obj.cfield += elem.find(".level_option_item.second.active").html() + "："
        var temp_arr = [];
        $.each(elem.find(".level_option_item.third.active"), function () {
          obj.field.push({
            field: $(this).attr("field"),
            value: $(this).attr("value")
          })
          temp_arr.push($(this).html());
        })
        obj.cfield += temp_arr.join("/");
        if (temp_arr.length) {
          obj.cfield += "：";
        }
        obj.value = value;
        obj.cfield += value;
        elem.find(".level_option_item.third.active").removeClass("active");
        store.include_data.push(obj);
      }
      if (elem.find(".not_include_content").val() && elem.find(
        ".not_include_content").val() != elem.find(".not_include_content")
          .attr("placeholder") && utils.delete_space(elem.find(
            ".not_include_content").val()).length > 0) {
        var key = elem.find(".not_include_content").val();
        var arr = key.trim().split(/\s+/); //去重
        for (var i = 0; i < arr.length; i++) {
          if (store.not_include_data.length == 0) {
            store.not_include_data.push({
              field: "all",
              cfield: "-" + arr[i],
              value: "-" + arr[i]
            });
          } else {
            var repeat = false;
            for (var j = 0; j < store.not_include_data.length; j++) {
              if (store.not_include_data[j].cfield == ("-" + arr[i])) {
                repeat = true;
                break;
              }
            }
            if (!repeat) {
              store.not_include_data.push({
                field: "all",
                cfield: "-" + arr[i],
                value: "-" + arr[i]
              });
            }
          }
        }
      }
      if (store.include_data.length == 0 && store.not_include_data.length == 0) {
        if (elem.find(".level_option_item.first.active").length == 0) {
          elem.find(".level_option_item.first").addClass("required");
          elem.find(".level_option_item.second").addClass("required");
        } else {
          if (elem.find(".level_option_item.second.active").length == 0) {
            elem.find(".level_option_item.second").addClass("required");
          }
        }
        elem.find(".include_content").addClass("required");
        elem.find(".not_include_content").addClass("required");
        return;
      }
      var form_config = {
        form_data: {
          query: config.query.concat(store.not_include_data),
          filter: config.filter,
          advs: config.advs.concat(store.include_data),
          includeJcy: config.includeJcy,
          nAjlx: config.nAjlx
        },
        url: "/basicSearch/search",
        tag_name: "_self"
      }
      utils.form_submit(form_config)
    },
    to_fb: function () {
      var form = document.createElement("FORM");
      document.body.appendChild(form);
      form.action = elem.find(".charge_item.active").attr("_href");
      form.target = "_blank";
      form.method = "post";
      form.submit();
      document.body.removeChild(form);
    },
    confirm_store_video: function () {
      //收藏
      if (actions.get_required_status() != 0) {
        return false;
      }

      var submit_data = {
        cMc: (config.AH ? config.AH : config.cMc),
        nSclx: config.nSclx,
        cAjxm: elem.find(".theme_input").attr("theme_id"),
        cAjxmmc: utils.delete_space(elem.find(".theme_input").val() ==
          elem.find(".theme_input").attr("placeholder") ? "" : elem.find(".theme_input").val()),
        cScnr: config.cScnr,
        nZtly: elem.find(".theme_input").attr("source"),
        cJstj: typeof config.cJstj == "string" ? config.cJstj : JSON.stringify(config.cJstj),
        cScnrzj: config.cScnrzj,
        cId: config.cId,
        nAjlx: cur_case_type
      }
      utils.post_req("/cpgdfx/operateSc", submit_data).done(function (response) {
        var data = utils.change_json(response);
        var status = {};
        if (data.msg == "收藏成功") {
          status = {
            status: "success",
            text: "收藏成功"
          };
          if (config.callback) {
            config.callback(submit_data);
          }
        } else if (data.msg == "重复收藏") {
          if (config.nSclx == 9) {
            status = {
              status: "warn",
              text: "同一庭审资料不能收藏在同一主题下"
            };
          } else if (config.nSclx == 10) {
            status = {
              status: "warn",
              text: "同一图文直播不能收藏在同一主题下"
            };
          } else if (config.nSclx == 11) {
            status = {
              status: "warn",
              text: "同一文章观点不能收藏在同一主题下"
            };
          }
        } else if (data.msg == "修改成功") {
          status = {
            status: "success",
            text: "编辑成功"
          };
          if (config.callback) {
            config.callback(submit_data);
          }
        } else if (data.msg == "修改失败") {
          status = {
            status: "warn",
            text: "编辑失败"
          };
        } else {
          status = {
            status: "fail",
            text: "收藏失败"
          };
        }
        utils.operation_hints(status);
        remove();
      }).fail(function () {
        var status = {};
        status = {
          status: "fail",
          text: "收藏失败"
        };
        utils.operation_hints(status);
        remove();
      })
    },
    close_court_video: function () {
      remove()
    },
    affirm_video: function () {
      var url = $('.videos_second_list.active').find('.ah').attr('data-url')
      window.open(url);
    },
    confirm_live_image: function () {
      elem.find('.look_large_images')
      var large_images = $('.look_large_images img');
      var img_src = $(this).attr('src')
      $.each($('.images_list ul').find('img'), function (index, item) {
        config.img_arr.push($(item).attr('src'))
      });
      large_images.attr('src', img_src)
      $('.images_list ul').hide();
      $('.look_large_images').show();
      elem.find('#pagination_container').hide();
      large_images.animate({
        'width': '100%',
        'height': '300px'
      }, 1000, function () {
        $('.control_button').show()
      });
      config.current_page = $(this).attr('data-index');

    },
    confirm_live_pre_page: function () {
      if (config.current_page - 1 < 0) {
        config.current_page = config.img_arr.length;
      }
      $(this).addClass('active').siblings().removeClass('active')
      config.current_page--;
      $('.look_large_images img').attr('src', config.img_arr[config.current_page])
    },
    confirm_live_next_page: function () {
      $(this).addClass('active').siblings().removeClass('active')
      if (config.current_page > config.img_arr.length - 1) {
        config.current_page = 0;
      }
      config.current_page++;
      $('.look_large_images img').attr('src', config.img_arr[config.current_page])
    },
    confirm_close_live: function () {
      $(this).addClass('active').siblings().removeClass('active')
      $('.control_button').hide();
      $('.look_large_images img').animate({
        'width': '0',
        'height': '0'
      }, 1000, function () {
        $('.look_large_images').hide();
        $('.images_list ul').show();
        $('.look_large_images img').css({
          'width': '30%',
          'height': 'auto'
        })
        elem.find('#pagination_container').show();
      })
      $(this).removeClass('active')

    },
    get_member_info: function () {
      if (actions.get_required_status() != 0 || $(this).hasClass('disabled')) {
        return false;
      }
      var type = "confirm_" + config.type;
      //判断是不是会员
      //不是会员出现免费体验弹窗
      if (config.member_info.is_member) {
        actions[type]()  //调用之前的逻辑
      }
      else if (config.member_info.remainingTimes) {
        config.form_obj = actions[type]()
        elem.html(render_fn.render_use_tips());
      } else {
        config.form_obj = actions[type]()   //调用这个之前的逻辑获取参数
        var html = '';
        html += '<a href="javascript:;" class="dialog_close_btn"><i class="icon-close"></i></a>'
        html += '<div class = "free_trial_container" >'
        html += '<div class = "free_trial_item">'
        html += '<div class="dialog_header"><h2 class="dialog_title">付费后使用高级功能</h2></div>'
        html += '<div class = "dialog_body">'
        html += '<div class = "details">'
        if (config.member_info.remainingFreeTimes) {
          html += '<div class = "hint">'
          html += '<span class = "hint_time" >您剩余' + config.member_info.remainingFreeTimes + '次"' + config.title + '"试用机会，已试用' + config.member_info.usageCount + '次。</span>'
          html += '<input type = "button" value = "免费体验" class = "confirm_free_button" />'
          html += '</div>'
        }
        html += '<ul class = "price">'
        html += '<li class = "unit_price">'
        html += '<span class = "key blue">商品名称</span>'
        html += '<div class = "commodity" >'
        $.each(config.list, function (index, item) {
          html += '<span class = " ' + (item.featureName == "jsbg" ? "jsbg" : "vip active") + ' confirm_kind" data-val = "' + item.featureName + '">' + item.cname + '</span>'
        })
        html += '<a class = "commodity_describe" href = "http://www.chineselaw.com/www/public/js/components/' + base_path + '/pricing" target = "_blank">'
        html += '<p class = "learn_more">智库全线功能无限次使用 了解更多</p>'
        html += '</a>'
        html += '</div>'
        html += '</li>'
        html += '<li class = "expire_time">'
        html += '<span class = "blue">到期时间</span>'
        html += '<span>' + config.list[1].expireDate + '</span>'
        html += '</li>'
        html += '<li class = "actual_payment ">'
        html += '<span class = "blue last_key">实际支付</span>'
        html += '<span class = "last">¥<span class = "big_price">' + config.list[1].price + '</span>/<span class = "unit" >' + config.list[1].unit + '</span></span>'
        html += '</li>'
        html += '</ul>'
        html += '<div class = "pattern_payment">'
        html += '<span class = "float_elem">支付方式</span>'
        html += '<div class = "float_elem mode confirm_change_pattern_payment active" data-val= "wx"><a><img src = "' + base_path + '/www/public/img/wx.png"/*tpa=http://www.chineselaw.com/www/public/js/components/' + base_path + '/www/public/img/wx.png*/ /></a> 微信支付</div>'
        html += '<div class = "float_elem mode confirm_change_pattern_payment" data-val = "zfb"><a><img src = "' + base_path + '/www/public/img/zfb.png"/*tpa=http://www.chineselaw.com/www/public/js/components/' + base_path + '/www/public/img/zfb.png*/ /><span></a> 支付宝</span></div>'
        html += '<div class = "float_elem  confirm_change_pattern_payment" data-val = "dhm"><span>兑换码</span></div>'
        html += '</div>'
        html += '</div>'
        html += '</div>'
        html += '<div class = "dialog_footer one_btn zf_button" >'
        html += '<a href="javascript:;" class="confirm_btn confirm_pay ">去支付</a>'
        html += '</div>'
        html += '</div>';
        elem.html(html);
      }
    },
    confirm_free_trial: function () {   //检索报告用的
      if (actions.get_required_status() != 0 || $(this).hasClass('disabled')) {
        return false;
      }
      if (config.type == "create_report" || config.type == "create_new_report") {
        utils.post_req('/getFreeTimes', config.times_data).done(function (res) {
          var data = JSON.parse(res);
          config.member_info = {
            is_member: data.useDirectly,
            remainingFreeTimes: data.remainingFreeTimes,     //剩余免费次数
            usageCount: data.usageCount,
            remainingTimes: data.remainingTimes, //已免费使用次数
          };
          config.list = data.featureList;
          config.changeAddress = data.changeAddress
          actions.get_member_info();
        })
      } else {
        actions.get_member_info();
      }
    },
    confirm_free_button: function () {
      actions.confirm_consumption(1)
    },
    confirm_change_pattern_payment: function () {     //切换支付方式
      var change_type = elem.find('.mode');
      var val = $(this).attr('data-val');
      if (val == 'dhm') {
        actions.confirm_pay(val);
        console.log('11')
      } else {
        change_type.removeClass('active');
        $(this).addClass('active');
        elem.find('.confirm_pay').removeClass('disabled').addClass('abled');
      }
    },
    confirm_kind: function () {      //切换种类
      var confirm_kind = elem.find('.confirm_kind');
      var big_price = elem.find('.big_price');
      var expire_time = elem.find('.expire_time span').eq(1);
      var unit = elem.find('.unit');
      var trigger = this;
      confirm_kind.removeClass('active');
      $(this).addClass('active');
      $.each(config.list, function (index, item) {
        if (item.cname === $(trigger).text()) {
          big_price.text(item.price);
          expire_time.text(item.expireDate)
          if (item.featureName === 'vip') {
            unit.text('年')
          } else {
            unit.text('次')
          }
          return false;
        }
      })

    },
    confirm_pay: function (val) {      //去支付
      var cdata = {
        unit_price: elem.find('.confirm_kind.active').text() || '智库vip',  //没有的话用vip
        pattern_payment: elem.find('.confirm_change_pattern_payment.active').text(),
        featureName: elem.find('.confirm_kind.active').attr('data-val'),
        payType: elem.find('.confirm_change_pattern_payment.active').attr('data-val'),
        price: elem.find('.big_price').text(),
        unit: elem.find('.unit').text(),
        expire_time: elem.find('.expire_time span').eq(1).text()
      }
      if (val == 'dhm') {
        elem.find(".free_trial_container").append(render_fn.render_change_feedback(cdata));
        window.open(config.changeAddress)    //打开新页面
        console.log('打开兑换页面')
        new_page()
        return false;
      } else {
        utils.post_req('/getOrder', {
          featureName: elem.find('.confirm_kind.active').attr('data-val') || "vip",
          payType: elem.find('.confirm_change_pattern_payment.active').attr('data-val')
        }, { async: false }).done(function (res) {
          var data = JSON.parse(res)
          if (data.success) {
            elem.find(".free_trial_container").append(render_fn.render_pay_feedback(cdata));
            window.open(data.orderUrl)    //打开新页面
            new_page()
          } else {
            console.error('失败了呀')
          }
        })
      }
      //新页面的逻辑
      function new_page() {
        elem.find(".free_trial_container .free_trial_item").eq(1).addClass('active');
        elem.find(".free_trial_container .free_trial_item").eq(0).addClass('animate')
        elem.find(".free_trial_container .free_trial_item").eq(1).animate({
          opacity: 1,
          left: '0px'
        })
        var payment_failure = elem.find('.payment_failure');    //支付失败
        var pay_succeed = elem.find('.pay_succeed');       //支付成功
        pay_succeed.on('click', function () {
          utils.post_req('/getFreeTimes', config.times_data).done(function (res) {
            var data = JSON.parse(res);
            config.changeAddress = data.changeAddress
            if (data.useDirectly) {
              to_details();
            }
            else {
              if (data.remainingTimes > 0) {   //弹出确认消耗
                elem.find(".free_trial_container .free_trial_item").eq(1).animate({
                  'left': '-600px',
                  opacity: 0
                });
                setTimeout(function () {
                  elem.find(".free_trial_container").html(render_fn.render_use_tips());
                  var better_use = elem.find('.payment_failure');    //稍后再用
                  var confirm_expend = elem.find('.pay_succeed');       //确认消耗
                  confirm_expend.on('click', to_details)
                  better_use.on('click', function () {
                    remove();
                  })
                }, 1000)
              }
              else {   //出现支付的弹窗
                elem.find(".free_trial_container .free_trial_item").eq(0).removeClass('animate');
                elem.find(".free_trial_container .free_trial_item").eq(1).addClass('animate_2')
                  .animate({
                    opacity: 0,
                    left: '600px'
                  }).remove();
              }
            }
          })
        })
        payment_failure.on('click', function () {
          remove();
        })
      }
      //直接跳的逻辑
      function to_details() {
        actions.confirm_consumption(0)
      }

  },
    confirm_consumption: function (reduceType) {
      var trigger = this;
  if (typeof reduceType != 'number') {
    reduceType = 2
  }
  if (typeof config.callback === 'function') {
    config.callback(reduceType)
  } else {
    if (config.is_ajax) {    //ajax请求
      var data = config.form_obj ? config.form_obj : actions["confirm_" + config.type](); //调用之前的逻辑
      data.reduceType = reduceType;
      actions["confirm_" + config.ajax_type](trigger, data)
    } else {
      var data = config.form_obj ? config.form_obj : actions["confirm_" + config.type](); //调用之前的逻辑
      data.form_data.reduceType = reduceType;
      if (config.type === "create_report") {    //检索报告
        config.callback.reset_count()
      }
      utils.form_submit(data);
    }
  }
  remove();

},
confirm_use_later: function () {
  remove();
}



  }
var content_data = {
  login: function () {
    place($(".username"));
    place($(".pwd"));
    init($(".username"));
    init($(".pwd"));

    $(".pwd").focus(function () {
      $(this).css("background", "#ffffff");
    })
    //敲回车登录成功
    $('#zhanghao,#mima').on('keydown', function (ev) {
      if (ev.keyCode == 13) {
        ev.returnValue = false;
        ev.cancel = true;
        elem.find('.loginBtn').trigger('click');
      }
    })
    /*密码输入框失去焦点判断*/
    $(".pwd").blur(function () {
      var password = $(this).val();
      if (!password || password.length == 0) {
        //没填k
        errorLog(4003);
      } else {
        $(".tipWord").hide();
      }
    })

    $(".username").focus(function () {
      $(this).css("background", "#ffffff");
    })

    /*登录输入框失去焦点判断*/
    $(".username").blur(function () {
      var loginStr = $(this).val().trim();
      if (!loginStr || loginStr.length == 0) {
        //没填
        errorLog(4002);
        return;
      } else {
        //判断是否需要验证码
        $.post(base_path + "/checkValitCode", {
          loginStr: loginStr
        }, function (ret) {
          if (ret.code == 5001) {
            valitCode();
          } else if (ret.code == 5003) {
            lockedTime = ret.lockedTime;
            errorLog(ret.code);
          } else {
            isValitCode = false;
            $("#dom_id").hide();
            $(".valicode").hide();
          }
        })
      }
      if (phoneFilter.test(loginStr)) {
        //手机号
        $.post(base_path + "/checkPhone", {
          phone: loginStr
        }, function (ret) {
          if (ret.errorCode == 0) {
            errorLog(5007);
          } else {
            $(".tipWord").hide();
          }
        })
      } else if (mailFilter.test(loginStr)) {
        //邮箱
        $.post(base_path + "/checkEmail", {
          email: loginStr
        }, function (ret) {
          if (ret.errorCode == 0) {
            errorLog(5008);
          } else {
            $(".tipWord").hide();
          }
        })
      } else {
        //用户loginId
        $.post(base_path + "/checkLoginId", {
          loginId: loginStr
        }, function (ret) {
          if (ret.errorCode == 0) {
            errorLog(5009);
          }
        })
      }
    });

    /*一周免登陆*/
    $(".mdl").on("click", function () {
      if ($(this).attr("data-value") == "false") {
        $(this).find("img").attr("src", base_path + "/www/login/img/checked2.png");
        $(this).attr("data-value", "true");
      } else {
        $(this).find("img").attr("src", base_path + "/www/login/img/checked1.png");
        $(this).attr("data-value", "false");
      }
    })

    /* 切换登录方式 */
    $(".chioseWay").click(function () {
      if ($(this).hasClass("wxlogin")) {
        $(this).addClass("clicked");
        $(".zhlogin").removeClass("clicked");
        $(".wxewmWrap").show();
        $(".zhloginWrap").hide();
      } else if ($(this).hasClass("zhlogin")) {
        $(this).addClass("clicked");
        $(".wxlogin").removeClass("clicked");
        $(".zhloginWrap").show();
        $(".wxewmWrap").hide();
      }
    })

    /*忘记密码*/
    $(".wjmm").click(function () {
      window.open(store.sso_url + "/findPwd/forgotPwd?originUrl=" + store.sso_url + "&appId=ajypfx")
    })

    /*登录*/
    $(".loginBtn").on("click", function () {
      denglu()
    })

    /*获取微信二维码*/
    getWechatQrcode();

    function getWechatQrcode() {
      var base = new Base64();
      var originUrl = base.encode(encodeURI(wxcallback));
      store.origin_url = originUrl;

      utils.post_req("/popWechatLogin", {
        originUrl: originUrl,
        appId: "ajypfx"
      }).done(function (response) {
        var result = utils.change_json(response);
        var url = result.respData.wxredirecturl;
        store.sso_url = result.respData.ssourl;
        store.urlId = result.respData.urlId;
        new WxLogin({
          id: "wxcode",
          appid: result.respData.wxappid,
          scope: "snsapi_login",
          redirect_uri: url,
          state: "ajypfx",
          style: "",
          href: base_path + "/www/login/css/wx.css"
        });
      })
    }

    function denglu() {
      var loginId = $(".zh").val().trim();
      var password = $(".mm").val();
      if (loginId.length == 0 && password.length != 0) { /*请输入账户名*/
        $(".zh").focus();
        errorLog(4002);
      } else if (loginId.length != 0 && password.length == 0) { /*请输入密码*/
        $(".pwd").focus();
        errorLog(4003);
      } else if (loginId.length == 0 && password.length == 0) { /*请输入账户名和密码*/
        errorLog(4004);
        return
      } else {
        /*验证码验证*/
        if (isValitCode) {
          if (yzm.length == 0) {
            //未验证
            errorLog(4005);
            return
          } else if (yzm.errorCode != 0) {
            //验证码错误
            errorLog(5006);
            return
          }
        }

        utils.post_req("/passwordLogin", {
          originUrl: store.origin_url,
          appId: "ajypfx",
          loginId: loginId,
          password: password,
          rememberMe: $(".mdl").attr("data-value"),
          nDm: cur_case_type
        }).done(function (response) {
          var data = utils.change_json(response);
          if (data.code == 1) {
            var jsObj = {}
            jsObj.token = data.data.url.replace(
              /^.+?_hyyd_tparams_\=/, '');
            jsObj.rememberMe = $(".mdl").attr("data-value");
            login_success_callback(jsObj.token, jsObj.rememberMe,
              data.data);
          } else if (data.code == 5000) {
            //登录失败
            errorLog(data.code);
          } else if (data.code == 5001) {
            //需要验证码
            errorLog(data.code);
          } else if (data.code == 5003) {
            //账号锁定
            lockedTime = data.data.lockedTime;
            errorLog(data.code);
          } else if (data.code == 3) {
            //账号锁定
            errorLog(data.code);
          }
        })
      }
    }

    function login_success_callback(token, rememberMe, data) {
      user_photo_src = data.user.image;
      user_status = data.user.status;
      user_manage_url = data.user.manageUrl;
      user_name = data.user.name;
      category = data.user.category;
      if (config.render_user_callback) {
        config.render_user_callback(); //渲染用户
      }
      remove();

      //登录成功后再跳转一下通行证，否则无法实现单点登录
      var url = base_path + "/loginCallBack?urlId=" + store.urlId;
      window.location.href = store.sso_url + "/ajypfxlogin?originUrl=" + url +
        "&token=" + token + "&rememberMe=" + rememberMe;
    }
  },
  get_same_type_judge: function () {
    loading.run(elem.find(".judge_list"));
    utils.post_req(config.url, config.condition).done(function (response) {
      loading.run();
      var data = utils.change_json(response);
      if (data.length == 0) {
        utils.no_result({
          parent_elem: elem.find(".judge_list"),
          img_name: "no_result",
          text: "无同类型法官"
        });
        return;
      }
      render(data);
    })

    function render(data) {
      var pageSize = 21;
      var maxCount = data.length;
      var maxPage = Math.ceil(maxCount / pageSize);
      var curPage = 1;
      var listData = {};

      function init() {
        if (maxCount === 0) {
          return;
        }
        for (var i = 0; i < maxPage; i++) {
          listData[(i + 1)] = [];
          for (var j = (i * pageSize); j < ((i + 1) * pageSize); j++) {
            if (data[j]) {
              listData[(i + 1)].push(data[j]);
            }
          }
        }
        renderList(curPage);
      }

      function renderList(curPage) {
        var html = '';
        $.each(listData[curPage], function (index, item) {
          html += '<li class="judge_item">';
          html += '<span class="judge_name" fgId="' + item.fgId + '">' + item.name + '</span>';
          html += '<span class="count">（' + item.ajNum + '）</span>';
          html += '</li>';
        });
        elem.find(".judge_list ul").empty().html(html);

        pagination({
          total_num: maxCount,
          cur_page: curPage,
          page_size: pageSize,
          jump: true,
          elem: elem.find(".pagination_container"),
          callback: renderList
        })
      }
      init();
    }
  },
  all_case: function () { //全案由的弹窗
    init()
    var data = config.data

    function init() {
      get_data()
      if (config.callback && typeof config.callback == 'function') {
        config.callback('/cpgdfx/aySuggest', $('.theme_filter'), elem, get_data)
      }
    }

    function get_data(current_page, ay, searchKey) {
      //初始化
      config.data.currentPage = current_page ? current_page : 1;
      config.data.ay = ay ? ay : '';
      config.data.searchKey = searchKey ? searchKey : ''
      utils.post_req(config.url, config.data).done(function (response) {
        loading.run();
        var data = utils.change_json(response);
        //如果没有数据
        if (data.allCount == 0) {
          utils.no_result({
            parent_elem: elem.find(".all_cause_info"),
            img_name: "no_result",
            text: "暂无数据"
          });
          return;
        }

        render_nav_list(data)
      })

      function render_nav_list(data) {
        var html = ''
        var list = data.videos ? data.videos : data.livetrials;
        var pageSize = data.pageSize;
        var maxCount = data.allCount;
        var maxPage = Math.ceil(maxCount / pageSize);
        var curPage = data.currentPage;
        if (data.videos) {
          $.each(list, function (index, item) {
            html += '<li class = "ah" title = ' + (utils.delete_space(item.AH)) + '><a href = ' + item.TSLXDZ +
              ' target = "_blank">' + item.AH + '</a></li>'
            html += '<li class = "ay" title=' + (utils.delete_space(item.WZAY)) + '>' + item.WZAY + '</li>'
            html += '<li class = "time">' + item.KTSJ.substring(0, item.KTSJ.indexOf('日') + 1) + '</li>'
          })
          elem.find('.nav_list').empty().html(html)
          elem.find('.nav li').last().addClass('time')
          pagination({
            total_num: maxCount,
            cur_page: curPage,
            page_size: pageSize,
            jump: true,
            elem: elem.find(".pagination_container"),
            callback: function truning_page(page) {
              get_data(page, ay, searchKey)
            }
          })

        } else {
          $.each(data.livetrials, function (index, item) {
            var url = base_path + '/cpgdfx/liveTrial/' + item.chat_id
            html += '<a href = ' + url + ' target = "_blank"><li class = "ah" id="court_video" title = ' +
              (utils.delete_space(item.title)) + ' >' + item.title + '</li></a>'
            html += '<li class = "live_time">' + item.live_date + '</li>'
          })
          elem.find('.nav_list').empty().html(html)
          elem.find('.nav li').css({
            'width': '50%'
          }).last().css({
            'text-align': 'right'
          });
          elem.find('.nav_list .live_time').css({
            'width': '25%'
          })
          pagination({
            total_num: maxCount,
            cur_page: curPage,
            page_size: pageSize,
            jump: true,
            elem: elem.find(".pagination_container"),
            callback: function truning_page(page) {
              get_data(page, ay, searchKey)

            }
          })
        }
      }

      function percentage(elem, page_size) {
        var count = elem.length;
        var percentage = page_size ? (100 / (elem.length) * page_size) + '%' : (100 / (elem.length) + '%')
        elem.css({
          'width': percentage
        })
      }
    }
  },

  all_court_image_text: function () {
    function render_image_text(cur_page) {
      loading.run(elem.find(".images_text_list"));
      config.data.currentPage = cur_page ? cur_page : 1;
      config.data.searchKey = '';
      utils.post_req(config.url, config.data).done(function (response) {
        loading.run();
        var data = utils.change_json(response);
        if (data.allCount == 0) {
          utils.no_result({
            img_name: "no_result",
            text: "暂无数据",
            parent_elem: $('.images_text_list')
          })
          return;
        }
        render_list(data);
      })
      if (config.callback) {
        config.callback($('.theme_filter'), elem, render_image_text)
      }
    }
    render_image_text()

    function render_list(data) {
      var html = ''
      var pageSize = data.pageSize;
      var maxCount = data.allCount;
      var maxPage = Math.ceil(maxCount / pageSize);
      var curPage = data.currentPage;
      var listData = {};
      $.each(data.livetrials, function (index, item) {
        var url = base_path + '/cpgdfx/liveTrial/' + item.chat_id
        html += '<li>'
        html += '<ul class = "videos_second_list" >'
        html += '<a href = ' + url + ' target = "_blank" ><li class = "ah" title = ' + item.title +
          ' >' + item.title + '</li></a>'
        html += '<li class = "time">' + item.live_date + '</li>'
        html += '</ul>'
        html += '</li>'
      })
      elem.find('.images_text_list ul').empty().html(html)
      pagination({
        total_num: maxCount,
        cur_page: curPage,
        page_size: pageSize,
        jump: false,
        elem: elem.find(".pagination_container"),
        callback: render_image_text
      })
    }

  },
  //全部直播图片
  all_live_image: function () {
    render_list()

    function render_list(curPage) {
      var html = '';
      var maxCount = config.list.length;
      var pageSize = 9;
      var curPage = curPage ? curPage : 1;
      var arr = config.list.slice((curPage - 1) * pageSize, curPage * pageSize)
      $.each(arr, function (index, item) {
        if ((index + 2) % 3 == 0) {
          html += '<li class = "center_image">'
        } else {
          html += '<li>'
        }
        html += '<div><img class = "confirm_live_image" src = ' + item.picUrl + ' data-index = ' + index + ' />'
        html += '<p title = ' + item.picName + ' >' + item.picName + '</p></div>'
        html += '</li>'
      })
      elem.find('.images_list ul').empty().html(html)
      pagination({
        total_num: maxCount,
        cur_page: curPage,
        page_size: pageSize,
        jump: true,
        elem: elem.find("#pagination_container"),
        callback: render_list
      })
    }
  },
  look_other_court: function () {
    loading.run(elem.find(".court_list"));
    utils.post_req("/cpgdfx/getXiangGuan_FaYuan", config.condition).done(
      function (response) {
        var data = utils.change_json(response);
        loading.run();
        if (data.sjfy.length == 0 && data.tjfy.length == 0) {
          utils.no_result({
            parent_elem: elem.find(".court_list"),
            img_name: "no_result",
            text: "您搜索的法院，无相关法院信息"
          });
        } else {
          var html = '';
          var prev_html = '';
          html += '<div class="prev_level">';
          html += '<h3 class="title">上级法院：</h3>';
          html += '<ul></ul>';
          html += '</div>';
          html += '<div class="same_level">';
          html += '<h3 class="title">同级法院：</h3>'
          html += '<ul></ul>';
          html += '<div class="pagination_container">';
          html += '</div>';
          html += '</div>';
          elem.find(".court_list").html(html);
          if (data.sjfy.length) {
            $.each(data.sjfy, function (index, item) {
              prev_html += '<li class="court_item" title="' + item + '">' + item + '</li>'
            })
          } else {
            prev_html += '<li>无上级法院</li>';
          }
          elem.find(".prev_level ul").html(prev_html);
          if (data.tjfy.length) {
            render_same_level(data.tjfy)
          } else {
            elem.find(".same_level ul").empty().html('<li>无同级法院</li>');
          }

          function render_same_level(data) {
            var pageSize = 14;
            var maxCount = data.length;
            var maxPage = Math.ceil(maxCount / pageSize);
            var curPage = 1;
            var listData = {};

            function init() {
              if (maxCount === 0) {
                return;
              }
              for (var i = 0; i < maxPage; i++) {
                listData[(i + 1)] = [];
                for (var j = (i * pageSize); j < ((i + 1) * pageSize); j++) {
                  if (data[j]) {
                    listData[(i + 1)].push(data[j]);
                  }
                }
              }
              renderList(curPage);
            }

            function renderList(curPage) {
              var html = '';
              $.each(listData[curPage], function (index, item) {
                html += '<li class="court_item" title="' + item + '">' + item + '</span></li>';
              });
              elem.find(".same_level ul").empty().html(html);
              pagination({
                total_num: maxCount,
                cur_page: curPage,
                page_size: pageSize,
                jump: true,
                elem: elem.find(".pagination_container"),
                callback: renderList
              })
            }
            init();
          }
        }
      })
  },
  look_case_with_basic: function () {
    var currentPage = arguments[0] || 1;
    loading.run(elem.find(".case_list"));
    var req_data = {
      condition: JSON.stringify(config.condition),
      currentPage: currentPage,
      pageSize: 14,
      flag: config.flag
    };
    utils.post_req("/cpgdfx/viewRelevantCases", req_data).done(function (response) {
      var data = utils.change_json(response);
      loading.run();
      if (data.result.length == 0) {
        utils.no_result({
          parent_elem: elem.find(".case_list"),
          img_name: "no_result",
          text: "无相关案例"
        });
      } else {
        render_list(data);
      }
    }).fail(function () {
      loading.run();
      utils.no_result({
        parent_elem: elem.find(".case_list"),
        img_name: "no_result",
        text: "无相关案例"
      });
    })

    function render_list(data) {
      var html = '';
      $.each(data.result, function (index, item) {
        html += '<li class="case_item" caseId="' + item.caseid + '" wsId="' + item.docid + '">';
        html += '<a class="case_name" title="' + item.ah + '" target="_blank" href="http://www.chineselaw.com/www/public/js/components/' + base_path + '/casews/' +          item.caseid + '/' + item.docid + '">' + item.ah + '</a>';
        if (item.tslxdz) {
          html += '<a class="trial_video_case" target="_blank" href="' + item.tslxdz + '">庭审视频</a>';
        }
        html += '</li>';
      });
      elem.find(".case_list ul").empty().html(html);
      pagination({
        total_num: data.totalNum,
        cur_page: currentPage,
        page_size: 14,
        jump: false,
        elem: elem.find(".pagination_container"),
        callback: content_data.look_case_with_basic
      })
    }
  },
  look_case_with_relation: function () {
    var currentPage = arguments[0] || 1;
    loading.run(elem.find(".case_list"));
    var req_data = {
      condition: JSON.stringify(config.condition),
      currentPage: currentPage,
      pageSize: 14,
      flag: config.flag
    };
    if (config.flag) {
      req_data.flag = config.flag;
    }
    if (config.mark) {
      if (config.mark == "lawyer") {
        req_data.lvShiMc = config.lvShiMc;
      } else if (config.mark == "law_firm") {
        req_data.lvSuoMc = config.lvSuoMc;
      } else if (config.mark == "judge") {
        req_data.hytFgId = config.hytFgId;
      }
    }
    utils.post_req("/cpgdfx/viewAls", req_data).done(function (response) {
      var data = utils.change_json(response);
      loading.run();
      if (data.result.length == 0) {
        utils.no_result({
          parent_elem: elem.find(".case_list"),
          img_name: "no_result",
          text: "无相关案例"
        });
      } else {
        render_list(data);
      }
    }).fail(function () {
      loading.run();
      utils.no_result({
        parent_elem: elem.find(".case_list"),
        img_name: "no_result",
        text: "无相关案例"
      });
    })

    function render_list(data) {
      var html = '';
      $.each(data.result, function (index, item) {
        html += '<li class="case_item" caseId="' + item.caseid + '" wsId="' + item.docid + '">';
        html += '<a class="case_name" title="' + item.ah + '" target="_blank" href="http://www.chineselaw.com/www/public/js/components/' + base_path +          '/casews/' + item.caseid + '/' + item.docid + '">' + item.ah + '</a>';
        if (item.tslxdz) {
          html += '<a class="trial_video_case" target="_blank" href="' + item.tslxdz + '">庭审视频</a>';
        }
        html += '</li>';
      });
      elem.find(".case_list ul").empty().html(html);
      pagination({
        total_num: data.totalNum,
        cur_page: currentPage,
        page_size: 14,
        jump: false,
        elem: elem.find(".pagination_container"),
        callback: content_data.look_case_with_relation
      })

    }
  },
  get_trial_video_case: function () {
    loading.run(elem.find(".trial_video_case_list"));
    var page_size = 14;
    var current_page = arguments[0] || 1;
    var submit_data = {
      condition: JSON.stringify(config.condition),
      currentPage: current_page,
      pageSize: page_size
    }
    utils.post_req("/cpgdfx/getTrialVideo", submit_data).done(function (
      response) {
      var data = utils.change_json(response);
      loading.run();
      if (data.result.length) {
        elem.find(".trial_video_case_list ul").empty().html(render_fn.render_trial_video_case(data.result));
        pagination({
          total_num: data.trialVideoTotal,
          cur_page: current_page,
          page_size: page_size,
          jump: false,
          elem: elem.find(".pagination_container"),
          callback: content_data.get_trial_video_case
        })
      } else {
        utils.no_result({
          parent_elem: elem.find(".trial_video_case_list"),
          img_name: "no_result",
          text: "暂无视频"
        });
      }
    })
  },
  combination_search: function () {
    var data = {
      nAjlx: config.nAjlx
    }
    utils.post_req("/ajax/getAdvs", data).done(function (response) {
      var data = utils.change_json(response);
      $.each(data.advs.list, function (index, item) {
        if (item.value == data.yhph_ajlx) {
          store.data = item.children;
          store.default_data = {
            field: "ajlx",
            value: item.value
          }
          store.include_data = [];
          store.not_include_data = [];
          store.cur_ajlx = data.yhph_ajlx;
        }
      })
      elem.find(".combination_search_content").prepend(render_fn.render_combination_search_data(store.data, "first"));
      actions.combination_search_suggest(elem.find(".include_content"),
        elem.find(".include_content_wrapper"));
    })
  },
  //引用法条分析
  law_analysis: function () {
    loading.run(elem.find(".law_list"));
    utils.post_req("/ajax/getYyftfx", {
      query: config.query,
      filter: config.filter,
      advs: config.advs,
      nAjlx: config.nAjlx
    }).done(function (response) {
      loading.run();
      var data = utils.change_json(response);
      if (data.content.length) {
        store.data = {};
        store.field = data.field;
        store.data_count = data.content.length;
        var maxPage = Math.ceil(data.content.length / 10);
        for (var i = 0; i < maxPage; i++) {
          store.data[(i + 1)] = [];
          for (var j = (i * 10); j < ((i + 1) * 10); j++) {
            if (data.content[j]) {
              store.data[(i + 1)].push(data.content[j]);
            };
          };
        };
        render_fn.render_law_data(1);
      }
    })
  },
  //获取主题列表
  get_theme_list_fn: function () {
    utils.get_req("/collection/getBXAjxm").done(function (response) {
      var data = utils.change_json(response);
      var html = '';
      html += render_fn.render_exist_theme(data);
      elem.find(".existed_theme_list ul").html(html);
    })
    utils.post_req("/collection/getAj", {}).done(function (response) {
      var data = utils.change_json(response);
      var html = '';
      html += render_fn.render_other_theme(data);
      elem.find(".other_theme_list ul").html(html);
      if (data.state == "jcy") {
        elem.find(".show_other_theme").remove();
      } else {
        elem.find(".show_other_theme").html(data.message).attr("source", data.state)
      }
    })
  },
  store_general_case: function () {
    if (config.document_list) {
      return;
    }
    utils.post_req("/collection/bianji", {
      ajId: config.ajId,
      cId: config.cId
    }).done(function (response) {
      var data = utils.change_json(response);
      var scWs_arr = [];
      $.each(data.aj.scWs, function (index, item) {
        scWs_arr.push(item.wsId)
      })
      if (data.wsxx.length) {
        var html = '';
        $.each(data.wsxx, function (index, item) {
          var active = $.inArray(item.wsid, scWs_arr) >= 0 ? "active" : "";
          html += '<li class="document_item ' + active + '" document_id="' + item.wsid + '" title = ' + item.ah +
            '>' + item.ah + '</li>';
        })
        var show_more_btn = '<a class="show_more_document" href="javascript:;">更多</a>';
        elem.find(".document_list").html(html);
        if (data.wsxx.length > 3) {
          elem.find(".document_list").after(show_more_btn)
        }
      } else {
        elem.find(".document_list").html('<li>未选择文书</li>');
      }
    })
  },
  //检索报告
  create_report: function () {
    elem.find(".report_case_list").empty();
    loading.run(elem.find(".report_case_list"));
    utils.post_req("/jsbg/get", {}).done(function (response) {
      loading.run();
      var data = utils.change_json(response);
      store.report_case = data;
      var html = '';
      if (data.ptal.length + data.qwal.length >= 1) {
        elem.find(".confirm_create_report").removeClass("disabled").addClass("abled");
        elem.find(".confirm_free_trial ").removeClass("disabled").addClass("abled");
        html += render_fn.render_report_al_case(data.qwal);
        html += render_fn.render_report_aj_case(data.ptal);
        elem.find(".report_case_list").empty().removeClass("no_result_elem").html(html);
        config.count_elem.show().html(data.qwal.length + data.ptal.length);
      } else {
        config.count_elem.hide().html(0);
        utils.no_result({
          parent_elem: elem.find(".report_case_list"),
          img_name: "no_case",
          text: "您还没有添加案例，请点击“添加检索报告”添加案例",
          text_more: "或直接选择已收藏案例进行添加"
        });
      }
    })
  },
  //新建检索报告
  create_new_report: function () {
    var data = {
      cAjxmmc: arguments[0] || "",
      lyWy: "jsbg"
    }
    loading.run(elem.find(".report_theme_list"));
    utils.post_req("/collection/getBXAjxm", data).done(function (response) {
      var data = utils.change_json(response);
      if (data.length) {
        store.report_theme = data;
        elem.find(".report_theme_list").empty()
          .removeClass("no_result_elem")
          .html(render_fn.render_report_theme(data))
        actions.theme_filter_event(elem.find(".theme_filter_input"));
      } else {
        utils.no_result({
          parent_elem: elem.find(".report_theme_list"),
          img_name: "no_result",
          text: "无匹配主题"
        });
      }
    })
  },
  get_create_new_report_case: function (data) {
    loading.run(elem.find(".create_new_report_case_list"));
    utils.post_req("/SearchReport/Wdscnr", data).done(function (response) {
      loading.run();
      var data = utils.change_json(response);
      if (data.aj || data.al || data.ft) {
        elem.find(".create_new_report_case_list").empty().removeClass(
          "no_result_elem").html(render_fn.render_create_new_report_case(data))
        elem.find(".confirm_create_new_report").addClass("abled").removeClass("disabled");
        elem.find('.confirm_free_trial ').addClass("abled").removeClass("disabled");

      } else {
        utils.no_result({
          parent_elem: elem.find(".create_new_report_case_list"),
          img_name: "no_result",
          text: "暂无案例"
        });
        elem.find(".confirm_create_new_report").addClass("disabled").removeClass("abled");
        elem.find(".confirm_free_trial").addClass("disabled").removeClass("abled");
      }
    })
  },
  add_note: function () {
    utils.get_req("/wdbj/bqList").done(function (response) {
      var data = utils.change_json(response);
      var html = '';
      html += '<ul>';
      $.each(data, function (index, item) {
        html += '<li class="lable_item">' + item + '</li>';
      })
      html += '</ul>';
      elem.find(".lable_list").empty().html(html);
      elem.find('.selected_label').on('keyup', function () {
        if ($(this).val().length >= 100) {
          $(this).html($(this).val().substr(0, 100))
        }
      });
      elem.find('.note').on('keyup', function () {
        if ($(this).val().length >= 1000) {
          $(this).html($(this).val().substr(0, 1000))
        }
      });
      setTimeout(function () {
        $(".note.required_input").focus().blur();
      }, 800);
    })
  },




};

function show() {
  switch (config.type) {
    case "login":
      if ($(".login_dialog").length > 0) {
        $(".login_dialog").remove();
      }
      elem = content[config.type]();
      break;
    case "law_analysis":
      elem = content[config.type](config.title);
      break;
    case "store_query":
      elem = content[config.type](config.title, config.query_string);
      break;
    case "add_case_to_report":
      elem = content[config.type](config.title, config.case_name, config.document_arr);
      break;
    case "create_report":
      elem = content[config.type](config.title);
      break;
    case "create_new_report":
      elem = content[config.type](config.title);
      break;
    case "store_general_case":
      elem = content[config.type](config.title, config.case_name);
      break;
    case "store_authoritative_case":
      elem = content[config.type](config.title, config.case_name);
      break;
    case "add_note":
      elem = content[config.type](config.title, config.content);
      break;
    case "store_law":
      elem = content[config.type](config.title, config.law_name);
      break;
    case "time_line":
      elem = content[config.type](config.title, config.SJX_List);
      break;
    case "combination_search":
      elem = content[config.type](config.title);
      break;
    case "store_judge":
      elem = content[config.type](config.title, config.cJstj.fg, config.cJstj.fy);
      break;
    case "get_trial_video_case":
      elem = content[config.type](config.title);
      break;
    case "store_court":
      elem = content[config.type](config.title, config.cJstj.fy, config.cJstj.ay);
      break;
    case "get_same_type_judge":
      elem = content[config.type](config.title);
      break;
    case "look_other_court":
      elem = content[config.type](config.title);
      break;
    case "look_case_with_basic":
      elem = content[config.type](config._title);
      break;
    case "look_case_with_relation":
      elem = content[config.type](config.title);
      break;
    case "show_all_charge":
      elem = content[config.type](config.title);
      break;
    case "to_judge_measure":
      elem = content[config.type](config.title)
      break;
    case "store_judge_case":
      elem = content[config.type](config.title, config.query_string)
      break;
    case "update_guide":
      elem = content[config.type](config.title)
      break;
    case "store_court_video":
      elem = content[config.type](config.title);
      break;
    case "all_case":
      elem = content[config.type](config.title, config.list);
      break;
    case "all_court_image_text":
      elem = content[config.type](config.title, config.list);
      break;
    case "all_live_image":
      elem = content[config.type](config.title, config.list);
      break;
    case "store_company":
      elem = content[config.type](config.title, config.list);
      break;
    case "confirm_free_trial":
      elem = content[config.type](config.title);
      break;
    case "free_trial":
      elem = content[config.type](config.title);
      break;
    case "store_consume":
      elem = content[config.type](config.title);
      break;
    case "pay_vip":     //支付智库vip
      elem = content[config.type]();
      break;
    default:
      return;
  }
  // 插入到body中
  $("body").addClass("dialog_open_class");
  var dialog_back_drop = $('<div class="dialog_back_drop"></div>');
  dialog_back_drop.appendTo("body").css("height", "100%");
  elem.appendTo(".dialog_back_drop");
  utils.placeholder(elem.find("[placeholder]"));
  // 获取到触发元素，dialog backDrop,options
  var trigger = config.trigger,
    options = config.options;
  DIALOG_CLOSE = cta(trigger, elem.get(0), options, dialog_show_callback);
  // 绑定事件
  elem
    .on("click", ".dialog_close_btn", remove) //关闭
    .on("click", ".cancle_btn", remove) //关闭
    .on("click", ".close_drop_menu", actions.close_drop_menu) //关闭下拉菜单按钮
    .on("click", ".show_existed_theme", actions.show_existed_theme) //显示已存在的主题菜单
    .on("click", ".show_other_theme", actions.show_other_theme) //显示有来源的主题
    .on("click", ".theme_item", actions.select_theme) //选择主题
    .on("keyup", ".theme_input", actions.reset_theme) //input框重置主题
    .on("keyup", ".required_input", actions.required_input) //判断必填项
    .on("click", ".document_item", actions.document_select) //文书选择
    .on("click", ".stored_case_item", actions.document_select) //已收藏的案例选择是否添加到检索报告
    .on("click", ".show_store_case", actions.show_store_case) //显示已收藏的案例
    .on("click", ".confirm_add_stored_case", actions.confirm_add_stored_case) //添加已收藏的案例到检索报告
    .on("click", ".cancle_add_stored_case", actions.cancle_add_stored_case) //取消添加已收藏的案例到检索报告
    .on("click", ".filter_theme_btn", actions.filter_theme_menu_show) //显示主题筛选案例的菜单
    .on("click", ".checkbox_group", actions.checkbox_select) //收藏普通案例复选框选中
    .on("click", ".show_all_lable", actions.show_all_lable) //显示已有的标签
    .on("click", ".lable_item", actions.select_lable) //选择某一个标签
    .on("click", ".show_more_document", actions.show_more_document)
    .on("keyup", ".not_include_content", actions.not_include_content_event)
    .on("click", ".charge_item", actions.select_charge_item) //选择罪名
    //组合检索显示下级数据
    .on("click", ".level_option_item.first", actions.select_first_level)
    .on("click", ".level_option_item.second", actions.select_second_level)
    .on("click", ".level_option_item.third", actions.select_third_level)
    //新建检索报告选择主题
    .on("click", ".report_theme_item", actions.select_theme_item)
    //新建检索报告确定选择主题
    .on("click", ".confirm_select_theme.abled", actions.confirm_select_theme)
    //新建检索报告选择案件
    .on("click", ".create_new_report_case_item", actions.select_create_new_report_case)
    //回到新建检索报告选择主题
    .on("click", ".back_to_report_theme", actions.back_to_report_theme)
    //交互操作
    //保存条件
    .on("click", ".store_query.abled", actions.store_query)
    //保存量刑
    .on('click', '.store_judge_case', actions.store_judge_case)
    //删除添加到报告中的案例
    .on("click", ".delete_report_case_btn", actions.delete_report_case)
    //添加普通案例到检索报告
    .on("click", ".confirm_add_report", actions.add_case_to_report)
    //更换主题筛选已收藏的案件
    .on("click", ".filter_theme_item", actions.change_theme_get_case)
    //确定生成检索报告
    .on("click", ".confirm_create_report.abled", actions.confirm_create_report)
    //查看法条详情
    .on("click", ".law_name", actions.look_law_detail)
    //返回法条列表
    .on("click", ".back_to_law_list", actions.back_to_law_list)
    //确定收藏法条分析中的法条
    .on("click", ".confirm_store_analysis_law", actions.confirm_store_analysis_law)
    //选中某一个法条
    .on("click", "http://www.chineselaw.com/www/public/js/components/.law_item .bg", actions.law_select)
    //分析法条
    .on("click", ".confirm_analysis_law.abled", actions.confirm_analysis_law)
    //收藏普通案例
    .on("click", ".confirm_store_general_case.abled", actions.confirm_store_general_case)
    //收藏权威案例
    .on("click", ".confirm_store_authoritative_case.abled", actions.confirm_store_authoritative_case)
    //保存笔记
    .on("click", ".confirm_add_note.abled", actions.confirm_add_note)
    //收藏法条
    .on("click", ".confirm_store_law", actions.confirm_store_law)
    //收藏法官
    .on("click", ".confirm_store_judge", actions.confirm_store_judge)
    //收藏法院
    .on("click", ".confirm_store_court", actions.confirm_store_court)
    //更换法官
    .on("click", ".judge_list .judge_name", actions.change_judge)
    //更换法院
    .on("click", ".court_list .court_item", actions.change_court)
    //导出时间线
    .on("click", ".confirm_export_time_line.abled", actions.confirm_export_time_line)
    //增加组合检索
    .on("click", ".confirm_combination_search", actions.confirm_combination_search)
    //确定新建检索报告
    .on("click", ".confirm_create_new_report.abled", actions.confirm_create_new_report)
    //罪名精释
    .on("click", ".confirm_select_charge.abled", actions.to_fb)
    //跳到量刑页面
    // .on('click', '.judge_measure_btn', actions.confirm_enter_judge_measure)
    //收藏庭审视频
    .on("click", ".confirm_store_video.abled", actions.confirm_store_video)
    //
    .on('click', '.video_footer .submit', actions.affirm_video)
    //点击直播图片
    .on('click', '.confirm_live_image', actions.confirm_live_image)
    //点击图片翻页
    .on('click', '.confirm_pre_page', actions.confirm_live_pre_page)
    .on('click', '.confirm_next_page', actions.confirm_live_next_page)
    //关闭图片直播
    .on('click', '.confirm_close_live', actions.confirm_close_live)
    //收藏企业风险信息
    .on('click', '.confirm_store_company', actions.confirm_store_company)
    //进入免费体验按钮
    .on('click', '.confirm_free_trial', actions.confirm_free_trial)
    //点击免费体验
    .on('click', '.confirm_free_button', actions.confirm_free_button)
    .on('click', '.confirm_change_pattern_payment', actions.confirm_change_pattern_payment)
    .on('click', '.confirm_kind', actions.confirm_kind)
    .on('click', '.confirm_pay', actions.confirm_pay)
    .on('click', '.confirm_consumption', actions.confirm_consumption)
    .on('click', '.payment_failure ', actions.confirm_use_later)

  if (content_data[config.type]) {
    content_data[config.type]();
  }
  if (config.type == "store_query" || config.type == "store_general_case" ||
    config.type == "store_authoritative_case" || config.type == "store_law" ||
    config.type == "store_judge" || config.type == "store_court" ||
    config.type == "store_court_video" || config.type == "store_judge_case" ||
    config.type == "store_company") {
    content_data.get_theme_list_fn();
  }
}

function remove(cb) {
  if (isSupportedBrowser) {
    DIALOG_CLOSE();
  }
  delete store;
  $(".dialog").appendTo("body");
  $(".dialog_back_drop").remove();
  $(".dialog").removeClass("show");
  setTimeout(function () {
    if (typeof cb != 'undefined' && cb != '' && typeof cb == 'Function') {
      $(".dialog").remove(cb);
    }
    $("body").removeClass("dialog_open_class");
    DIALOG_CLOSE = null;
    if (INIT_PROJECT == 'alyp' && INIT_List == 'index' && config.close_callback_data) {
      if (config.close_callback_data.arr.length) {
        var CUR_PROJECT_Arr = config.close_callback_data.arr
        var project_item = CUR_PROJECT_Arr[CUR_PROJECT_Arr.length - 2];
        var project_arr = ['alyp', 'flfg', 'cpgd', 'qyfxfx'];
        var project_index = project_arr.indexOf(project_item);
        search_container.find(".search_project").eq(project_index).trigger('click');
      }
    }
  }, 400);
}

function dialog_show_callback() {
  elem.addClass("show");
}
return {
  show: show,
  remove: remove,
  content: content
}
}
