function tree(data, elem, callback) {
    function render(data) {
        var html = '';
        var temp_count = 0;
        html += '<div class="tree_list">';
        $.each(data, function (index, item) {
            var last = index == data.length - 1 ? "last" : "";
            html += '<div class="tree_item clearfix ' + last + '">';
            html += '<h3 class="tree_item_title">' + item.title + '</h3>';
            if (item.isCheckBox == true) {
                html += '<a href="javascript:;" class="multiselect_btn">多选</a>';
            }
            html += '<div class="tree_item_content">';
            html += '<div class="select_area">'
            html += '<div class="radio_select">';
            html += '<div class="tree_wrapper hidden">';
            html += '<ul class="tree">';
            if (item.children && item.children.length) {
                render_children(item.children, "radio");
            }
            html += '</ul>';
            html += '</div>';
            if (item.children && item.children.length > 5) {
                html += '<a class="look_more" href="javascript:;"><span>查看更多</span><i class="icon-drop-down"></i></a>'
            }
            html += '</div>';
            if (item.isCheckBox == true) {
                html += '<div class="multi_select">';
                html += '<div class="tree_wrapper">';
                html += '<ul class="tree">';
                if (item.children && item.children.length) {
                    render_children(item.children, "multi");
                }
                html += '</ul>';
                html += '</div>';
                html += '<div class="select_operation">';
                html += '<a href="javascript:;" class="confirm_select">确认</a>';
                html += '<a href="javascript:;" class="cancle_multi_select">取消</a>';
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
            html += '</div>';
        })
        html += '</div>';

        function render_children(children, selection_type) {
            $.each(children, function (index, item) {
                html += '<li class="node">';
                html += '<span class="node_count">（' + item.count + '）</span>';
                html += '<div class="node_operation" title="' + item.cfield + '">';
                if (item.children && item.children.length) {
                    html += '<i class="node_switch"></i>';
                } else {
                    html += '<i>●</i>';
                }
                if (selection_type == "multi") {
                    var parent_check = item.children.length ? "parent_check" : "";
                    html += ' <span class="node_check"><input type="checkbox" class="' + parent_check + '" id="node_check_' + temp_count + '" field="' + item.field + '" cfield="' + (item.title ? item.title + "：" : "") + item.cfield + '" value="' + item.value + '"></span>';
                    html += '<label for="node_check_' + temp_count + '" class="node_name">' + item.cfield + '</label>';
                } else {
                    html += '<span class="node_name direct_select" field="' + item.field + '" cfield="' + (item.title ? item.title + "：" : "") + item.cfield + '" value="' + item.value + '">' + item.cfield + '</span>';
                }
                ++temp_count;
                html += '</div>';
                if (item.children && item.children.length) {
                    html += '<div class="tree_level switched">';
                    html += '<ul class="">';
                    render_children(item.children, selection_type);
                    html += '</ul>';
                    html += '</div>';
                }
                html += '</li>';
            })
        }
        return html;
    }
    //获取第一个父节点
    function get_first_parent_node(obj) {
        var parents_node_count = obj.parents(".node").length;
        if (parents_node_count == 1) {
            return 0
        }
        return obj.parents(".node").eq(1);
    }
    //获取所有的父节点
    function get_all_parents_node(obj) {
        var parents_node = [];
        $.each(obj.parents(".node"), function (index, item) {
            if (index != 0) {
                parents_node.push(this);
            }
        });
        return parents_node;
    }
    //获取兄弟节点
    function get_siblings_node(obj) {
        return obj.closest(".node").siblings(".node");
    }
    //获取子节点
    function get_children_node(obj) {
        var children_node = [];
        return obj.closest(".node").find(".node");
    }
    //获取子节点选中的个数
    function children_selected_count(obj) {
        return obj.find(".node .checked").length;
    }
    //选中操作
    function selected(_this) {
        $(_this).addClass("select_all").find("input[type=checkbox]").eq(0).prop("checked", true).parent(".node_check").addClass("checked").removeClass("not_check_all");
    }
    //非全部子节点选中操作
    function not_select_all(_this) {
        $(_this).addClass("not_select_all").removeClass("select_all").find("input[type=checkbox]").eq(0).prop("checked", false).parent(".node_check").removeClass("checked").addClass("not_check_all");
    }
    //不选中操作
    function cancel_selected(_this) {
        $(_this).removeClass("select_all").removeClass("not_select_all").find("input[type=checkbox]").eq(0).prop("checked", false).parent(".node_check").removeClass("checked").removeClass("not_check_all");
    }
    //控制自身选中
    function self_select(_this) {
        $(_this).prop("checked", true).parent(".node_check").addClass("checked").removeClass("not_check_all").closest(".node").removeClass("not_check_all").addClass("select_all");
    }
    //控制自身非选中
    function self_cancel_select(_this) {
        $(_this).prop("checked", false).parent(".node_check").removeClass("checked").removeClass("not_check_all").closest(".node").removeClass("select_all").removeClass("not_select_all");
    }
    //控制子节点选中
    function children_select(_this) {
        //控制子节点
        var children_node = get_children_node(_this);
        if (children_node) {
            $.each(children_node, function () {
                selected(this);
            })
        }
    }
    //控制子节点不选中
    function children_cancel_select(_this) {
        //控制子节点
        var children_node = get_children_node(_this);
        if (children_node) {
            $.each(children_node, function () {
                cancel_selected(this);
            })
        }
    }
    //控制父节点选中状态
    function parents_selected(_this) {
        var all_parents_node = get_all_parents_node(_this);
        if (all_parents_node) {
            $.each(all_parents_node, function () {
                if ($(this).find(".node .node_check").length == children_selected_count($(this))) {
                    selected($(this));
                } else {
                    not_select_all($(this));
                }
            })
        }
    }
    //控制父节点不选中状态
    function parents_cancel_selected(_this) {
        var all_parents_node = get_all_parents_node(_this);
        if (all_parents_node) {
            $.each(all_parents_node, function () {
                if (children_selected_count($(this)) == 0) {
                    cancel_selected($(this));
                } else {
                    not_select_all($(this));
                }
            })
        }
    }
    //监听checkbox选中事件
    function check_event() {
        var _this = $(this);
        /*if($(this).hasClass("parent_check")){

        }*/
        if ($(this).prop("checked")) {
            self_select(_this);
            children_select(_this);
            parents_selected(_this);
        } else {
            self_cancel_select(_this);
            children_cancel_select(_this);
            parents_cancel_selected(_this);
        }

    }
    //折叠
    function collapse() {
        var _this = this;
        $(this).closest(".tree_wrapper").removeClass("hidden").addClass("auto").next(".look_more").remove();
        var collapse_target = $($(this).parent().next(".tree_level"));
        if (collapse_target) {
            $(_this).addClass("open");
            if (collapse_target.hasClass("switched")) {
                collapse_target.animate({
                    height: parseInt(collapse_target.find("ul").eq(0).height())
                }, 500, function () {
                    $(this).removeClass("switched");
                    collapse_target.css("height", "auto");

                });
            } else {
                $(_this).removeClass("open");
                collapse_target.animate({
                    height: 0
                }, 500, function () {
                    $(this).addClass("switched")
                });
            }
        }
    }
    //隐藏整个tree
    function hide_tree() {
        var hide_target = $(this).parent().find(".tree_item_content").eq(0);
        if (hide_target) {
            if (hide_target.hasClass("switched")) {
                hide_target.animate({
                    height: parseInt(hide_target.find(".select_area").eq(0).height())
                }, 500, function () {
                    $(this).removeClass("switched");
                    hide_target.css("height", "auto");
                });
            } else {
                hide_target.addClass("switched").animate({
                    height: 0
                }, 500);
            }
        }
    }

    function multi_select() {
        if ($(this).hasClass("multi")) {
            $(this).parent().find(".multi_select").hide();
            $(this).parent().find(".radio_select").show();
            $(this).removeClass("multi").html("多选");
        } else {
            $(this).parent().find(".multi_select").show();
            $(this).parent().find(".radio_select").hide();
            $(this).addClass("multi").html("单选");
        }
    }

    function direct_select() {
        var temp_arr = [{
            field: $(this).attr("field"),
            cfield: $(this).attr("cfield"),
            value: $(this).attr("value")
        }];
        if (callback) {
            callback(temp_arr);
        }
    }

    function confirm_multi_select() {
        var selected_arr = [];
        var nodes = $(this).closest(".multi_select").find(".tree").children(".node");
        get_selected_nodes(nodes);
        if (selected_arr.length == 0) return;
        if (callback) {

            callback(selected_arr);
        }

        function get_selected_nodes(nodes) {
            $.each(nodes, function () {
                var cur_checkbox = $(this).find("input[type=checkbox]").eq(0);
                if ($(this).hasClass("select_all")) {
                    selected_arr.push({
                        field: cur_checkbox.attr("field"),
                        cfield: cur_checkbox.attr("cfield"),
                        value: cur_checkbox.attr("value"),
                    })
                } else if ($(this).hasClass("not_select_all")) {
                    var next_level_nodes = $(this).find(".tree_level").eq(0).children("ul").children(".node");
                    get_selected_nodes(next_level_nodes)
                }
            })
        }
    }

    function cancle_multi_select() {
        $(this).closest(".tree_item").find(".radio_select").show();
        $(this).closest(".tree_item").find(".multi_select").hide();
        $(this).closest(".tree_item").find(".multiselect_btn ").removeClass("multi").html("多选");
    }

    function look_more() {
        $(this).prev().removeClass("hidden").addClass("auto");
        $(this).remove();
    }

    function init() {
        elem.empty().show().off().html(render(data))
            .on("change", "input[type=checkbox]", check_event)
            .on("click", ".node_switch", collapse)
            .on("click", ".tree_item_title", hide_tree)
            .on("click", ".multiselect_btn", multi_select)
            .on("click", ".direct_select", direct_select)
            .on("click", ".confirm_select", confirm_multi_select)
            .on("click", ".cancle_multi_select", cancle_multi_select)
            .on("click", ".look_more", look_more);
    }
    return {
        init: init
    };
}